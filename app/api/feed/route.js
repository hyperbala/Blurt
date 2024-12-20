import { connectToDB } from '../../../lib/mongodb';
import Post from '../../../models/Post';
import Question from '../../../models/Question';

import { NextResponse } from 'next/server';
export async function GET(req) {
  try {
    await connectToDB();

    // Fetch all posts and questions, including comments and populating author information
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({
        path: 'author',
        select: 'name username image profilePic'
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name username image profilePic'
        }
      });
    
    const questions = await Question.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({
        path: 'author',
        select: 'name username image profilePic'
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name username image profilePic'
        }
      });

    // Combine and sort by creation date
    const combinedResults = [...posts, ...questions].sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json(combinedResults, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/feed:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
