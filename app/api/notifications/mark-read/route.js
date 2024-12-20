// pages/api/notifications/mark-read.js

import { connectToDB } from '../../../../lib/mongodb';
import Notification from '../../../../models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);

    await Notification.updateMany(
      { 
        toUser: session.user.id, // You'll need to get the current user from the session
        read: false 
      },
      { 
        $set: { read: true } 
      }
    );

    return NextResponse.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
