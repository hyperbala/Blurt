// app/api/questions/[questionId]/comments/like/route.js
import { connectToDB } from '../../../../../../lib/mongodb';
import Question from '../../../../../../models/Question';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { questionId } = params;
    const { commentId, replyId } = await req.json();

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const comment = question.comments.id(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Initialize likes if it doesn't exist
    if (!comment.likes) {
      comment.likes = { count: 0, likedBy: [] };
    }

    if (replyId) {
      // Handle reply like
      const reply = comment.replies.id(replyId);
      if (!reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
      }

      // Initialize likes for reply if it doesn't exist
      if (!reply.likes) {
        reply.likes = { count: 0, likedBy: [] };
      }

      const userHasLiked = reply.likes.likedBy.includes(session.user.id);
      
      if (userHasLiked) {
        // Unlike
        reply.likes.likedBy = reply.likes.likedBy.filter(id => id.toString() !== session.user.id);
        reply.likes.count = Math.max(0, reply.likes.count - 1);
      } else {
        // Like
        reply.likes.likedBy.push(session.user.id);
        reply.likes.count += 1;
      }

      await question.save();
      return NextResponse.json({
        success: true,
        likes: reply.likes
      }, { status: 200 });
    } else {
      // Handle comment like
      const userHasLiked = comment.likes.likedBy.includes(session.user.id);
      
      if (userHasLiked) {
        // Unlike
        comment.likes.likedBy = comment.likes.likedBy.filter(id => id.toString() !== session.user.id);
        comment.likes.count = Math.max(0, comment.likes.count - 1);
      } else {
        // Like
        comment.likes.likedBy.push(session.user.id);
        comment.likes.count += 1;
      }

      await question.save();
      return NextResponse.json({
        success: true,
        likes: comment.likes
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error handling like:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}