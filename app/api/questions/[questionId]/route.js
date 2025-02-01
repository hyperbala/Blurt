//app/api/posts/[postId]/route.js
import { connectToDB } from '../../../../lib/mongodb';
import Question from '../../../../models/Question';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
export async function DELETE(req, { params }) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
  
      await connectToDB();
  
      const questionId = params.questionId;
      const question = await Question.findById(questionId);
  
      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 } 
        );
      }
  
      if (question.author.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only delete your own questions' },
          { status: 403 }
        );
      }
  
      await Question.findByIdAndDelete(questionId);
  
      return NextResponse.json(
        { message: 'Question deleted successfully' },
        { status: 200 }
      );
  
    } catch (error) {
      console.error('Error deleting question:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
  