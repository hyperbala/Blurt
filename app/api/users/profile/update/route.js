import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDB } from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import { NextResponse } from 'next/server';

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updates = {};

    // Handle name update
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { message: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    // Handle username update
    if (body.username !== undefined) {
      if (!body.username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
        return NextResponse.json(
          { message: 'Username must be 3-20 characters long and can only contain letters, numbers, and underscores' },
          { status: 400 }
        );
      }

      await connectToDB();

      // Check if username is taken by another user
      const existingUser = await User.findOne({
        username: body.username,
        email: { $ne: session.user.email }
      });

      if (existingUser) {
        return NextResponse.json(
          { message: 'Username already taken' },
          { status: 400 }
        );
      }

      updates.username = body.username;
    }

    // If no valid updates were provided, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Always set hasCompletedOnboarding to true when updating profile
    updates.hasCompletedOnboarding = true;

    await connectToDB();

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      updates,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Profile updated successfully', 
        user: {
          ...updatedUser.toObject(),
          hasCompletedOnboarding: true
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}