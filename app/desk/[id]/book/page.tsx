import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import BookingConfirmForm from "./BookingConfirmForm";
import Header from "../../../Header";

type BookingReviewPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dates?: string }>;
};

export default async function BookingReviewPage({
  params,
  searchParams,
}: BookingReviewPageProps) {
  const { id: deskId } = await params;
  const search = await searchParams;
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect(`/auth/sign-in?redirect=/desk/${deskId}/book${search.dates ? `?dates=${search.dates}` : ''}`);
  }

  // Parse dates from query string
  const datesParam = search.dates;
  if (!datesParam) {
    redirect(`/desk/${deskId}`);
  }

  const selectedDates = datesParam.split(',').sort();

  // Fetch desk details
  const desk = await prisma.desk.findUnique({
    where: { id: deskId },
    include: {
      photos: { take: 1, orderBy: { order: 'asc' } },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      availableDates: true,
    },
  });

  if (!desk) {
    redirect('/');
  }

  // Check if user is trying to book their own desk
  if (desk.ownerId === userId) {
    redirect(`/desk/${deskId}?error=own-desk`);
  }

  // Verify all dates are available
  const availableDateStrings = new Set(
    desk.availableDates.map((ad) => ad.date.toISOString().split('T')[0])
  );

  const unavailableDates = selectedDates.filter(
    (date) => !availableDateStrings.has(date)
  );

  if (unavailableDates.length > 0) {
    redirect(`/desk/${deskId}?error=dates-unavailable`);
  }

  // Calculate pricing
  const numberOfDays = selectedDates.length;
  const subtotal = (desk.pricePerDay / 100) * numberOfDays;
  const platformFee = subtotal * 0.15;
  const total = subtotal + platformFee;

  // Get current user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });

  return (
    <main className="min-h-screen bg-white">
      <Header backHref={`/desk/${deskId}`} backText="Back to desk" />

      <div className="max-w-5xl mx-auto px-6 py-10 bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Review and confirm
          </h1>
          <p className="text-gray-600">
            Check your booking details before confirming
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Left side - Booking details */}
          <div className="space-y-6">
            {/* Your trip */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-5">
                Your booking
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Dates
                  </div>
                  <div className="text-sm text-gray-700">
                    {selectedDates.map((d) => format(new Date(d), "MMM d, yyyy")).join(", ")}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {numberOfDays} day{numberOfDays > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Your details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-5">
                Your details
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Name</div>
                  <div className="text-sm text-gray-700">{user?.name || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Email</div>
                  <div className="text-sm text-gray-700">{user?.email}</div>
                </div>
                {user?.phone && (
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Phone</div>
                    <div className="text-sm text-gray-700">{user.phone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* House rules */}
            {desk.houseRules_en && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  House rules
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {desk.houseRules_en}
                </p>
              </div>
            )}

            {/* Cancellation policy */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Cancellation policy
              </h2>
              <p className="text-sm text-gray-700">
                Free cancellation up to 24 hours before your booking. After that,
                cancellations are subject to a 50% fee. No refunds within 24 hours
                of your booking start time.
              </p>
            </div>

            {/* Ground rules */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ground rules
              </h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p>We ask every guest to remember a few simple things about what makes a great workspace.</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Treat the space with respect</li>
                  <li>Keep noise levels reasonable</li>
                  <li>Clean up after yourself</li>
                  <li>Follow the house rules</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right side - Price breakdown and confirmation */}
          <div>
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Desk summary card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
                  {desk.photos?.[0] && (
                    <div className="w-24 h-24 rounded-xl overflow-hidden relative flex-shrink-0">
                      <Image
                        src={desk.photos[0].thumbnailUrl ?? desk.photos[0].url}
                        alt={desk.title_en ?? "desk photo"}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                      {desk.title_en}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {desk.city}, {desk.country}
                    </p>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Price details
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {desk.pricePerDay / 100} {desk.currency} × {numberOfDays} day{numberOfDays > 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-900">
                      {subtotal.toFixed(2)} {desk.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Service fee (15%)</span>
                    <span className="text-gray-900">
                      {platformFee.toFixed(2)} {desk.currency}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-base font-semibold text-gray-900">
                        {total.toFixed(2)} {desk.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation form */}
              <BookingConfirmForm
                deskId={deskId}
                dates={selectedDates}
                hasHouseRules={!!desk.houseRules_en}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
