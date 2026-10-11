import { apiError, json, withApi } from '@/lib/api.server';
import { fetchDrivingRoute, resolvePlace } from '@/lib/geo.server';

/**
 * GET /api/route-data?origin=...&destination=...&waypoint=...
 *
 * Returns JSON for the booking map: resolved markers + driving polyline.
 * Uses Google when available; otherwise Photon/airport DB + OSRM.
 * Public and cacheable by URL (same origin/destination → same route).
 */
export const loader = withApi(async ({ request }) => {
	const url = new URL(request.url);
	const origin = (url.searchParams.get('origin') ?? '').trim();
	const destination = (url.searchParams.get('destination') ?? '').trim();
	const waypoint = (url.searchParams.get('waypoint') ?? '').trim();
	const key = process.env.GOOGLE_MAPS_API_KEY;

	if (!origin || !destination) {
		return apiError(422, 'origin and destination query params are required');
	}

	// Verified coordinates captured when the customer picked a suggestion.
	// When present they are used directly, so the map renders from the exact
	// selected location without another geocode round-trip.
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
			: resolvePlace(origin, key, request.signal),
		destLat !== null && destLng !== null
			? { lat: destLat, lng: destLng, label: destination, source: 'selection' }
			: resolvePlace(destination, key, request.signal),
		waypoint
			? stopLat !== null && stopLng !== null
				? { lat: stopLat, lng: stopLng, label: waypoint, source: 'selection' }
				: resolvePlace(waypoint, key, request.signal)
			: Promise.resolve(null),
	]);

	if (!originPlace || !destPlace) {
		return json(
			{
				ok: false,
				error: 'Could not locate one or both addresses on the map.',
				origin: originPlace,
				destination: destPlace,
				waypoint: stopPlace,
				polyline: [] as [number, number][],
				distanceMeters: 0,
				durationSeconds: 0,
				source: null as string | null,
			},
			{ headers: { 'Cache-Control': 'public, max-age=60' } },
		);
	}

	const points = [originPlace, ...(stopPlace ? [stopPlace] : []), destPlace];
	const route = await fetchDrivingRoute(points, key, request.signal);

	return json(
		{
			ok: true as const,
			origin: originPlace,
			destination: destPlace,
			waypoint: stopPlace,
			polyline: route?.polyline ?? points.map((p) => [p.lat, p.lng] as [number, number]),
			distanceMeters: route?.distanceMeters ?? 0,
			durationSeconds: route?.durationSeconds ?? 0,
			source: route?.source ?? 'straight',
		},
		{ headers: { 'Cache-Control': 'public, max-age=300' } },
	);
});
