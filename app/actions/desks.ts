"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ALLOWED_LOCATIONS, formatLocation } from "@/lib/locations";

// TEMP: until we have auth, we use your seeded owner ID
const HARDCODED_OWNER_ID = "cmi2s3ask0000pco0slpyyntg";

export async function createDesk(formData: FormData) {
  // Read raw values
  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const rawAddress = formData.get("address");
  const rawLocation = formData.get("location");
  const rawPricePerDay = formData.get("pricePerDay");

  // Basic type checks (protect against tampered form data)
  if (
    typeof rawTitle !== "string" ||
    typeof rawDescription !== "string" ||
    typeof rawAddress !== "string" ||
    typeof rawLocation !== "string" ||
    typeof rawPricePerDay !== "string"
  ) {
    throw new Error("Invalid form submission.");
  }

  const title = rawTitle.trim();
  const description = rawDescription.trim();
  const address = rawAddress.trim();
  const location = rawLocation.trim();
  const pricePerDayStr = rawPricePerDay.trim();

  // ---- VALIDATION (server-side, strict) ----

  // Title: 3–100 chars
  if (title.length < 3 || title.length > 100) {
    throw new Error("Title must be between 3 and 100 characters.");
  }

  // Description: 10–2000 chars
  if (description.length < 10 || description.length > 2000) {
    throw new Error("Description must be between 10 and 2000 characters.");
  }

  // Address: 3–200 chars
  if (address.length < 3 || address.length > 200) {
    throw new Error("Address must be between 3 and 200 characters.");
  }

  // Price: positive, sane range
  const pricePerDayNumber = Number(pricePerDayStr);
  if (
    !Number.isFinite(pricePerDayNumber) ||
    pricePerDayNumber <= 0 ||
    pricePerDayNumber > 100000
  ) {
    throw new Error("Invalid price per day.");
  }

  // Location: must exactly match one of the allowed (city, country) combos
  const match = ALLOWED_LOCATIONS.find(
    (loc) => formatLocation(loc).toLowerCase() === location.toLowerCase()
  );

  if (!match) {
    throw new Error("Invalid location. Please select a valid city from the list.");
  }

  // ---- CREATE DESK IN DB ----

  await prisma.desk.create({
    data: {
      ownerId: HARDCODED_OWNER_ID,
      title_en: title,
      description_en: description,
      address,
      city: match.city,
      country: match.country,
      pricePerDay: Math.round(pricePerDayNumber * 100), // store in cents
      currency: "ILS",
      amenities: {}, // empty for now
      isActive: true,
    },
  });

  // Revalidate and redirect
  revalidatePath("/dashboard/owner/desks");
  redirect("/dashboard/owner/desks");
}
