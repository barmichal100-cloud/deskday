"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function UnreadMessagesBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/conversations/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll for unread messages every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);

    return () => clearInterval(interval);
  }, [pathname]); // Refetch when pathname changes

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-[10px] font-bold text-white">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}
