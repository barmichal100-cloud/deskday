"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Props = {
  userRole: "RENTER" | "OWNER" | "ADMIN";
  hasStripeAccount: boolean;
  hasPaymentMethod: boolean;
  payouts: any[];
};

export default function PaymentsTabs({
  userRole,
  hasStripeAccount,
  hasPaymentMethod,
  payouts,
}: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "payments" | "payouts" | null;

  const [activeTab, setActiveTab] = useState<"payments" | "payouts">(
    tabParam || "payments"
  );

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const tabs = [
    { id: "payments", label: "Payments" },
    ...(userRole === "OWNER" ? [{ id: "payouts", label: "Payouts" }] : []),
  ];

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "payments" | "payouts")}
              className={`pb-4 px-1 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="space-y-12">
          {/* Your payments section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your payments
            </h2>
            <p className="text-gray-600 mb-6">
              Keep track of all your payments and refunds.
            </p>
            <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
              Manage payments
            </button>
          </div>

          {/* Payment methods section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Payment methods
            </h2>
            <p className="text-gray-600 mb-6">
              Add a payment method using our secure payment system, then start planning your next trip.
            </p>

            {hasPaymentMethod ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-8 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M0 4.5C0 3.12 1.12 2 2.5 2h19C22.88 2 24 3.12 24 4.5v15c0 1.38-1.12 2.5-2.5 2.5h-19C1.12 22 0 20.88 0 19.5v-15zM2.5 4a.5.5 0 00-.5.5V8h20V4.5a.5.5 0 00-.5-.5h-19zM2 19.5a.5.5 0 00.5.5h19a.5.5 0 00.5-.5V10H2v9.5z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Card ending in ••••</p>
                      <p className="text-sm text-gray-600">Expires 12/25</p>
                    </div>
                  </div>
                  <button className="text-sm font-semibold underline text-gray-900 hover:text-gray-700">
                    Edit
                  </button>
                </div>
                <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
                  Add payment method
                </button>
              </div>
            ) : (
              <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
                Add payment method
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payouts Tab (Owner only) */}
      {activeTab === "payouts" && userRole === "OWNER" && (
        <div className="space-y-12">
          {/* How you'll get paid section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              How you'll get paid
            </h2>
            <p className="text-gray-600 mb-6">
              Add at least one payout method so we know where to send your money.
            </p>

            {hasStripeAccount ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Bank account connected</p>
                      <p className="text-sm text-gray-600">Payouts enabled</p>
                    </div>
                  </div>
                  <button className="text-sm font-semibold underline text-gray-900 hover:text-gray-700">
                    Edit
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-2">Need help?</h3>
                  <div className="space-y-3">
                    <Link href="/help/payouts/when" className="flex items-center justify-between text-gray-900 hover:underline">
                      <span>When you'll get your payout</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link href="/help/payouts/how" className="flex items-center justify-between text-gray-900 hover:underline">
                      <span>How payouts work</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link href="/help/payouts/history" className="flex items-center justify-between text-gray-900 hover:underline">
                      <span>Go to your transaction history</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
                  Set up payouts
                </button>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-2">Need help?</h3>
                  <div className="space-y-3">
                    <Link href="/help/payouts/when" className="flex items-center justify-between text-gray-900 hover:underline">
                      <span>When you'll get your payout</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link href="/help/payouts/how" className="flex items-center justify-between text-gray-900 hover:underline">
                      <span>How payouts work</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <Link href="/help/payouts/history" className="flex items-center justify-between text-gray-900 hover:underline">
                      <span>Go to your transaction history</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent payouts section */}
          {payouts.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Recent payouts
              </h2>
              <div className="border border-gray-300 rounded-xl divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <div key={payout.id} className="p-4 hover:bg-gray-50 transition">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
