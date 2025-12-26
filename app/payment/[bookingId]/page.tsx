import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import StripePaymentForm from "./StripePaymentForm";
import Header from "../../Header";

type PaymentPageProps = {
  params: Promise<{ bookingId: string }>;
};

export default async function MockPaymentPage({ params }: PaymentPageProps) {
  const { bookingId } = await params;

  // Fetch booking details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      desk: {
        include: {
          photos: { take: 1, orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!booking) {
    redirect('/');
  }

  if (booking.status === 'CONFIRMED') {
    // Already paid, redirect to dashboard
    redirect(`/dashboard?tab=made&booking=${bookingId}&payment=success`);
  }

  const bookedDates = booking.bookedDates as string[];
  const numberOfDays = bookedDates.length;
  const datesParam = bookedDates.join(',');

  return (
    <main className="min-h-screen bg-white">
      <Header backHref={`/desk/${booking.deskId}/book?dates=${datesParam}`} backText="Booking" />

      <div className="max-w-2xl mx-auto px-6 py-10 bg-gray-50">
        {/* Mock Stripe-style header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600" />
            <span className="text-lg font-semibold text-gray-900">Secure Payment</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Complete your booking
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            You're booking {booking.desk.title_en}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Payment summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order summary
            </h2>
            <div className="flex gap-4 mb-4 pb-4 border-b border-gray-200">
              {booking.desk.photos?.[0] && (
                <div className="w-20 h-20 rounded-lg overflow-hidden relative flex-shrink-0 border border-gray-200">
                  <img
                    src={booking.desk.photos[0].thumbnailUrl ?? booking.desk.photos[0].url}
                    alt={booking.desk.title_en ?? "desk photo"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {booking.desk.title_en}
                </h3>
                <p className="text-sm text-gray-600">
                  {booking.desk.city}, {booking.desk.country}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {numberOfDays} day{numberOfDays > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal</span>
                <span className="text-gray-900">
                  {(booking.totalAmount / 100).toFixed(2)} {booking.currency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Service fee</span>
                <span className="text-gray-900">
                  {(booking.platformFee / 100).toFixed(2)} {booking.currency}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-base font-semibold text-gray-900">
                    {((booking.totalAmount + booking.platformFee) / 100).toFixed(2)} {booking.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe payment form */}
          <StripePaymentForm bookingId={bookingId} deskId={booking.deskId} />
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure payment</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Instant confirmation</span>
          </div>
        </div>
      </div>
    </main>
  );
}
