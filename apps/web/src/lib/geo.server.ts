/**
 * Server-only geocoding + routing helpers.
 * Prefer Google when the key works; otherwise Photon/Open-Meteo + OSRM + airport DB.
 */
import { findAirportByCode, haversineMiles, serviceAreaAirports } from '@/lib/airports';
import { houseNumberInText, isStreetQuery, lookupStreetAddress, parseAddressIntent } from '@/lib/address.server';
import { isServiceState, serviceStateAbbr } from '@/lib/service-area';

export type LatLng = { lat: number; lng: number };

export type ResolvedPlace = LatLng & { label: string; source: string };

const UA = 'BJKLimoRideBook/1.0 (ride-booking; contact@bjklimo.local)';

/** Airport DB first (instant, no network), then free geocoders, then Google if key works. */
export async function resolvePlace(
	address: string,
	key: string | undefined,
	signal?: AbortSignal,
): Promise<ResolvedPlace | null> {
	const trimmed = address.trim();
	if (!trimmed) return null;

	const intent = parseAddressIntent(trimmed);
	const streetLike = isStreetQuery(intent);

	// A full street address must resolve to that house and street. Do not let a
	// loose airport-code scan or the first Photon hit substitute a different place.
	if (streetLike) {
		const street = await lookupStreetAddress(trimmed, signal);
		if (street) {
			return {
				lat: street.lat,
				lng: street.lng,
				label: street.formattedAddress,
				source: street.source,
			};
		}
		// Strict matcher found nothing — fall through to the general Google/Photon
		// lookup below, gated by a house-number check so a different address is
		// never resolved as the route endpoint.
	}

	const airport =
		findAirportByCode(trimmed) ??
		findAirportByCode(trimmed.split(/[\s,–-]+/)[0] ?? '') ??
		matchAirportInText(trimmed);
	if (airport) {
		return {
			lat: airport.lat,
			lng: airport.lng,
			label: `${airport.code} — ${airport.name}, ${airport.city}`,
			source: 'airport-db',
		};
	}

	if (key) {
		try {
			const res = await fetch(
				`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${key}`,
				{ signal },
			);
			if (res.ok) {
				const data = (await res.json()) as {
					status?: string;
					results?: {
						formatted_address?: string;
						address_components?: { short_name?: string; types?: string[] }[];
						geometry?: { location?: { lat: number; lng: number } };
					}[];
				};
				const result = data.results?.[0];
				const loc = result?.geometry?.location;
				const state = result?.address_components?.find((c) => c.types?.includes('administrative_area_level_1'))?.short_name;
				// Service area: only New York / New Jersey / Connecticut results.
				// For street queries, the result must also carry the typed house
				// number so a different address is never resolved.
				if (
					data.status === 'OK' &&
					loc &&
					isServiceState(state) &&
					(!streetLike || houseNumberInText(result?.formatted_address ?? '', intent.house))
				) {
					return {
						lat: loc.lat,
						lng: loc.lng,
						label: result?.formatted_address ?? trimmed,
						source: 'google',
					};
				}
			}
		} catch {
			// fall through
		}
	}

	// Photon (Komoot) — free, no key
	try {
		const res = await fetch(
			`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=1`,
			{ signal, headers: { 'User-Agent': UA } },
		);
		if (res.ok) {
			const data = (await res.json()) as {
				features?: {
					geometry?: { coordinates?: [number, number] };
					properties?: { name?: string; housenumber?: string; street?: string; city?: string; state?: string; country?: string };
				}[];
			};
			for (const f of data.features ?? []) {
				const coords = f?.geometry?.coordinates;
				const p = f?.properties;
				// Service area: only New York / New Jersey / Connecticut results.
				if (!coords || coords.length < 2 || !serviceStateAbbr(p?.state)) continue;
				const streetLine = [p?.housenumber, p?.street].filter(Boolean).join(' ');
				const labelParts = [streetLine || p?.name, p?.city, p?.state, p?.country].filter(Boolean);
				const labelText = labelParts.join(', ');
				// For street queries, the result must carry the typed house number.
				if (streetLike && !houseNumberInText(labelText, intent.house)) continue;
				return {
					lng: coords[0],
					lat: coords[1],
					label: labelText || trimmed,
					source: 'photon',
				};
			}
		}
	} catch {
		// fall through
	}

	// Open-Meteo geocoding — free, no key
	try {
		const res = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`,
			{ signal },
		);
		if (res.ok) {
			const data = (await res.json()) as {
				results?: { name?: string; latitude: number; longitude: number; admin1?: string; country?: string }[];
			};
			// Service area: only New York / New Jersey / Connecticut results.
			const r = data.results?.find(
				(item) => typeof item.latitude === 'number' && serviceStateAbbr(item.admin1),
			);
			if (r) {
				const parts = [r.name, r.admin1, r.country].filter(Boolean);
				return {
					lat: r.latitude,
					lng: r.longitude,
					label: parts.join(', ') || trimmed,
					source: 'open-meteo',
				};
			}
		}
	} catch {
		// fall through
	}

	return null;
}

function matchAirportInText(text: string) {
	const upper = text.toUpperCase();
	// "JFK - John F. Kennedy" / "Newark Liberty Intl"
	const codeMatch = upper.match(/\b([A-Z]{3})\b/);
	if (codeMatch) {
		const hit = findAirportByCode(codeMatch[1]);
		if (hit) return hit;
	}
	const lower = text.toLowerCase();
	return serviceAreaAirports.find(
		(a) =>
			lower.includes(a.name.toLowerCase()) ||
			lower.includes(`${a.city.toLowerCase()} airport`) ||
			lower.includes(a.code.toLowerCase()),
	);
}

export type RouteResult = {
	/** [lat, lng] pairs suitable for Leaflet */
	polyline: [number, number][];
	distanceMeters: number;
	durationSeconds: number;
	source: 'google' | 'osrm' | 'straight';
	/** Estimated tolls in the route's currency, in whole units (e.g. USD). Null when the provider did not return toll data. */
	tolls: number | null;
	/** ISO currency code for the toll estimate, when tolls are present. */
	tollCurrency: string | null;
};

/** Driving route between points. Google Directions first, then OSRM public server. */
export async function fetchDrivingRoute(
	points: LatLng[],
	key: string | undefined,
	signal?: AbortSignal,
): Promise<RouteResult | null> {
	if (points.length < 2) return null;

	if (key) {
		try {
			const origin = `${points[0].lat},${points[0].lng}`;
			const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
			const mids = points.slice(1, -1);
			const waypointPart =
				mids.length > 0
					? `&waypoints=${encodeURIComponent(mids.map((p) => `${p.lat},${p.lng}`).join('|'))}`
					: '';
			const res = await fetch(
				`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypointPart}&extra_computations=tolls&key=${key}`,
				{ signal },
			);
			if (res.ok) {
				const data = (await res.json()) as {
					status?: string;
					routes?: {
						overview_polyline?: { points?: string };
						legs?: { distance?: { value?: number }; duration?: { value?: number } }[];
						travel_advisory?: {
							tollData?: {
								estimatedPrice?: { units?: string; nanos?: number; currencyCode?: string }[];
							};
						};
					}[];
				};
				const route = data.routes?.[0];
				const encoded = route?.overview_polyline?.points;
				if (data.status === 'OK' && encoded) {
					const decoded = decodePolyline(encoded);
					const legs = route?.legs ?? [];
					const distanceMeters = legs.reduce((s, l) => s + (l.distance?.value ?? 0), 0);
					const durationSeconds = legs.reduce((s, l) => s + (l.duration?.value ?? 0), 0);
					// Sum every estimatedPrice entry across the route. Google returns
					// one per tolled segment; units are whole currency and nanos are
					// the fractional part (1e-9).
					let tolls: number | null = null;
					let tollCurrency: string | null = null;
					const prices = route?.travel_advisory?.tollData?.estimatedPrice ?? [];
					if (prices.length > 0) {
						let sum = 0;
						for (const p of prices) {
							const units = Number(p.units ?? 0);
							const nanos = Number(p.nanos ?? 0) / 1e9;
							sum += units + nanos;
							if (p.currencyCode) tollCurrency = p.currencyCode;
						}
						tolls = Math.round(sum * 100) / 100;
					}
					if (decoded.length >= 2) {
						return { polyline: decoded, distanceMeters, durationSeconds, source: 'google', tolls, tollCurrency };
					}
				}
			}
		} catch {
			// fall through
		}
	}

	// OSRM public router — lon,lat pairs
	try {
		const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
		const res = await fetch(
			`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
			{ signal, headers: { 'User-Agent': UA } },
		);
		if (res.ok) {
			const data = (await res.json()) as {
				code?: string;
				routes?: {
					distance?: number;
					duration?: number;
					geometry?: { coordinates?: [number, number][] };
				}[];
			};
			const route = data.routes?.[0];
			const raw = route?.geometry?.coordinates;
			if (data.code === 'Ok' && raw && raw.length >= 2) {
				// GeoJSON is [lng, lat] → Leaflet wants [lat, lng]
				const polyline = simplify(
					raw.map(([lng, lat]) => [lat, lng] as [number, number]),
					400,
				);
				return {
					polyline,
					distanceMeters: route?.distance ?? 0,
					durationSeconds: route?.duration ?? 0,
					source: 'osrm',
					tolls: null,
					tollCurrency: null,
				};
			}
		}
	} catch {
		// fall through
	}

	// Straight-line fallback between the resolved points
	const polyline = points.map((p) => [p.lat, p.lng] as [number, number]);
	let distanceMeters = 0;
	for (let i = 1; i < points.length; i++) {
		distanceMeters +=
			haversineMiles(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng) * 1609.344;
	}
	return {
		polyline,
		distanceMeters,
		durationSeconds: 0,
		source: 'straight',
		tolls: null,
		tollCurrency: null,
	};
}

/** Google encoded polyline → [lat, lng][] */
function decodePolyline(encoded: string): [number, number][] {
	const coordinates: [number, number][] = [];
	let index = 0;
	let lat = 0;
	let lng = 0;
	while (index < encoded.length) {
		let shift = 0;
		let result = 0;
		let byte: number;
		do {
			byte = encoded.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);
		lat += result & 1 ? ~(result >> 1) : result >> 1;
		shift = 0;
		result = 0;
		do {
			byte = encoded.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);
		lng += result & 1 ? ~(result >> 1) : result >> 1;
		coordinates.push([lat / 1e5, lng / 1e5]);
	}
	return simplify(coordinates, 400);
}

/** Keep at most `max` points, always retaining first/last. */
function simplify(points: [number, number][], max: number): [number, number][] {
	if (points.length <= max) return points;
	const out: [number, number][] = [points[0]];
	const step = (points.length - 1) / (max - 1);
	for (let i = 1; i < max - 1; i++) {
		out.push(points[Math.round(i * step)]);
	}
	out.push(points[points.length - 1]);
	return out;
}
