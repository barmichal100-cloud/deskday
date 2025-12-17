import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      );
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        desk: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify this is the user's booking
    if (booking.renterId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if already confirmed
    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({
        success: true,
        message: 'Booking already confirmed',
      });
    }

    // Update booking to CONFIRMED
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        stripePaymentIntentId: `mock_pi_${Date.now()}`, // Mock payment intent ID
      },
    });

    // Block the booked dates
    const bookedDates = booking.bookedDates as string[];
    if (bookedDates && Array.isArray(bookedDates)) {
      // Remove from available dates
      await prisma.deskAvailableDate.deleteMany({
        where: {
          deskId: booking.deskId,
          date: {
            in: bookedDates.map(d => new Date(d)),
          },
        },
      });

      // Add to blocked dates
      const blockedDatesToCreate = bookedDates.map(dateStr => ({
        deskId: booking.deskId,
        date: new Date(dateStr),
        reason: 'BOOKED' as const,
      }));

      await prisma.deskBlockedDate.createMany({
        data: blockedDatesToCreate,
        skipDuplicates: true,
      });
    }

    console.log(`Mock payment: Booking ${bookingId} confirmed and dates blocked`);

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Mock payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
