import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";
import Header from "../../Header";

export default async function PrivacyPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/settings" backText="Settings" />

      <section className="px-6 lg:px-20 py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Privacy & Sharing</h1>
          <p className="text-gray-600">Manage your personal data and privacy settings</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600">
            Privacy settings will be available soon.
          </p>
        </div>
      </section>
    </main>
  );
}
