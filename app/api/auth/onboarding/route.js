import { NextResponse } from 'next/server';
import { connectToDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(req) {
  try {
    await connectToDB();
    const { name, username, userId } = await req.json();

    if (!name || !username || !userId) {
      return NextResponse.json(
        { message: 'Name, username, and userId are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user profile
    user.name = name;
    user.username = username;
    await user.save();

    return NextResponse.json(
      { message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { message: 'Failed to update profile', error: error.message },
      { status: 500 }
    );
  }
}