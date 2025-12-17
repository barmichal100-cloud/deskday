"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Desk = {
  id: string;
  title_en: string | null;
  city: string;
  country: string;
  photos: { thumbnailUrl: string | null; url: string }[];
  pricePerDay: number;
  currency: string;
};

type Props = {
  desk: Desk;
  initialIsFavorite?: boolean;
};

export default function DeskCard({ desk, initialIsFavorite = false }: Props) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isToggling) return;

    setIsToggling(true);
    const previousState = isFavorite;

    // Optimistic update
    setIsFavorite(!isFavorite);

    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deskId: desk.id }),
      });

      if (!res.ok) {
        // Revert on error
        setIsFavorite(previousState);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert on error
      setIsFavorite(previousState);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Link
      href={`/desk/${desk.id}`}
      className="group cursor-pointer"
    >
      <div className="relative aspect-square mb-3 overflow-hidden rounded-xl">
        {desk.photos?.[0] ? (
          <Image
            src={desk.photos[0].thumbnailUrl || desk.photos[0].url}
            alt={desk.title_en || 'desk photo'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
        {/* Heart icon */}
        <button
          className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform"
          onClick={handleToggleFavorite}
          disabled={isToggling}
        >
          <svg
            className={`w-6 h-6 text-white drop-shadow-lg stroke-2 ${
              isFavorite ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-current hover:fill-rose-500'
            }`}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>

      <div className="flex justify-between items-start mb-1">
        <h3 className="font-semibold text-gray-900 truncate">
          {desk.city}, {desk.country}
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-1 truncate">
        {desk.title_en || "Desk"}
      </p>

      <p className="text-sm font-semibold text-gray-900">
        <span className="font-semibold">{desk.pricePerDay / 100} {desk.currency}</span> per day
      </p>
    </Link>
  );
}
