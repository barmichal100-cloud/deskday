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
    const { deskId, dates } = body;

    if (!deskId || !dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: deskId and dates array' },
        { status: 400 }
      );
    }

    // Fetch desk with available dates
    const desk = await prisma.desk.findUnique({
      where: { id: deskId },
      include: {
        availableDates: true,
        owner: {
          select: {
            id: true,
            stripeAccountId: true,
          },
        },
      },
    });

    if (!desk) {
      return NextResponse.json(
        { error: 'Desk not found' },
        { status: 404 }
      );
    }

    // Check if user is trying to book their own desk
    if (desk.ownerId === userId) {
      return NextResponse.json(
        { error: 'You cannot book your own desk' },
        { status: 400 }
      );
    }

    // Check if all dates are available
    const availableDateStrings = new Set(
      desk.availableDates.map((ad) => ad.date.toISOString().split('T')[0])
    );

    const requestedDates = dates;

    const unavailableDates = requestedDates.filter(
      (date: string) => !availableDateStrings.has(date)
    );

    if (unavailableDates.length > 0) {
      return NextResponse.json(
        { error: `Some dates are not available: ${unavailableDates.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate total amount
    const numberOfDays = requestedDates.length;
    const totalAmount = desk.pricePerDay * numberOfDays;
    const platformFeePercentage = 0.15; // 15% platform fee
    const platformFee = Math.round(totalAmount * platformFeePercentage);
    const deskOwnerAmount = totalAmount - platformFee;

    // Sort dates to get start and end
    const sortedDates = [...requestedDates].sort();
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);

    // Create booking first (with PENDING status, will be updated by webhook)
    const booking = await prisma.booking.create({
      data: {
        deskId,
        renterId: userId,
        startDate,
        endDate,
        bookedDates: requestedDates,
        totalAmount,
        deskOwnerAmount,
        platformFee,
        currency: desk.currency,
        status: 'PENDING',
      },
    });

    // Get current domain for redirect URLs
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Return mock payment page URL instead of Stripe
    return NextResponse.json({
      url: `${baseUrl}/payment/${booking.id}`,
      bookingId: booking.id,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
