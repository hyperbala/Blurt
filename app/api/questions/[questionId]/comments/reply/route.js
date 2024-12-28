// app/api/questions/[questionId]/comments/reply/route.js
import { connectToDB } from '../../../../../../lib/mongodb';
import Question from '../../../../../../models/Question';
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

    const { questionId } = params;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const { content, parentCommentId, parentReplyId } = await req.json();

    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      content,
      author: new mongoose.Types.ObjectId(session.user.id),
      createdAt: new Date(),
      likes: {
        count: 0,
        likedBy: []
      }
    };

    const parentComment = question.comments.id(parentCommentId);
    if (!parentComment) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
    }

    if (parentReplyId) {
      // Handling nested reply
      const parentReply = parentComment.replies.id(parentReplyId);
      if (!parentReply) {
        return NextResponse.json({ error: 'Parent reply not found' }, { status: 404 });
      }

      if (!parentReply.replies) {
        parentReply.replies = [];
      }
      parentReply.replies.push(newReply);
    } else {
      // Handling direct reply to comment
      if (!parentComment.replies) {
        parentComment.replies = [];
      }
      parentComment.replies.push(newReply);
    }

    await question.save();

    // Fetch the populated reply to return
    const savedQuestion = await Question.findById(questionId)
      .populate('comments.author', 'name image username')
      .populate('comments.replies.author', 'name image username')
      .populate('comments.replies.replies.author', 'name image username');

    const savedComment = savedQuestion.comments.id(parentCommentId);
    let savedReply;

    if (parentReplyId) {
      const savedParentReply = savedComment.replies.id(parentReplyId);
      savedReply = savedParentReply.replies.slice(-1)[0];
    } else {
      savedReply = savedComment.replies.slice(-1)[0];
    }

    // Format the reply for response
    const formattedReply = {
      ...savedReply.toObject(),
      createdAt: savedReply.createdAt.toISOString(),
      author: {
        _id: savedReply.author?._id,
        name: savedReply.author?.name || 'Anonymous',
        image: savedReply.author?.image || '/default-avatar.png',
        username: savedReply.author?.username
      }
    };

    return NextResponse.json(formattedReply, { status: 201 });

  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}