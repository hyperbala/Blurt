// app/api/posts/user/route.js
import { connectToDB } from '../../../../lib/mongodb';
import Post from '../../../../models/Post';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Fetching posts for user ID:', session.user.id); // Debug log

    const posts = await Post.find({ 
      author: session.user.id 
    })
    .populate('author', 'name email username image')
    .sort({ createdAt: -1 })
    .lean();

    console.log('Found posts:', posts); // Debug log

    const postsWithStatus = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      author: {
        ...post.author,
        _id: post.author._id.toString()
      },
      likes: Array.isArray(post.likes) ? post.likes.length : 0,
      isLiked: Array.isArray(post.likes) ? post.likes.includes(session.user.id) : false,
      isSaved: Array.isArray(post.savedBy) ? post.savedBy.includes(session.user.id) : false
    }));

    return NextResponse.json(postsWithStatus);

  } catch (error) {
    console.error('Error in GET /api/posts/user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}