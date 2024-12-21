// app/api/posts/saved/route.js
import { connectToDB } from '../../../../lib/mongodb';
import Post from '../../../../models/Post';
import Question from '../../../../models/Question';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
      await connectToDB();
  
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
  
      const userId = session.user.id;
  
      // Find all posts that have the user's ID in their savedBy array
      const savedPosts = await Post.find({
        savedBy: userId
      })
      .populate('author', 'name email username image')
      .lean()
      .sort({ createdAt: -1 });

      // Find all questions that have the user's ID in their savedBy array
      const savedQuestions = await Question.find({
        savedBy: userId
      })
      .populate('author', 'name email username image')
      .lean()
      .sort({ createdAt: -1 });

      // Combine and sort by createdAt
      const savedItems = [...savedPosts, ...savedQuestions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Add isLiked field to each item and ensure likes is an array
      const itemsWithLikeStatus = savedItems.map(item => ({
        ...item,
        likes: Array.isArray(item.likes) ? item.likes : [],
        isLiked: Array.isArray(item.likes) ? item.likes.some(like => 
          like.toString() === userId.toString()
        ) : false,
        type: item.type || 'post'
      }));
  
      return NextResponse.json(itemsWithLikeStatus);
  
    } catch (error) {
      console.error('Error in GET /api/posts/saved:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}