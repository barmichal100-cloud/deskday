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

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        deskId,
        renterId: userId,
        startDate,
        endDate,
        bookedDates: requestedDates, // Store the actual dates that were booked
        totalAmount,
        deskOwnerAmount,
        platformFee,
        currency: desk.currency,
        status: 'PENDING',
      },
      include: {
        desk: {
          include: {
            photos: { take: 1, orderBy: { order: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
    return NextResponse.json(
      { error: `Failed to create booking: ${errorMessage}` },
      { status: 500 }
    );
  }
}
