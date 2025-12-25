import Header from "@/app/Header";

export default function HowItWorksPage() {
    return (
      <main className="min-h-screen bg-white">
        <Header backHref="/" backText="Home" hideRoleSwitch={true} hideDashboard={true} />

        <section className="px-6 lg:px-20 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            How Deskday works
          </h1>
          <p className="text-gray-600 max-w-2xl mb-12">
            Deskday connects businesses that have spare desks with people who need a
            quiet place to work for a day or a few days.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
              <p className="text-xs font-semibold text-rose-500 mb-3 tracking-wide">
                FOR DESK OWNERS
              </p>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">List your spare desks</h2>
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
  