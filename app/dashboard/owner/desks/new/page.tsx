"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useState, useRef } from "react";
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import { ALLOWED_LOCATIONS, formatLocation } from "@/lib/locations";
import { useRouter } from "next/navigation";
import AvailabilityCalendar from './AvailabilityCalendar';
import HeaderClient from '../../../../HeaderClient';

export default function NewDeskPage() {
  type MapboxContextItem = { id: string; text?: string; short_code?: string };
  type MapboxFeature = { id: string; text?: string; place_name?: string; context?: MapboxContextItem[]; score?: number };
  type MapboxRaw = { id?: string; place_type?: string[]; text?: string; context?: MapboxContextItem[]; place_name?: string };
  type ScoredFeature = MapboxFeature & { score: number };

  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Controlled form fields (needed for autocomplete)
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [address, setAddress] = useState("");
  // Images state for uploads
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // cropping/hard-edit UI
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [description, setDescription] = useState("");
  const [imageErrors, setImageErrors] = useState<string | null>(null);
  const MAX_IMAGES = 6;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB each
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const [pricePerDayInput, setPricePerDayInput] = useState("");
  const [currency, setCurrency] = useState("ILS");
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Desk properties / amenities
  const [hasWifi, setHasWifi] = useState(false);
  const [hasScreens, setHasScreens] = useState(false);
  const [screensCount, setScreensCount] = useState("");
  const [hasHdmi, setHasHdmi] = useState(false);
  const [hasKeyboard, setHasKeyboard] = useState(false);
  const [hasMouse, setHasMouse] = useState(false);
  const [hasChair, setHasChair] = useState(false);

  // Autocomplete suggestions
  const [locationSuggestions, setLocationSuggestions] = useState<MapboxFeature[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<MapboxFeature[]>([]);
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
          .map((loc) => ({ city: loc.city, country: loc.country, label: formatLocation(loc) }))
          .filter((loc) => loc.label.toLowerCase().includes(qnorm))
          .map((loc) => ({ id: `${loc.city}-${loc.country}`, text: loc.city, place_name: loc.label, context: [{ id: `country.${loc.country}`, text: loc.country }] } as MapboxFeature));
      }
    } catch (err) {
      // ignore whitelist failure and continue to provider lookups
      console.error('whitelist check failed', err);
    }
    try {
      // If we have a Mapbox key, prefer Mapbox
      if (mapboxKey) {
        const q = encodeURIComponent(query);
        // request English results for predictable labels, limit to places/countries
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${mapboxKey}&autocomplete=true&types=${types}&limit=8&language=en`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        const raw: MapboxRaw[] = json.features ?? [];

        // Normalize Mapbox results to { id, text, place_name, context }
        const seen = new Set<string>();
        type ScoredFeature = MapboxFeature & { score: number };
        const out: ScoredFeature[] = [];
        // prepare tokenized query for scoring
        const qnorm = String(query).trim().toLowerCase();
        const qtokens = qnorm.split(/\s+/).filter(Boolean);
        for (const f of raw) {
          const placeTypes: string[] = f.place_type ?? [];
          // accept only place (city) or country
          if (!placeTypes.includes('place') && !placeTypes.includes('country')) continue;

          const city = f.text || '';
          const country = (f.context ?? []).find((c: MapboxContextItem) => String(c.id).startsWith('country.'))?.text || '';

          // If this is a country-only result and no city, show country alone
          const label = placeTypes.includes('country') && !city ? country : `${city}${country ? ', ' + country : ''}`;

          if (!label) continue;
          if (seen.has(label)) continue;

            // scoring: prefer exact or starts-with matches in city or label
            const cityNorm = (city || '').toLowerCase();
            const labelNorm = String(label).toLowerCase();
            let score = 0;
            if (cityNorm === qnorm || labelNorm === qnorm) score += 200;
            if (cityNorm.startsWith(qnorm) || labelNorm.startsWith(qnorm)) score += 150;
            // token-starts-with matching: match tokens to successive label words
            const labelWords = labelNorm.split(/\s+|,\s*/).filter(Boolean);
            let tokenPrefixMatch = true;
            for (let i = 0; i < qtokens.length; i++) {
              if (!labelWords[i] || !labelWords[i].startsWith(qtokens[i])) {
                tokenPrefixMatch = false;
                break;
              }
            }
            if (tokenPrefixMatch && qtokens.length > 1) score += 140;
            // permissive fallback: tokens appear anywhere
            if (qtokens.length > 0 && qtokens.every((t) => labelNorm.includes(t))) score += 60;
            // small boost for shorter label (likely a city only)
            score += Math.max(0, 20 - labelNorm.length);

          seen.add(label);
          out.push({ id: String(f.id ?? `m-${Math.random().toString(36).slice(2,8)}`), text: city || country, place_name: label, context: country ? [{ id: `country.${country}`, text: country } ] : [], score });
        }
        // sort by score desc, then alphabetic and trim to 8
        // Filter out very low scores but keep a wider pool so provider results supplement localMatches
        const filtered = out.filter((f) => (f.score ?? 0) >= 20);
        filtered.sort((a: ScoredFeature, b: ScoredFeature) => (b.score || 0) - (a.score || 0) || String(a.place_name).localeCompare(String(b.place_name)));
        const providerResults = filtered.map((f) => ({ id: f.id, text: f.text, place_name: f.place_name, context: f.context } as MapboxFeature));

        // Merge localMatches (if any) first, then provider results, dedupe by place_name
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

      // Fallback: use local Nominatim proxy (no API key required)
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const json = await res.json();
      const rawNom: { id?: string | number; text?: string; place_name?: string; context?: { id: string; text?: string }[] }[] = json ?? [];
      // Score and filter Nominatim results on client as well
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
          // scoring - same stricter rules for Nominatim
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
          return { id: String(f.id ?? `n-${idx}`), text: city || country, place_name: label, context: country ? [{ id: `country.${country}`, text: country }] : [], score } as ScoredFeature;
        })
        .filter((x): x is ScoredFeature => !!x)
        .filter((f) => (f?.score ?? 0) >= 20)
        .sort((a: ScoredFeature, b: ScoredFeature) => (b.score || 0) - (a.score || 0) || String(a.place_name).localeCompare(String(b.place_name)))
        .slice(0, 12)
        .map((f) => ({ id: f.id, text: f.text, place_name: f.place_name, context: f.context } as MapboxFeature))) as MapboxFeature[];

      // Merge localMatches (if any) first, then provider results, dedupe by place_name
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    setFieldErrors({});

    // Require location to be selected from suggestions
    const selected = locationSuggestions.find(
      (s) => {
        const countryObj = s.context?.find((c: MapboxContextItem) => c.id.startsWith('country.'));
        return `${s.text}, ${countryObj?.text ?? ''}` === location;
      }
    );
    if (!location || !selected) {
      setFieldErrors((prev) => ({ ...prev, location: "Please select a location from the suggestions." }));
      setIsSubmitting(false);
      return;
    }

    const city = selected.text;
    const country = selected.context?.find((c: MapboxContextItem) => c.id.startsWith('country.'))?.text || "";

    const priceNumber = parseFloat(pricePerDayInput || "0");
    const pricePerDay = Math.round((isNaN(priceNumber) ? 0 : priceNumber) * 100);

    // validate images client-side too
    if (imageErrors) {
      setFieldErrors((prev) => ({ ...prev, images: String(imageErrors) }));
      setIsSubmitting(false);
      return;
    }

    if (images.length > 6) {
      setFieldErrors((prev) => ({ ...prev, images: "Maximum 6 images allowed." }));
      setIsSubmitting(false);
      return;
    }

    const body = {
      title,
      description,
      city,
      country,
      address,
      pricePerDay,
      currency,
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

    try {
      // If images were attached, submit as multipart/form-data so server can accept files
      let res: Response;
      if (images.length > 0) {
        const fd = new FormData();
        fd.append('payload', JSON.stringify(body));
        images.forEach((f) => fd.append('images', f));
        res = await fetch('/api/desks', { method: 'POST', body: fd });
      } else {
        res = await fetch('/api/desks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('API Error:', data);
        if (data && data.errors) {
          setFieldErrors(data.errors);
        } else {
          const errorMsg = typeof data.error === "string" ? data.error : "Failed to create desk. Please check your inputs.";
          const detailMsg = data.detail ? `\n\nDetails: ${JSON.stringify(data.detail)}` : '';
          setFormError(errorMsg + detailMsg);
        }
        setIsSubmitting(false);
        return;
      }

      // On success, redirect to the newly created desk page
      setIsSubmitting(false);
      const deskId = data.desk?.id;
      if (deskId) {
        router.push(`/desk/${deskId}?success=true`);
      } else {
        router.push("/dashboard/owner");
      }
      router.refresh();
    } catch (err) {
      console.error("Error submitting form:", err);
      setFormError("Unexpected error while creating desk.");
      setIsSubmitting(false);
    }
  }

  // Helpers for cropping (component scope)
  function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img') as HTMLImageElement;
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;
    });
  }

  async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  }

  // onCropComplete handled inline in component JSX

  const applyButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // focus the apply button when crop modal opens for keyboard accessibility
    if (croppingIndex !== null) {
      setTimeout(() => applyButtonRef.current?.focus(), 50);
    }
  }, [croppingIndex]);

  async function applyCrop() {
    if (croppingIndex === null) return;
    const src = imagePreviews[croppingIndex];
    if (!src || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(src, croppedAreaPixels);
      if (!blob) throw new Error('Crop failed');
      const original = images[croppingIndex];
      const filename = original?.name || `cropped-${Date.now()}.jpg`;
      const croppedFile = new File([blob], filename, { type: 'image/jpeg' });

      // revoke old preview URL
      try { URL.revokeObjectURL(imagePreviews[croppingIndex]); } catch {}

      const newImages = images.slice();
      newImages[croppingIndex] = croppedFile;
      setImages(newImages);

      const newPreviews = imagePreviews.slice();
      newPreviews[croppingIndex] = URL.createObjectURL(croppedFile);
      setImagePreviews(newPreviews);

      setCroppingIndex(null);
    } catch (err) {
      console.error('applyCrop failed', err);
      setImageErrors('Failed to crop image — please try again');
    }
  }

  function cancelCrop() {
    setCroppingIndex(null);
  }

  return (
    <main className="min-h-screen bg-white">
      <HeaderClient backHref="/dashboard" backText="Back to dashboard" />

      <section className="px-6 lg:px-20 py-12">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
          Add a new desk
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Fill in the details of your spare desk. You can adjust availability
          and pricing later.
        </p>

        {formError && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Form */}
          <div className="lg:max-w-2xl">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              required
              placeholder="Cozy desk in quiet office"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
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

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Address</label>
            <input
              name="address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (mapboxKey) scheduleFetch(e.target.value, "address,place,poi", setAddressSuggestions);
              }}
              type="text"
              required
              placeholder="Dizengoff 100"
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
            {addressSuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg bg-white border border-gray-200 shadow-lg max-h-44 overflow-auto">
                {addressSuggestions.map((s, i) => (
                  <li
                    key={i}
                    className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer text-gray-900"
                    onClick={() => {
                      setAddress(s.place_name || s.text || "");
                      setAddressSuggestions([]);
                    }}
                  >
                    {s.place_name}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Photos (optional)</label>
              <div className="flex items-center gap-3 mb-2">
                <input
                  aria-label="Upload photos"
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  multiple
                  onChange={(e) => {
                    setImageErrors(null);
                    const files = Array.from(e.target.files ?? []);
                    if (files.length === 0) return;
                    // merge with existing, but cap to MAX_IMAGES
                    const merged = [...images, ...files].slice(0, MAX_IMAGES);
                    // validate types and sizes
                    const errs: string[] = [];
                    for (const f of merged) {
                      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) errs.push(`${f.name} has invalid type`);
                      if (f.size > MAX_IMAGE_SIZE) errs.push(`${f.name} is too large (max 5MB)`);
                    }
                    if (errs.length) {
                      setImageErrors(errs.join('; '));
                      return;
                    }
                    setImages(merged);
                    // create previews
                    const urls = merged.map((f) => URL.createObjectURL(f));
                    setImagePreviews(urls);
                  }}
                  className="text-sm text-gray-600"
                />
                <div className="text-xs text-gray-600">Up to {MAX_IMAGES} images, JPEG/PNG/WEBP, ≤5MB each</div>
              </div>
              {imageErrors && <div className="text-xs text-red-600 mb-2">{imageErrors}</div>}
              {fieldErrors.images && <div className="text-xs text-red-600 mb-2">{fieldErrors.images}</div>}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm" style={{ aspectRatio: '4 / 3' }}>
                              {src.startsWith('/') || src.startsWith('http') ? (
                                <Image src={src} alt={`preview-${idx}`} fill style={{ objectFit: 'contain' }} />
                              ) : (
                                <img src={src} alt={`preview-${idx}`} className="w-full h-full object-contain bg-gray-50" />
                              )}
                      <div className="absolute left-2 top-2 flex items-start gap-2">
                        <button
                          type="button"
                          aria-label={`Remove image ${idx + 1}`}
                          className="bg-white/90 text-xs rounded-full px-2 py-1 shadow-sm font-medium text-gray-700 hover:bg-white"
                        onClick={() => {
                          // revoke url and remove image/preview
                          try { URL.revokeObjectURL(src); } catch {}
                          const imgs = images.slice(); imgs.splice(idx, 1); setImages(imgs);
                          const previews = imagePreviews.slice(); previews.splice(idx, 1); setImagePreviews(previews);
                        }}
                      >
                        ✕
                        </button>
                        <button
                          type="button"
                          aria-label={`Crop image ${idx + 1}`}
                          title="Crop this image"
                          className="bg-white/90 text-xs rounded-md px-2 py-1 shadow-sm font-medium text-gray-700 hover:bg-white"
                          onClick={() => {
                            setCroppingIndex(idx);
                            // reset crop/zoom
                            setCrop({ x: 0, y: 0 });
                            setZoom(1);
                            setCroppedAreaPixels(null);
                          }}
                        >
                          Crop
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {croppingIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal={true} aria-label="Image crop dialog" tabIndex={-1}>
                  <div className="bg-white rounded-lg w-full max-w-3xl p-4" role="document">
                    <h3 className="text-sm font-semibold mb-2">Crop image</h3>
                    <div className="relative w-full h-[400px] bg-gray-100 rounded overflow-hidden">
                      <Cropper
                        image={imagePreviews[croppingIndex]}
                        crop={crop}
                        zoom={zoom}
                        aspect={4 / 3}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(area: { x: number; y: number; width: number; height: number }, areaPixels: { x: number; y: number; width: number; height: number }) => setCroppedAreaPixels(areaPixels)}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <label className="text-xs text-foreground/70">Zoom</label>
                      <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button type="button" onClick={() => cancelCrop()} className="px-3 py-2 rounded bg-gray-100 text-sm">Cancel</button>
                      <button ref={applyButtonRef} aria-label="Apply crop" type="button" onClick={() => applyCrop()} className="px-3 py-2 rounded bg-primary text-sm text-primary-foreground">Apply crop</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {fieldErrors.address && <div className="mt-1 text-xs text-red-600">{fieldErrors.address}</div>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the desk, noise level, what's included (monitor, chair, coffee, etc.)."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
            />
            {fieldErrors.description && <div className="mt-1 text-xs text-red-600">{fieldErrors.description}</div>}
          </div>

          <div className="grid gap-4 md:grid-cols-2 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Price per day</label>
              <input
                name="pricePerDay"
                value={pricePerDayInput}
                onChange={(e) => setPricePerDayInput(e.target.value)}
                type="number"
                min={1}
                step="0.01"
                required
                placeholder="200"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              {fieldErrors.pricePerDay && <div className="mt-1 text-xs text-red-600">{fieldErrors.pricePerDay}</div>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Currency</label>
              <select
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="ILS">ILS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-pink-600 hover:to-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create desk"}
          </button>
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
      </section>
    </main>
  );
}

// (helper functions moved into component)
