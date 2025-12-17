"use client";

import { useState } from "react";
import SearchFilters from "./SearchFilters";
import DeskCard from "../DeskCard";

type Props = {
  initialDesks: any[];
  date: string;
  location: string;
};

export default function SearchResults({ initialDesks, date, location }: Props) {
  const [filteredDesks, setFilteredDesks] = useState(initialDesks);

  return (
    <>
      <SearchFilters desks={initialDesks} onFilteredDesksChange={setFilteredDesks} />

      {filteredDesks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No desks match your filters</h2>
          <p className="text-sm text-gray-600 mb-4">
            Try adjusting your filter criteria to see more results.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-5">
            {filteredDesks.length} desk{filteredDesks.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDesks.map((desk) => (
              <DeskCard key={desk.id} desk={desk} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
