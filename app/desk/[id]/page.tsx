import { prisma } from "@/lib/prisma";
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import BookingCard from './BookingCard';
import Header from '../../Header';
import SuccessBanner from './SuccessBanner';
import { getCurrentUserId } from '@/lib/auth';

type DeskPageProps = {
  params: Promise<{ id: string }>;
};

type SearchParams = {
  searchParams: Promise<{ from?: string; location?: string; date?: string }>;
};

export default async function DeskPage({ params, searchParams }: DeskPageProps & SearchParams) {
  const { id } = await params;
  const search = await searchParams;

  if (!id) {
    return (
      <main className="min-h-screen bg-white">
        <section className="px-6 lg:px-20 py-12 md:py-16">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            Desk not found
          </h1>
          <p className="text-gray-600">
            We couldn&apos;t determine which desk you were trying to view.
          </p>
        </section>
      </main>
    );
  }

  // Get current user ID to check if they own this desk
  const userId = await getCurrentUserId();

  const desk = await prisma.desk.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: 'asc' } },
      availableDates: { orderBy: { date: 'asc' } }
    },
  });

  if (!desk) {
    return (
      <main className="min-h-screen bg-white">
        <section className="px-6 lg:px-20 py-12 md:py-16">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            Desk not found
          </h1>
          <p className="text-gray-600">
            This desk doesn&apos;t exist anymore or has been removed.
          </p>
        </section>
      </main>
    );
  }

  const availableDates = desk.availableDates.map(ad => new Date(ad.date));
  const amenities = (desk.amenities as any) || {};

  // Build back URL based on where user came from
  let backUrl = '/';
  let backText = 'Back to home';

  if (search.from === 'search') {
    // Build search URL with location and date if available
    const searchParams = new URLSearchParams();
    if (search.location) searchParams.set('location', search.location);
    if (search.date) searchParams.set('date', search.date);
    backUrl = `/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    backText = 'Back to search';
  }

  return (
    <main className="min-h-screen bg-white">
      <Header backHref={backUrl} backText={backText} />

      <section className="px-6 lg:px-20 py-10 md:py-12">
        <Suspense fallback={null}>
          <SuccessBanner />
        </Suspense>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2">
            {desk.title_en || "Desk"}
          </h1>
          <p className="text-gray-600">
            {desk.city}, {desk.country}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start">
          {/* Left side – details */}
          <div>

            {desk.photos && desk.photos.length > 0 && (
              <div className="mb-8 grid gap-2 grid-cols-2 md:grid-cols-3">
                {desk.photos.map((p) => (
                  <div key={p.id} className="rounded-xl overflow-hidden border border-gray-200 aspect-square relative hover:opacity-90 transition">
                    <Image src={p.thumbnailUrl ?? p.url} alt={desk.title_en ?? 'desk photo'} fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}

            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {desk.description_en || "A quiet, comfortable desk in a real office. Perfect for focused work."}
              </p>
            </div>

            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-5">What this desk offers</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`flex items-center gap-3 text-base ${amenities.wifi ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  <span>WiFi</span>
                </div>

                <div className={`flex items-center gap-3 text-base ${amenities.screens > 0 ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {amenities.screens > 0 ? `${amenities.screens} Screen${amenities.screens > 1 ? 's' : ''}` : 'Screens'}
                  </span>
                </div>

                <div className={`flex items-center gap-3 text-base ${amenities.hdmi ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span>HDMI</span>
                </div>

                <div className={`flex items-center gap-3 text-base ${amenities.keyboard ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <span>Keyboard</span>
                </div>

                <div className={`flex items-center gap-3 text-base ${amenities.mouse ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span>Mouse</span>
                </div>

                <div className={`flex items-center gap-3 text-base ${amenities.chair ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Chair</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Where you'll be</h2>
              <p className="text-gray-700 mb-1">
                {desk.address}
              </p>
              <p className="text-gray-600 text-sm">
                {desk.city}, {desk.country}
              </p>
            </div>
          </div>

          {/* Right side – booking card */}
          <div className="lg:sticky lg:top-6">
            <BookingCard
              deskId={desk.id}
              pricePerDay={desk.pricePerDay}
              currency={desk.currency}
              availableDates={availableDates}
              isOwnDesk={userId === desk.ownerId}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
