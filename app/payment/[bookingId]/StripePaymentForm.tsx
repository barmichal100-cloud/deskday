"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  bookingId: string;
  deskId: string;
};

export default function StripePaymentForm({ bookingId, deskId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user canceled the Stripe checkout
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setError('Payment was canceled. Please try again.');
    }
  }, [searchParams]);

  async function handlePayment() {
    setError(null);
    setIsProcessing(true);

    try {
      // The booking was already created by create-checkout-session
      // We need to create a new checkout session for this existing booking
      const response = await fetch('/api/create-stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create checkout session');
        setIsProcessing(false);
        return;
      }

      // Redirect to Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to get checkout URL');
        setIsProcessing(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsProcessing(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Payment details
      </h2>

      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-900">
            You'll be redirected to Stripe's secure payment page to complete your booking.
          </p>
        </div>

        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading Stripe...
            </span>
          ) : (
            'Proceed to Stripe Checkout'
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
}
