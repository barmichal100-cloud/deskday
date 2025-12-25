"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationAutocomplete from "./LocationAutocomplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  initialLocation?: string;
  initialDate?: string;
};

export default function SearchForm({ initialLocation = "", initialDate = "" }: Props) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [date, setDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate ? new Date(initialDate) : null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build search URL with query parameters
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (date) params.set("date", date);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="flex flex-col md:flex-row md:items-center divide-y md:divide-y-0 md:divide-x divide-gray-300">
            {/* Where */}
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              label="Where"
              placeholder="Search destinations"
              variant="home"
            />

            {/* When */}
            <div className="flex-1 px-6 py-3">
              <label className="block text-xs font-semibold text-gray-900 mb-1 text-left">
                When
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  setSelectedDate(date);
                  setDate(date ? date.toISOString().split("T")[0] : "");
                }}
                minDate={new Date()}
                placeholderText="Select date"
                dateFormat="MMM d, yyyy"
                className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none cursor-pointer"
                calendarClassName="custom-datepicker"
                wrapperClassName="w-full"
                popperPlacement="bottom-start"
                preventOpenOnFocus={false}
              />
            </div>

            {/* Search button */}
            <div className="px-2 py-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full px-6 py-3 md:px-4 md:py-3 font-semibold transition shadow-md hover:shadow-lg w-full md:w-auto justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="md:hidden">Search</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
