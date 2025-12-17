import Link from "next/link";

export default function HowItWorksPage() {
    return (
      <main className="min-h-screen bg-white">
        {/* Airbnb-style header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="px-6 lg:px-20 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
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

              {/* Right side navigation */}
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/sign-up"
                  className="text-sm font-semibold text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-full transition"
                >
                  List your desk
                </Link>
                <Link
                  href="/auth/sign-in"
                  className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <div className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="px-6 lg:px-20 py-12 md:py-16">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            How Deskday works
          </h1>
          <p className="text-gray-600 max-w-2xl mb-12">
            Deskday connects businesses that have spare desks with people who need a
            quiet place to work for a day or a few days in a row.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
              <p className="text-xs font-semibold text-rose-500 mb-3 tracking-wide">
                FOR DESK OWNERS
              </p>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">List your spare desk</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Add photos, price per day, and choose which dates are available.
                You stay in control of your space.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
              <p className="text-xs font-semibold text-rose-500 mb-3 tracking-wide">
                FOR RENTERS
              </p>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Search & book</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Find desks near you, filter by date, and book instantly with secure
                payment. No contracts or long-term commitments.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
              <p className="text-xs font-semibold text-rose-500 mb-3 tracking-wide">
                PAYMENTS
              </p>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">We handle the payments</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Deskday processes the payment and sends the payout to the desk
                owner, while keeping a small service fee.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }
  