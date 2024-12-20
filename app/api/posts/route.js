// app/api/posts/route.js
import { connectToDB } from '../../../lib/mongodb';
import Post from '../../../models/Post';
import Question from '../../../models/Question';
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { writeFile } from 'fs/promises';
import { join } from 'path';


// app/api/posts/route.js (Posts only API)
export async function GET(req) {
  try {
    await connectToDB();

    // Only fetch posts
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'name username image')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name  username image',
        }
      });

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('Authentication failed: No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Session:', session);

    const formData = await req.formData();
    const title = formData.get('title');
    const content = formData.get('content');
    const type = formData.get('type');
    const imageFile = formData.get('image');

    let imagePath = '';

    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `${Date.now()}-${imageFile.name}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads');

      await writeFile(join(uploadDir, fileName), buffer);
      imagePath = `/uploads/${fileName}`;
    }

    const commonData = {
      title,
      content,
      type,
      image: imagePath,
      author: session.user.id,
    };

    let result;

    if (type === 'question') {
      // Add question-specific fields
      const category = formData.get('category');
      result = await Question.create({
        ...commonData,
        category,
        answers: [],
      });
    } else {
      // Assume it's a regular post
      result = await Post.create(commonData);
    }

    console.log(`${type} created successfully:`, result);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`Error in POST /api/posts:`, error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}