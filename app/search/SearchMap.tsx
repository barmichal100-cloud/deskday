"use client";

type Props = {
  desks: any[];
};

export default function SearchMap({ desks }: Props) {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Map View</h3>
        <p className="text-sm text-gray-600 mb-4">
          Showing {desks.length} desk{desks.length !== 1 ? "s" : ""} on the map
        </p>
        <p className="text-xs text-gray-500">
          Interactive map coming soon
        </p>
      </div>
    </div>
  );
}
