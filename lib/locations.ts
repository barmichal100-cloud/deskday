export type LocationItem = {
    city: string;
    country: string;
  };
  
  export const ALLOWED_LOCATIONS: LocationItem[] = [
    { city: "Tel Aviv", country: "Israel" },
    { city: "Jerusalem", country: "Israel" },
    { city: "Haifa", country: "Israel" },
    { city: "Rishon LeZion", country: "Israel" },
    { city: "Herzliya", country: "Israel" },
    // 👉 Later: expand this list, or load from a DB / external dataset
  ];
  
  export function formatLocation(item: LocationItem): string {
    return `${item.city}, ${item.country}`;
  }
  