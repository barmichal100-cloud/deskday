"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import LanguageCurrencySelector from "./LanguageCurrencySelector";

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
  const [isOpen, setIsOpen] = useState(false);

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

  const displayName = user?.name || user?.email.split("@")[0] || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="px-6 lg:px-20 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo */}
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
            ) : !user ? (
              <Link
                href="/auth/sign-in"
                className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <div className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{initial}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">Hello, {displayName}</p>
                    </div>

                    <Link
                      href="/profile"
                      className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3"
                      onClick={() => setIsOpen(false)}
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </Link>

                    <div className="border-t border-gray-200 my-2"></div>

                    <button
                      onClick={async () => {
                        await fetch("/api/auth/signout", { method: "POST" });
                        setUser(null);
                        setIsOpen(false);
                        window.location.href = "/";
                      }}
                      className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
