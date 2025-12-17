import { z } from "zod";

const NewDeskSchema = z.object({
  // stronger rules: title at least 10 chars
  title: z.string().min(10, "Title must be at least 10 characters").max(200),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  address: z.string().min(3, "Address is required"),
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
  // Parse with Zod first
  const parseResult = NewDeskSchema.safeParse(payload);
  if (!parseResult.success) {
    // Build a map of field errors from Zod
    const errors: Record<string, string> = {};
    // ZodError exposes `issues` (array of ZodIssue)
    for (const issue of parseResult.error.issues) {
      const path = issue.path?.[0] ?? "_";
      errors[String(path)] = issue.message;
    }
    return { ok: false, error: "Validation failed", errors } as const;
  }

  const parsed = parseResult.data as {
    title: string;
    city: string;
    country: string;
    address: string;
    description: string;
    pricePerDay: string | number;
    currency: string;
  };

  const fieldErrors: Record<string, string> = {};

  // Additional validations
  if (parsed.title.trim().length < 10) {
    fieldErrors.title = "Title must be at least 10 characters";
  }

  // Description: if provided, require it to look like a sentence (end punctuation + min word count)
  const desc = parsed.description?.trim() ?? "";
  if (desc) {
    const words = desc.split(/\s+/).filter(Boolean);
    const endsWithSentencePunct = /[.!?]$/.test(desc);
    if (words.length < 6 || !endsWithSentencePunct) {
      fieldErrors.description = "Description should be a sentence (at least 6 words and end with a period).";
    }
  }

  // Price
  const priceMinor = parsePriceToMinorUnits(parsed.pricePerDay);
  if (priceMinor === null) fieldErrors.pricePerDay = "Invalid pricePerDay";

  // Currency allow-list
  const currencyRaw = typeof parsed.currency === "string" ? parsed.currency.trim().toUpperCase() : "ILS";
  const allowed = ["ILS", "USD", "EUR"];
  const currency = allowed.includes(currencyRaw) ? currencyRaw : "ILS";

  // If any field errors so far, return them
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Validation failed", errors: fieldErrors } as const;
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
