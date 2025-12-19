import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserMenuWrapper from "../../UserMenuWrapper";
import { prisma } from "@/lib/prisma";

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
        take: 5,
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
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="px-6 lg:px-20 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/settings" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Settings</span>
              </Link>
              <Link href="/" className="flex items-center gap-1">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center p-1">
                  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                    <rect x="4" y="12" width="24" height="2.5" rx="0.5" fill="white"/>
                    <rect x="5" y="14.5" width="6" height="9" rx="0.5" fill="white" fillOpacity="0.9"/>
                    <line x1="6.5" y1="17" x2="9.5" y2="17" stroke="#ec4899" strokeWidth="0.8" strokeLinecap="round"/>
                    <line x1="6.5" y1="20" x2="9.5" y2="20" stroke="#ec4899" strokeWidth="0.8" strokeLinecap="round"/>
                    <rect x="23" y="14.5" width="2" height="9" rx="0.5" fill="white" fillOpacity="0.9"/>
                    <rect x="14" y="7" width="7" height="5" rx="0.5" fill="white" fillOpacity="0.95"/>
                    <rect x="17" y="12" width="1" height="1" fill="white" fillOpacity="0.8"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-rose-500 tracking-tight">deskday</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <UserMenuWrapper />
            </div>
          </div>
        </div>
      </header>

      <section className="px-6 lg:px-20 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Payments & Payouts</h1>
          <p className="text-gray-600">Manage payment methods and payout preferences</p>
        </div>

        <div className="space-y-6">
          {/* Payment Methods Section (for Renters) */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
              <p className="text-sm text-gray-600 mt-1">Add and manage your payment methods for bookings</p>
            </div>
            <div className="p-6">
              {hasPaymentMethod ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-8 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M0 4.5C0 3.12 1.12 2 2.5 2h19C22.88 2 24 3.12 24 4.5v15c0 1.38-1.12 2.5-2.5 2.5h-19C1.12 22 0 20.88 0 19.5v-15zM2.5 4a.5.5 0 00-.5.5V8h20V4.5a.5.5 0 00-.5-.5h-19zM2 19.5a.5.5 0 00.5.5h19a.5.5 0 00.5-.5V10H2v9.5z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Card ending in ••••</p>
                        <p className="text-sm text-gray-600">Default payment method</p>
                      </div>
                    </div>
                    <button className="text-sm font-medium text-pink-600 hover:text-pink-700">
                      Edit
                    </button>
                  </div>
                  <button className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition">
                    + Add payment method
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No payment methods</h3>
                  <p className="text-gray-600 mb-4">Add a payment method to book desks</p>
                  <button className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition">
                    Add payment method
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payout Methods Section (for Owners) */}
          {user.role === "OWNER" && (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Payout Method</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage how you receive payouts from bookings</p>
                </div>
                <div className="p-6">
                  {hasStripeAccount ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-green-50 border-green-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Bank account connected</p>
                            <p className="text-sm text-gray-600">Payouts are enabled</p>
                          </div>
                        </div>
                        <button className="text-sm font-medium text-pink-600 hover:text-pink-700">
                          Manage
                        </button>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex gap-3">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-blue-900">Payout Schedule</p>
                            <p className="text-sm text-blue-700 mt-1">Payouts are processed within 2-3 business days after a booking is completed.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Set up payouts</h3>
                      <p className="text-gray-600 mb-4">Connect your bank account to receive payouts from bookings</p>
                      <button className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition">
                        Connect bank account
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Payouts */}
              {payouts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Payouts</h2>
                    <p className="text-sm text-gray-600 mt-1">View your recent payout history</p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="px-6 py-4 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{payout.booking.desk.title_en}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(payout.createdAt).toLocaleDateString("en-IE", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {payout.currency} {(payout.amount / 100).toFixed(2)}
                            </p>
                            <span
                              className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                                payout.status === "PAID"
                                  ? "bg-green-100 text-green-700"
                                  : payout.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {payout.status.charAt(0) + payout.status.slice(1).toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <Link
                      href="/dashboard/owner?tab=payouts"
                      className="text-sm font-medium text-pink-600 hover:text-pink-700"
                    >
                      View all payouts →
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Invoices & Receipts */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Invoices & Receipts</h2>
              <p className="text-sm text-gray-600 mt-1">Download invoices and receipts for your transactions</p>
            </div>
            <div className="p-6 text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600">No invoices or receipts yet</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
