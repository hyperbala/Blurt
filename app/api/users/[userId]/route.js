// app/api/users/[userId]/route.js
import { connectToDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req, { params }) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId } = params;
    const user = await User.findById(userId)
      .select('name email image followers following createdAt')
      .populate('followers', 'name username image')
      .populate('following', 'name username image');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formattedUser = {
      ...user.toObject(),
      createdAt: new Date(user.createdAt).toISOString(),
      followersCount: user.followers.length,
      followingCount: user.following.length
    };

    return NextResponse.json(formattedUser, { status: 200 });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}