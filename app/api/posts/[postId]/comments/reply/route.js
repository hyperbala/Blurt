// app/api/posts/[postId]/comments/reply/route.js
import { connectToDB } from '../../../../../../lib/mongodb';
import Post from '../../../../../../models/Post';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function POST(req, { params }) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { postId } = params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const { content, parentCommentId, parentReplyId } = await req.json();

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      content,
      author: new mongoose.Types.ObjectId(session.user.id),
      createdAt: new Date()
    };

    const parentComment = post.comments.id(parentCommentId);
    if (!parentComment) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
    }

    const parentReply = parentComment.replies.id(parentReplyId);
    if (!parentReply) {
      return NextResponse.json({ error: 'Parent reply not found' }, { status: 404 });
    }

    if (!parentReply.replies) {
      parentReply.replies = [];
    }
    parentReply.replies.push(newReply);

    await post.save();

    // Fetch the populated reply to return
    const savedPost = await Post.findById(postId)
      .populate('comments.author', 'name image username')
      .populate('comments.replies.author', 'name image username')
      .populate('comments.replies.replies.author', 'name image username');

    const savedComment = savedPost.comments.id(parentCommentId);
    const savedParentReply = savedComment.replies.id(parentReplyId);
    const savedNestedReply = savedParentReply.replies.slice(-1)[0];

    // Format the nested reply for response
    const formattedNestedReply = {
      ...savedNestedReply.toObject(),
      createdAt: savedNestedReply.createdAt.toISOString(),
      author: {
        _id: savedNestedReply.author?._id,
        name: savedNestedReply.author?.name || 'Anonymous',
        image: savedNestedReply.author?.image || '/default-avatar.png',
        username: savedNestedReply.author?.username
      }
    };

    return NextResponse.json(formattedNestedReply, { status: 201 });

  } catch (error) {
    console.error('Error adding nested reply:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}