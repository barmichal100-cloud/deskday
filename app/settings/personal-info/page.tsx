import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "../../Header";

export default async function PersonalInfoPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/settings" backText="Settings" />

      {/* Main content */}
      <section className="px-6 lg:px-20 py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Personal Information</h1>
          <p className="text-gray-600">Update your personal details and contact information</p>
        </div>

        <div className="space-y-6">
          {/* Legal Name */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Legal name</label>
            <input
              type="text"
              defaultValue={user.name || ""}
              placeholder="Enter your legal name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              This is the name on your government ID, which could be a license or passport.
            </p>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email address</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">
              Email address cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {/* Phone Number */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Phone number</label>
            <input
              type="tel"
              placeholder="+972 50 123 4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              We may use this number to contact you about your bookings.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition">
              Save changes
            </button>
            <Link
              href="/settings"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
