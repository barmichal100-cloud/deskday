import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { deskId } = body;

    if (!deskId) {
      return NextResponse.json(
        { error: "Desk ID is required" },
        { status: 400 }
      );
    }

    // Check if favorite already exists
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_deskId: {
          userId,
          deskId,
        },
      },
    });

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({
        where: {
          id: existing.id,
        },
      });

      return NextResponse.json({ isFavorite: false });
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId,
          deskId,
        },
      });

      return NextResponse.json({ isFavorite: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
