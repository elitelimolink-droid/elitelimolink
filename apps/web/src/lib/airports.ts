// Static airport database used for offline airport-code validation and as the
// autocomplete fallback when no Google Maps API key is configured. Each entry
// holds the IATA code, airport name, city, country, and approximate coordinates
// (lat/lng) so the distance fallback can produce a straight-line estimate.
//
// Only airports inside the NY / NJ / CT service area are ever offered or
// resolved — see serviceAreaAirports below.

import { SERVICE_AREA_AIRPORT_CODES } from '@/lib/service-area';

export type Airport = {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

export const airports: Airport[] = [
  { code: "JFK", name: "John F. Kennedy Intl", city: "New York", country: "USA", lat: 40.6413, lng: -73.7781 },
  { code: "LGA", name: "LaGuardia", city: "New York", country: "USA", lat: 40.7769, lng: -73.874 },
  { code: "EWR", name: "Newark Liberty Intl", city: "Newark", country: "USA", lat: 40.6895, lng: -74.1745 },
  { code: "HPN", name: "Westchester County Airport", city: "White Plains", country: "USA", lat: 41.067, lng: -73.7076 },
  { code: "ISP", name: "Long Island MacArthur", city: "Islip", country: "USA", lat: 40.7951, lng: -73.1003 },
  { code: "FRG", name: "Republic Airport", city: "Farmingdale", country: "USA", lat: 40.7271, lng: -73.4127 },
  { code: "SWF", name: "Stewart Intl", city: "New Windsor", country: "USA", lat: 41.5041, lng: -74.1044 },
  { code: "TEB", name: "Teterboro Airport", city: "Teterboro", country: "USA", lat: 40.8501, lng: -74.0608 },
  { code: "MMU", name: "Morristown Municipal", city: "Morristown", country: "USA", lat: 40.7993, lng: -74.4149 },
  { code: "BDL", name: "Bradley Intl", city: "Hartford", country: "USA", lat: 41.9389, lng: -72.6832 },
  { code: "HVN", name: "Tweed–New Haven", city: "New Haven", country: "USA", lat: 41.2637, lng: -72.8868 },
  { code: "LAX", name: "Los Angeles Intl", city: "Los Angeles", country: "USA", lat: 33.9416, lng: -118.4085 },
  { code: "SFO", name: "San Francisco Intl", city: "San Francisco", country: "USA", lat: 37.6213, lng: -122.379 },
  { code: "OAK", name: "Oakland Intl", city: "Oakland", country: "USA", lat: 37.7126, lng: -122.2197 },
  { code: "SJC", name: "San Jose Intl", city: "San Jose", country: "USA", lat: 37.3639, lng: -121.9289 },
  { code: "ORD", name: "O'Hare Intl", city: "Chicago", country: "USA", lat: 41.9742, lng: -87.9073 },
  { code: "MDW", name: "Midway Intl", city: "Chicago", country: "USA", lat: 41.7868, lng: -87.7522 },
  { code: "ATL", name: "Hartsfield–Jackson Intl", city: "Atlanta", country: "USA", lat: 33.6407, lng: -84.4277 },
  { code: "DFW", name: "Dallas/Fort Worth Intl", city: "Dallas", country: "USA", lat: 32.8998, lng: -97.0403 },
  { code: "DAL", name: "Dallas Love Field", city: "Dallas", country: "USA", lat: 32.8471, lng: -96.8517 },
  { code: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "USA", lat: 29.9844, lng: -95.3414 },
  { code: "HOU", name: "William P. Hobby", city: "Houston", country: "USA", lat: 29.6454, lng: -95.2789 },
  { code: "MIA", name: "Miami Intl", city: "Miami", country: "USA", lat: 25.7959, lng: -80.287 },
  { code: "FLL", name: "Fort Lauderdale–Hollywood Intl", city: "Fort Lauderdale", country: "USA", lat: 26.0742, lng: -80.1506 },
  { code: "PHL", name: "Philadelphia Intl", city: "Philadelphia", country: "USA", lat: 39.8744, lng: -75.2424 },
  { code: "BOS", name: "Boston Logan Intl", city: "Boston", country: "USA", lat: 42.3656, lng: -71.0096 },
  { code: "DCA", name: "Ronald Reagan Washington Natl", city: "Washington", country: "USA", lat: 38.8512, lng: -77.0402 },
  { code: "IAD", name: "Washington Dulles Intl", city: "Washington", country: "USA", lat: 38.9531, lng: -77.4565 },
  { code: "BWI", name: "Baltimore/Washington Intl", city: "Baltimore", country: "USA", lat: 39.1754, lng: -76.6683 },
  { code: "PHX", name: "Phoenix Sky Harbor Intl", city: "Phoenix", country: "USA", lat: 33.4342, lng: -112.0116 },
  { code: "LAS", name: "Harry Reid Intl", city: "Las Vegas", country: "USA", lat: 36.084, lng: -115.1537 },
  { code: "DEN", name: "Denver Intl", city: "Denver", country: "USA", lat: 39.8561, lng: -104.6737 },
  { code: "MSP", name: "Minneapolis–St. Paul Intl", city: "Minneapolis", country: "USA", lat: 44.8848, lng: -93.2223 },
  { code: "DTW", name: "Detroit Metro", city: "Detroit", country: "USA", lat: 42.2162, lng: -83.3554 },
  { code: "CLT", name: "Charlotte Douglas Intl", city: "Charlotte", country: "USA", lat: 35.214, lng: -80.9431 },
  { code: "MCO", name: "Orlando Intl", city: "Orlando", country: "USA", lat: 28.4312, lng: -81.3081 },
  { code: "TPA", name: "Tampa Intl", city: "Tampa", country: "USA", lat: 27.9755, lng: -82.5332 },
  { code: "FLL", name: "Fort Lauderdale Intl", city: "Fort Lauderdale", country: "USA", lat: 26.0742, lng: -80.1506 },
  { code: "AUS", name: "Austin–Bergstrom Intl", city: "Austin", country: "USA", lat: 30.1975, lng: -97.6664 },
  { code: "SAN", name: "San Diego Intl", city: "San Diego", country: "USA", lat: 32.7338, lng: -117.1933 },
  { code: "PDX", name: "Portland Intl", city: "Portland", country: "USA", lat: 45.5887, lng: -122.5975 },
  { code: "SEA", name: "Seattle–Tacoma Intl", city: "Seattle", country: "USA", lat: 47.4502, lng: -122.3088 },
  { code: "SLC", name: "Salt Lake City Intl", city: "Salt Lake City", country: "USA", lat: 40.7899, lng: -111.9791 },
  { code: "STL", name: "St. Louis Lambert Intl", city: "St. Louis", country: "USA", lat: 38.7487, lng: -90.37 },
  { code: "BNA", name: "Nashville Intl", city: "Nashville", country: "USA", lat: 36.1245, lng: -86.6782 },
  { code: "MSY", name: "Louis Armstrong New Orleans Intl", city: "New Orleans", country: "USA", lat: 29.9934, lng: -90.258 },
  { code: "RDU", name: "Raleigh–Durham Intl", city: "Raleigh", country: "USA", lat: 35.8776, lng: -78.7875 },
  { code: "JAX", name: "Jacksonville Intl", city: "Jacksonville", country: "USA", lat: 30.4941, lng: -81.6879 },
  { code: "MEM", name: "Memphis Intl", city: "Memphis", country: "USA", lat: 35.0424, lng: -89.9767 },
  { code: "IND", name: "Indianapolis Intl", city: "Indianapolis", country: "USA", lat: 39.7173, lng: -86.2944 },
  { code: "CLE", name: "Cleveland Hopkins Intl", city: "Cleveland", country: "USA", lat: 41.4117, lng: -81.8498 },
  { code: "PIT", name: "Pittsburgh Intl", city: "Pittsburgh", country: "USA", lat: 40.4915, lng: -80.2329 },
  { code: "CVG", name: "Cincinnati/Northern Kentucky Intl", city: "Cincinnati", country: "USA", lat: 39.0488, lng: -84.6678 },
  { code: "MKE", name: "Milwaukee Mitchell Intl", city: "Milwaukee", country: "USA", lat: 42.9472, lng: -87.8966 },
  { code: "KCI", name: "Kansas City Intl", city: "Kansas City", country: "USA", lat: 39.2976, lng: -94.7139 },
  { code: "ABQ", name: "Albuquerque Intl Sunport", city: "Albuquerque", country: "USA", lat: 35.0405, lng: -106.609 },
  { code: "HNL", name: "Daniel K. Inouye Intl", city: "Honolulu", country: "USA", lat: 21.3187, lng: -157.9225 },
  { code: "ANC", name: "Ted Stevens Anchorage Intl", city: "Anchorage", country: "USA", lat: 61.1744, lng: -149.9961 },
  { code: "YYZ", name: "Toronto Pearson Intl", city: "Toronto", country: "Canada", lat: 43.6777, lng: -79.6248 },
  { code: "YVR", name: "Vancouver Intl", city: "Vancouver", country: "Canada", lat: 49.1939, lng: -123.1844 },
  { code: "YUL", name: "Montréal–Trudeau Intl", city: "Montreal", country: "Canada", lat: 45.4706, lng: -73.7408 },
  { code: "LHR", name: "London Heathrow", city: "London", country: "UK", lat: 51.47, lng: -0.4543 },
  { code: "LGW", name: "London Gatwick", city: "London", country: "UK", lat: 51.1537, lng: -0.1821 },
  { code: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479 },
  { code: "FRA", name: "Frankfurt am Main", city: "Frankfurt", country: "Germany", lat: 50.0379, lng: 8.5622 },
  { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lng: 4.7683 },
  { code: "MAD", name: "Adolfo Suárez Madrid–Barajas", city: "Madrid", country: "Spain", lat: 40.4983, lng: -3.5676 },
  { code: "FCO", name: "Rome Fiumicino", city: "Rome", country: "Italy", lat: 41.8003, lng: 12.2389 },
  { code: "NRT", name: "Narita Intl", city: "Tokyo", country: "Japan", lat: 35.772, lng: 140.3929 },
  { code: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japan", lat: 35.5494, lng: 139.7798 },
  { code: "DXB", name: "Dubai Intl", city: "Dubai", country: "UAE", lat: 25.2532, lng: 55.3657 },
  { code: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", lat: -33.9399, lng: 151.1753 },
  { code: "GRU", name: "São Paulo–Guarulhos Intl", city: "São Paulo", country: "Brazil", lat: -23.4356, lng: -46.4731 },
  { code: "MEX", name: "Mexico City Intl", city: "Mexico City", country: "Mexico", lat: 19.4361, lng: -99.0719 },
];

export type AutocompleteSuggestion = {
  placeId: string;
  description: string;
  main: string;
  secondary: string;
  type: "airport" | "place";
  // Approximate coordinates so the client can map the chosen address without
  // a second lookup. Optional — sources without coordinates omit them.
  lat?: number;
  lng?: number;
};

/** Airports inside the NY / NJ / CT service area — the only ones offered. */
export const serviceAreaAirports: Airport[] = airports.filter(
  (a) => SERVICE_AREA_AIRPORT_CODES.has(a.code),
);

const asSuggestion = (a: Airport): AutocompleteSuggestion => ({
  placeId: `airport:${a.code}`,
  description: `${a.code} — ${a.name}, ${a.city}, ${a.country}`,
  main: `${a.code} · ${a.name}`,
  secondary: `${a.city}, ${a.country}`,
  type: "airport",
  lat: a.lat,
  lng: a.lng,
});

/** Airport-code + city/name matching used as the offline autocomplete
 * fallback. Restricted to the NY / NJ / CT service area. */
export function matchAirports(input: string, limit = 6): AutocompleteSuggestion[] {
  const q = input.trim().toLowerCase();
  if (q.length < 2) return [];
  const codeQuery = q.replace(/[^a-z]/g, "");
  const scored: { airport: Airport; score: number }[] = [];
  for (const a of serviceAreaAirports) {
    let score = -1;
    if (a.code.toLowerCase() === codeQuery) score = 100;
    else if (a.code.toLowerCase().startsWith(codeQuery)) score = 80;
    else if (a.city.toLowerCase().startsWith(q)) score = 60;
    else if (a.city.toLowerCase().includes(q)) score = 40;
    else if (a.name.toLowerCase().startsWith(q)) score = 55;
    else if (a.name.toLowerCase().includes(q)) score = 30;
    if (score >= 0) scored.push({ airport: a, score });
  }
  return scored
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(s => asSuggestion(s.airport));
}

/** Resolve a service-area airport by IATA code (case-insensitive). */
export function findAirportByCode(code: string): Airport | undefined {
  const c = code.trim().toUpperCase();
  return serviceAreaAirports.find(a => a.code === c);
}

/**
 * Resolve an airport from free text: a standalone IATA code token ("LGA",
 * "LGA — LaGuardia, New York, USA"), the airport name ("laguardia"), or
 * "<city> airport". Returns undefined for plain street addresses so it is
 * safe to try before geocoders.
 */
export function matchAirportByText(text: string): Airport | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const codeMatch = trimmed.toUpperCase().match(/\b([A-Z]{3})\b/);
  if (codeMatch) {
    const hit = findAirportByCode(codeMatch[1]);
    if (hit) return hit;
  }
  const lower = trimmed.toLowerCase();
  return serviceAreaAirports.find(
    a =>
      lower.includes(a.name.toLowerCase()) ||
      lower.includes(`${a.city.toLowerCase()} airport`),
  );
}

/** True when the input looks like an IATA airport code (3 letters). */
export function looksLikeAirportCode(input: string): boolean {
  return /^[a-zA-Z]{3}$/.test(input.trim());
}

/** Great-circle distance in miles between two lat/lng points. */
export function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
