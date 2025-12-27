import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { createDashboardLink } from '@/lib/stripe';

/**
 * POST /api/stripe/connect/dashboard
 * Generate Stripe Express Dashboard login link for owner
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

    // Get user with Stripe account ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found. Please complete onboarding first.' },
        { status: 400 }
      );
    }

    if (!user.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: 'Stripe onboarding not complete. Please finish onboarding first.' },
        { status: 400 }
      );
    }

    // Create dashboard login link
    const loginLink = await createDashboardLink(user.stripeConnectAccountId);

    return NextResponse.json({
      url: loginLink.url,
    });
  } catch (error) {
    console.error('Error creating Stripe dashboard link:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create dashboard link';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
