import { json, withApi } from '@/lib/api.server';
import { matchAirports, type AutocompleteSuggestion } from '@/lib/airports';
import { isStreetQuery, parseAddressIntent, suggestStreetAddresses } from '@/lib/address.server';
import { isServiceState, serviceStateAbbr, serviceStateFromText } from '@/lib/service-area';

type GooglePrediction = {
  place_id?: string;
  description?: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
  types?: string[];
};

type PhotonProperties = {
  osm_id?: number;
  name?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProperties;
};

const UA = 'BJKLimoRideBook/1.0 (ride-booking; contact@bjklimo.local)';

/** Build a readable "123 Main St" + "City, ST 10001, Country" pair from Photon properties. */
function formatPhotonParts(p: PhotonProperties): { main: string; secondary: string } {
  const street = [p.housenumber, p.street].filter(Boolean).join(' ') || p.name || '';
  const city = p.city || p.district || p.county || '';
  const secondary = [[p.postcode, city].filter(Boolean).join(' '), p.state, p.country]
    .filter(Boolean)
    .join(', ');
  return { main: street, secondary };
}

/**
 * Free worldwide address autocomplete (OpenStreetMap data via Photon).
 * No API key required, so full street addresses always resolve to live
 * suggestions — even when no Google Maps key is configured or Google denies
 * the key. Returns up to 6 suggestions.
 */
async function photonSuggestions(input: string, signal?: AbortSignal): Promise<AutocompleteSuggestion[]> {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=6&lang=en`,
      { signal, headers: { 'User-Agent': UA } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };
    const out: AutocompleteSuggestion[] = [];
    const seenPlaceIds = new Set<string>();
    for (const f of data.features ?? []) {
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;
      // Service area: only New York / New Jersey / Connecticut results.
      if (!serviceStateAbbr(f.properties?.state)) continue;
      const { main, secondary } = formatPhotonParts(f.properties ?? {});
      const description = [main, secondary].filter(Boolean).join(', ');
      if (!description) continue;
      // Photon can return multiple POIs at the exact same coordinate (e.g. a
      // building + a business). Dedupe by coordinate so we never emit two
      // suggestions that share a placeId — that produced duplicate React keys
      // in the autocomplete list.
      const placeId = `photon:${coords[0]},${coords[1]}`;
      if (seenPlaceIds.has(placeId)) continue;
      seenPlaceIds.add(placeId);
      out.push({
        placeId,
        description,
        main,
        secondary,
        lat: coords[1],
        lng: coords[0],
        type: 'place' as const,
      });
    }
    return out.slice(0, 6);
  } catch {
    // Network blip or abort — caller falls back to the airport database.
    return [];
  }
}

/**
 * GET /api/places-autocomplete?input=...
 *
 * Live address autocomplete. A typed street address is normalized (so
 * "30 25 71st east Elmhurst" can resolve to 30-25 71st Street, East Elmhurst)
 * and only suggestions that share that house number, street, city, and state
 * are returned — a different address is never offered as a match.
 * Airport and landmark searches ("Laguardia") still lead with the airport
 * database. The Maps key never reaches the browser.
 */
export const loader = withApi(async ({ request }) => {
  const url = new URL(request.url);
  const input = (url.searchParams.get('input') ?? '').trim();
  const configured = Boolean(process.env.GOOGLE_MAPS_API_KEY);

  if (input.length < 2) {
    return json({ suggestions: [] as AutocompleteSuggestion[], configured, source: 'none' });
  }

  const intent = parseAddressIntent(input);
  // Service area: the typed state is outside New York / New Jersey /
  // Connecticut — say so instead of offering unrelated places.
  if (intent.state && !isServiceState(intent.state)) {
    return json({ suggestions: [] as AutocompleteSuggestion[], configured, source: 'none', outOfArea: true });
  }
  // Airport and landmark matches lead the list, so a search like "Laguardia"
  // surfaces "LGA · LaGuardia" even when Google/Photon return nothing.
  const airportSuggestions = matchAirports(input, 3);

  const merge = (places: AutocompleteSuggestion[]): AutocompleteSuggestion[] => {
    const merged = [...airportSuggestions];
    for (const p of places) {
      if (merged.length >= 6) break;
      const dupe = merged.some(
        m => m.description.toLowerCase() === p.description.toLowerCase(),
      );
      if (!dupe) merged.push(p);
    }
    return merged.slice(0, 6);
  };

  if (isStreetQuery(intent)) {
    const suggestions = await suggestStreetAddresses(input, request.signal);
    if (suggestions.length > 0) {
      return json({
        suggestions,
        configured,
        source: 'street',
      });
    }
    // Strict street matching found nothing — fall back to general Photon
    // search (service-area filtered) so the customer still sees relevant
    // New York / New Jersey / Connecticut address suggestions instead of an
    // empty list. The customer picks the right one from the list.
    const photon = await photonSuggestions(input, request.signal);
    return json({
      suggestions: merge(photon),
      configured,
      source: photon.length ? 'photon' : airportSuggestions.length ? 'airports' : 'none',
    });
  }

  // 1. Google Places, when the key is configured and allowed.
  if (configured) {
    const key = process.env.GOOGLE_MAPS_API_KEY as string;
    try {
      const upstream = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${key}&types=geocode&language=en`,
        { signal: request.signal },
      );

      if (upstream.ok) {
        const data = (await upstream.json()) as { predictions?: GooglePrediction[]; status?: string };

        // Service area: drop predictions outside New York / New Jersey /
        // Connecticut so a different area is never offered.
        const suggestions: AutocompleteSuggestion[] = (data.predictions ?? [])
          .filter(p => serviceStateFromText(p.description ?? ''))
          .slice(0, 6)
          .map(p => ({
            placeId: p.place_id ?? '',
            description: p.description ?? '',
            main: p.structured_formatting?.main_text ?? '',
            secondary: p.structured_formatting?.secondary_text ?? '',
            type: 'place' as const,
          }));

        if (suggestions.length > 0 || airportSuggestions.length > 0) {
          return json({
            suggestions: merge(suggestions),
            configured,
            source: 'google',
          });
        }
        // Google returned no predictions (key denied/billing disabled). Fall
        // through to Photon below.
      }
    } catch {
      // Network blip or abort — fall through to Photon.
    }
  }

  // 2. Photon (OpenStreetMap) — free, no key. This is what makes full street
  // addresses resolve reliably even without a working Google key.
  const photon = await photonSuggestions(input, request.signal);
  if (photon.length > 0 || airportSuggestions.length > 0) {
    return json({
      suggestions: merge(photon),
      configured,
      source: photon.length > 0 ? 'photon' : 'airports',
    });
  }

  // 3. Airport database fallback (no key, Photon miss, or airport search).
  return json({ suggestions: matchAirports(input), configured, source: 'airports' });
});
