// app/api/posts/[postId]/comments/route.js
import { connectToDB } from '../../../../../lib/mongodb';
import Post from '../../../../../models/Post';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    await connectToDB();
    const { postId } = params;
    
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const post = await Post.findById(postId)
      .populate('comments.author', 'name image username')
      .populate('comments.replies.author', 'name image username');

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Format the comments for display
    const formattedComments = post.comments.map(comment => ({
      ...comment.toObject(),
      createdAt: comment.createdAt.toISOString(),
      author: {
        _id: comment.author?._id,
        name: comment.author?.name || 'Anonymous',
        image: comment.author?.image || '/default-avatar.png',
        username: comment.author?.username
      },
      replies: comment.replies?.map(reply => ({
        ...reply.toObject(),
        createdAt: reply.createdAt.toISOString(),
        author: {
          _id: reply.author?._id,
          name: reply.author?.name || 'Anonymous',
          image: reply.author?.image || '/default-avatar.png',
          username: reply.author?.username
        }
      }))
    }));

    return NextResponse.json(formattedComments, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const { content, parentCommentId } = await req.json();

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      content,
      author: new mongoose.Types.ObjectId(session.user.id),
      createdAt: new Date()
    };

    if (parentCommentId) {
      const parentComment = post.comments.id(parentCommentId);
      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
      parentComment.replies.push(newComment);
    } else {
      post.comments.push(newComment);
    }

    await post.save();

    // Fetch the populated comment to return
    const savedPost = await Post.findById(postId)
      .populate('comments.author', 'name image username')
      .populate('comments.replies.author', 'name image username');

    const savedComment = parentCommentId
      ? savedPost.comments.id(parentCommentId).replies.slice(-1)[0]
      : savedPost.comments.slice(-1)[0];

    // Format the comment for response
    const formattedComment = {
      ...savedComment.toObject(),
      createdAt: savedComment.createdAt.toISOString(),
      author: {
        _id: savedComment.author?._id,
        name: savedComment.author?.name || 'Anonymous',
        image: savedComment.author?.image || '/default-avatar.png',
        username: savedComment.author?.username
      }
    };

    return NextResponse.json(formattedComment, { status: 201 });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}