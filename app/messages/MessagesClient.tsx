"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  name: string | null;
  email: string;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    name: string | null;
  };
};

type Conversation = {
  id: string;
  participants: Array<{
    user: User;
  }>;
  messages: Message[];
  updatedAt: string;
  unreadCount?: number;
};

export default function MessagesClient({
  currentUserId,
  initialOtherUserId,
}: {
  currentUserId: string;
  initialOtherUserId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // Fetch specific conversation
  const fetchConversation = async (conversationId: string, shouldScroll: boolean = false) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data.conversation);
        if (shouldScroll) {
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  // Create or get conversation with a specific user
  const startConversation = async (otherUserId: string) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data.conversation);
        await fetchConversations();
        router.push(`/messages`);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedConversation || !messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageInput.trim() }),
      });

      if (res.ok) {
        setMessageInput("");
        await fetchConversation(selectedConversation.id, true);
        await fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchConversations();

      if (initialOtherUserId) {
        await startConversation(initialOtherUserId);
      }

      setIsLoading(false);
    };

    init();
  }, [initialOtherUserId]);

  // Set up polling for new messages
  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(() => {
        fetchConversation(selectedConversation.id, false);
      }, 3000); // Poll every 3 seconds

      setPollingInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [selectedConversation?.id]);

  const getOtherUser = (conversation: Conversation) => {
    return conversation.participants.find((p) => p.user.id !== currentUserId)?.user;
  };

  const getLastMessage = (conversation: Conversation) => {
    return conversation.messages[0]; // API returns latest message first
  };

  const getUnreadCount = (conversation: Conversation) => {
    // Use the unreadCount from API if available (from conversations list)
    if (conversation.unreadCount !== undefined) {
      return conversation.unreadCount;
    }
    // Otherwise calculate from messages (when viewing a specific conversation)
    return conversation.messages.filter(
      (msg) => msg.senderId !== currentUserId && !msg.isRead
    ).length;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const otherUser = selectedConversation ? getOtherUser(selectedConversation) : null;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Conversations list */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>

        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm text-gray-600">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const user = getOtherUser(conversation);
              const lastMessage = getLastMessage(conversation);
              const isSelected = selectedConversation?.id === conversation.id;
              const unreadCount = getUnreadCount(conversation);

              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-3 rounded-lg text-left transition ${
                    isSelected
                      ? "bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {(user?.name?.[0] || user?.email[0] || "?").toUpperCase()}
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${unreadCount > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-900"}`}>
                        {user?.name || user?.email || "Unknown"}
                      </p>
                      {lastMessage && (
                        <p className={`text-xs truncate ${unreadCount > 0 ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                          {lastMessage.senderId === currentUserId ? "You: " : ""}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 flex flex-col h-[600px]">
        {selectedConversation && otherUser ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {(otherUser.name?.[0] || otherUser.email[0]).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{otherUser.name || otherUser.email}</p>
                  <p className="text-xs text-gray-600">{otherUser.email}</p>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => {
                    const isOwn = message.senderId === currentUserId;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-pink-100" : "text-gray-500"}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-3 items-end">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSending}
                  rows={1}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none min-h-[44px] max-h-[120px] overflow-y-auto"
                  style={{
                    height: 'auto',
                    minHeight: '44px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                />
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={isSending || !messageInput.trim()}
                  className="rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-sm text-gray-600">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
