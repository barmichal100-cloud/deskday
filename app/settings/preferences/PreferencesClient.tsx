"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  currentLocale: "EN" | "HE";
};

export default function PreferencesClient({ currentLocale }: Props) {
  const router = useRouter();
  const [selectedLocale, setSelectedLocale] = useState<"EN" | "HE">(currentLocale);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const languages = [
    {
      code: "EN" as const,
      name: "English",
      nativeName: "English",
    },
    {
      code: "HE" as const,
      name: "Hebrew",
      nativeName: "עברית",
    },
  ];

  const handleSave = async () => {
    if (selectedLocale === currentLocale) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferredLocale: selectedLocale }),
      });

      if (response.ok) {
        setSaveMessage("Language preference saved successfully");
        setTimeout(() => {
          setSaveMessage(null);
          router.refresh();
        }, 2000);
      } else {
        setSaveMessage("Failed to save preference. Please try again.");
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error("Error saving preference:", error);
      setSaveMessage("An error occurred. Please try again.");
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-lg border ${
            saveMessage.includes("success")
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className={`w-5 h-5 flex-shrink-0 ${
                saveMessage.includes("success") ? "text-green-600" : "text-red-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p
              className={`text-sm font-medium ${
                saveMessage.includes("success") ? "text-green-900" : "text-red-900"
              }`}
            >
              {saveMessage}
            </p>
          </div>
        </div>
      )}

      {/* Language Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Language</h2>
        <p className="text-gray-600 mb-6">
          Choose your preferred language for the deskday interface
        </p>

        <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
          {languages.map((language, index) => (
            <button
              key={language.code}
              onClick={() => setSelectedLocale(language.code)}
              className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition ${
                index !== languages.length - 1 ? "border-b border-gray-200" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="font-medium text-gray-900">{language.name}</p>
                  <p className="text-sm text-gray-600">{language.nativeName}</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedLocale === language.code
                    ? "border-gray-900 bg-gray-900"
                    : "border-gray-300"
                }`}
              >
                {selectedLocale === language.code && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Currency Section (Coming Soon) */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Currency</h2>
        <p className="text-gray-600 mb-6">Choose your preferred currency</p>

        <div className="bg-white border border-gray-300 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">ILS (₪)</p>
              <p className="text-sm text-gray-600">Israeli New Shekel</p>
            </div>
            <span className="text-sm text-gray-500">Default</span>
          </div>
        </div>
      </div>

      {/* Timezone Section (Coming Soon) */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Timezone</h2>
        <p className="text-gray-600 mb-6">
          Automatically detect or set your timezone
        </p>

        <div className="bg-white border border-gray-300 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Asia/Jerusalem</p>
              <p className="text-sm text-gray-600">
                Israel Standard Time (GMT+2)
              </p>
            </div>
            <span className="text-sm text-gray-500">Auto-detected</span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving || selectedLocale === currentLocale}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
