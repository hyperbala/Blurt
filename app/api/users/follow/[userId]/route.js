// app/api/users/follow/[userId]/route.js
import { connectToDB } from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import Notification from '../../../../../models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    // Prevent following yourself
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    const currentUser = await User.findById(session.user.id);
    const userToFollow = await User.findById(userId);

    if (!userToFollow) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isFollowing = currentUser.following.includes(userId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(session.user.id, {
        $pull: { following: userId }
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: session.user.id }
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(session.user.id, {
        $addToSet: { following: userId }
      });
      await User.findByIdAndUpdate(userId, {
        $addToSet: { followers: session.user.id }
      });
    }
    
    if (!isFollowing) {
      // Create notification for new follower
      await Notification.create({
        type: 'follow',
        fromUser: session.user.id,
        toUser: userId,
      });
    }
    

    // Get updated follower count
    const updatedUser = await User.findById(userId);
    
    return NextResponse.json({
      isFollowing: !isFollowing,
      followersCount: updatedUser.followers.length
    });

  } catch (error) {
    console.error('Error in follow API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check follow status
export async function GET(request, { params }) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;
    const currentUser = await User.findById(session.user.id);
    const userToCheck = await User.findById(userId);

    if (!userToCheck) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isFollowing = currentUser.following.includes(userId);

    return NextResponse.json({
      isFollowing,
      followersCount: userToCheck.followers.length
    });

  } catch (error) {
    console.error('Error in follow status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}