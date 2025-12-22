"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  currentLocale: "EN" | "HE";
};

export default function LanguageCurrencySelector({ currentLocale }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<"EN" | "HE">(currentLocale);
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = async (locale: "EN" | "HE") => {
    if (locale === selectedLocale || isSaving) return;

    setIsSaving(true);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferredLocale: locale }),
      });

      if (response.ok) {
        setSelectedLocale(locale);
        setIsOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating language:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span>{selectedLocale === "EN" ? "English" : "עברית"}</span>
        <span className="text-gray-500">· ILS</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
          {/* Language section */}
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Language
            </p>
            <button
              onClick={() => handleLanguageChange("EN")}
              disabled={isSaving}
              className={`w-full px-3 py-2 text-left text-sm rounded-lg transition flex items-center justify-between ${
                selectedLocale === "EN"
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              <span>English</span>
              {selectedLocale === "EN" && (
                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => handleLanguageChange("HE")}
              disabled={isSaving}
              className={`w-full px-3 py-2 text-left text-sm rounded-lg transition flex items-center justify-between mt-1 ${
                selectedLocale === "HE"
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              <span>עברית</span>
              {selectedLocale === "HE" && (
                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="border-t border-gray-200 my-2"></div>

          {/* Currency section */}
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Currency
            </p>
            <div className="px-3 py-2 text-sm text-gray-700 flex items-center justify-between">
              <span>ILS (₪)</span>
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              More currencies coming soon
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
