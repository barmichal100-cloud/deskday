import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/getUser";
import DashboardTabs from "../DashboardTabs";
import UserMenuWrapper from "../../UserMenuWrapper";

export default async function RenterDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Redirect to owner dashboard if user is an owner
  if (user.role === "OWNER") {
    redirect("/dashboard/owner");
  }

  // Fetch bookings made (desks booked by user)
  const bookingsMade = await prisma.booking.findMany({
    where: {
      renterId: user.id,
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
            {/* Left side - Back button and Logo */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </Link>
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
            Desk Renter Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        <DashboardTabs
          myDesks={[]}
          bookingsReceived={[]}
          bookingsMade={bookingsMade}
          userRole={user.role}
        />
      </section>
    </main>
  );
}
