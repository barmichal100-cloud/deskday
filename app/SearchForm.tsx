"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_LOCATIONS } from "@/lib/locations";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type MapboxContextItem = { id: string; text?: string; short_code?: string };
type MapboxFeature = {
  id: string;
  text?: string;
  place_name?: string;
  context?: MapboxContextItem[];
  score?: number
};
type MapboxRaw = {
  id?: string;
  place_type?: string[];
  text?: string;
  context?: MapboxContextItem[];
  place_name?: string
};
type ScoredFeature = MapboxFeature & { score: number };

type Props = {
  initialLocation?: string;
  initialDate?: string;
};

export default function SearchForm({ initialLocation = "", initialDate = "" }: Props) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [date, setDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate ? new Date(initialDate) : null
  );
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<MapboxFeature[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const mapboxKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
  const debounceRef = useRef<number | null>(null);

  async function fetchPlaceSuggestions(query: string, types = "place,country") {
    if (!query) return [];

    // Quick local whitelist: find ALLOWED_LOCATIONS entries that start with the query
    let localMatches: MapboxFeature[] = [];
    try {
      const qnorm = String(query).trim().toLowerCase();
      if (qnorm.length > 0) {
        // allow contains matching so short fragments return all matching cities
        localMatches = ALLOWED_LOCATIONS
          .map((loc) => ({
            city: loc.city,
            country: loc.country,
            label: `${loc.city}, ${loc.country}`
          }))
          .filter((loc) => loc.label.toLowerCase().includes(qnorm))
          .map((loc) => ({
            id: `${loc.city}-${loc.country}`,
            text: loc.city,
            place_name: loc.label,
            context: [{ id: `country.${loc.country}`, text: loc.country }]
          } as MapboxFeature));
      }
    } catch (err) {
      console.error('whitelist check failed', err);
    }

    try {
      // If we have a Mapbox key, prefer Mapbox
      if (mapboxKey) {
        const q = encodeURIComponent(query);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${mapboxKey}&autocomplete=true&types=${types}&limit=8&language=en`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        const raw: MapboxRaw[] = json.features ?? [];

        // Normalize Mapbox results
        const seen = new Set<string>();
        const out: ScoredFeature[] = [];
        const qnorm = String(query).trim().toLowerCase();
        const qtokens = qnorm.split(/\s+/).filter(Boolean);

        for (const f of raw) {
          const placeTypes: string[] = f.place_type ?? [];
          if (!placeTypes.includes('place') && !placeTypes.includes('country')) continue;

          const city = f.text || '';
          const country = (f.context ?? []).find((c: MapboxContextItem) => String(c.id).startsWith('country.'))?.text || '';
          const label = placeTypes.includes('country') && !city ? country : `${city}${country ? ', ' + country : ''}`;

          if (!label) continue;
          if (seen.has(label)) continue;

          // scoring: prefer exact or starts-with matches
          const cityNorm = (city || '').toLowerCase();
          const labelNorm = String(label).toLowerCase();
          let score = 0;
          if (cityNorm === qnorm || labelNorm === qnorm) score += 200;
          if (cityNorm.startsWith(qnorm) || labelNorm.startsWith(qnorm)) score += 150;

          const labelWords = labelNorm.split(/\s+|,\s*/).filter(Boolean);
          let tokenPrefixMatch = true;
          for (let i = 0; i < qtokens.length; i++) {
            if (!labelWords[i] || !labelWords[i].startsWith(qtokens[i])) {
              tokenPrefixMatch = false;
              break;
            }
          }
          if (tokenPrefixMatch && qtokens.length > 1) score += 140;
          if (qtokens.length > 0 && qtokens.every((t) => labelNorm.includes(t))) score += 60;
          score += Math.max(0, 20 - labelNorm.length);

          seen.add(label);
          out.push({
            id: String(f.id ?? `m-${Math.random().toString(36).slice(2,8)}`),
            text: city || country,
            place_name: label,
            context: country ? [{ id: `country.${country}`, text: country }] : [],
            score
          });
        }

        const filtered = out.filter((f) => (f.score ?? 0) >= 20);
        filtered.sort((a: ScoredFeature, b: ScoredFeature) => (b.score || 0) - (a.score || 0) || String(a.place_name).localeCompare(String(b.place_name)));
        const providerResults = filtered.map((f) => ({
          id: f.id,
          text: f.text,
          place_name: f.place_name,
          context: f.context
        } as MapboxFeature));

        // Merge localMatches first, then provider results
        const combined: MapboxFeature[] = [];
        const seenCombined = new Set<string>();
        for (const p of [...localMatches, ...providerResults]) {
          const key = String(p.place_name ?? p.text ?? p.id).toLowerCase();
          if (seenCombined.has(key)) continue;
          seenCombined.add(key);
          combined.push(p);
        }
        return combined.slice(0, 12);
      }

      // Fallback: use local Nominatim proxy
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const json = await res.json();
      const rawNom: { id?: string | number; text?: string; place_name?: string; context?: { id: string; text?: string }[] }[] = json ?? [];

      const qnorm = String(query).trim().toLowerCase();
      const qtokens = qnorm.split(/\s+/).filter(Boolean);
      const seen = new Set<string>();
      const out = (rawNom
        .map((f, idx) => {
          const city = f.text || '';
          const country = (f.context ?? [])[0]?.text || '';
          const label = f.place_name || `${city}${country ? ', ' + country : ''}`;
          const labelNorm = String(label).toLowerCase();
          if (!city && !country) return null;

          let score = 0;
          if (city.toLowerCase() === qnorm || labelNorm === qnorm) score += 200;
          if (city.toLowerCase().startsWith(qnorm) || labelNorm.startsWith(qnorm)) score += 150;

          const labelWords = labelNorm.split(/\s+|,\s*/).filter(Boolean);
          let tokenPrefixMatch = true;
          for (let i = 0; i < qtokens.length; i++) {
            if (!labelWords[i] || !labelWords[i].startsWith(qtokens[i])) {
              tokenPrefixMatch = false;
              break;
            }
          }
          if (tokenPrefixMatch && qtokens.length > 1) score += 140;
          if (qtokens.length > 0 && qtokens.every((t: string) => labelNorm.includes(t))) score += 60;
          score += Math.max(0, 20 - labelNorm.length);

          const key = `${city}|${country}`;
          if (seen.has(key)) return null;
          seen.add(key);
          return {
            id: String(f.id ?? `n-${idx}`),
            text: city || country,
            place_name: label,
            context: country ? [{ id: `country.${country}`, text: country }] : [],
            score
          } as ScoredFeature;
        })
        .filter((x): x is ScoredFeature => !!x)
        .filter((f) => (f?.score ?? 0) >= 20)
        .sort((a: ScoredFeature, b: ScoredFeature) => (b.score || 0) - (a.score || 0) || String(a.place_name).localeCompare(String(b.place_name)))
        .slice(0, 12)
        .map((f) => ({ id: f.id, text: f.text, place_name: f.place_name, context: f.context } as MapboxFeature))) as MapboxFeature[];

      // Merge localMatches first
      const combined: MapboxFeature[] = [];
      const seen2 = new Set<string>();
      for (const p of [...localMatches, ...out]) {
        const key = String(p.place_name ?? p.text ?? p.id).toLowerCase();
        if (seen2.has(key)) continue;
        seen2.add(key);
        combined.push(p);
      }

      return combined.slice(0, 12);
    } catch (err) {
      console.error('fetchPlaceSuggestions error', err);
      return [];
    }
  }

  function scheduleFetch(
    query: string,
    types: string,
    setter: (v: MapboxFeature[]) => void,
    setLoading?: (v: boolean) => void
  ) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        if (setLoading) setLoading(true);
        const items = await fetchPlaceSuggestions(query, types);
        setter(items as MapboxFeature[]);
      } catch (err) {
        console.error('scheduleFetch error', err);
        setter([]);
      } finally {
        if (setLoading) setLoading(false);
      }
    }, 250);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build search URL with query parameters
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (date) params.set("date", date);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex flex-col md:flex-row md:items-center divide-y md:divide-y-0 md:divide-x divide-gray-300">
            {/* Where */}
            <div className="flex-1 relative px-6 py-3">
              <label className="block text-xs font-semibold text-gray-900 mb-1 text-left">
                Where
              </label>
              <input
                name="location"
                value={location}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocation(v);
                  if (v.length > 1) {
                    scheduleFetch(v, "place", setLocationSuggestions, setLocationLoading);
                    setShowLocationDropdown(true);
                  } else {
                    setLocationSuggestions([]);
                    setShowLocationDropdown(false);
                  }
                }}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowLocationDropdown(false), 150);
                }}
                type="text"
                placeholder="Search destinations"
                autoComplete="off"
                className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
              />
              {locationLoading && <div className="text-xs text-gray-500 mt-1">Loading…</div>}
              {showLocationDropdown && locationSuggestions.length > 0 && (
                <ul className="absolute left-0 top-full mt-2 w-full md:w-96 rounded-2xl bg-white border border-gray-200 shadow-xl max-h-96 overflow-auto z-50">
                  {locationSuggestions.map((s, i) => {
                    const country = s.context?.find((c: MapboxContextItem) => c.id.startsWith('country.'))?.text || "";
                    return (
                      <li
                        key={i}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onMouseDown={() => {
                          setLocation(`${s.text}, ${country}`);
                          setShowLocationDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="text-sm text-gray-900">{s.place_name}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* When */}
            <div className="flex-1 px-6 py-3">
              <label className="block text-xs font-semibold text-gray-900 mb-1 text-left">
                When
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  setSelectedDate(date);
                  setDate(date ? date.toISOString().split("T")[0] : "");
                }}
                minDate={new Date()}
                placeholderText="Select date"
                dateFormat="MMM d, yyyy"
                className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none cursor-pointer"
                calendarClassName="custom-datepicker"
                wrapperClassName="w-full"
                popperPlacement="bottom"
                popperProps={{
                  strategy: "fixed"
                }}
              />
            </div>

            {/* Search button */}
            <div className="px-2 py-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full px-6 py-3 md:px-4 md:py-3 font-semibold transition shadow-md hover:shadow-lg w-full md:w-auto justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="md:hidden">Search</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
