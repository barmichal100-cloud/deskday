import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SearchForm from './SearchForm';
import DeskCard from './DeskCard';
import UserMenuWrapper from './UserMenuWrapper';
import ListDeskButton from './ListDeskButton';
import LanguageCurrencySelectorWrapper from './LanguageCurrencySelectorWrapper';
import { getCurrentUserId } from '@/lib/auth';

export default async function HomePage() {
  // Get current user if logged in
  const userId = await getCurrentUserId();

  // Fetch recent desks from the DB
  const desks = await prisma.desk.findMany({
    take: 12,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title_en: true,
      city: true,
      country: true,
      photos: { take: 1, orderBy: { order: 'asc' }, select: { thumbnailUrl: true, url: true } },
      pricePerDay: true,
      currency: true,
    },
  });

  // Fetch user's favorites if logged in
  const favoriteIds = userId
    ? (await prisma.favorite.findMany({
        where: { userId },
        select: { deskId: true },
      })).map(f => f.deskId)
    : [];

  return (
    <main className="min-h-screen bg-white">
      {/* Airbnb-style header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="px-6 lg:px-20 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
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

            {/* Right side navigation */}
            <div className="flex items-center gap-4">
              <LanguageCurrencySelectorWrapper />
              <UserMenuWrapper />
            </div>
          </div>
        </div>
      </header>

      {/* Hero section with search */}
      <section className="px-6 lg:px-20 pt-12 pb-16 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Find your perfect workspace
        </h1>
        <p className="text-base md:text-lg text-gray-600 mb-8 max-w-4xl mx-auto">
          Discover desks in offices around the world. Work where you want, when you want.
        </p>
        <div className="max-w-3xl mx-auto">
          <SearchForm />
        </div>
      </section>

      {/* Featured desks */}
      <section className="px-6 lg:px-20 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Recently added desks
        </h2>
        {desks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No desks listed yet. Soon you'll see available workspaces here.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {desks.map((desk) => (
              <DeskCard
                key={desk.id}
                desk={desk}
                initialIsFavorite={favoriteIds.includes(desk.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Owner CTA section */}
      <section className="border-t border-gray-200 bg-gray-50 px-6 lg:px-20 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            Have a spare desk in your office?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join Deskday and turn your unused workspace into a revenue stream.
            It's simple to set up and you stay in control.
          </p>
          <ListDeskButton />
        </div>
      </section>
    </main>
  );
}
