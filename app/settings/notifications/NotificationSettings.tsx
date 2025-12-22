"use client";

import { useState, useEffect } from "react";

type Props = {
  userRole: "RENTER" | "OWNER" | "ADMIN";
  userEmail: string;
};

type NotificationPreferences = {
  // Booking notifications
  bookingConfirmation: { email: boolean; push: boolean; sms: boolean };
  bookingReminder: { email: boolean; push: boolean; sms: boolean };
  bookingCancellation: { email: boolean; push: boolean; sms: boolean };

  // Owner notifications (if OWNER role)
  newBookingRequest: { email: boolean; push: boolean; sms: boolean };
  paymentReceived: { email: boolean; push: boolean; sms: boolean };
  reviewReceived: { email: boolean; push: boolean; sms: boolean };

  // General notifications
  accountActivity: { email: boolean; push: boolean; sms: boolean };
  promotionsAndTips: { email: boolean; push: boolean; sms: boolean };
  newsAndUpdates: { email: boolean; push: boolean; sms: boolean };
};

export default function NotificationSettings({ userRole, userEmail }: Props) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
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

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (
    category: keyof NotificationPreferences,
    channel: "email" | "push" | "sms"
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaveMessage("Notification preferences saved successfully");
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage("Failed to save preferences. Please try again.");
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveMessage("An error occurred. Please try again.");
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const NotificationRow = ({
    title,
    description,
    category,
  }: {
    title: string;
    description: string;
    category: keyof NotificationPreferences;
  }) => (
    <div className="py-6 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="flex gap-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences[category].email}
              onChange={() => handleToggle(category, "email")}
              className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700 hidden sm:inline">Email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences[category].push}
              onChange={() => handleToggle(category, "push")}
              className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700 hidden sm:inline">Push</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences[category].sms}
              onChange={() => handleToggle(category, "sms")}
              className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700 hidden sm:inline">SMS</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Success message */}
      {saveMessage && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-900">{saveMessage}</p>
          </div>
        </div>
      )}

      {/* Contact info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h2 className="font-medium text-gray-900 mb-4">Email address</h2>
        <p className="text-gray-700 mb-2">{userEmail}</p>
        <p className="text-sm text-gray-600">We'll send notifications to this email address</p>
      </div>

      {/* Booking notifications */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Booking notifications</h2>
          <p className="text-gray-600">Stay informed about your desk bookings</p>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl">
          <div className="p-6">
            <div className="flex justify-end gap-8 mb-4 pb-4 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700 w-20 text-center">Email</span>
              <span className="text-sm font-medium text-gray-700 w-20 text-center">Push</span>
              <span className="text-sm font-medium text-gray-700 w-20 text-center">SMS</span>
            </div>

            <NotificationRow
              title="Booking confirmation"
              description="Get notified when your booking is confirmed"
              category="bookingConfirmation"
            />
            <NotificationRow
              title="Booking reminders"
              description="Receive reminders before your booking starts"
              category="bookingReminder"
            />
            <NotificationRow
              title="Cancellations"
              description="Get notified if a booking is cancelled"
              category="bookingCancellation"
            />
          </div>
        </div>
      </div>

      {/* Owner notifications */}
      {userRole === "OWNER" && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Hosting notifications</h2>
            <p className="text-gray-600">Manage notifications for your listed desks</p>
          </div>

          <div className="bg-white border border-gray-300 rounded-xl">
            <div className="p-6">
              <div className="flex justify-end gap-8 mb-4 pb-4 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700 w-20 text-center">Email</span>
                <span className="text-sm font-medium text-gray-700 w-20 text-center">Push</span>
                <span className="text-sm font-medium text-gray-700 w-20 text-center">SMS</span>
              </div>

              <NotificationRow
                title="New booking requests"
                description="Get notified when someone books your desk"
                category="newBookingRequest"
              />
              <NotificationRow
                title="Payment received"
                description="Receive notifications when you get paid"
                category="paymentReceived"
              />
              <NotificationRow
                title="Reviews"
                description="Get notified when renters leave reviews"
                category="reviewReceived"
              />
            </div>
          </div>
        </div>
      )}

      {/* General notifications */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">General notifications</h2>
          <p className="text-gray-600">Account activity and deskday news</p>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl">
          <div className="p-6">
            <div className="flex justify-end gap-8 mb-4 pb-4 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700 w-20 text-center">Email</span>
              <span className="text-sm font-medium text-gray-700 w-20 text-center">Push</span>
              <span className="text-sm font-medium text-gray-700 w-20 text-center">SMS</span>
            </div>

            <NotificationRow
              title="Account activity"
              description="Important updates about your account security and login activity"
              category="accountActivity"
            />
            <NotificationRow
              title="Promotions and tips"
              description="Receive special offers and helpful tips"
              category="promotionsAndTips"
            />
            <NotificationRow
              title="News and updates"
              description="Learn about new features and updates from deskday"
              category="newsAndUpdates"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
