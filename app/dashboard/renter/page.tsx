import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/getUser";
import DashboardTabs from "../DashboardTabs";
import Header from "../../Header";

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
      <Header backHref="/" backText="Home" />

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
