import { NextResponse } from 'next/server';

type NominatimResult = {
  place_id?: number;
  display_name?: string;
  address?: Record<string, any>;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    if (!q) return NextResponse.json([]);

    // Request English labels for predictable display and increase results so short fragments return more candidates
    const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      q
    )}&addressdetails=1&limit=50&accept-language=en`;

    const res = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        // Provide a User-Agent as recommended by Nominatim usage policy
        'User-Agent': 'deskday/1.0 (https://github.com/your-repo)'
      }
    });
    if (!res.ok) return NextResponse.json([]);

    const data: NominatimResult[] = await res.json();

    // Convert Nominatim results into a lightweight feature shape similar to Mapbox
    // Keep only city/town/village/hamlet results or country results, and dedupe by city+country.
    const seen = new Set<string>();
    const features = data
      .map((item, idx) => {
        const address = item.address || {};
        // broaden accepted fields so we catch towns/localities/municipalities as city-like
        const city =
          address.city || address.town || address.village || address.hamlet || address.locality || address.municipality || address.county || '';
        const country = address.country || '';
        const type = (item as any).type || '';
        const klass = (item as any).class || '';

        // Accept if we have a city-like field OR the result is a country-type
        const isCity = !!city;
        const isCountry = type === 'country' || (klass === 'boundary' && type === 'administrative' && !!country && !city);

        // In addition, for short fragment queries allow items whose display_name contains the
        // query if they are place/boundary-like (helps 'tel' find Tel.. matches globally).
        let allowByName = false;
        try {
          const qLower = String(q).toLowerCase();
          const displayLower = String(item.display_name || '').toLowerCase();
          if (displayLower.includes(qLower) && (klass === 'place' || klass === 'boundary')) allowByName = true;
        } catch {
          allowByName = false;
        }

        if (!isCity && !isCountry && !allowByName) return null;

        // Normalize label: prefer "City, Country" or just "Country"
        const label = isCity ? `${city}${country ? ', ' + country : ''}` : country;
        const key = `${city || country}|${country}`;
        if (seen.has(key)) return null;
        seen.add(key);

        return {
          id: item.place_id ?? `nominatim-${idx}`,
          text: city || country,
          place_name: label,
          context: country ? [{ id: `country.${country}`, text: country }] : []
        };
      })
      .filter(Boolean);

    // If Nominatim returned results but none of them contain the query as a substring
    // in the label or city, try a Photon fallback which tends to provide stronger
    // prefix / partial matching for place names.
    const qLower = String(q).toLowerCase();
    const hasTokenMatch = features.some((f) => String(f.place_name || f.text || '').toLowerCase().includes(qLower));

    if (!hasTokenMatch) {
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=50&lang=en`;
        const r2 = await fetch(photonUrl, { headers: { Accept: 'application/json', 'User-Agent': 'deskday/1.0 (https://github.com/your-repo)' } });
        if (r2.ok) {
          const photon = await r2.json();
          if (Array.isArray(photon.features)) {
            for (const f of photon.features) {
              try {
                const props = f.properties || {};
                const city = props.city || props.name || props.town || props.village || '';
                const country = props.country || '';
                if (!city && !country) continue;
                const label = city ? `${city}${country ? ', ' + country : ''}` : country;
                const key = `${city || country}|${country}`;
                if (seen.has(key)) continue;
                seen.add(key);
                features.push({ id: props.osm_id ?? `ph-${Math.random().toString(36).slice(2,8)}`, text: city || country, place_name: label, context: country ? [{ id: `country.${country}`, text: country }] : [] });
              } catch (_) {
                // ignore malformed photon item
              }
            }
          }
        }
      } catch (err) {
        // if photon fails, it's not fatal — we'll just return whatever matches we have
        console.warn('photon fallback failed', err);
      }
    }

    return NextResponse.json(features);
  } catch (err) {
    console.error('geocode proxy error', err);
    return NextResponse.json([]);
  }
}
