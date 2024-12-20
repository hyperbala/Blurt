// api/posts/[postId]/like/route.js

import { connectToDB } from '../../../../../lib/mongodb';
import Post from '../../../../../models/Post';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';

// GET handler to check if a post is liked by the current user
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();
    
    const post = await Post.findById(params.postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if the current user's ID exists in the likedBy array
    const isLiked = post.likedBy?.includes(session.user.id) || false;
    
    return NextResponse.json({
      isLiked,
      likes: post.likes || 0
    });

  } catch (error) {
    console.error('GET like status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST handler to toggle like status
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();
    
    const post = await Post.findById(params.postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Initialize likedBy array if it doesn't exist
    if (!post.likedBy) {
      post.likedBy = [];
    }

    const userIndex = post.likedBy.indexOf(session.user.id);
    const hasLiked = userIndex !== -1;

    if (hasLiked) {
      // Remove like
      post.likedBy.splice(userIndex, 1);
      post.likes = Math.max(0, (post.likes || 1) - 1);
    } else {
      // Add like
      post.likedBy.push(session.user.id);
      post.likes = (post.likes || 0) + 1;
    }

    await post.save();

    return NextResponse.json({
      success: true,
      isLiked: !hasLiked,
      likes: post.likes
    });

  } catch (error) {
    console.error('POST like toggle error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}