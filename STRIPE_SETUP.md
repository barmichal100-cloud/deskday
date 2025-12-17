# Stripe Payment Integration Setup

This guide explains how to set up Stripe payments for Deskday's instant booking system.

## Overview

The booking flow now works like Airbnb with **instant booking**:

1. User selects dates on desk page
2. Clicks "Reserve" → Goes to review/confirmation page
3. Reviews booking details, accepts policies
4. Clicks "Confirm and pay" → Redirects to Stripe Checkout
5. Completes payment on Stripe
6. **Booking is instantly confirmed** (no host approval needed)
7. **Booked dates are automatically blocked** from availability
8. Redirects to dashboard with success message

## Setup Instructions

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in
3. Get your API keys from: **Developers** → **API keys**
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend)

### 2. Add Environment Variables

Add these to your `.env` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY="sk_test_your_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

### 3. Set Up Stripe Webhook

For local development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe login`
3. Forward webhook events to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_...`)
5. Add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

For production:

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Copy the webhook signing secret
6. Add it to your production environment variables

## How It Works

### Payment Flow

```
User clicks "Confirm and pay"
    ↓
POST /api/create-checkout-session
    ↓
Creates booking with status: PENDING
    ↓
Creates Stripe Checkout Session
    ↓
Redirects user to Stripe payment page
    ↓
User completes payment
    ↓
Stripe sends webhook to /api/webhooks/stripe
    ↓
Webhook handler:
  - Updates booking status to CONFIRMED
  - Removes dates from availableDates
  - Adds dates to blockedDates with reason: BOOKED
    ↓
User redirected to dashboard with success message
```

### Booking Statuses

- **PENDING**: Temporary state while Stripe checkout is in progress (max 24 hours)
- **CONFIRMED**: Payment successful, booking is active
- **CANCELLED**: Booking was cancelled
- **REFUNDED**: Payment was refunded

### Key Files

#### API Routes
- [`/app/api/create-checkout-session/route.ts`](app/api/create-checkout-session/route.ts) - Creates Stripe checkout session and pending booking
- [`/app/api/webhooks/stripe/route.ts`](app/api/webhooks/stripe/route.ts) - Handles payment confirmation webhook
- [`/app/api/bookings/route.ts`](app/api/bookings/route.ts) - Original booking endpoint (no longer used for creation)

#### Components
- [`/app/desk/[id]/book/page.tsx`](app/desk/[id]/book/page.tsx) - Booking review/confirmation page
- [`/app/desk/[id]/book/BookingConfirmForm.tsx`](app/desk/[id]/book/BookingConfirmForm.tsx) - Payment button with Stripe integration

## Testing

### Test Card Numbers

Use these test cards in Stripe Checkout:

**Successful payment:**
- Card: `4242 4242 4242 4242`
- Exp: Any future date (e.g., 12/25)
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Payment declined:**
- Card: `4000 0000 0000 0002`

**Requires authentication (3D Secure):**
- Card: `4000 0027 6000 3184`

Full list: https://stripe.com/docs/testing#cards

### Testing the Flow

1. Make sure your dev server is running: `npm run dev`
2. Start Stripe webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Browse to a desk and select dates
4. Click "Reserve"
5. Accept the terms and click "Confirm and pay"
6. Use test card `4242 4242 4242 4242`
7. Complete payment
8. You should be redirected to dashboard with "Payment successful!" message
9. Check that:
   - Booking status is CONFIRMED
   - Selected dates are no longer available on the desk
   - Dates appear in blockedDates table

### Debugging

Check webhook delivery:
```bash
# In Stripe CLI output, you'll see:
✔ Received event: checkout.session.completed
```

Check server logs:
```bash
# You should see:
Booking {bookingId} confirmed and dates blocked
```

Check database:
```sql
-- Check booking status
SELECT id, status, "totalAmount", currency FROM "Booking" WHERE id = 'booking_id';

-- Check blocked dates
SELECT * FROM "DeskBlockedDate" WHERE "deskId" = 'desk_id' AND reason = 'BOOKED';

-- Check available dates removed
SELECT * FROM "DeskAvailableDate" WHERE "deskId" = 'desk_id';
```

## Production Considerations

1. **Use live API keys** in production (starts with `pk_live_` and `sk_live_`)
2. **Set up production webhook** endpoint in Stripe dashboard
3. **Enable email receipts** in Stripe dashboard settings
4. **Configure tax** collection if required
5. **Set up Connect** for payouts to desk owners (future feature)
6. **Add metadata** to charges for better tracking
7. **Implement refund logic** for cancellations

## Currency Support

Currently supported currencies:
- ILS (Israeli Shekel)
- USD (US Dollar)
- EUR (Euro)

The currency is set per desk listing and used for all bookings of that desk.

## Platform Fee

- **15%** platform fee on each booking
- Calculated as: `platformFee = totalAmount * 0.15`
- Desk owner receives: `deskOwnerAmount = totalAmount - platformFee`

Example:
- Desk price: 200 ILS/day
- Booking: 3 days
- Subtotal: 600 ILS
- Platform fee (15%): 90 ILS
- Total charged to guest: 600 ILS
- Desk owner receives: 510 ILS

## Security

- ✅ Webhook signature verification prevents fake events
- ✅ User authentication required before checkout
- ✅ Server-side price calculation prevents tampering
- ✅ Stripe handles all payment data (PCI compliant)
- ✅ Idempotency prevents duplicate bookings
- ✅ Automatic date blocking prevents double-booking

## Troubleshooting

**"Stripe failed to load"**
- Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
- Ensure it's a publishable key (starts with `pk_`)

**"Invalid signature" in webhook**
- Verify `STRIPE_WEBHOOK_SECRET` matches your webhook signing secret
- Make sure you're using the correct secret for test/live mode

**Booking stays PENDING**
- Check webhook is working: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Verify webhook URL is correct in production
- Check server logs for webhook errors

**Dates not blocked after payment**
- Check webhook handler logs
- Verify `checkout.session.completed` event is being received
- Check that `bookedDates` field has the correct date array

## Future Enhancements

- [ ] Email confirmation to guest and host
- [ ] SMS notifications
- [ ] Stripe Connect for automated payouts to desk owners
- [ ] Partial refunds for cancellations
- [ ] Saved payment methods for returning guests
- [ ] Apple Pay / Google Pay support
- [ ] Multi-currency pricing
- [ ] Dynamic pricing based on demand
