import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/getUser";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { preferredLocale, preferredCurrency } = body;

    // Build update data object
    const updateData: {
      preferredLocale?: "EN" | "HE";
      preferredCurrency?: "ILS" | "USD" | "EUR";
    } = {};

    // Validate and add locale if provided
    if (preferredLocale !== undefined) {
      if (!["EN", "HE"].includes(preferredLocale)) {
        return NextResponse.json(
          { error: "Invalid locale" },
          { status: 400 }
        );
      }
      updateData.preferredLocale = preferredLocale;
    }

    // Validate and add currency if provided
    if (preferredCurrency !== undefined) {
      if (!["ILS", "USD", "EUR"].includes(preferredCurrency)) {
        return NextResponse.json(
          { error: "Invalid currency" },
          { status: 400 }
        );
      }
      updateData.preferredCurrency = preferredCurrency;
    }

    // Update user preferences
    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
