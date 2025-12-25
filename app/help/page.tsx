"use client";

import Link from "next/link";
import HeaderClient from "@/app/HeaderClient";
import { useState } from "react";

export default function HelpCentrePage() {
  const [activeTab, setActiveTab] = useState<"renter" | "owner">("renter");
  const [searchQuery, setSearchQuery] = useState("");

  // All guides data
  const renterGuides = [
    {
      title: "Getting started with deskday",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
      href: "#"
    },
    {
      title: "Finding the perfect desk",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop",
      href: "#"
    },
    {
      title: "Making a booking",
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&auto=format&fit=crop",
      href: "#"
    }
  ];

  const ownerGuides = [
    {
      title: "Access and manage your account",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
      href: "#"
    },
    {
      title: "Getting paid as a desk owner",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop",
      href: "#"
    }
  ];

  // Filter guides based on search query
  const filteredRenterGuides = renterGuides.filter(guide =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOwnerGuides = ownerGuides.filter(guide =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <HeaderClient backHref="/" backText="Home" hideRoleSwitch={true} hideDashboard={true} />

      {/* Hero Section */}
      <div className="px-6 lg:px-20 py-16 text-center">
        <h1 className="text-5xl font-semibold text-gray-900 mb-8">Hi, how can we help?</h1>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search how-tos and more"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pr-14 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600 text-lg"
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition"
              onClick={() => {}}
            >
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
            <button
              onClick={() => setActiveTab("renter")}
              className={`pb-4 px-1 border-b-2 ${
                activeTab === "renter"
                  ? "border-gray-900 text-gray-900 font-semibold"
                  : "border-transparent text-gray-600"
              }`}
            >
              Desk Renter
            </button>
            <button
              onClick={() => setActiveTab("owner")}
              className={`pb-4 px-1 border-b-2 ${
                activeTab === "owner"
                  ? "border-gray-900 text-gray-900 font-semibold"
                  : "border-transparent text-gray-600"
              }`}
            >
              Desk Owner
            </button>
          </div>
        </div>

        {/* Guides Section - Desk Renter */}
        {activeTab === "renter" && (
          <div className="mb-16 mt-12">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-gray-900">Guides for getting started</h2>
              {searchQuery && (
                <p className="text-sm text-gray-600 mt-2">
                  {filteredRenterGuides.length} result{filteredRenterGuides.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
            </div>

            {filteredRenterGuides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredRenterGuides.map((guide, index) => (
                  <Link key={index} href={guide.href} className="group">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3">
                      <img
                        src={guide.image}
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:underline">{guide.title}</h3>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No guides found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* Guides Section - Desk Owner */}
        {activeTab === "owner" && (
          <div className="mb-16 mt-12">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold text-gray-900">Guides for getting started</h2>
              {searchQuery && (
                <p className="text-sm text-gray-600 mt-2">
                  {filteredOwnerGuides.length} result{filteredOwnerGuides.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
            </div>

            {filteredOwnerGuides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOwnerGuides.map((guide, index) => (
                  <Link key={index} href={guide.href} className="group">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3">
                      <img
                        src={guide.image}
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:underline">{guide.title}</h3>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No guides found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
