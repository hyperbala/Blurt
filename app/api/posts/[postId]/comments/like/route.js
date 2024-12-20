// app/api/posts/[postId]/comments/like/route.js
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
    const { commentId, replyId } = await req.json();

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (replyId) {
      // Handle reply like
      const reply = comment.replies.id(replyId);
      if (!reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
      }

      const userHasLiked = reply.likes.likedBy.includes(session.user.id);
      
      if (userHasLiked) {
        // Unlike
        reply.likes.likedBy = reply.likes.likedBy.filter(id => id !== session.user.id);
        reply.likes.count = Math.max(0, reply.likes.count - 1);
      } else {
        // Like
        reply.likes.likedBy.push(session.user.id);
        reply.likes.count += 1;
      }
    } else {
      // Handle comment like
      const userHasLiked = comment.likes.likedBy.includes(session.user.id);
      
      if (userHasLiked) {
        // Unlike
        comment.likes.likedBy = comment.likes.likedBy.filter(id => id !== session.user.id);
        comment.likes.count = Math.max(0, comment.likes.count - 1);
      } else {
        // Like
        comment.likes.likedBy.push(session.user.id);
        comment.likes.count += 1;
      }
    }

    await post.save();

    return NextResponse.json({
      success: true,
      likes: replyId ? comment.replies.id(replyId).likes : comment.likes
    }, { status: 200 });

  } catch (error) {
    console.error('Error handling like:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}