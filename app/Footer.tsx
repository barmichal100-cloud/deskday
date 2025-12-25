"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Footer() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        setIsLoggedIn(res.ok);
      } catch (error) {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  const handleListYourDesk = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (isLoggedIn === null) {
      // Still checking auth status
      return;
    }

    if (isLoggedIn) {
      router.push("https://deskday.vercel.app/dashboard/owner/desks/new");
    } else {
      router.push("https://deskday.vercel.app/auth/sign-in");
    }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="px-6 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Support Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900 transition">
                  Help Centre
                </Link>
              </li>
            </ul>
          </div>

          {/* Hosting Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Hosting</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  onClick={handleListYourDesk}
                  className="text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  List your desk
                </a>
              </li>
              <li>
                <Link href="/help/hosting/responsible" className="text-sm text-gray-600 hover:text-gray-900 transition">
                  Hosting responsibly
                </Link>
              </li>
            </ul>
          </div>

          {/* deskday Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">deskday</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>© 2025 deskday, Inc.</span>
            <span className="hidden md:inline">·</span>
            <Link href="/privacy" className="hover:text-gray-900 transition">
              Privacy
            </Link>
            <span className="hidden md:inline">·</span>
            <Link href="/terms" className="hover:text-gray-900 transition">
              Terms
            </Link>
            <span className="hidden md:inline">·</span>
            <Link href="/about/company-details" className="hover:text-gray-900 transition" target="_blank">
              Company details
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
