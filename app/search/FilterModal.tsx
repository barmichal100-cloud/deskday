"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  activeFilterCount: number;
  currentFilter: string;
};

export default function FilterModal({ activeFilterCount, currentFilter }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current filters from URL
  const currentFilters = currentFilter.split(",").filter(Boolean);
  const [filterWifi, setFilterWifi] = useState(currentFilters.includes("wifi"));
  const [filterScreens, setFilterScreens] = useState(currentFilters.some(f => f.startsWith("screens:")));
  const [minScreens, setMinScreens] = useState(() => {
    const screensFilter = currentFilters.find(f => f.startsWith("screens:"));
    return screensFilter ? screensFilter.split(":")[1] : "1";
  });
  const [filterHdmi, setFilterHdmi] = useState(currentFilters.includes("hdmi"));
  const [filterKeyboard, setFilterKeyboard] = useState(currentFilters.includes("keyboard"));
  const [filterMouse, setFilterMouse] = useState(currentFilters.includes("mouse"));
  const [filterChair, setFilterChair] = useState(currentFilters.includes("chair"));

  // Price range filter (stored in agorot in URL, displayed in shekels in UI)
  const priceFilter = currentFilters.find(f => f.startsWith("price:"));
  const [minPrice, setMinPrice] = useState(() => {
    if (priceFilter) {
      const [min] = priceFilter.split(":")[1].split("-");
      // Convert from agorot to shekels
      return String(parseInt(min) / 100);
    }
    return "0";
  });
  const [maxPrice, setMaxPrice] = useState(() => {
    if (priceFilter) {
      const [, max] = priceFilter.split(":")[1].split("-");
      // Convert from agorot to shekels
      return String(parseInt(max) / 100);
    }
    return "1000";
  });

  function handleApplyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    const activeFilters: string[] = [];

    if (filterWifi) activeFilters.push("wifi");
    if (filterScreens) activeFilters.push(`screens:${minScreens || "1"}`);
    if (filterHdmi) activeFilters.push("hdmi");
    if (filterKeyboard) activeFilters.push("keyboard");
    if (filterMouse) activeFilters.push("mouse");
    if (filterChair) activeFilters.push("chair");

    // Add price range if not default (convert to agorot - multiply by 100)
    if (minPrice !== "0" || maxPrice !== "1000") {
      const minAgorot = parseInt(minPrice) * 100;
      const maxAgorot = parseInt(maxPrice) * 100;
      activeFilters.push(`price:${minAgorot}-${maxAgorot}`);
    }

    if (activeFilters.length === 0) {
      params.delete("filter");
    } else {
      params.set("filter", activeFilters.join(","));
    }

    const queryString = params.toString();
    const finalUrl = queryString ? `/search?${queryString}` : "/search";

    // Force a hard navigation with window.location to ensure the page reloads
    window.location.href = finalUrl;
  }

  function handleClearAll() {
    setFilterWifi(false);
    setFilterScreens(false);
    setMinScreens("1");
    setFilterHdmi(false);
    setFilterKeyboard(false);
    setFilterMouse(false);
    setFilterChair(false);
    setMinPrice("0");
    setMaxPrice("1000");
  }

  const hasPriceFilter = minPrice !== "0" || maxPrice !== "1000";
  const hasActiveFilters = filterWifi || filterScreens || filterHdmi || filterKeyboard || filterMouse || filterChair || hasPriceFilter;

  return (
    <>
      {/* Filters button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 hover:border-gray-900 transition"
      >
        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="text-sm font-semibold text-gray-900">Filters</span>
        {activeFilterCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-xs font-semibold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={handleClearAll}
                className="text-sm font-semibold text-gray-900 hover:underline"
              >
                Clear all
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Amenities</h3>

              <div className="space-y-3">
                {/* WiFi */}
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                    filterWifi
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filterWifi}
                    onChange={(e) => setFilterWifi(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">WiFi</span>
                  </div>
                </label>

                {/* Screens */}
                <div
                  className={`p-4 border-2 rounded-xl transition ${
                    filterScreens
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterScreens}
                      onChange={(e) => setFilterScreens(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Screens / Monitors</span>
                    </div>
                  </label>
                  {filterScreens && (
                    <div className="mt-3 ml-8">
                      <label className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Minimum:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={minScreens}
                          onChange={(e) => setMinScreens(e.target.value)}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* HDMI */}
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                    filterHdmi
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filterHdmi}
                    onChange={(e) => setFilterHdmi(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">HDMI Cable</span>
                  </div>
                </label>

                {/* Keyboard */}
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                    filterKeyboard
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filterKeyboard}
                    onChange={(e) => setFilterKeyboard(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Keyboard</span>
                  </div>
                </label>

                {/* Mouse */}
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                    filterMouse
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filterMouse}
                    onChange={(e) => setFilterMouse(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Mouse</span>
                  </div>
                </label>

                {/* Chair */}
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                    filterChair
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filterChair}
                    onChange={(e) => setFilterChair(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Ergonomic Chair</span>
                  </div>
                </label>
              </div>

              {/* Price Range */}
              <div className="mt-8">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Price Range</h3>
                <p className="text-sm text-gray-600 mb-6">Per day price, including all fees</p>

                {/* Histogram visualization */}
                <div className="mb-6 px-2">
                  <div className="flex items-end justify-between h-24 gap-0.5">
                    {[12, 18, 25, 35, 48, 62, 75, 88, 95, 100, 98, 92, 85, 78, 70, 65, 58, 52, 45, 38, 32, 28, 22, 18, 15, 12, 10, 8, 6, 4].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-rose-400 to-rose-500 rounded-t-sm transition-opacity"
                        style={{
                          height: `${height}%`,
                          opacity: i >= parseInt(minPrice || "0") / 35 && i <= parseInt(maxPrice || "1000") / 35 ? 1 : 0.2
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Range slider track */}
                <div className="relative mb-8">
                  <div className="h-1 bg-gray-200 rounded-full"></div>
                  <div
                    className="absolute h-1 bg-gray-900 rounded-full"
                    style={{
                      left: `${(parseInt(minPrice || "0") / 1000) * 100}%`,
                      right: `${100 - (parseInt(maxPrice || "1000") / 1000) * 100}%`
                    }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={minPrice}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val < parseInt(maxPrice || "1000")) {
                        setMinPrice(e.target.value);
                      }
                    }}
                    className="absolute top-0 left-0 w-full h-1 appearance-none bg-transparent pointer-events-auto cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-900 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-900 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={maxPrice}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > parseInt(minPrice || "0")) {
                        setMaxPrice(e.target.value);
                      }
                    }}
                    className="absolute top-0 left-0 w-full h-1 appearance-none bg-transparent pointer-events-auto cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-900 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-900 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
                  />
                </div>

                {/* Price inputs */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-2">Minimum</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-900 font-medium">₪</span>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="10"
                        value={minPrice}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val < parseInt(maxPrice || "1000")) {
                            setMinPrice(e.target.value);
                          }
                        }}
                        className="w-full rounded-xl border border-gray-300 pl-7 pr-3 py-3 text-sm font-medium focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      />
                    </div>
                  </div>

                  <div className="pt-6 text-gray-400">–</div>

                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-2">Maximum</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-900 font-medium">₪</span>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="10"
                        value={maxPrice}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val > parseInt(minPrice || "0")) {
                            setMaxPrice(e.target.value);
                          }
                        }}
                        className="w-full rounded-xl border border-gray-300 pl-7 pr-3 py-3 text-sm font-medium focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handleClearAll}
                className="text-sm font-semibold text-gray-900 hover:underline"
              >
                Clear all
              </button>
              <button
                onClick={handleApplyFilters}
                className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
