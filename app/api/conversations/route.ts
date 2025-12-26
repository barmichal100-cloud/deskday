import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

// GET /api/conversations - List all conversations for the current user
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/conversations - Create or get existing conversation
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { otherUserId, bookingId, deskId } = body;

    if (!otherUserId) {
      return NextResponse.json({ error: 'otherUserId is required' }, { status: 400 });
    }

    // Check if conversation already exists between these two users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            OR: [
              { userId },
              { userId: otherUserId },
            ],
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        bookingId,
        deskId,
        participants: {
          create: [
            { userId },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
