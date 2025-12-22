import { prisma } from "./prisma";

type NotificationType =
  | "bookingConfirmation"
  | "bookingReminder"
  | "bookingCancellation"
  | "newBookingRequest"
  | "paymentReceived"
  | "reviewReceived"
  | "accountActivity"
  | "promotionsAndTips"
  | "newsAndUpdates";

type NotificationData = {
  userId: string;
  type: NotificationType;
  subject: string;
  message: string;
  data?: Record<string, any>;
};

/**
 * Send notification to user based on their preferences
 */
export async function sendNotification(notificationData: NotificationData) {
  const { userId, type, subject, message, data } = notificationData;

  // Get user and their preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      notificationPreferences: true,
    },
  });

  if (!user) {
    console.error(`User ${userId} not found`);
    return;
  }

  const prefs = user.notificationPreferences;

  // If no preferences, use defaults (all emails enabled)
  const shouldSendEmail = prefs
    ? (prefs as any)[`${type}Email`]
    : true;
  const shouldSendPush = prefs
    ? (prefs as any)[`${type}Push`]
    : type.includes("booking") || type.includes("Request");
  const shouldSendSms = prefs
    ? (prefs as any)[`${type}Sms`]
    : false;

  // Send Email
  if (shouldSendEmail) {
    await sendEmail({
      to: user.email,
      subject,
      html: message,
      data,
    });
  }

  // Send Push notification
  if (shouldSendPush) {
    await sendPushNotification({
      userId,
      title: subject,
      body: message,
      data,
    });
  }

  // Send SMS
  if (shouldSendSms && user.phone) {
    await sendSMS({
      to: user.phone,
      message: `${subject}: ${message}`,
      data,
    });
  }

  // Log the notification
  await prisma.systemLog.create({
    data: {
      userId,
      type: `notification_${type}`,
      data: {
        subject,
        message,
        channels: {
          email: shouldSendEmail,
          push: shouldSendPush,
          sms: shouldSendSms,
        },
        ...data,
      },
    },
  });
}

/**
 * Send email notification
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  data?: Record<string, any>;
}) {
  // TODO: Implement actual email sending (e.g., using SendGrid, Resend, etc.)
  console.log("[EMAIL] Sending to:", params.to);
  console.log("[EMAIL] Subject:", params.subject);
  console.log("[EMAIL] Message:", params.html);

  // For now, just log it
  // In production, you would use a service like:
  // await sendgrid.send({ to: params.to, subject: params.subject, html: params.html })
}

/**
 * Send push notification
 */
async function sendPushNotification(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  // TODO: Implement actual push notification sending
  console.log("[PUSH] Sending to user:", params.userId);
  console.log("[PUSH] Title:", params.title);
  console.log("[PUSH] Body:", params.body);

  // For now, just log it
  // In production, you would use a service like Firebase Cloud Messaging or OneSignal
}

/**
 * Send SMS notification
 */
async function sendSMS(params: {
  to: string;
  message: string;
  data?: Record<string, any>;
}) {
  // TODO: Implement actual SMS sending (e.g., using Twilio)
  console.log("[SMS] Sending to:", params.to);
  console.log("[SMS] Message:", params.message);

  // For now, just log it
  // In production, you would use a service like:
  // await twilio.messages.create({ to: params.to, body: params.message })
}

/**
 * Helper functions for common notification scenarios
 */

export async function notifyBookingConfirmed(params: {
  userId: string;
  deskTitle: string;
  startDate: Date;
  endDate: Date;
}) {
  await sendNotification({
    userId: params.userId,
    type: "bookingConfirmation",
    subject: "Booking Confirmed",
    message: `Your booking for "${params.deskTitle}" from ${params.startDate.toLocaleDateString()} to ${params.endDate.toLocaleDateString()} has been confirmed!`,
    data: params,
  });
}

export async function notifyBookingCancelled(params: {
  userId: string;
  deskTitle: string;
  reason?: string;
}) {
  await sendNotification({
    userId: params.userId,
    type: "bookingCancellation",
    subject: "Booking Cancelled",
    message: `Your booking for "${params.deskTitle}" has been cancelled${params.reason ? `: ${params.reason}` : ""}.`,
    data: params,
  });
}

export async function notifyNewBookingRequest(params: {
  ownerId: string;
  deskTitle: string;
  renterName: string;
  startDate: Date;
  endDate: Date;
}) {
  await sendNotification({
    userId: params.ownerId,
    type: "newBookingRequest",
    subject: "New Booking Request",
    message: `${params.renterName} has booked your desk "${params.deskTitle}" from ${params.startDate.toLocaleDateString()} to ${params.endDate.toLocaleDateString()}.`,
    data: params,
  });
}

export async function notifyPaymentReceived(params: {
  ownerId: string;
  amount: number;
  currency: string;
  deskTitle: string;
}) {
  await sendNotification({
    userId: params.ownerId,
    type: "paymentReceived",
    subject: "Payment Received",
    message: `You've received a payment of ${params.currency} ${(params.amount / 100).toFixed(2)} for your desk "${params.deskTitle}".`,
    data: params,
  });
}

export async function notifyReviewReceived(params: {
  ownerId: string;
  deskTitle: string;
  rating: number;
  reviewerName: string;
}) {
  await sendNotification({
    userId: params.ownerId,
    type: "reviewReceived",
    subject: "New Review",
    message: `${params.reviewerName} left a ${params.rating}-star review for your desk "${params.deskTitle}".`,
    data: params,
  });
}
