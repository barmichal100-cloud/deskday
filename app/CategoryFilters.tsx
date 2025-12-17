"use client";

import { useRouter, useSearchParams } from "next/navigation";

type FilterCategory = "all" | "monitors" | "wifi" | "hdmi" | "chair";

export default function CategoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = (searchParams.get("filter") || "all") as FilterCategory;

  function handleFilterClick(filter: FilterCategory) {
    const params = new URLSearchParams(searchParams.toString());

    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  }

  const isActive = (filter: FilterCategory) => currentFilter === filter;

  return (
    <section className="px-6 lg:px-20 pb-6 border-b border-gray-200">
      <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => handleFilterClick("all")}
          className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg transition flex-shrink-0 ${
            isActive("all")
              ? "bg-gray-100 border-b-2 border-gray-900"
              : "hover:bg-gray-50"
          }`}
        >
          <svg className={`w-6 h-6 ${isActive("all") ? "text-gray-900" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className={`text-xs font-medium ${isActive("all") ? "text-gray-900" : "text-gray-700"}`}>All desks</span>
        </button>
        <button
          onClick={() => handleFilterClick("monitors")}
          className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg transition flex-shrink-0 ${
            isActive("monitors")
              ? "bg-gray-100 border-b-2 border-gray-900"
              : "hover:bg-gray-50"
          }`}
        >
          <svg className={`w-6 h-6 ${isActive("monitors") ? "text-gray-900" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className={`text-xs font-medium ${isActive("monitors") ? "text-gray-900" : "text-gray-700"}`}>With monitors</span>
        </button>
        <button
          onClick={() => handleFilterClick("wifi")}
          className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg transition flex-shrink-0 ${
            isActive("wifi")
              ? "bg-gray-100 border-b-2 border-gray-900"
              : "hover:bg-gray-50"
          }`}
        >
          <svg className={`w-6 h-6 ${isActive("wifi") ? "text-gray-900" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <span className={`text-xs font-medium ${isActive("wifi") ? "text-gray-900" : "text-gray-700"}`}>WiFi</span>
        </button>
        <button
          onClick={() => handleFilterClick("hdmi")}
          className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg transition flex-shrink-0 ${
            isActive("hdmi")
              ? "bg-gray-100 border-b-2 border-gray-900"
              : "hover:bg-gray-50"
          }`}
        >
          <svg className={`w-6 h-6 ${isActive("hdmi") ? "text-gray-900" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className={`text-xs font-medium ${isActive("hdmi") ? "text-gray-900" : "text-gray-700"}`}>HDMI</span>
        </button>
        <button
          onClick={() => handleFilterClick("chair")}
          className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg transition flex-shrink-0 ${
            isActive("chair")
              ? "bg-gray-100 border-b-2 border-gray-900"
              : "hover:bg-gray-50"
          }`}
        >
          <svg className={`w-6 h-6 ${isActive("chair") ? "text-gray-900" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className={`text-xs font-medium ${isActive("chair") ? "text-gray-900" : "text-gray-700"}`}>Ergonomic chair</span>
        </button>
      </div>
    </section>
  );
}
