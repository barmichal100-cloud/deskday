"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  deskId: string;
  dates: string[];
  hasHouseRules: boolean;
};

export default function BookingConfirmForm({ deskId, dates, hasHouseRules }: Props) {
  const router = useRouter();
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleConfirmAndPay() {
    // Validate checkboxes
    if (!acceptedPolicy) {
      setError('Please accept the cancellation policy');
      return;
    }

    if (hasHouseRules && !acceptedRules) {
      setError('Please accept the house rules');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create booking and get payment page URL
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deskId,
          dates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create booking');
        setIsProcessing(false);
        return;
      }

      // Redirect to mock payment page
      router.push(data.url);
    } catch (err) {
      setError('An unexpected error occurred');
      setIsProcessing(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Confirm and book
      </h3>

      <div className="space-y-4 mb-6">
        {hasHouseRules && (
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptedRules}
              onChange={(e) => {
                setAcceptedRules(e.target.checked);
                setError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">
              I agree to the house rules
            </span>
          </label>
        )}

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={acceptedPolicy}
            onChange={(e) => {
              setAcceptedPolicy(e.target.checked);
              setError(null);
            }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">
            I understand the cancellation policy
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        onClick={handleConfirmAndPay}
        disabled={isProcessing}
        className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-base font-semibold text-white shadow-sm hover:from-pink-600 hover:to-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Confirm and pay'}
      </button>

      <p className="text-xs text-center text-gray-600 mt-3">
        You&apos;ll be redirected to a secure payment page to complete your booking.
      </p>
    </div>
  );
}
