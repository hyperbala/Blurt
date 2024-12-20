// app/api/posts/user/[userId]/route.js
import { NextResponse } from 'next/server';
import { connectToDB } from '../../../../../lib/mongodb';
import { getServerSession } from "next-auth/next";
import Post from '../../../../../models/Post';
import { authOptions } from "../../../auth/[...nextauth]/route";


export async function GET(req, { params }) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { userId } = params;

    const posts = await Post.find({ 
        author: userId 
      })
      .populate('author', 'name email username image')
      .sort({ createdAt: -1 })
      .lean();

    const postsWithInteractions = posts.map(post => ({
      ...post,
      isLiked: post.likedBy?.some(id => id.toString() === session.user.id) || false,
      isSaved: post.savedBy?.some(id => id.toString() === session.user.id) || false,
      likes: post.likes || 0,
      comments: post.comments || []
    }));

    return NextResponse.json(postsWithInteractions);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
