import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "../Header";
import MessagesClient from "./MessagesClient";

type MessagesPageProps = {
  searchParams: Promise<{ userId?: string; bookingId?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    redirect("/auth/sign-in");
  }

  const params = await searchParams;
  const otherUserId = params.userId;

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/" backText="Home" />
      <div className="max-w-6xl mx-auto px-6 py-10 bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Messages</h1>
          <p className="text-sm text-gray-600">Chat with desk owners and guests</p>
        </div>

        <MessagesClient currentUserId={currentUserId} initialOtherUserId={otherUserId} />
      </div>
    </main>
  );
}
