import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardTabs from "./DashboardTabs";
import Header from "../Header";

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
      <Header backHref="/" backText="Home" />

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
