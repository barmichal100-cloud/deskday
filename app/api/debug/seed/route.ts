// app/api/debug/seed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Upsert a test owner user
    const owner = await prisma.user.upsert({
      where: { email: "owner@example.com" },
      update: {},
      create: {
        email: "owner@example.com",
        passwordHash: "TEMP", // we'll replace with real auth later
        name: "Test Owner",
        role: "OWNER",
      },
    });

    // 2. Create a sample desk if none exists for this owner
    const existingDesk = await prisma.desk.findFirst({
      where: { ownerId: owner.id },
    });

    let desk;

    if (!existingDesk) {
      desk = await prisma.desk.create({
        data: {
          ownerId: owner.id,
          title_en: "Sunny desk in a quiet office",
          title_he: "שולחן מואר במשרד שקט",
          description_en:
            "Comfortable desk with fast WiFi, ergonomic chair, and access to a small kitchen.",
          description_he:
            "שולחן נוח עם אינטרנט מהיר, כיסא ארגונומי וגישה למטבחון קטן.",
          houseRules_en: "Please keep the noise low and leave the desk tidy.",
          houseRules_he: "נא לשמור על שקט ולהשאיר את השולחן מסודר.",
          address: "123 Example Street",
          city: "Tel Aviv",
          country: "Israel",
          pricePerDay: 20000, // 200.00 in smallest unit
          currency: "ILS",
          amenities: {
            wifi: true,
            monitor: true,
            coffee: true,
            parking: false,
          },
        },
      });
    } else {
      desk = existingDesk;
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Seed OK",
        ownerId: owner.id,
        deskId: desk.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Seed failed" },
      { status: 500 }
    );
  }
}
