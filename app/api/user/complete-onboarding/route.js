// app/api/user/complete-onboarding/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { username } = body;

    if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { message: 'Invalid username format' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await connectToDB();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already taken' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { 
        username,
        hasCompletedOnboarding: true 
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.json(
      { message: 'Username set successfully', user: updatedUser },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in complete-onboarding:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}