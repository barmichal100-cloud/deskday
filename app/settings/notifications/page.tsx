import { getUser } from "@/lib/getUser";
import { redirect } from "next/navigation";
import Header from "../../Header";
import NotificationSettings from "./NotificationSettings";

export default async function NotificationsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/settings" backText="Settings" />

      <section className="px-6 lg:px-20 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>
        </div>

        <NotificationSettings userRole={user.role} userEmail={user.email} />
      </section>
    </main>
  );
}
