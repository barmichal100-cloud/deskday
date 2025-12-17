"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeaderClient from "../HeaderClient";
import Image from "next/image";
import Link from "next/link";

type Favorite = {
  id: string;
  createdAt: string;
  desk: {
    id: string;
    title_en: string;
    city: string;
    country: string;
    pricePerDay: number;
    currency: string;
    photos: { url: string; thumbnailUrl: string | null }[];
    owner: {
      id: string;
      name: string | null;
    };
  };
};

export default function FavoritesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites);
        } else if (res.status === 401) {
          router.push("/auth/sign-in");
        } else {
          setError("Failed to load favorites");
        }
      } catch (err) {
        setError("An error occurred while loading favorites");
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [router]);

  const handleRemoveFavorite = async (deskId: string) => {
    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deskId }),
      });

      if (res.ok) {
        setFavorites(favorites.filter((fav) => fav.desk.id !== deskId));
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <HeaderClient backHref="/" backText="Home" />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <HeaderClient backHref="/" backText="Home" />
      <div className="max-w-7xl mx-auto px-6 lg:px-20 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            My Favorites
          </h1>
          <p className="text-sm text-gray-600">
            {favorites.length} {favorites.length === 1 ? "desk" : "desks"} saved
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No favorites yet
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Start exploring and save desks you love to your favorites
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm hover:from-pink-600 hover:to-rose-600 transition"
            >
              Browse Desks
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="group cursor-pointer">
                <Link href={`/desk/${favorite.desk.id}`}>
                  <div className="relative aspect-square mb-3 overflow-hidden rounded-xl">
                    {favorite.desk.photos?.[0] ? (
                      <Image
                        src={favorite.desk.photos[0].thumbnailUrl || favorite.desk.photos[0].url}
                        alt={favorite.desk.title_en || "desk photo"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                    {/* Remove favorite button */}
                    <button
                      className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFavorite(favorite.desk.id);
                      }}
                    >
                      <svg className="w-6 h-6 text-white drop-shadow-lg fill-rose-500 stroke-rose-500 stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {favorite.desk.city}, {favorite.desk.country}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-1 truncate">
                    {favorite.desk.title_en || "Desk"}
                  </p>

                  <p className="text-sm font-semibold text-gray-900">
                    <span className="font-semibold">{favorite.desk.pricePerDay / 100} {favorite.desk.currency}</span> per day
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
