import { apiError, json, withApi } from '@/lib/api.server';
import { matchAirportByText } from '@/lib/airports';
import { houseNumberInText, isStreetQuery, lookupStreetAddress, parseAddressIntent } from '@/lib/address.server';
import { isServiceState, serviceStateAbbr } from '@/lib/service-area';

type PhotonProperties = {
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

type PhotonHit = { formattedAddress: string; lat: number; lng: number };

/**
 * Free address verification via Photon (OpenStreetMap data) — no API key.
 * Resolves a typed address to its canonical form and coordinates so full
 * street addresses verify even without a working Google Maps key.
 */
async function photonLookup(address: string, signal?: AbortSignal): Promise<PhotonHit | null> {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&lang=en`,
      { signal, headers: { 'User-Agent': UA } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: PhotonFeature[] };
    // Service area: only New York / New Jersey / Connecticut results verify.
    const f = data.features?.find((feature) => serviceStateAbbr(feature.properties?.state));
    const coords = f?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    const p = f?.properties ?? {};
    const street = [p.housenumber, p.street].filter(Boolean).join(' ') || p.name || '';
    const city = p.city || p.district || p.county || '';
    const secondary = [[p.postcode, city].filter(Boolean).join(' '), p.state, p.country]
      .filter(Boolean)
      .join(', ');
    const formatted = [street, secondary].filter(Boolean).join(', ');
    if (!formatted) return null;
    return { formattedAddress: formatted, lat: coords[1], lng: coords[0] };
  } catch {
    return null;
  }
}

/**
 * GET /api/geocode?address=...
 *
 * Address verification: resolves a typed or selected address to a real
 * geocoded location. Street addresses are matched only when the house number,
 * street, city, and state agree — a different place is not returned as
 * verified. Airports resolve from the local database. Google, then Photon,
 * still cover landmarks when no street number was typed. Public and
 * cacheable — the result for a given address is the same for every caller.
 */
export const loader = withApi(async ({ request }) => {
  const url = new URL(request.url);
  const address = (url.searchParams.get('address') ?? url.searchParams.get('q') ?? '').trim();
  const key = process.env.GOOGLE_MAPS_API_KEY;

  if (!address) {
    return apiError(422, 'address query param is required');
  }

  const intent = parseAddressIntent(address);
  const streetLike = isStreetQuery(intent);

  // Street addresses verify through Census/ArcGIS with a relevance check, so
  // "30 25 71st east Elmhurst" becomes 30-25 71st Street, East Elmhurst and a
  // different house or street is never returned as verified.
  if (streetLike) {
    const hit = await lookupStreetAddress(address, request.signal);
    if (hit) {
      return json({
        verified: true,
        configured: true,
        source: hit.source,
        formattedAddress: hit.formattedAddress,
        lat: hit.lat,
        lng: hit.lng,
        locationType: 'ROOFTOP',
      });
    }
    // Strict street matching found nothing — fall through to the general
    // Google/Photon lookup below, gated by a house-number check so a
    // different address is never returned as verified.
  }

  // Airport DB first (instant, no network): a suggestion chosen from the
  // autocomplete list ("LGA — LaGuardia, New York, USA") or a typed landmark
  // like "Laguardia airport" verifies immediately with the airport's real
  // coordinates, so airport selections never depend on Google/Photon.
  const airport = matchAirportByText(address);
  if (airport) {
    return json({
      verified: true,
      configured: true,
      formattedAddress: `${airport.code} — ${airport.name}, ${airport.city}, ${airport.country}`,
      lat: airport.lat,
      lng: airport.lng,
      locationType: 'airport',
    });
  }

  if (key) {
    try {
      const upstream = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`,
        { signal: request.signal },
      );
      if (!upstream.ok) {
        throw new Error(`geocode failed: ${upstream.status} ${upstream.statusText}`);
      }

      const data = (await upstream.json()) as {
        status?: string;
        results?: {
          formatted_address?: string;
          address_components?: { short_name?: string; types?: string[] }[];
          geometry?: { location?: { lat: number; lng: number }; location_type?: string };
        }[];
      };
      const result = data.results?.[0];
      const state = result?.address_components?.find(c => c.types?.includes('administrative_area_level_1'))?.short_name;
      // Service area: only New York / New Jersey / Connecticut results verify.
      // For street queries, the result must also carry the typed house number
      // so a different address is never returned as verified.
      if (
        data.status === 'OK' &&
        result &&
        isServiceState(state) &&
        (!streetLike || houseNumberInText(result.formatted_address ?? '', intent.house))
      ) {
        return json({
          verified: true,
          configured: true,
          formattedAddress: result.formatted_address ?? '',
          lat: result.geometry?.location?.lat,
          lng: result.geometry?.location?.lng,
          locationType: result.geometry?.location_type ?? '',
        });
      }
      // Google found nothing (or denied the key) — fall through to Photon.
    } catch (err) {
      // A hard upstream failure should surface, but a denied key should not
      // block verification — only rethrow when Google itself errored.
      if (err instanceof Error && err.message.startsWith('geocode failed:')) throw err;
    }
  }

  // Photon fallback — works with or without a Google key, so fully typed
  // street addresses always verify and normalize. For street queries, the
  // result must carry the typed house number so a different address is never
  // returned as verified.
  const hit = await photonLookup(address, request.signal);
  if (hit && (!streetLike || houseNumberInText(hit.formattedAddress, intent.house))) {
    return json({
      verified: true,
      configured: true,
      source: 'photon',
      formattedAddress: hit.formattedAddress,
      lat: hit.lat,
      lng: hit.lng,
    });
  }

  return json({ verified: false, configured: true });
});
