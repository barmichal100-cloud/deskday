import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/getUser";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (\!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { preferredLocale } = body;

    // Validate locale
    if (\!preferredLocale || \!["EN", "HE"].includes(preferredLocale)) {
      return NextResponse.json(
        { error: "Invalid locale" },
        { status: 400 }
      );
    }

    // Update user preference
    await prisma.user.update({
      where: { id: user.id },
      data: { preferredLocale },
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
