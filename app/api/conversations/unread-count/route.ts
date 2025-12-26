import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

// GET /api/conversations/unread-count - Get count of unread messages for current user
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count unread messages where the user is not the sender
    const unreadCount = await prisma.message.count({
      where: {
        senderId: { not: userId },
        isRead: false,
        conversation: {
          participants: {
            some: {
              userId,
            },
          },
        },
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
