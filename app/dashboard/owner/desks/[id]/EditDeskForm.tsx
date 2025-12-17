"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import AvailabilityCalendar from '../new/AvailabilityCalendar';
import { ALLOWED_LOCATIONS } from "@/lib/locations";

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

export default function EditDeskForm({ desk }: any) {
  const [title, setTitle] = useState(desk.title_en ?? '');
  const [description, setDescription] = useState(desk.description_en ?? '');
  const [address, setAddress] = useState(desk.address ?? '');
  const [location, setLocation] = useState(`${desk.city ?? ''}, ${desk.country ?? ''}`);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<MapboxFeature[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [price, setPrice] = useState(String((desk.pricePerDay ?? 0) / 100));
  const [currency, setCurrency] = useState(desk.currency ?? 'ILS');
  const mapboxKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
  const debounceRef = useRef<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});

  // existing photos
  const [existingPhotos, setExistingPhotos] = useState<(any & { markedForRemove?: boolean })[]>(desk.photos ?? []);
  // newly added files
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Normalize date to midnight UTC to avoid timezone issues
  const normalizeDate = (date: Date | string): Date => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  };

  // Initialize available dates from desk data
  const [availableDates, setAvailableDates] = useState<Date[]>(
    (desk.availableDates ?? []).map((d: any) => normalizeDate(d.date))
  );

  // Desk properties / amenities - initialize from desk data
  const amenities = desk.amenities || {};
  const [hasWifi, setHasWifi] = useState(amenities.wifi || false);
  const [hasScreens, setHasScreens] = useState((amenities.screens || 0) > 0);
  const [screensCount, setScreensCount] = useState(String(amenities.screens || ''));
  const [hasHdmi, setHasHdmi] = useState(amenities.hdmi || false);
  const [hasKeyboard, setHasKeyboard] = useState(amenities.keyboard || false);
  const [hasMouse, setHasMouse] = useState(amenities.mouse || false);
  const [hasChair, setHasChair] = useState(amenities.chair || false);

  async function fetchPlaceSuggestions(query: string, types = "place,country") {
    if (!query) return [];

    let localMatches: MapboxFeature[] = [];
    try {
      const qnorm = String(query).trim().toLowerCase();
      if (qnorm.length > 0) {
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
      if (mapboxKey) {
        const q = encodeURIComponent(query);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${mapboxKey}&autocomplete=true&types=${types}&limit=8&language=en`;
        const res = await fetch(url);
        if (!res.ok) return localMatches;
        const json = await res.json();
        const raw: MapboxRaw[] = json.features ?? [];

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

      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!res.ok) return localMatches;
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
      return localMatches;
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

  function handleAddFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    setNewFiles((prev) => [...prev, ...arr].slice(0, 6));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // Parse location field to get city and country
      const selected = locationSuggestions.find(
        (s) => {
          const countryObj = s.context?.find((c: MapboxContextItem) => c.id.startsWith('country.'));
          return `${s.text}, ${countryObj?.text ?? ''}` === location;
        }
      );

      const city = selected?.text || location.split(',')[0]?.trim() || desk.city;
      const country = selected?.context?.find((c: MapboxContextItem) => c.id.startsWith('country.'))?.text || location.split(',')[1]?.trim() || desk.country;

      const payload = {
        title,
        description,
        address,
        city,
        country,
        pricePerDay: Math.round((Number(price) || 0) * 100),
        currency,
        removePhotoIds: existingPhotos.filter(p => p.markedForRemove).map(p => p.id),
        availableDates: availableDates.map(d => d.toISOString().split('T')[0]),
        amenities: {
          wifi: hasWifi,
          screens: hasScreens ? parseInt(screensCount) || 0 : 0,
          hdmi: hasHdmi,
          keyboard: hasKeyboard,
          mouse: hasMouse,
          chair: hasChair,
        },
      };

      let res: Response;
      if (newFiles.length > 0 || payload.removePhotoIds.length > 0) {
        const fd = new FormData();
        fd.append('payload', JSON.stringify(payload));
        newFiles.forEach((f) => fd.append('images', f));
        res = await fetch(`/api/desks/${desk.id}`, { method: 'PATCH', body: fd });
      } else {
        res = await fetch(`/api/desks/${desk.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data && data.errors) setFieldErrors(data.errors);
        else setFormError(data?.error || 'Failed to update desk');
        setIsSubmitting(false);
        return;
      }

      // On success, show success message
      setSuccessMessage('Desk listing updated successfully!');
      setIsSubmitting(false);

      // Update existing photos with new data if available
      if (data.desk && data.desk.photos) {
        setExistingPhotos(data.desk.photos);
      }

      // Update available dates if returned
      if (data.desk && data.desk.availableDates) {
        setAvailableDates(data.desk.availableDates.map((d: any) => normalizeDate(d.date)));
      }

      // Clear new files
      setNewFiles([]);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('update failed', err);
      setFormError('Unexpected error while updating desk.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left column - Form */}
      <div className="lg:max-w-2xl">
        {successMessage && <div className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">{successMessage}</div>}
        {formError && <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none" />
        {fieldErrors.title && <div className="mt-1 text-xs text-red-600">{fieldErrors.title}</div>}
      </div>

      <div className="relative">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
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
          required
          placeholder="City, Country"
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
        />
        {locationLoading && <div className="text-xs text-gray-600 mt-1">Loading…</div>}
        {showLocationDropdown && locationSuggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full rounded-lg bg-white border border-gray-200 shadow-lg max-h-56 overflow-auto">
            {locationSuggestions.map((s, i) => {
              const country = s.context?.find((c: MapboxContextItem) => c.id.startsWith('country.'))?.text || "";
              return (
                <li
                  key={i}
                  className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer text-gray-900"
                  onMouseDown={() => {
                    setLocation(`${s.text}, ${country}`);
                    setShowLocationDropdown(false);
                  }}
                >
                  {s.place_name}
                </li>
              );
            })}
          </ul>
        )}
        {fieldErrors.location && <div className="mt-1 text-xs text-red-600">{fieldErrors.location}</div>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Dizengoff 100" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Price (per day)</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0} step="0.01" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none">
            <option value="ILS">ILS</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Existing photos</label>
        <div className="grid grid-cols-3 gap-3">
          {existingPhotos.map((p, idx) => (
            <div key={p.id} className="relative rounded-lg overflow-hidden border border-gray-200 h-32 shadow-sm">
              <Image src={p.thumbnailUrl ?? p.url} alt={`photo-${idx}`} fill style={{ objectFit: 'cover' }} />
              <label className="absolute left-2 top-2 bg-white/90 rounded-md px-2 py-1 text-xs font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-white">
                <input type="checkbox" checked={!!p.markedForRemove} onChange={(e) => {
                  const clone = existingPhotos.slice();
                  clone[idx] = { ...clone[idx], markedForRemove: e.target.checked };
                  setExistingPhotos(clone);
                }} className="mr-1" /> Remove
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Add new photos</label>
        <input type="file" accept="image/*" multiple onChange={(e) => handleAddFiles(e.target.files)} className="text-sm text-gray-600" />
        {newFiles.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            {newFiles.map((f, i) => (
              <div key={i} className="h-28 rounded-lg overflow-hidden border border-gray-200 relative shadow-sm">
                {/* preview */}
                <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Desk Properties</label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasWifi}
              onChange={(e) => setHasWifi(e.target.checked)}
              className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-700">WiFi Available</span>
          </label>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasScreens}
                onChange={(e) => setHasScreens(e.target.checked)}
                className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-sm text-gray-700">Screens</span>
            </label>
            {hasScreens && (
              <input
                type="number"
                min="1"
                value={screensCount}
                onChange={(e) => setScreensCount(e.target.value)}
                placeholder="Number of screens"
                className="ml-8 mt-2 w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHdmi}
              onChange={(e) => setHasHdmi(e.target.checked)}
              className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-700">HDMI Connector</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasKeyboard}
              onChange={(e) => setHasKeyboard(e.target.checked)}
              className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-700">Keyboard</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasMouse}
              onChange={(e) => setHasMouse(e.target.checked)}
              className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-700">Mouse</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasChair}
              onChange={(e) => setHasChair(e.target.checked)}
              className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-700">Chair</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold shadow-sm hover:from-pink-600 hover:to-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? 'Saving...' : 'Save changes'}</button>
      </div>
    </form>
      </div>

      {/* Right column - Calendar */}
      <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full overflow-hidden shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
          <AvailabilityCalendar
            selectedDates={availableDates}
            onChange={setAvailableDates}
          />
          {fieldErrors.availableDates && <div className="mt-2 text-xs text-red-600">{fieldErrors.availableDates}</div>}
        </div>
      </div>
    </div>
  );
}
