import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardTabs from "./DashboardTabs";
import UserMenuWrapper from "../UserMenuWrapper";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  // Fetch user data to determine their role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true, email: true },
  });

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch user's listed desks (for owners)
  const myDesks = await prisma.desk.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      photos: { take: 1, orderBy: { order: "asc" } },
      availableDates: { orderBy: { date: "asc" } },
    },
  });

  // Fetch bookings received (desks owned by user that were booked)
  const bookingsReceived = await prisma.booking.findMany({
    where: {
      desk: {
        ownerId: userId,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      desk: {
        include: {
          photos: { take: 1, orderBy: { order: "asc" } },
        },
      },
      renter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Fetch bookings made (desks booked by user)
  const bookingsMade = await prisma.booking.findMany({
    where: {
      renterId: userId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      desk: {
        include: {
          photos: { take: 1, orderBy: { order: "asc" } },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="px-6 lg:px-20 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Back link */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-1">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center p-1">
                  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                    {/* Desk surface */}
                    <rect x="4" y="12" width="24" height="2.5" rx="0.5" fill="white"/>
                    {/* Left drawer unit */}
                    <rect x="5" y="14.5" width="6" height="9" rx="0.5" fill="white" fillOpacity="0.9"/>
                    <line x1="6.5" y1="17" x2="9.5" y2="17" stroke="#ec4899" strokeWidth="0.8" strokeLinecap="round"/>
                    <line x1="6.5" y1="20" x2="9.5" y2="20" stroke="#ec4899" strokeWidth="0.8" strokeLinecap="round"/>
                    {/* Right leg */}
                    <rect x="23" y="14.5" width="2" height="9" rx="0.5" fill="white" fillOpacity="0.9"/>
                    {/* Monitor on desk */}
                    <rect x="14" y="7" width="7" height="5" rx="0.5" fill="white" fillOpacity="0.95"/>
                    <rect x="17" y="12" width="1" height="1" fill="white" fillOpacity="0.8"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-rose-500 tracking-tight">
                  deskday
                </span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-900 hover:text-gray-600 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Home
              </Link>
            </div>

            {/* Right navigation */}
            <div className="flex items-center gap-4">
              <UserMenuWrapper />
            </div>
          </div>
        </div>
      </header>

      <section className="px-6 lg:px-20 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            {user.role === "OWNER" ? "Desk Owner Dashboard" : "Desk Renter Dashboard"}
          </h1>
          <p className="text-sm text-gray-600">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        <DashboardTabs
          myDesks={myDesks}
          bookingsReceived={bookingsReceived}
          bookingsMade={bookingsMade}
          userRole={user.role}
        />
      </section>
    </main>
  );
}
