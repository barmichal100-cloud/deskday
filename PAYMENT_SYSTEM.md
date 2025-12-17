# Mock Payment System

## Overview

Deskday uses a **mock payment system** that simulates the Airbnb-style instant booking experience without processing real payments. This allows you to test and develop the booking flow without needing Stripe API keys or payment processing infrastructure.

## How It Works

### Complete Booking Flow

```
1. User selects dates on desk page
   ↓
2. Clicks "Reserve" → Review/confirmation page
   ↓
3. Reviews details, accepts policies
   ↓
4. Clicks "Confirm and pay"
   ↓
5. Redirects to mock payment page (looks like Stripe Checkout)
   ↓
6. User enters mock card details
   ↓
7. Clicks "Pay now" → 2-second processing simulation
   ↓
8. Booking status: PENDING → CONFIRMED
   ↓
9. Booked dates automatically blocked
   ↓
10. Redirects to dashboard with success message ✅
```

### Mock Payment Page Features

The mock payment page ([`/app/payment/[bookingId]/page.tsx`](app/payment/[bookingId]/page.tsx)) looks like a real Stripe Checkout page:

- **Professional UI**: Styled to look like Stripe's payment form
- **Order summary**: Shows desk photo, details, and price breakdown
- **Card form**: Accepts any card number (16 digits)
- **Validation**: Basic validation for card format, expiry, CVC
- **Processing animation**: 2-second delay simulating real payment
- **Trust badges**: Security icons for credibility

### Test Card Details

You can use **any** test card details:

- **Card number**: Any 16 digits (e.g., `1234 5678 9012 3456`)
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3-4 digits (e.g., `123`)
- **Name**: Any name

The system validates the format but accepts all cards.

## Key Files

### Payment Pages
- [`/app/payment/[bookingId]/page.tsx`](app/payment/[bookingId]/page.tsx) - Mock payment page (replaces Stripe Checkout)
- [`/app/payment/[bookingId]/MockPaymentForm.tsx`](app/payment/[bookingId]/MockPaymentForm.tsx) - Payment form component

### API Routes
- [`/app/api/create-checkout-session/route.ts`](app/api/create-checkout-session/route.ts) - Creates PENDING booking and returns mock payment URL
- [`/app/api/mock-payment/process/route.ts`](app/api/mock-payment/process/route.ts) - Processes mock payment and confirms booking
- [`/app/api/webhooks/stripe/route.ts`](app/api/webhooks/stripe/route.ts) - Not used in mock system (kept for future Stripe integration)

### Components
- [`/app/desk/[id]/book/page.tsx`](app/desk/[id]/book/page.tsx) - Booking review/confirmation page
- [`/app/desk/[id]/book/BookingConfirmForm.tsx`](app/desk/[id]/book/BookingConfirmForm.tsx) - Redirects to mock payment page

## What Happens Behind the Scenes

### 1. Create Checkout Session
```typescript
// POST /api/create-checkout-session
// Creates booking with status: PENDING
// Returns URL: /payment/{bookingId}
```

### 2. Mock Payment Processing
```typescript
// POST /api/mock-payment/process
// 1. Validates booking ownership
// 2. Updates status: PENDING → CONFIRMED
// 3. Removes dates from DeskAvailableDate
// 4. Adds dates to DeskBlockedDate with reason: BOOKED
// 5. Returns success
```

### 3. Automatic Date Blocking

After successful "payment":
- Selected dates are **removed** from `DeskAvailableDate` table
- Selected dates are **added** to `DeskBlockedDate` table with `reason: 'BOOKED'`
- This prevents double-booking automatically
- No manual intervention needed

## Booking Statuses

- **PENDING**: Temporary state while payment page is open
- **CONFIRMED**: "Payment" successful, booking is active ✅
- **CANCELLED**: Booking was cancelled
- **REFUNDED**: Payment was refunded

## Testing the Flow

1. **Browse to a desk** with available dates
2. **Select dates** on the calendar
3. **Click "Reserve"**
4. **Review booking details** and accept terms
5. **Click "Confirm and pay"**
6. **Fill in mock card details** (any 16 digits)
7. **Click "Pay now"**
8. Wait 2 seconds for processing animation
9. **Success!** Redirected to dashboard

## No Setup Required

Unlike the Stripe version, the mock payment system requires:
- ✅ **No API keys**
- ✅ **No webhook configuration**
- ✅ **No external accounts**
- ✅ **No credit card**
- ✅ **Works offline**

Just start your dev server and it works!

## Differences from Real Stripe

| Feature | Mock System | Real Stripe |
|---------|-------------|-------------|
| Payment processing | Simulated (2 sec delay) | Real card charges |
| API keys needed | No | Yes |
| Webhook setup | No | Yes |
| Card validation | Format only | Full validation + fraud detection |
| Payment intents | Mock ID | Real Stripe ID |
| Refunds | Not implemented | Full refund support |
| 3D Secure | Not supported | Supported |
| Multiple currencies | Display only | Real conversion |
| Saved cards | Not supported | Supported |

## Migrating to Real Stripe Later

When you're ready to accept real payments, you'll need to:

1. **Install Stripe packages** (already installed):
   ```bash
   npm install stripe @stripe/stripe-js
   ```

2. **Get Stripe API keys** from https://dashboard.stripe.com/test/apikeys

3. **Update `.env`**:
   ```bash
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

4. **Restore Stripe integration**:
   - Uncomment Stripe code in [`create-checkout-session/route.ts`](app/api/create-checkout-session/route.ts)
   - Update [`BookingConfirmForm.tsx`](app/desk/[id]/book/BookingConfirmForm.tsx) to use Stripe redirect
   - Set up webhook forwarding for local dev

5. **Remove mock payment** files (or keep as fallback for testing)

See [`STRIPE_SETUP.md`](STRIPE_SETUP.md) for detailed Stripe integration instructions.

## Security Notes

The mock payment system:
- ✅ Validates user authentication
- ✅ Checks booking ownership
- ✅ Validates date availability
- ✅ Prevents duplicate bookings
- ✅ Server-side price calculation
- ⚠️ **Does NOT validate real cards**
- ⚠️ **Does NOT process real money**
- ⚠️ **Not suitable for production**

This is **for development and testing only**. Use real Stripe in production.

## Advantages of Mock System

1. **Fast development**: No external dependencies
2. **Free testing**: No transaction fees
3. **Offline capable**: Works without internet
4. **Easy debugging**: All logic in your codebase
5. **No rate limits**: Test as much as you want
6. **Instant feedback**: No async webhook delays

## Future Enhancements

When ready for production:
- [ ] Replace mock with real Stripe
- [ ] Add email confirmations
- [ ] Implement refund logic
- [ ] Support multiple payment methods
- [ ] Add invoice generation
- [ ] Implement Stripe Connect for owner payouts
