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


export async function DELETE(req, { params }) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDB();

    const postId = params.postId;

    // Find the post
    const post = await Post.findById(postId);

    // Check if post exists
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if the authenticated user is the post owner
    // Convert to string for comparison since post.author might be an ObjectId
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete the post
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
