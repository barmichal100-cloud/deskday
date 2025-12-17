"use client";

import { useState, useEffect } from "react";

type Props = {
  desks: any[];
  onFilteredDesksChange: (desks: any[]) => void;
};

export default function SearchFilters({ desks, onFilteredDesksChange }: Props) {
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterScreens, setFilterScreens] = useState(false);
  const [minScreens, setMinScreens] = useState("");
  const [filterHdmi, setFilterHdmi] = useState(false);
  const [filterKeyboard, setFilterKeyboard] = useState(false);
  const [filterMouse, setFilterMouse] = useState(false);
  const [filterChair, setFilterChair] = useState(false);

  // Apply filters whenever any filter state changes
  useEffect(() => {
    let filtered = [...desks];

    if (filterWifi) {
      filtered = filtered.filter((desk) => desk.amenities?.wifi === true);
    }

    if (filterScreens) {
      const minCount = parseInt(minScreens) || 1;
      filtered = filtered.filter((desk) => (desk.amenities?.screens || 0) >= minCount);
    }

    if (filterHdmi) {
      filtered = filtered.filter((desk) => desk.amenities?.hdmi === true);
    }

    if (filterKeyboard) {
      filtered = filtered.filter((desk) => desk.amenities?.keyboard === true);
    }

    if (filterMouse) {
      filtered = filtered.filter((desk) => desk.amenities?.mouse === true);
    }

    if (filterChair) {
      filtered = filtered.filter((desk) => desk.amenities?.chair === true);
    }

    onFilteredDesksChange(filtered);
  }, [desks, filterWifi, filterScreens, minScreens, filterHdmi, filterKeyboard, filterMouse, filterChair, onFilteredDesksChange]);

  const clearFilters = () => {
    setFilterWifi(false);
    setFilterScreens(false);
    setMinScreens("");
    setFilterHdmi(false);
    setFilterKeyboard(false);
    setFilterMouse(false);
    setFilterChair(false);
  };

  const hasActiveFilters = filterWifi || filterScreens || filterHdmi || filterKeyboard || filterMouse || filterChair;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-rose-500 hover:text-rose-600 font-semibold transition"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterWifi}
            onChange={(e) => setFilterWifi(e.target.checked)}
            className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          <span className="text-sm text-gray-700">WiFi</span>
        </label>

        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterScreens}
              onChange={(e) => setFilterScreens(e.target.checked)}
              className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-700">Screens</span>
          </label>
          {filterScreens && (
            <input
              type="number"
              min="1"
              value={minScreens}
              onChange={(e) => setMinScreens(e.target.value)}
              placeholder="Min"
              className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterHdmi}
            onChange={(e) => setFilterHdmi(e.target.checked)}
            className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          <span className="text-sm text-gray-700">HDMI</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterKeyboard}
            onChange={(e) => setFilterKeyboard(e.target.checked)}
            className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          <span className="text-sm text-gray-700">Keyboard</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterMouse}
            onChange={(e) => setFilterMouse(e.target.checked)}
            className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          <span className="text-sm text-gray-700">Mouse</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterChair}
            onChange={(e) => setFilterChair(e.target.checked)}
            className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          <span className="text-sm text-gray-700">Chair</span>
        </label>
      </div>
    </div>
  );
}
