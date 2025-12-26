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
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      );
    }

    // Fetch booking with desk details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        desk: {
          include: {
            photos: { take: 1, orderBy: { order: 'asc' } },
          },
        },
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
      return NextResponse.json(
        { error: 'Booking already confirmed' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();

    // Calculate total amount (booking amount + platform fee)
    const totalAmount = booking.totalAmount + booking.platformFee;

    // Get the number of days
    const bookedDates = booking.bookedDates as string[];
    const numberOfDays = bookedDates.length;

    // Get base URL for redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: booking.currency.toLowerCase(),
            product_data: {
              name: booking.desk.title_en,
              description: `${booking.desk.city}, ${booking.desk.country} - ${numberOfDays} day${numberOfDays > 1 ? 's' : ''}`,
              images: booking.desk.photos?.[0]?.url ? [booking.desk.photos[0].url] : undefined,
            },
            unit_amount: totalAmount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?tab=made&booking=${bookingId}&payment=success`,
      cancel_url: `${baseUrl}/payment/${bookingId}?canceled=true`,
      metadata: {
        bookingId: booking.id,
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
