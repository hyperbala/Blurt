// app/api/users/[userId]/follow-data/route.js
import { connectToDB } from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId } = params;
    const user = await User.findById(userId)
      .populate('followers', 'name username email image')
      .populate('following', 'name username email image');

    const followersWithStatus = user.followers.map(follower => ({
      ...follower.toObject(),
      isFollowing: user.following.some(f => f._id.toString() === follower._id.toString())
    }));

    const followingWithStatus = user.following.map(followedUser => ({
      ...followedUser.toObject(),
      isFollowing: true
    }));

    return NextResponse.json({
      followers: followersWithStatus,
      following: followingWithStatus,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      name: user.name,
      username: user.username,
      image: user.image,
      email: user.email
    });

  } catch (error) {
    console.error('Error in GET /api/users/[userId]/follow-data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}