"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/I18nProvider";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: "RENTER" | "OWNER" | "ADMIN";
  preferredLocale: "EN" | "HE";
  preferredCurrency: "ILS" | "USD" | "EUR";
};

type Props = {
  initialUser: User | null;
  hideRoleSwitch?: boolean;
  hideDashboard?: boolean;
};

export default function UserMenuClient({ initialUser, hideRoleSwitch = false, hideDashboard = false }: Props) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setUser(null);
      setIsOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  async function handleSwitchRole(newRole: "RENTER" | "OWNER") {
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      setUser(data.user);
      setIsOpen(false);

      // Redirect to appropriate dashboard
      if (newRole === "OWNER") {
        router.push("/dashboard/owner");
      } else {
        router.push("/dashboard/renter");
      }
      router.refresh();
    } catch (error) {
      console.error("Error switching role:", error);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth/sign-in"
          className="text-sm font-semibold text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-full transition hidden md:block"
        >
          {t("userMenu.login")}
        </Link>
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
      </div>
    );
  }

  const displayName = user.name || user.email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {/* Mode Indicator & Dashboard - Only show when not hidden */}
      {!hideDashboard && !hideRoleSwitch && (
        <>
          {/* Vertical Divider before mode section */}
          <div className="hidden md:block h-12 w-px bg-gray-300"></div>

          <div className="hidden md:flex flex-col items-center gap-2">
            {/* Mode Badge - Bold and centered above both sections */}
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {user.role === "OWNER" ? "Desk Owner Mode" : "Desk Renter Mode"}
            </span>

            <div className="flex items-center gap-3">
              {/* Dashboard Link */}
              <Link
                href={user.role === "OWNER" ? "/dashboard/owner" : "/dashboard/renter"}
                className="text-sm text-gray-900 hover:text-rose-500 transition"
              >
                {user.role === "OWNER" ? "Owner Dashboard" : "Renter Dashboard"}
              </Link>

              {/* Role Switcher */}
              {user.role === "OWNER" ? (
                <button
                  onClick={() => handleSwitchRole("RENTER")}
                  className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch to Renter
                </button>
              ) : (
                <button
                  onClick={() => handleSwitchRole("OWNER")}
                  className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch to Owner
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Dashboard only (for pages that hide role switch) */}
      {!hideDashboard && hideRoleSwitch && (
        <Link
          href={user.role === "OWNER" ? "/dashboard/owner" : "/dashboard/renter"}
          className="text-sm font-semibold text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-full transition hidden md:block"
        >
          {t("nav.dashboard")}
        </Link>
      )}

      {/* User Menu */}
      <div className="relative" ref={menuRef}>
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
          {/* User greeting */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{t("userMenu.hello", { name: displayName })}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {user.role === "OWNER" ? t("userMenu.deskOwnerMode") : t("userMenu.deskRenterMode")}
            </p>
          </div>

          {/* Menu items */}
          <Link
            href="/profile"
            className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{t("userMenu.profile")}</span>
          </Link>

          <Link
            href={user.role === "OWNER" ? "/dashboard/owner?tab=received" : "/dashboard/renter?tab=made"}
            className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{t("userMenu.myBookings")}</span>
          </Link>

          <Link
            href="/favorites"
            className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{t("userMenu.myFavorites")}</span>
          </Link>

          <Link
            href="/messages"
            className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{t("userMenu.myMessages")}</span>
          </Link>

          <div className="border-t border-gray-200 my-2"></div>

          <Link
            href="/settings"
            className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{t("userMenu.accountSettings")}</span>
          </Link>

          <Link
            href="/help"
            className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t("userMenu.help")}</span>
          </Link>

          <div className="border-t border-gray-200 my-2"></div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{t("userMenu.logout")}</span>
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
