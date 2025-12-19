import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/getUser";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: deskId } = await params;

    // Check if desk exists and belongs to the user
    const desk = await prisma.desk.findUnique({
      where: { id: deskId },
      include: {
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
        },
      },
    });

    if (!desk) {
      return NextResponse.json({ error: "Desk not found" }, { status: 404 });
    }

    if (desk.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this desk" },
        { status: 403 }
      );
    }

    // Check if there are any active bookings
    if (desk.bookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete desk with active or pending bookings" },
        { status: 400 }
      );
    }

    // Delete related records first
    await prisma.$transaction([
      // Delete photos
      prisma.photo.deleteMany({
        where: { deskId },
      }),
      // Delete available dates
      prisma.availableDate.deleteMany({
        where: { deskId },
      }),
      // Delete amenities
      prisma.deskAmenity.deleteMany({
        where: { deskId },
      }),
      // Delete the desk
      prisma.desk.delete({
        where: { id: deskId },
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting desk:", error);
    return NextResponse.json(
      { error: "Failed to delete desk" },
      { status: 500 }
    );
  }
}
