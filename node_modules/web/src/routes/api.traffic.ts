import { apiError, json, withApi } from '@/lib/api.server';
import { fetchDrivingRoute, resolvePlace, type LatLng } from '@/lib/geo.server';

/**
 * GET /api/traffic?origin=...&destination=...&waypoint=...
 *
 * Returns live traffic flow segments along the driving route, when a traffic
 * provider key is configured server-side. Credentials never leave the server.
 *
 * Response (available):
 *   { available: true, segments: [{ coords:[[lat,lng]...], jamFactor, level }], updatedAt }
 * Response (unavailable — no key, no route, or provider error):
 *   { available: false }
 *
 * `level` is derived from HERE's jamFactor (0–10): free < 4, slow 4–8, heavy > 8.
 */
export const loader = withApi(async ({ request }) => {
	const url = new URL(request.url);
	const origin = (url.searchParams.get('origin') ?? '').trim();
	const destination = (url.searchParams.get('destination') ?? '').trim();
	const waypoint = (url.searchParams.get('waypoint') ?? '').trim();
	const apiKey = process.env.HERE_TRAFFIC_API_KEY;

	if (!origin || !destination) {
		return apiError(422, 'origin and destination query params are required');
	}

	// No provider credentials → traffic data is simply unavailable.
	if (!apiKey) {
		return json({ available: false as const }, { headers: { 'Cache-Control': 'public, max-age=60' } });
	}

	// Verified coordinates captured when the customer picked a suggestion —
	// used directly so traffic follows the exact selected route.
	const num = (name: string): number | null => {
		const raw = url.searchParams.get(name);
		if (raw === null || raw.trim() === '') return null;
		const value = Number(raw);
		return Number.isFinite(value) ? value : null;
	};
	const originLat = num('originLat');
	const originLng = num('originLng');
	const destLat = num('destinationLat');
	const destLng = num('destinationLng');
	const stopLat = num('waypointLat');
	const stopLng = num('waypointLng');

	const [originPlace, destPlace, stopPlace] = await Promise.all([
		originLat !== null && originLng !== null
			? { lat: originLat, lng: originLng, label: origin, source: 'selection' }
			: resolvePlace(origin, undefined, request.signal),
		destLat !== null && destLng !== null
			? { lat: destLat, lng: destLng, label: destination, source: 'selection' }
			: resolvePlace(destination, undefined, request.signal),
		waypoint
			? stopLat !== null && stopLng !== null
				? { lat: stopLat, lng: stopLng, label: waypoint, source: 'selection' }
				: resolvePlace(waypoint, undefined, request.signal)
			: Promise.resolve(null),
	]);

	if (!originPlace || !destPlace) {
		return json({ available: false as const }, { headers: { 'Cache-Control': 'public, max-age=60' } });
	}

	const points: LatLng[] = [originPlace, ...(stopPlace ? [stopPlace] : []), destPlace];
	const route = await fetchDrivingRoute(points, undefined, request.signal);
	const polyline = route?.polyline;
	if (!polyline || polyline.length < 2) {
		return json({ available: false as const }, { headers: { 'Cache-Control': 'public, max-age=60' } });
	}

	// Bounding box of the route, padded ~1.5km so nearby flow segments are included.
	const lats = polyline.map((p) => p[0]);
	const lngs = polyline.map((p) => p[1]);
	const padLat = 0.0135;
	const padLng = 0.018;
	const west = Math.min(...lngs) - padLng;
	const south = Math.min(...lats) - padLat;
	const east = Math.max(...lngs) + padLng;
	const north = Math.max(...lats) + padLat;

	// HERE limits the bbox span; if the route is huge, clamp to a centered window.
	const maxSpan = 1.0;
	const centerLat = (north + south) / 2;
	const centerLng = (east + west) / 2;
	const halfH = Math.min((north - south) / 2, maxSpan / 2);
	const halfW = Math.min((east - west) / 2, maxSpan / 2);
	const bbox = `${centerLng - halfW},${centerLat - halfH},${centerLng + halfW},${centerLat + halfH}`;

	try {
		const res = await fetch(
			`https://data.traffic.hereapi.com/v7/flow?locationReferencing=shape&in=bbox:${bbox}&apiKey=${encodeURIComponent(apiKey)}`,
			{ signal: request.signal, headers: { Accept: 'application/json' } },
		);
		if (!res.ok) {
			return json({ available: false as const }, { headers: { 'Cache-Control': 'public, max-age=60' } });
		}
		const data = (await res.json()) as TrafficResponse;
		const segments = extractSegments(data);
		if (segments.length === 0) {
			return json({ available: false as const }, { headers: { 'Cache-Control': 'public, max-age=60' } });
		}
		return json(
			{ available: true as const, segments, updatedAt: Date.now() },
			{ headers: { 'Cache-Control': 'public, max-age=60' } },
		);
	} catch {
		return json({ available: false as const }, { headers: { 'Cache-Control': 'public, max-age=60' } });
	}
});

type TrafficResponse = {
	results?: TrafficResult[];
};

type TrafficResult = {
	location?: {
		shape?: { links?: { points?: { lat: number; lng: number }[] }[] } | { lat: number; lng: number }[];
	};
	currentFlow?: { jamFactor?: number };
};

function levelFor(jam: number): 'free' | 'slow' | 'heavy' {
	if (jam >= 8) return 'heavy';
	if (jam >= 4) return 'slow';
	return 'free';
}

/** Pull {coords, jamFactor, level} segments out of HERE's shape response, tolerantly. */
function extractSegments(data: TrafficResponse): {
	coords: [number, number][];
	jamFactor: number;
	level: 'free' | 'slow' | 'heavy';
}[] {
	const out: { coords: [number, number][]; jamFactor: number; level: 'free' | 'slow' | 'heavy' }[] = [];
	for (const r of data.results ?? []) {
		const jam = r.currentFlow?.jamFactor;
		if (typeof jam !== 'number') continue;
		const shape = r.location?.shape;
		if (!shape) continue;

		// shape.links[].points[] (v7 shape referencing)
		if (Array.isArray((shape as { links?: unknown[] }).links)) {
			for (const link of (shape as { links?: { points?: { lat: number; lng: number }[] }[] }).links ?? []) {
				const pts = link?.points;
				if (pts && pts.length >= 2) {
					out.push({
						coords: pts.map((p) => [p.lat, p.lng] as [number, number]),
						jamFactor: jam,
						level: levelFor(jam),
					});
				}
			}
			continue;
		}

		// shape as a flat list of {lat,lng}
		if (Array.isArray(shape) && shape.length >= 2) {
			const pts = shape as { lat: number; lng: number }[];
			out.push({
				coords: pts.map((p) => [p.lat, p.lng] as [number, number]),
				jamFactor: jam,
				level: levelFor(jam),
			});
		}
	}
	return out;
}
