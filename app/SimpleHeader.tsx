"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import LanguageCurrencySelector from "./LanguageCurrencySelector";
import UserMenuClient from "./UserMenuClient";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: "RENTER" | "OWNER" | "ADMIN";
  preferredLocale: "EN" | "HE";
  preferredCurrency: "ILS" | "USD" | "EUR";
};

export default function SimpleHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="px-6 lg:px-20 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Back to home */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center p-1">
                <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                  {/* Desk surface */}
                  <rect x="4" y="12" width="24" height="2.5" rx="0.5" fill="white"/>
                  {/* Left drawer unit */}
                  <rect x="5" y="14.5" width="6" height="9" rx="0.5" fill="white" fillOpacity="0.9"/>
                  <line x1="6.5" y1="17" x2="9.5" y2="17" stroke="#ec4899" strokeWidth="0.8" strokeLinecap="round"/>
                  <line x1="6.5" y1="20" x2="9.5" y2="20" stroke="#ec4899" strokeWidth="0.8" strokeLinecap="round"/>
                  {/* Right leg */}
                  <rect x="23" y="14.5" width="2" height="9" rx="0.5" fill="white" fillOpacity="0.9"/>
                  {/* Monitor on desk */}
                  <rect x="14" y="7" width="7" height="5" rx="0.5" fill="white" fillOpacity="0.95"/>
                  <rect x="17" y="12" width="1" height="1" fill="white" fillOpacity="0.8"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-rose-500 tracking-tight">
                deskday
              </span>
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-600 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
          </div>

          {/* Right side - Language/Currency and User Menu */}
          <div className="flex items-center gap-4">
            {/* Language/Currency Selector */}
            {!loading && (
              <LanguageCurrencySelector
                currentLocale={user?.preferredLocale || "EN"}
                currentCurrency={user?.preferredCurrency || "ILS"}
              />
            )}

            {/* User Menu */}
            {loading ? (
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
            ) : (
              <UserMenuClient initialUser={user} hideRoleSwitch={true} hideDashboard={true} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
