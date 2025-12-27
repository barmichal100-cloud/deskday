import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { createConnectAccount, createAccountLink } from '@/lib/stripe';

/**
 * POST /api/stripe/connect/onboard
 * Start Stripe Connect onboarding for an owner
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is an owner
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can connect Stripe accounts' },
        { status: 403 }
      );
    }

    // Check if already has a Connect account
    let stripeAccountId = user.stripeConnectAccountId;

    if (!stripeAccountId) {
      // Create new Stripe Connect account
      const account = await createConnectAccount({
        email: user.email,
        country: 'US', // You may want to get this from user preferences or location
      });

      stripeAccountId = account.id;

      // Save to database
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeConnectAccountId: stripeAccountId,
        },
      });
    }

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create account link for onboarding
    const accountLink = await createAccountLink({
      accountId: stripeAccountId,
      refreshUrl: `${baseUrl}/settings/payments`,
      returnUrl: `${baseUrl}/api/stripe/connect/return`,
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: stripeAccountId,
    });
  } catch (error) {
    console.error('Error creating Stripe Connect onboarding:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to start onboarding';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
