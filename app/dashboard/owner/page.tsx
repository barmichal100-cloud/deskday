import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/getUser";
import DashboardTabs from "../DashboardTabs";
import Header from "../../Header";

export default async function OwnerDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Redirect to renter dashboard if user is a renter
  if (user.role === "RENTER") {
    redirect("/dashboard/renter");
  }

  // Fetch user's listed desks (for owners)
  const myDesks = await prisma.desk.findMany({
    where: { ownerId: user.id },
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
        ownerId: user.id,
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

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/" backText="Home" />

      <section className="px-6 lg:px-20 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
            Desk Owner Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        <DashboardTabs
          myDesks={myDesks}
          bookingsReceived={bookingsReceived}
          bookingsMade={[]}
          userRole={user.role}
        />
      </section>
    </main>
  );
}
