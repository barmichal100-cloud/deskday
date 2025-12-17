"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

type Props = {
  myDesks: any[];
  bookingsReceived: any[];
  bookingsMade: any[];
  userRole: string;
};

export default function DashboardTabs({
  myDesks,
  bookingsReceived,
  bookingsMade,
  userRole,
}: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as "desks" | "received" | "made" | null;
  const bookingIdParam = searchParams.get('booking');
  const cancelledParam = searchParams.get('cancelled');

  // Determine default tab based on user role
  const getDefaultTab = () => {
    if (userRole === "OWNER") return "desks";
    if (userRole === "RENTER") return "made";
    return "desks";
  };

  const [activeTab, setActiveTab] = useState<"desks" | "received" | "made">(
    tabParam || getDefaultTab()
  );
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelledMessage, setShowCancelledMessage] = useState(false);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Show success message when booking param is present
  useEffect(() => {
    if (bookingIdParam) {
      setShowSuccessMessage(true);
    }
  }, [bookingIdParam]);

  // Show cancelled message when cancelled param is present
  useEffect(() => {
    if (cancelledParam === 'true') {
      setShowCancelledMessage(true);
    }
  }, [cancelledParam]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "REFUNDED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div>
      {/* Success message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-green-800 font-medium">
                Payment successful! Your booking is confirmed. Check your email for details.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Cancelled message */}
      {showCancelledMessage && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">
                Your booking has been cancelled successfully. Refund will be processed according to the cancellation policy.
              </p>
            </div>
            <button
              onClick={() => setShowCancelledMessage(false)}
              className="flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {userRole === "OWNER" && (
          <>
            <button
              onClick={() => setActiveTab("desks")}
              className={`px-4 py-3 text-sm font-semibold transition -mb-px ${
                activeTab === "desks"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              My Desks ({myDesks.length})
            </button>
            <button
              onClick={() => setActiveTab("received")}
              className={`px-4 py-3 text-sm font-semibold transition -mb-px ${
                activeTab === "received"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Bookings Received ({bookingsReceived.length})
            </button>
          </>
        )}
        {userRole === "RENTER" && (
          <button
            onClick={() => setActiveTab("made")}
            className={`px-4 py-3 text-sm font-semibold transition -mb-px ${
              activeTab === "made"
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Bookings ({bookingsMade.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "desks" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Desks</h2>
            <Link
              href="/dashboard/owner/desks/new"
              className="rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-pink-600 hover:to-rose-600 transition"
            >
              Create listing
            </Link>
          </div>

          {myDesks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No desks yet</h3>
              <p className="text-sm text-gray-600">
                Click &quot;Create listing&quot; to add your first desk.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myDesks.map((desk) => (
                <div
                  key={desk.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
                >
                  {desk.photos?.[0] && (
                    <div className="w-full h-48 relative">
                      <Image
                        src={desk.photos[0].thumbnailUrl ?? desk.photos[0].url}
                        alt={desk.title_en ?? "desk photo"}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {desk.title_en || "Desk"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {desk.city}, {desk.country}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/owner/desks/${desk.id}/edit`}
                        className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
                      >
                        Edit
                      </Link>
                    </div>
                    <p className="text-base font-semibold text-gray-900 mb-2">
                      {desk.pricePerDay / 100} {desk.currency} <span className="font-normal text-gray-600">per day</span>
                    </p>
                    {desk.availableDates && desk.availableDates.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {desk.availableDates.length} available date{desk.availableDates.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "received" && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Bookings Received</h2>
          {bookingsReceived.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-sm text-gray-600">
                When someone books your desk, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookingsReceived.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/booking/${booking.id}`}
                  className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex gap-4">
                    {booking.desk.photos?.[0] && (
                      <div className="w-40 h-32 rounded-xl overflow-hidden relative flex-shrink-0">
                        <Image
                          src={
                            booking.desk.photos[0].thumbnailUrl ??
                            booking.desk.photos[0].url
                          }
                          alt={booking.desk.title_en ?? "desk photo"}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            {booking.desk.title_en}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {booking.desk.city}, {booking.desk.country}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {formatStatus(booking.status)}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Booked by:</span>{" "}
                          {booking.renter.name || booking.renter.email}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Dates:</span>{" "}
                          {booking.bookedDates && Array.isArray(booking.bookedDates)
                            ? (booking.bookedDates as string[]).map((d) => format(new Date(d), "MMM d, yyyy")).join(", ")
                            : `${format(new Date(booking.startDate), "MMM d, yyyy")} - ${format(new Date(booking.endDate), "MMM d, yyyy")}`
                          }
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Total:</span>{" "}
                          {booking.totalAmount / 100} {booking.currency}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Your earnings:</span>{" "}
                          {booking.deskOwnerAmount / 100} {booking.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "made" && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Bookings</h2>
          {bookingsMade.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-sm text-gray-600">
                Browse available desks and make your first booking!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookingsMade.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/booking/${booking.id}`}
                  className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex gap-4">
                    {booking.desk.photos?.[0] && (
                      <div className="w-40 h-32 rounded-xl overflow-hidden relative flex-shrink-0">
                        <Image
                          src={
                            booking.desk.photos[0].thumbnailUrl ??
                            booking.desk.photos[0].url
                          }
                          alt={booking.desk.title_en ?? "desk photo"}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            {booking.desk.title_en}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {booking.desk.city}, {booking.desk.country}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {formatStatus(booking.status)}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Owner:</span>{" "}
                          {booking.desk.owner.name || booking.desk.owner.email}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Dates:</span>{" "}
                          {booking.bookedDates && Array.isArray(booking.bookedDates)
                            ? (booking.bookedDates as string[]).map((d) => format(new Date(d), "MMM d, yyyy")).join(", ")
                            : `${format(new Date(booking.startDate), "MMM d, yyyy")} - ${format(new Date(booking.endDate), "MMM d, yyyy")}`
                          }
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Total paid:</span>{" "}
                          {booking.totalAmount / 100} {booking.currency}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Address:</span>{" "}
                          {booking.desk.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
