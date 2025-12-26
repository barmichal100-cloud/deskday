import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
  });
}

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

    // Get base URL for redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const stripe = getStripeClient();

    // Fetch desk with photos for Stripe checkout
    const deskWithPhotos = await prisma.desk.findUnique({
      where: { id: deskId },
      include: {
        photos: { take: 1, orderBy: { order: 'asc' } },
      },
    });

    // Calculate total amount (booking amount + platform fee)
    const totalAmountWithFee = totalAmount + platformFee;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: desk.currency.toLowerCase(),
            product_data: {
              name: desk.title_en,
              description: `${desk.city}, ${desk.country} - ${numberOfDays} day${numberOfDays > 1 ? 's' : ''}`,
              images: deskWithPhotos?.photos?.[0]?.url ? [deskWithPhotos.photos[0].url] : undefined,
            },
            unit_amount: totalAmountWithFee, // Amount in cents (totalAmount + platformFee)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?tab=made&booking=${booking.id}&payment=success`,
      cancel_url: `${baseUrl}/payment/${booking.id}?canceled=true`,
      metadata: {
        bookingId: booking.id,
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
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
