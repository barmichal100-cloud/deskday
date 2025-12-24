import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "../Header";

type MessagesPageProps = {
  searchParams: Promise<{ userId?: string; bookingId?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const otherUserId = params.userId;
  const bookingId = params.bookingId;

  // Fetch the other user if userId is provided
  let otherUser = null;
  if (otherUserId) {
    otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, email: true },
    });
  }

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/" backText="Home" />
      <div className="max-w-6xl mx-auto px-6 py-10 bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Messages
          </h1>
          <p className="text-sm text-gray-600">
            Chat with desk owners and guests
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations list */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Conversations
            </h2>

            {otherUser ? (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {(otherUser.name?.[0] || otherUser.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {otherUser.name || otherUser.email}
                    </p>
                    <p className="text-xs text-gray-600">Click to start chatting</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-gray-600">No conversations yet</p>
              </div>
            )}
          </div>

          {/* Chat area */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 flex flex-col">
            {otherUser ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {(otherUser.name?.[0] || otherUser.email[0]).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {otherUser.name || otherUser.email}
                      </p>
                      <p className="text-xs text-gray-600">{otherUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 p-6 overflow-y-auto min-h-[400px]">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Messaging Coming Soon
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        The messaging feature is currently under development. For now, please contact{" "}
                        <span className="font-semibold">{otherUser.name || otherUser.email}</span> via email:
                      </p>
                      <a
                        href={`mailto:${otherUser.email}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email {otherUser.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Message input (disabled) */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      disabled
                      placeholder="Messaging coming soon..."
                      className="flex-1 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm outline-none cursor-not-allowed"
                    />
                    <button
                      disabled
                      className="rounded-lg bg-gray-400 px-6 py-3 text-sm font-semibold text-white cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 min-h-[500px]">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Messaging feature in development
              </p>
              <p className="text-sm text-blue-800">
                We're working on a real-time messaging system. For now, you can contact users via email. This feature will be available soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
