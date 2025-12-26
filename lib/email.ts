import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn('⚠️  RESEND_API_KEY is not configured - emails will not be sent');
}

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendBookingConfirmationEmail({
  to,
  bookingId,
  deskTitle,
  deskAddress,
  checkInDate,
  checkOutDate,
  totalPrice,
  currency,
  renterName,
}: {
  to: string;
  bookingId: string;
  deskTitle: string;
  deskAddress: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  currency: string;
  renterName: string;
}) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  console.log('📧 Attempting to send booking confirmation email to:', to);
  console.log('📧 From email:', fromEmail);
  console.log('📧 Resend configured:', !!resend);

  if (!resend) {
    console.error('❌ Cannot send email - Resend not configured');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Booking Confirmation - ${deskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #ec4899, #f43f5e); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed!</h1>
            </div>

            <div style="background: #f9fafb; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #111827;">Hi ${renterName},</h2>
              <p style="margin: 15px 0; font-size: 16px;">Great news! Your booking has been confirmed and payment received.</p>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #111827; border-bottom: 2px solid #ec4899; padding-bottom: 10px;">Booking Details</h3>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Booking ID:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${bookingId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Desk:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${deskTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Address:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${deskAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Check-in:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Check-out:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;"><strong>Total Paid:</strong></td>
                  <td style="padding: 12px 0; text-align: right; font-size: 18px; color: #ec4899; font-weight: bold;">${currency} ${(totalPrice / 100).toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Important:</strong> Please save this email for your records. You may need to show proof of booking when you arrive.
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
              <p>Need help? Contact us at support@deskday.com</p>
              <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} DeskDay. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending booking confirmation email:', error);
      return { success: false, error };
    }

    console.log('✅ Booking confirmation email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to send booking confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendBookingNotificationToOwner({
  to,
  bookingId,
  deskTitle,
  deskAddress,
  checkInDate,
  checkOutDate,
  totalPrice,
  currency,
  renterName,
  renterEmail,
  ownerName,
}: {
  to: string;
  bookingId: string;
  deskTitle: string;
  deskAddress: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  currency: string;
  renterName: string;
  renterEmail: string;
  ownerName: string;
}) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  console.log('📧 Attempting to send booking notification to owner:', to);
  console.log('📧 From email:', fromEmail);
  console.log('📧 Resend configured:', !!resend);

  if (!resend) {
    console.error('❌ Cannot send email - Resend not configured');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const { data, error} = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `New Booking Received - ${deskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Booking Notification</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #ec4899, #f43f5e); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Booking Received!</h1>
            </div>

            <div style="background: #f9fafb; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #111827;">Hi ${ownerName},</h2>
              <p style="margin: 15px 0; font-size: 16px;">You have received a new booking for your desk.</p>
            </div>

            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #111827; border-bottom: 2px solid #ec4899; padding-bottom: 10px;">Booking Details</h3>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Booking ID:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${bookingId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Desk:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${deskTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Address:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${deskAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Renter:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${renterName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Renter Email:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${renterEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Check-in:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><strong>Check-out:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;"><strong>Amount Earned:</strong></td>
                  <td style="padding: 12px 0; text-align: right; font-size: 18px; color: #10b981; font-weight: bold;">${currency} ${(totalPrice / 100).toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px; color: #1e40af;">
                <strong>Next Steps:</strong> The dates have been automatically blocked on your calendar. You can view all booking details in your dashboard.
              </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
              <p>Need help? Contact us at support@deskday.com</p>
              <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} DeskDay. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending booking notification to owner:', error);
      return { success: false, error };
    }

    console.log('✅ Booking notification email sent to owner successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to send booking notification to owner:', error);
    return { success: false, error };
  }
}
