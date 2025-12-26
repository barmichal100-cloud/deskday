import { z } from "zod";

const NewDeskSchema = z.object({
  // stronger rules: title at least 10 chars
  title: z.string().min(10, "Title must be at least 10 characters").max(200),
  city: z.string().min(1, "Location must be selected from the suggestion list"),
  country: z.string().min(1, "Location must be selected from the suggestion list"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  // description optional but if provided must look like a sentence
  description: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => (v === undefined ? "" : v)),
  // price should be sent in minor units (cents) from the client
  pricePerDay: z.union([z.string(), z.number()]),
  currency: z.string().min(3).max(3),
});

function parsePriceToMinorUnits(value: string | number): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.round(value);
  }

  const s = String(value).trim();
  if (s === "") return null;
  const num = Number(s);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
}

export interface NewDeskData {
  title_en: string;
  city: string;
  country: string;
  address: string;
  description_en: string;
  pricePerDay: number; // in smallest currency unit (cents)
  currency: string;
}

export function validateAmenities(amenities: any): { ok: boolean; sanitized?: any; error?: string } {
  if (!amenities || typeof amenities !== 'object') {
    return { ok: true, sanitized: {} };
  }

  // Validate structure - only allow specific boolean fields and screens as number
  const sanitized: any = {};

  if ('wifi' in amenities) {
    if (typeof amenities.wifi !== 'boolean') {
      return { ok: false, error: 'WiFi must be true or false' };
    }
    sanitized.wifi = amenities.wifi;
  }

  if ('hdmi' in amenities) {
    if (typeof amenities.hdmi !== 'boolean') {
      return { ok: false, error: 'HDMI must be true or false' };
    }
    sanitized.hdmi = amenities.hdmi;
  }

  if ('keyboard' in amenities) {
    if (typeof amenities.keyboard !== 'boolean') {
      return { ok: false, error: 'Keyboard must be true or false' };
    }
    sanitized.keyboard = amenities.keyboard;
  }

  if ('mouse' in amenities) {
    if (typeof amenities.mouse !== 'boolean') {
      return { ok: false, error: 'Mouse must be true or false' };
    }
    sanitized.mouse = amenities.mouse;
  }

  if ('chair' in amenities) {
    if (typeof amenities.chair !== 'boolean') {
      return { ok: false, error: 'Chair must be true or false' };
    }
    sanitized.chair = amenities.chair;
  }

  if ('screens' in amenities) {
    const screens = Number(amenities.screens);
    if (!Number.isInteger(screens) || screens < 0 || screens > 10) {
      return { ok: false, error: 'Screens must be a number between 0 and 10' };
    }
    sanitized.screens = screens;
  }

  // Reject any unknown fields
  const allowedKeys = ['wifi', 'hdmi', 'keyboard', 'mouse', 'chair', 'screens'];
  for (const key of Object.keys(amenities)) {
    if (!allowedKeys.includes(key)) {
      return { ok: false, error: `Unknown amenity field: ${key}` };
    }
  }

  return { ok: true, sanitized };
}

