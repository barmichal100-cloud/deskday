import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";
import Header from "../../Header";
import { prisma } from "@/lib/prisma";
import PaymentsTabs from "./PaymentsTabs";

export default async function PaymentsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch user's payouts if they're an owner
  const payouts = user.role === "OWNER"
    ? await prisma.payout.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          booking: {
            include: {
              desk: {
                select: {
                  title_en: true,
                },
              },
            },
          },
        },
      })
    : [];

  const hasStripeAccount = !!user.stripeAccountId;
  const hasPaymentMethod = !!user.stripeCustomerId;

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/settings" backText="Settings" />

      <section className="px-6 lg:px-20 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Payments</h1>
        </div>

        <PaymentsTabs
          userRole={user.role}
          hasStripeAccount={hasStripeAccount}
          hasPaymentMethod={hasPaymentMethod}
          payouts={payouts}
        />
      </section>
    </main>
  );
}
