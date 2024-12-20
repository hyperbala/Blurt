// app/api/questions/[questionId]/save/route.js
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

    // Initialize savedBy array if it doesn't exist
    if (!question.savedBy) {
      question.savedBy = [];
    }

    const isSaved = question.savedBy.includes(session.user.id);

    if (isSaved) {
      // Remove user from savedBy array
      question.savedBy = question.savedBy.filter(id => id.toString() !== session.user.id);
    } else {
      // Add user to savedBy array
      question.savedBy.push(session.user.id);
    }

    await question.save();

    return NextResponse.json({
      isSaved: !isSaved,
      savedCount: question.savedBy.length
    });

  } catch (error) {
    console.error('Error in question save:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}