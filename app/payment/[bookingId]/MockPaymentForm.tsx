"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  deskId: string;
};

export default function MockPaymentForm({ bookingId, deskId }: Props) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format card number with spaces
  function formatCardNumber(value: string) {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  }

  // Format expiry date as MM/YY
  function formatExpiryDate(value: string) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      // Simulate payment processing delay (like Stripe would)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Call mock payment API
      const response = await fetch('/api/mock-payment/process', {
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
        setError(data.error || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // Redirect to success page
      router.push(`/dashboard?tab=made&booking=${bookingId}&payment=success`);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card number */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Card number
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                if (formatted.replace(/\s/g, '').length <= 16) {
                  setCardNumber(formatted);
                }
              }}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <div className="w-8 h-5 rounded bg-gradient-to-br from-blue-600 to-blue-400 opacity-60" />
              <div className="w-8 h-5 rounded bg-gradient-to-br from-orange-600 to-orange-400 opacity-60" />
            </div>
          </div>
        </div>

        {/* Expiry and CVC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Expiry date
            </label>
            <input
              type="text"
              value={expiryDate}
              onChange={(e) => {
                const formatted = formatExpiryDate(e.target.value);
                if (formatted.replace(/\D/g, '').length <= 4) {
                  setExpiryDate(formatted);
                }
              }}
              placeholder="MM/YY"
              maxLength={5}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              CVC
            </label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 4) {
                  setCvc(value);
                }
              }}
              placeholder="123"
              maxLength={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Cardholder name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Cardholder name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing payment...
            </span>
          ) : (
            'Pay now'
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          This is a demo payment form. No real charges will be made.
        </p>
      </form>
    </div>
  );
}
