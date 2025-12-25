import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SearchMap from "./SearchMap";
import FilterModal from "./FilterModal";
import DeskCard from "../DeskCard";
import SearchForm from "../SearchForm";
import Header from "../Header";

type Props = {
  searchParams: Promise<{ location?: string; date?: string; filter?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const location = params.location || "";
  const date = params.date || "";
  const filter = params.filter || "";

  // Parse location to extract city
  const cityMatch = location.match(/^([^,]+)/);
  const searchCity = cityMatch ? cityMatch[1].trim() : "";

  // Build query for searching desks
  const where: any = {
    isActive: true,
  };

  if (searchCity) {
    where.city = {
      contains: searchCity,
      mode: "insensitive",
    };
  }

  // If date is provided, only show desks that have that date available
  if (date) {
    where.availableDates = {
      some: {
        date: new Date(date + "T00:00:00.000Z"),
      },
    };
  }

  const allDesks = await prisma.desk.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      photos: {
        take: 1,
        orderBy: { order: "asc" },
      },
      availableDates: date
        ? {
            where: {
              date: new Date(date + "T00:00:00.000Z"),
            },
            take: 1,
          }
        : { take: 0 },
    },
  });

  // Parse filters from URL
  const filters = filter.split(",").filter(Boolean);

  // Apply filters
  const desks = allDesks.filter((desk) => {
    if (filters.length === 0) return true;

    const amenities = desk.amenities as {
      wifi?: boolean;
      screens?: number;
      hdmi?: boolean;
      keyboard?: boolean;
      mouse?: boolean;
      chair?: boolean;
    } | null;

    // Check each filter - all must pass (AND logic)
    return filters.every((f) => {
      // Price range filter - doesn't require amenities
      if (f.startsWith("price:")) {
        const [minStr, maxStr] = f.split(":")[1].split("-");
        const minPrice = parseInt(minStr) || 0;
        const maxPrice = parseInt(maxStr) || 1000;
        const price = desk.pricePerDay || 0;
        return price >= minPrice && price <= maxPrice;
      }

      // All other filters are amenity filters and require amenities object
      if (!amenities) return false;

      if (f === "wifi") return amenities.wifi === true;
      if (f.startsWith("screens:")) {
        const minScreens = parseInt(f.split(":")[1]) || 1;
        return (amenities.screens || 0) >= minScreens;
      }
      if (f === "hdmi") return amenities.hdmi === true;
      if (f === "keyboard") return amenities.keyboard === true;
      if (f === "mouse") return amenities.mouse === true;
      if (f === "chair") return amenities.chair === true;
      return true;
    });
  });

  // Count active filters
  const activeFilterCount = filters.length;

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <Header backHref="/" backText="Home" />

      {/* Search form section */}
      <div className="border-b border-gray-200 bg-white sticky top-[73px] z-40">
        <div className="px-6 lg:px-20 py-4">
          <SearchForm initialLocation={location} initialDate={date} />
        </div>
      </div>

      {/* Main content with map */}
      <div className="flex h-[calc(100vh-160px)]">
        {/* Left side - Results */}
        <div className="w-full lg:w-1/2 overflow-y-auto">
          <div className="px-6 lg:px-12 py-6">
            {/* Results header with filter button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  {desks.length} desk{desks.length !== 1 ? "s" : ""} {location ? `in ${location}` : ""}
                </h1>
                {filters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.map((f, idx) => {
                      let label = f;
                      if (f === "wifi") label = "WiFi";
                      else if (f.startsWith("screens:")) label = `${f.split(":")[1]}+ Screens`;
                      else if (f === "hdmi") label = "HDMI";
                      else if (f === "keyboard") label = "Keyboard";
                      else if (f === "mouse") label = "Mouse";
                      else if (f === "chair") label = "Chair";
                      else if (f.startsWith("price:")) {
                        const [min, max] = f.split(":")[1].split("-");
                        // Convert from agorot to shekels for display
                        const minShekels = parseInt(min) / 100;
                        const maxShekels = parseInt(max) / 100;
                        label = `₪${minShekels} - ₪${maxShekels}`;
                      }

                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Filters button */}
              <FilterModal activeFilterCount={activeFilterCount} currentFilter={filter} />
            </div>

            {/* Results grid */}
            {desks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No desks found. Try adjusting your search or filters.
                </p>
                <Link
                  href="/"
                  className="inline-block mt-4 text-sm text-rose-500 hover:text-rose-600 transition"
                >
                  Home
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 pb-6 sm:grid-cols-2">
                {desks.map((desk) => (
                  <DeskCard key={desk.id} desk={desk} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Map (hidden on mobile) */}
        <div className="hidden lg:block lg:w-1/2 sticky top-[160px] h-[calc(100vh-160px)]">
          <SearchMap desks={desks} />
        </div>
      </div>
    </main>
  );
}
