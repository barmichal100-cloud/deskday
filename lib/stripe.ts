import Stripe from 'stripe';

/**
 * Stripe helper functions for payment processing and Connect
 */

// Initialize Stripe client
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
  });
}

/**
 * Create a Stripe Connect Express account for an owner
 */
export async function createConnectAccount(params: {
  email: string;
  country?: string;
}): Promise<Stripe.Account> {
  const stripe = getStripeClient();

  const account = await stripe.accounts.create({
    type: 'express',
    email: params.email,
    country: params.country || 'US',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
}

/**
 * Create an account link for Stripe Connect onboarding
 */
export async function createAccountLink(params: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<Stripe.AccountLink> {
  const stripe = getStripeClient();

  const accountLink = await stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: 'account_onboarding',
  });

  return accountLink;
}

/**
 * Create a login link for Stripe Express Dashboard
 */
export async function createDashboardLink(accountId: string): Promise<Stripe.LoginLink> {
  const stripe = getStripeClient();

  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink;
}

/**
 * Retrieve account details to check onboarding status
 */
export async function getAccountDetails(accountId: string): Promise<Stripe.Account> {
  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(accountId);
  return account;
}

/**
 * Create a refund for a payment
 */
export async function createRefund(params: {
  paymentIntentId: string;
  amount?: number; // Amount in cents, omit for full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}): Promise<Stripe.Refund> {
  const stripe = getStripeClient();

  const refund = await stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amount,
    reason: params.reason || 'requested_by_customer',
  });

  return refund;
}

/**
 * Calculate refund amount based on cancellation policy
 *
 * @param totalAmount Total booking amount in cents
 * @param startDate Rental start date (first booked date)
 * @returns Refund amount in cents and percentage
 */
export function calculateRefundAmount(
  totalAmount: number,
  startDate: Date
): { amount: number; percentage: number } {
  const startDateTime = new Date(startDate);
  startDateTime.setHours(9, 0, 0, 0); // 9:00 AM

  const now = new Date();
  const hoursUntilStart = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let percentage: number;

  if (hoursUntilStart >= 24) {
    percentage = 100; // 100% refund
  } else if (hoursUntilStart > 0) {
    percentage = 50; // 50% refund
  } else {
    percentage = 0; // No refund, must file dispute
  }

  const amount = Math.round((totalAmount * percentage) / 100);

  return { amount, percentage };
}

/**
 * Calculate payout scheduled date (3 days after rental end at 11 PM)
 */
export function calculatePayoutDate(endDate: Date): Date {
  const endDateTime = new Date(endDate);
  endDateTime.setHours(23, 0, 0, 0); // 11:00 PM on last rental day

  // Add 3 days
  const payoutDate = new Date(endDateTime);
  payoutDate.setDate(payoutDate.getDate() + 3);

  return payoutDate;
}

/**
 * Check if guest can still file a dispute (within 48 hours of rental end)
 */
export function canFileDispute(endDate: Date): boolean {
  const endDateTime = new Date(endDate);
  endDateTime.setHours(23, 0, 0, 0); // 11:00 PM on last rental day

  const disputeDeadline = new Date(endDateTime);
  disputeDeadline.setHours(disputeDeadline.getHours() + 48); // 48 hours after end

  const now = new Date();
  return now <= disputeDeadline;
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeClient();

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  );

  return event;
}
