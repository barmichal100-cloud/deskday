"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
};

export default function CancelBookingButton({ bookingId }: Props) {
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setError(null);
    setIsCancelling(true);

    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to cancel booking");
        setIsCancelling(false);
        return;
      }

      // Redirect to dashboard with success message
      router.push("/dashboard?tab=made&cancelled=true");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      setIsCancelling(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirmModal(true)}
        className="w-full rounded-lg border-2 border-red-500 px-6 py-3 text-base font-semibold text-red-500 hover:bg-red-50 transition"
      >
        Cancel booking
      </button>

      {/* Confirmation modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Cancel this booking?
            </h3>

            <div className="mb-6 space-y-3 text-sm text-gray-700">
              <p>
                Are you sure you want to cancel this booking?
              </p>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Refund policy:</span> You'll receive a full refund if cancelled at least 24 hours before check-in. After that, the booking is non-refundable.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isCancelling}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Keep booking
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition disabled:opacity-50"
              >
                {isCancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Cancelling...
                  </span>
                ) : (
                  "Yes, cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
