import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import CancelBookingButton from "./CancelBookingButton";
import Header from "../../Header";

type BookingDetailsPageProps = {
  params: Promise<{ bookingId: string }>;
};

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { bookingId } = await params;
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  // Fetch booking details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      desk: {
        include: {
          photos: { take: 5, orderBy: { order: "asc" } },
          owner: { select: { id: true, name: true, email: true } },
        },
      },
      renter: { select: { id: true, name: true, email: true } },
    },
  });

  if (!booking) {
    redirect("/dashboard");
  }

  // Check if user is authorized to view this booking
  const isRenter = booking.renterId === userId;
  const isOwner = booking.desk.ownerId === userId;

  if (!isRenter && !isOwner) {
    redirect("/dashboard");
  }

  const bookedDates = (booking.bookedDates as string[]) || [];
  const numberOfDays = bookedDates.length;
  const canCancel = booking.status === "CONFIRMED" && isRenter;

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/dashboard" backText="Dashboard" />
      <div className="max-w-4xl mx-auto px-6 py-10 bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Booking details
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm px-3 py-1.5 rounded-full border font-semibold ${
                booking.status === "CONFIRMED"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : booking.status === "CANCELLED"
                  ? "bg-red-100 text-red-800 border-red-200"
                  : booking.status === "REFUNDED"
                  ? "bg-gray-100 text-gray-800 border-gray-200"
                  : "bg-blue-100 text-blue-800 border-blue-200"
              }`}
            >
              {booking.status}
            </span>
            <span className="text-sm text-gray-600">
              Booked on {format(new Date(booking.createdAt), "MMMM d, yyyy")}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Desk details */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Photo gallery */}
              {booking.desk.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 p-4">
                  <div className="col-span-2 h-64 rounded-xl overflow-hidden relative">
                    <Image
                      src={booking.desk.photos[0].url}
                      alt={booking.desk.title_en ?? "desk photo"}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  {booking.desk.photos.slice(1, 5).map((photo, idx) => (
                    <div key={photo.id} className="h-32 rounded-xl overflow-hidden relative">
                      <Image
                        src={photo.thumbnailUrl ?? photo.url}
                        alt={`${booking.desk.title_en} photo ${idx + 2}`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="p-6 border-t border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {booking.desk.title_en}
                </h2>
                <p className="text-base text-gray-600 mb-4">
                  {booking.desk.city}, {booking.desk.country}
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  {booking.desk.address}
                </p>

                {/* Description */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">About this space</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {booking.desk.description_en}
                  </p>
                </div>

                {/* Contact info */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        {isRenter ? "Hosted by" : "Booked by"}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {isRenter
                          ? booking.desk.owner.name || booking.desk.owner.email
                          : booking.renter.name || booking.renter.email}
                      </p>
                    </div>
                    {isRenter && (
                      <Link
                        href={`/messages?userId=${booking.desk.owner.id}&bookingId=${bookingId}`}
                        className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Contact owner
                      </Link>
                    )}
                    {isOwner && (
                      <Link
                        href={`/messages?userId=${booking.renter.id}&bookingId=${bookingId}`}
                        className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Contact guest
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation policy */}
            {canCancel && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Cancellation policy
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Flexible cancellation:</span> Get a full refund if you cancel at least 24 hours before check-in.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Cancel up to 24 hours before check-in for a full refund</li>
                    <li>After that, the reservation is non-refundable</li>
                    <li>Service fees are refunded when applicable</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Booking summary
              </h3>

              {/* Dates */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900">Dates</span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  {bookedDates.map((dateStr) => (
                    <div key={dateStr}>
                      {format(new Date(dateStr), "EEEE, MMMM d, yyyy")}
                    </div>
                  ))}
                  <p className="text-xs text-gray-600 mt-2">
                    {numberOfDays} day{numberOfDays > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {booking.desk.pricePerDay / 100} {booking.currency} × {numberOfDays} day{numberOfDays > 1 ? "s" : ""}
                  </span>
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
              </div>

              {/* Total */}
              <div className="flex justify-between mb-6">
                <span className="text-base font-semibold text-gray-900">Total paid</span>
                <span className="text-base font-semibold text-gray-900">
                  {((booking.totalAmount + booking.platformFee) / 100).toFixed(2)} {booking.currency}
                </span>
              </div>

              {/* Cancel button */}
              {canCancel && (
                <CancelBookingButton bookingId={booking.id} />
              )}

              {/* Already cancelled message */}
              {booking.status === "CANCELLED" && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800">
                    This booking has been cancelled
                  </p>
                </div>
              )}

              {/* Owner view note */}
              {isOwner && booking.status === "CONFIRMED" && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Your earnings: <span className="font-semibold">{(booking.deskOwnerAmount / 100).toFixed(2)} {booking.currency}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
