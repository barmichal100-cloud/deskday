import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { getAccountDetails } from '@/lib/stripe';
import { redirect } from 'next/navigation';

/**
 * GET /api/stripe/connect/return
 * Handle return from Stripe Connect onboarding
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      // Redirect to login if not authenticated
      return redirect('/login');
    }

    // Get user with Stripe account ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeConnectAccountId) {
      return redirect('/settings/payments?error=no_account');
    }

    // Retrieve account details from Stripe
    const account = await getAccountDetails(user.stripeConnectAccountId);

    // Update user with account status
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeDetailsSubmitted: account.details_submitted || false,
        stripeChargesEnabled: account.charges_enabled || false,
        stripePayoutsEnabled: account.payouts_enabled || false,
        stripeOnboardingComplete:
          account.details_submitted &&
          account.charges_enabled &&
          account.payouts_enabled,
      },
    });

    // Redirect to settings with success or pending status
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      return redirect('/settings/payments?success=onboarding_complete');
    } else {
      return redirect('/settings/payments?warning=onboarding_pending');
    }
  } catch (error) {
    console.error('Error handling Stripe Connect return:', error);
    return redirect('/settings/payments?error=onboarding_failed');
  }
}
