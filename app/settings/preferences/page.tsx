import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";
import Header from "../../Header";
import PreferencesClient from "./PreferencesClient";

export default async function PreferencesPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/settings" backText="Settings" />

      <section className="px-6 lg:px-20 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Preferences</h1>
        </div>

        <PreferencesClient currentLocale={user.preferredLocale} />
      </section>
    </main>
  );
}
