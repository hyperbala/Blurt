//app/api/posts/[postId]/route.js
import { connectToDB } from '../../../../lib/mongodb';
import Post from '../../../../models/Post';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    await connectToDB();
    
    const postId = params.postId;
    const post = await Post.findById(postId)
      .populate('author', 'name avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (session) {
      post._doc.isLiked = post.likedBy.includes(session.user.id);
      post._doc.isSaved = post.savedBy.includes(session.user.id);
    }

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}