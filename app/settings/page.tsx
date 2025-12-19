import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserMenuWrapper from "../UserMenuWrapper";

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const settingsSections = [
    {
      title: "Personal Information",
      description: "Provide personal details and how we can reach you",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      items: [
        { label: "Legal name", value: user.name || "Not provided", href: "/settings/personal-info" },
        { label: "Email address", value: user.email, href: "/settings/personal-info" },
        { label: "Phone number", value: "Not provided", href: "/settings/personal-info" },
      ],
    },
    {
      title: "Login & Security",
      description: "Update your password and secure your account",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      items: [
        { label: "Password", value: "••••••••", href: "/settings/security" },
        { label: "Two-factor authentication", value: "Not enabled", href: "/settings/security" },
      ],
    },
    {
      title: "Payments & Payouts",
      description: "Manage your payment methods and payout preferences",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      items: [
        { label: "Payment methods", value: "Add payment method", href: "/settings/payments" },
        { label: "Payout methods", value: "Add payout method", href: "/settings/payments" },
      ],
    },
    {
      title: "Notifications",
      description: "Choose notification preferences and how you want to be contacted",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      items: [
        { label: "Email notifications", value: "Manage preferences", href: "/settings/notifications" },
        { label: "Push notifications", value: "Manage preferences", href: "/settings/notifications" },
      ],
    },
    {
      title: "Privacy & Sharing",
      description: "Manage your personal data, connected services, and data sharing settings",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
      items: [
        { label: "Data sharing", value: "Manage settings", href: "/settings/privacy" },
        { label: "Request your data", value: "Download data", href: "/settings/privacy" },
      ],
    },
    {
      title: "Preferences",
      description: "Set your default language, currency, and timezone",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      items: [
        { label: "Language", value: user.preferredLocale === "EN" ? "English" : "Hebrew", href: "/settings/preferences" },
        { label: "Currency", value: "ILS (₪)", href: "/settings/preferences" },
        { label: "Timezone", value: "Asia/Jerusalem", href: "/settings/preferences" },
      ],
    },
  ];

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

      {/* Main content */}
      <section className="px-6 lg:px-20 py-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">
            {user.name || user.email.split("@")[0]} · {user.email}
          </p>
        </div>

        <div className="space-y-6">
          {settingsSections.map((section, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      {section.title}
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      {section.description}
                    </p>
                    <div className="space-y-3">
                      {section.items.map((item, itemIdx) => (
                        <Link
                          key={itemIdx}
                          href={item.href}
                          className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 transition group"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.label}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {item.value}
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deactivate account */}
        <div className="mt-8 p-6 bg-white rounded-2xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Deactivate your account
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            This will deactivate your account. You can reactivate it anytime by logging back in.
          </p>
          <Link
            href="/settings/deactivate"
            className="inline-block text-sm font-semibold text-gray-900 hover:text-gray-700 underline transition"
          >
            Deactivate account
          </Link>
        </div>
      </section>
    </main>
  );
}
