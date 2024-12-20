
import { connectToDB } from '../../../lib/mongodb';
import Question from '../../../models/Question';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await connectToDB();

    // Only fetch questions
    const questions = await Question.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'name username image')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      });

    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await req.formData();
    const question = {
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category'),
      author: session.user.id,
      createdAt: new Date(),
      answers: []
    };

    const imageFile = formData.get('image');
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `${Date.now()}-${imageFile.name}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await writeFile(join(uploadDir, fileName), buffer);
      question.image = `/uploads/${fileName}`;
    }

    const newQuestion = await Question.create(question);
    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}