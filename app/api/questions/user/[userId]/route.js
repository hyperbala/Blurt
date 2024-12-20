// app/api/questions/user/[userId]/route.js
import { NextResponse } from 'next/server';
import { connectToDB } from '../../../../../lib/mongodb';
import { getServerSession } from "next-auth/next";
import Question from '../../../../../models/Question';
import { authOptions } from "../../../auth/[...nextauth]/route";
export async function GET(req, { params }) {
    try {
      await connectToDB();
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      
      const { userId } = params;
  
      const questions = await Question.find({ 
          author: userId 
        })
        .populate('author', 'name email username image')
        .populate('likedBy', '_id')
        .populate('savedBy', '_id')
        .sort({ createdAt: -1 })
        .lean();
  
      // Add isLiked and isSaved fields for the current user
      const questionsWithUserInteraction = questions.map(question => ({
        ...question,
        isLiked: question.likedBy?.some(user => user._id.toString() === session.user.id) || false,
        isSaved: question.savedBy?.some(user => user._id.toString() === session.user.id) || false,
        likes: question.likes || 0 // Use the likes count directly
      }));
  
      console.log('Found questions:', questionsWithUserInteraction);
      return NextResponse.json(questionsWithUserInteraction);
    } catch (error) {
      console.error('Error fetching user questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
  }
  