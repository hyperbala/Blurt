// app/api/questions/[questionId]/like/route.js
import { connectToDB } from '../../../../../lib/mongodb';
import Question from '../../../../../models/Question';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { questionId } = params;
    const question = await Question.findById(questionId);

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const hasLiked = question.likedBy.includes(session.user.id);

    if (hasLiked) {
      question.likedBy = question.likedBy.filter(id => id.toString() !== session.user.id);
      question.likes = Math.max(0, (question.likes || 1) - 1);
    } else {
      question.likedBy.push(session.user.id);
      question.likes = (question.likes || 0) + 1;
    }

    await question.save();

    return NextResponse.json({
      likes: question.likes,
      hasLiked: !hasLiked
    });

  } catch (error) {
    console.error('Error in question like:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}