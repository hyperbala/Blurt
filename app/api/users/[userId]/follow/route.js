// app/api/users/[userId]/follow/route.js
import { connectToDB } from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId: targetUserId } = params;
    const currentUserId = session.user.id;

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
    }

    return NextResponse.json({ success: true, isFollowing: !isFollowing });

  } catch (error) {
    console.error('Error in POST /api/users/[userId]/follow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}