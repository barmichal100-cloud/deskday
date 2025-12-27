"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Props = {
  userRole: "RENTER" | "OWNER" | "ADMIN";
  hasStripeAccount: boolean;
  hasPaymentMethod: boolean;
  payouts: any[];
  stripeOnboardingComplete: boolean;
  stripeChargesEnabled: boolean;
};

export default function PaymentsTabs({
  userRole,
  hasStripeAccount,
  hasPaymentMethod,
  payouts,
  stripeOnboardingComplete,
  stripeChargesEnabled,
}: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "payments" | "payouts" | null;

  const [activeTab, setActiveTab] = useState<"payments" | "payouts">(
    tabParam || "payments"
  );
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showManagePaymentsModal, setShowManagePaymentsModal] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true);
    setConnectError(null);

    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setConnectError(data.error || 'Failed to start Stripe Connect onboarding');
        setIsConnectingStripe(false);
        return;
      }

      // Redirect to Stripe onboarding
      if (data.url) {
        window.location.href = data.url;
      } else {
        setConnectError('Failed to get onboarding URL');
        setIsConnectingStripe(false);
      }
    } catch (error) {
      setConnectError('An unexpected error occurred');
      setIsConnectingStripe(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      const response = await fetch('/api/stripe/connect/dashboard', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to open Stripe dashboard:', error);
    }
  };

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
            <button
              onClick={() => setShowManagePaymentsModal(true)}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Manage payments
            </button>
          </div>

          {/* Payment methods section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Payment methods
            </h2>
            <p className="text-gray-600 mb-6">
              Add a payment method using our secure payment system, then start booking desks.
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
                <button
                  onClick={() => setShowAddPaymentModal(true)}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
                >
                  Add payment method
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
              >
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
                {connectError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {connectError}
                  </div>
                )}
                <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stripeOnboardingComplete && stripeChargesEnabled
                        ? 'bg-gray-900'
                        : 'bg-yellow-500'
                    }`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {stripeOnboardingComplete && stripeChargesEnabled ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {stripeOnboardingComplete && stripeChargesEnabled
                          ? 'Bank account connected'
                          : 'Onboarding incomplete'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {stripeOnboardingComplete && stripeChargesEnabled
                          ? 'Payouts enabled'
                          : 'Complete onboarding to receive payments'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={stripeOnboardingComplete ? handleOpenStripeDashboard : handleConnectStripe}
                    className="text-sm font-semibold underline text-gray-900 hover:text-gray-700"
                    disabled={isConnectingStripe}
                  >
                    {stripeOnboardingComplete ? 'Manage' : 'Complete setup'}
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
                {connectError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {connectError}
                  </div>
                )}
                <button
                  onClick={handleConnectStripe}
                  disabled={isConnectingStripe}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnectingStripe ? 'Connecting...' : 'Set up payouts'}
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

      {/* Manage Payments Modal */}
      {showManagePaymentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Your payments</h2>
              <button
                onClick={() => setShowManagePaymentsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Once you have a reservation, this is where you can come to track your payments and refunds.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="font-medium text-gray-900 mb-2">Need help?</h3>
                <div className="space-y-3">
                  <Link
                    href="/help/payments/plans"
                    className="flex items-center justify-between text-gray-900 hover:underline"
                    onClick={() => setShowManagePaymentsModal(false)}
                  >
                    <span>How do payment plans work?</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/help/payments/find"
                    className="flex items-center justify-between text-gray-900 hover:underline"
                    onClick={() => setShowManagePaymentsModal(false)}
                  >
                    <span>Where can I find my payment?</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add card details</h2>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-3 mb-6">
                <svg className="w-10 h-7" viewBox="0 0 38 24" fill="none">
                  <rect width="38" height="24" rx="4" fill="#1434CB"/>
                  <path d="M13 8h-3v8h3V8zm-1.5 9.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" fill="#FFB600"/>
                  <circle cx="17.5" cy="12" r="4.5" fill="#FF5F00"/>
                  <circle cx="20.5" cy="12" r="4.5" fill="#EB001B"/>
                </svg>
                <svg className="w-10 h-7" viewBox="0 0 38 24">
                  <rect width="38" height="24" rx="4" fill="#016FD0"/>
                  <path d="M19 6l-3 12h3l3-12h-3zm8 0l-4 8.5 1.5 3.5h3l3-12h-3l-1 5-1-5h.5zm-10 0l-2 7 1 5h3l4-12h-3l-2 7-1-7z" fill="white"/>
                </svg>
                <svg className="w-10 h-7" viewBox="0 0 38 24">
                  <rect width="38" height="24" rx="4" fill="#006FCF"/>
                  <path d="M15 8h8v8h-8V8z" fill="#FFF"/>
                  <path d="M11 12h16M15 9h8M15 15h8" stroke="#006FCF" strokeWidth="0.5"/>
                </svg>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 1234 1234 1234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration
                    </label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Billing address</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street address
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apt or suite number
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          County
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postcode
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition"
                  >
                    Done
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
