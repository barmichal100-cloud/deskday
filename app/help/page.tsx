"use client";

import Link from "next/link";
import SimpleHeader from "@/app/SimpleHeader";
import { useState, useEffect } from "react";

export default function HelpCentrePage() {
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

  return (
    <div className="min-h-screen bg-white">
      <SimpleHeader />

      {/* Hero Section */}
      <div className="px-6 lg:px-20 py-16 text-center">
        <h1 className="text-5xl font-semibold text-gray-900 mb-8">Hi, how can we help?</h1>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search how-tos and more"
              className="w-full px-6 py-4 pr-14 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600 text-lg"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 lg:px-20">
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            <button className="pb-4 px-1 border-b-2 border-gray-900 font-semibold text-gray-900">
              Desk Renter
            </button>
            <button className="pb-4 px-1 text-gray-600 hover:text-gray-900 transition">
              Desk Owner
            </button>
          </div>
        </div>

        {/* Login Section - Only show when user is not logged in */}
        {isLoggedIn === false && (
          <div className="mt-8 mb-12 border border-gray-200 rounded-2xl p-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">We're here for you</h2>
              <p className="text-gray-600">Log in to get help with your reservations, account, and more.</p>
            </div>
            <Link
              href="https://deskday.vercel.app/auth/sign-in"
              className="px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition whitespace-nowrap"
            >
              Log in or sign up
            </Link>
          </div>
        )}

        {/* Guides Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-semibold text-gray-900">Guides for getting started</h2>
            <Link href="#" className="text-gray-900 font-semibold hover:underline flex items-center gap-2">
              Browse all topics
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Guide Card 1 */}
            <Link href="#" className="group">
              <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop"
                  alt="Getting started with deskday"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:underline">Getting started with deskday</h3>
            </Link>

            {/* Guide Card 2 */}
            <Link href="#" className="group">
              <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop"
                  alt="Finding the perfect desk"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:underline">Finding the perfect desk</h3>
            </Link>

            {/* Guide Card 3 */}
            <Link href="#" className="group">
              <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3">
                <img
                  src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&auto=format&fit=crop"
                  alt="Making a booking"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:underline">Making a booking</h3>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
