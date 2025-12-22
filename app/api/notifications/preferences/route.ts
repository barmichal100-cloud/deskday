import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/getUser";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // If no preferences exist, return defaults
    if (!preferences) {
      return NextResponse.json({
        bookingConfirmation: { email: true, push: true, sms: false },
        bookingReminder: { email: true, push: true, sms: false },
        bookingCancellation: { email: true, push: true, sms: false },
        newBookingRequest: { email: true, push: true, sms: false },
        paymentReceived: { email: true, push: false, sms: false },
        reviewReceived: { email: true, push: true, sms: false },
        accountActivity: { email: true, push: false, sms: false },
        promotionsAndTips: { email: false, push: false, sms: false },
        newsAndUpdates: { email: false, push: false, sms: false },
      });
    }

    // Transform database format to UI format
    return NextResponse.json({
      bookingConfirmation: {
        email: preferences.bookingConfirmationEmail,
        push: preferences.bookingConfirmationPush,
        sms: preferences.bookingConfirmationSms,
      },
      bookingReminder: {
        email: preferences.bookingReminderEmail,
        push: preferences.bookingReminderPush,
        sms: preferences.bookingReminderSms,
      },
      bookingCancellation: {
        email: preferences.bookingCancellationEmail,
        push: preferences.bookingCancellationPush,
        sms: preferences.bookingCancellationSms,
      },
      newBookingRequest: {
        email: preferences.newBookingRequestEmail,
        push: preferences.newBookingRequestPush,
        sms: preferences.newBookingRequestSms,
      },
      paymentReceived: {
        email: preferences.paymentReceivedEmail,
        push: preferences.paymentReceivedPush,
        sms: preferences.paymentReceivedSms,
      },
      reviewReceived: {
        email: preferences.reviewReceivedEmail,
        push: preferences.reviewReceivedPush,
        sms: preferences.reviewReceivedSms,
      },
      accountActivity: {
        email: preferences.accountActivityEmail,
        push: preferences.accountActivityPush,
        sms: preferences.accountActivitySms,
      },
      promotionsAndTips: {
        email: preferences.promotionsAndTipsEmail,
        push: preferences.promotionsAndTipsPush,
        sms: preferences.promotionsAndTipsSms,
      },
      newsAndUpdates: {
        email: preferences.newsAndUpdatesEmail,
        push: preferences.newsAndUpdatesPush,
        sms: preferences.newsAndUpdatesSms,
      },
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Transform UI format to database format
    const data = {
      bookingConfirmationEmail: body.bookingConfirmation.email,
      bookingConfirmationPush: body.bookingConfirmation.push,
      bookingConfirmationSms: body.bookingConfirmation.sms,
      bookingReminderEmail: body.bookingReminder.email,
      bookingReminderPush: body.bookingReminder.push,
      bookingReminderSms: body.bookingReminder.sms,
      bookingCancellationEmail: body.bookingCancellation.email,
      bookingCancellationPush: body.bookingCancellation.push,
      bookingCancellationSms: body.bookingCancellation.sms,
      newBookingRequestEmail: body.newBookingRequest.email,
      newBookingRequestPush: body.newBookingRequest.push,
      newBookingRequestSms: body.newBookingRequest.sms,
      paymentReceivedEmail: body.paymentReceived.email,
      paymentReceivedPush: body.paymentReceived.push,
      paymentReceivedSms: body.paymentReceived.sms,
      reviewReceivedEmail: body.reviewReceived.email,
      reviewReceivedPush: body.reviewReceived.push,
      reviewReceivedSms: body.reviewReceived.sms,
      accountActivityEmail: body.accountActivity.email,
      accountActivityPush: body.accountActivity.push,
      accountActivitySms: body.accountActivity.sms,
      promotionsAndTipsEmail: body.promotionsAndTips.email,
      promotionsAndTipsPush: body.promotionsAndTips.push,
      promotionsAndTipsSms: body.promotionsAndTips.sms,
      newsAndUpdatesEmail: body.newsAndUpdates.email,
      newsAndUpdatesPush: body.newsAndUpdates.push,
      newsAndUpdatesSms: body.newsAndUpdates.sms,
    };

    // Upsert preferences (create or update)
    await prisma.notificationPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...data,
      },
      update: data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
