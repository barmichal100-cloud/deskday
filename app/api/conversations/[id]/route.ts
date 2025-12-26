import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

// GET /api/conversations/[id] - Get a specific conversation with messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
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

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Update last read timestamp
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: id,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}