async function verifyLocationWithMapbox(city: string, country: string) {
  const key = process.env.MAPBOX_API_KEY;
  if (!key) return { ok: true, info: "no-geocode" };

  try {
    const q = encodeURIComponent(`${city}, ${country}`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${key}&limit=1&types=place,country`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false, info: "geocode-failed" };
    const json = await res.json();
    const features = json?.features;
    if (!features || features.length === 0) return { ok: false, info: "not-found" };
    return { ok: true, info: "found", feature: features[0] };
  } catch (e) {
    return { ok: false, info: "error" };
  }
}

async function verifyAddressWithMapbox(address: string, city: string, country: string) {
  const key = process.env.MAPBOX_API_KEY;
  if (!key) return { ok: true, info: "no-geocode" };

  try {
    const q = encodeURIComponent(`${address}, ${city}, ${country}`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${key}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false, info: "geocode-failed" };
    const json = await res.json();
    const features = json?.features;
    if (!features || features.length === 0) return { ok: false, info: "not-found" };
    return { ok: true, info: "found", feature: features[0] };
  } catch (e) {
    return { ok: false, info: "error" };
  }
}

export async function validateNewDeskInput(payload: Record<string, unknown>) {
  // Collect ALL errors before returning
  const fieldErrors: Record<string, string> = {};

  // Parse with Zod first
  const parseResult = NewDeskSchema.safeParse(payload);
  if (!parseResult.success) {
    // Build a map of field errors from Zod
    // ZodError exposes `issues` (array of ZodIssue)
    for (const issue of parseResult.error.issues) {
      const path = issue.path?.[0] ?? "_";
      const pathStr = String(path);

      // Combine city and country errors into a single "location" error
      if (pathStr === "city" || pathStr === "country") {
        if (!fieldErrors.location) {
          fieldErrors.location = "Location must be selected from the suggestion list";
        }
      } else {
        fieldErrors[pathStr] = issue.message;
      }
    }
  }

  // Continue validating even if Zod failed, to collect all errors
  const parsed = parseResult.success ? parseResult.data : {
    title: String(payload.title ?? ""),
    city: String(payload.city ?? ""),
    country: String(payload.country ?? ""),
    address: String(payload.address ?? ""),
    description: String(payload.description ?? ""),
    pricePerDay: payload.pricePerDay ?? 0,
    currency: String(payload.currency ?? "ILS"),
  } as {
    title: string;
    city: string;
    country: string;
    address: string;
    description: string;
    pricePerDay: string | number;
    currency: string;
  };

  // Additional validations - add to errors but don't override Zod errors
  if (!fieldErrors.title && parsed.title.trim().length < 10) {
    fieldErrors.title = "Title must be at least 10 characters";
  }

  // Description: if provided, require it to look like a sentence (end punctuation + min word count)
  const desc = parsed.description?.trim() ?? "";
  if (desc && !fieldErrors.description) {
    const words = desc.split(/\s+/).filter(Boolean);
    const endsWithSentencePunct = /[.!?]$/.test(desc);
    if (words.length < 6 || !endsWithSentencePunct) {
      fieldErrors.description = "Description should be a sentence (at least 6 words and end with a period).";
    }
  }

  // Price
  if (!fieldErrors.pricePerDay) {
    const priceMinor = parsePriceToMinorUnits(parsed.pricePerDay);
    if (priceMinor === null) {
      fieldErrors.pricePerDay = "Price must be a valid number greater than 0";
    } else {
      // Store the valid price for later use
      (parsed as any)._validatedPrice = priceMinor;
    }
  }

  // Currency validation - must be one of the allowed values
  const currencyRaw = typeof parsed.currency === "string" ? parsed.currency.trim().toUpperCase() : "";
  const allowed = ["ILS", "USD", "EUR"];
  if (!allowed.includes(currencyRaw)) {
    fieldErrors.currency = "Currency must be one of: ILS, USD, EUR";
  }
  const currency = allowed.includes(currencyRaw) ? currencyRaw : "ILS";

  // If any field errors so far, return them ALL
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Validation failed", errors: fieldErrors } as const;
  }

  const priceMinor = (parsed as any)._validatedPrice ?? parsePriceToMinorUnits(parsed.pricePerDay);

  // Verify location via Mapbox if API key present
  const locationGeo = await verifyLocationWithMapbox(parsed.city, parsed.country);
  if (!locationGeo.ok && process.env.MAPBOX_API_KEY) {
    return { ok: false, error: "Location verification failed", errors: { location: "Please select a valid location from the suggestions." } } as const;
  }

  // Optional: verify address via Mapbox if API key present
  const geo = await verifyAddressWithMapbox(parsed.address, parsed.city, parsed.country);
  if (!geo.ok) {
    if (process.env.MAPBOX_API_KEY) {
      // Return an error attached to address field
      return { ok: false, error: "Address verification failed", errors: { address: "Address could not be verified for the selected city/country." } } as const;
    }
    // otherwise skip verification
  } else if (geo.feature) {
    // ensure the geocoded feature contains the city and country
    const ctx = geo.feature.context || [];
    const texts = [geo.feature.text, ...(ctx.map((c: any) => c.text || []))].map(String).map((s) => s.toLowerCase());
    const cityMatch = texts.some((t) => t === parsed.city.trim().toLowerCase());
    const countryMatch = texts.some((t) => t === parsed.country.trim().toLowerCase());
    if (!cityMatch || !countryMatch) {
      return { ok: false, error: "Address verification mismatch", errors: { address: "Address does not appear to be within the selected city/country." } } as const;
    }
  }

  return {
    ok: true,
    data: {
      title_en: parsed.title.trim(),
      description_en: parsed.description?.trim() ?? "",
      city: parsed.city.trim(),
      country: parsed.country.trim(),
      address: parsed.address.trim(),
      pricePerDay: priceMinor,
      currency,
    },
  } as const;
}
