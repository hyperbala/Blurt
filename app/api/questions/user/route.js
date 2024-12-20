// app/api/questions/user/route.js
import { connectToDB } from '../../../../lib/mongodb';
import Question from '../../../../models/Question';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Fetching questions for user:', session.user.id);

    // Find questions using the Question model
    const questions = await Question.find({ 
      author: session.user.id
    })
    .populate('author', 'name email username image')
    .sort({ createdAt: -1 });

    console.log('Found questions:', questions);

    // Format the questions with the expected structure
    const formattedQuestions = questions.map(question => ({
      ...question.toObject(),
      _id: question._id.toString(),
      author: question.author ? {
        ...question.author.toObject(),
        _id: question.author._id.toString()
      } : null,
      likes: question.likes || 0,
      likedBy: question.likedBy || [],
      savedBy: question.savedBy || [],
      comments: question.answers || [], // Map answers to comments for UI consistency
      isLiked: question.likedBy?.includes(session.user.id) || false,
      isSaved: question.savedBy?.includes(session.user.id) || false
    }));

    return NextResponse.json(formattedQuestions);

  } catch (error) {
    console.error('Error in GET /api/questions/user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}