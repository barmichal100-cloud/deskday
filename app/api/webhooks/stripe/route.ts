import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { sendBookingConfirmationEmail, sendBookingNotificationToOwner } from '@/lib/email';

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
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe webhook is not configured' },
        { status: 503 }
      );
    }

    const stripe = getStripeClient();
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const bookingId = session.metadata?.bookingId;
        if (!bookingId) {
          console.error('No bookingId in session metadata');
          return NextResponse.json({ received: true });
        }

        // Update booking status to CONFIRMED and add payment intent ID
        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CONFIRMED',
            stripePaymentIntentId: session.payment_intent as string,
          },
          include: {
            desk: {
              include: {
                owner: true,
              },
            },
            renter: true,
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

        console.log(`Booking ${bookingId} confirmed and dates blocked`);

        // Send confirmation email to renter
        if (booking.renter?.email) {
          const checkInDate = bookedDates[0];
          const checkOutDate = bookedDates[bookedDates.length - 1];

          await sendBookingConfirmationEmail({
            to: booking.renter.email,
            bookingId: booking.id,
            deskTitle: booking.desk.title_en,
            deskAddress: `${booking.desk.address}, ${booking.desk.city}, ${booking.desk.country}`,
            checkInDate,
            checkOutDate,
            totalPrice: booking.totalAmount,
            currency: booking.currency,
            renterName: booking.renter.name || booking.renter.email.split('@')[0],
          });
        }

        // Send notification email to desk owner
        if (booking.desk.owner?.email) {
          const checkInDate = bookedDates[0];
          const checkOutDate = bookedDates[bookedDates.length - 1];

          await sendBookingNotificationToOwner({
            to: booking.desk.owner.email,
            bookingId: booking.id,
            deskTitle: booking.desk.title_en,
            deskAddress: `${booking.desk.address}, ${booking.desk.city}, ${booking.desk.country}`,
            checkInDate,
            checkOutDate,
            totalPrice: booking.totalAmount,
            currency: booking.currency,
            renterName: booking.renter?.name || booking.renter?.email.split('@')[0] || 'Unknown',
            renterEmail: booking.renter?.email || 'Not provided',
            ownerName: booking.desk.owner.name || booking.desk.owner.email.split('@')[0],
          });
        }

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;

        const bookingId = session.metadata?.bookingId;
        if (bookingId) {
          // Delete the pending booking if payment was not completed
          await prisma.booking.delete({
            where: { id: bookingId },
          });
          console.log(`Booking ${bookingId} deleted due to expired session`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
