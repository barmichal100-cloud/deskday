import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Fetch the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        desk: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if the user is the renter
    if (booking.renterId !== userId) {
      return NextResponse.json(
        { error: "You can only cancel your own bookings" },
        { status: 403 }
      );
    }

    // Check if booking is already cancelled
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // Check if booking is confirmed
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Only confirmed bookings can be cancelled" },
        { status: 400 }
      );
    }

    // Update booking status to CANCELLED
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
      },
    });

    // Unblock the dates (make them available again)
    const bookedDates = booking.bookedDates as string[];

    if (bookedDates && bookedDates.length > 0) {
      // Remove from blocked dates
      await prisma.deskBlockedDate.deleteMany({
        where: {
          deskId: booking.deskId,
          date: {
            in: bookedDates.map((d) => new Date(d)),
          },
          reason: "BOOKED",
        },
      });

      // Add back to available dates
      await prisma.deskAvailableDate.createMany({
        data: bookedDates.map((dateStr) => ({
          deskId: booking.deskId,
          date: new Date(dateStr),
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to cancel booking";
    return NextResponse.json(
      { error: `Failed to cancel booking: ${errorMessage}` },
      { status: 500 }
    );
  }
}
