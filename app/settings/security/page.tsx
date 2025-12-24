import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "../../Header";

export default async function SecurityPage() {
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
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Login & Security</h1>
          <p className="text-gray-600">Update your password and secure your account</p>
        </div>

        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change password</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Current password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">New password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm new password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <button className="mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-rose-600 transition">
              Update password
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Two-factor authentication</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add an extra layer of security to your account. Coming soon!
            </p>
            <button
              disabled
              className="px-6 py-3 bg-gray-100 text-gray-400 font-semibold rounded-xl cursor-not-allowed"
            >
              Enable 2FA (Coming soon)
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
