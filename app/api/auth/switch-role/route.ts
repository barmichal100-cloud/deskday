import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { role } = await request.json();

    if (role !== "RENTER" && role !== "OWNER") {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLocale: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error switching role:", error);
    return NextResponse.json(
      { error: "Failed to switch role" },
      { status: 500 }
    );
  }
}
