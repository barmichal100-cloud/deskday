import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, preferredLocale } = body;

    // Validate preferredLocale
    if (preferredLocale && !["EN", "HE"].includes(preferredLocale)) {
      return NextResponse.json(
        { error: "Invalid language preference" },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || null,
        preferredLocale: preferredLocale || "EN",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLocale: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
