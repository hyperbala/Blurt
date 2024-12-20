//component/posts/[postId]/save/route.js

import { connectToDB } from '../../../../../lib/mongodb';
import Post from '../../../../../models/Post';
import { authOptions } from "../../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
export async function GET(req, { params }) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const postId = params.postId;
    const userId = session.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isSaved = post.savedBy?.includes(userId) || false;

    return NextResponse.json({
      isSaved,
      savedCount: post.savedBy?.length || 0
    });

  } catch (error) {
    console.error('Error in GET /api/posts/[postId]/save:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const postId = params.postId;
    const userId = session.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Initialize savedBy array if it doesn't exist
    if (!post.savedBy) {
      post.savedBy = [];
    }

    const savedIndex = post.savedBy.indexOf(userId);
    const isSaved = savedIndex === -1;

    if (isSaved) {
      post.savedBy.push(userId);
    } else {
      post.savedBy.splice(savedIndex, 1);
    }

    await post.save();

    return NextResponse.json({
      isSaved,
      savedCount: post.savedBy.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/posts/[postId]/save:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}