// app/api/users/liked-posts/route.js
import { connectToDB } from '../../../../lib/mongodb';
import Post from '../../../../models/Post';
import Question from '../../../../models/Question';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const likedPosts = await Post.find({
      likedBy: session.user.id
    }).populate('author').sort({ createdAt: -1 });

    const likedQuestions = await Question.find({
      likedBy: session.user.id
    }).populate('author').sort({ createdAt: -1 });

    const likedItems = [...likedPosts, ...likedQuestions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json(likedItems);

  } catch (error) {
    console.error('Error fetching liked posts and questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}