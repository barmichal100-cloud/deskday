import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Simple DB check
    const now = await prisma.$queryRaw`SELECT NOW() as now`;

    return NextResponse.json({
      ok: true,
      message: "DB connection works 🎉",
      now,
    });
  } catch (error) {
    console.error("DB check failed:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "DB connection failed",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
