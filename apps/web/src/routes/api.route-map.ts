import { apiError, withApi } from '@/lib/api.server';
import { fetchDrivingRoute, resolvePlace } from '@/lib/geo.server';
import { haversineMiles } from '@/lib/airports';

/**
 * GET /api/route-map?origin=...&destination=...&waypoint=...
 *
 * Image endpoint (PNG via Google Static Maps when available, otherwise a rich
 * SVG of the real driving polyline from OSRM). Prefer `/api/route-data` + the
 * Leaflet client map for the booking UI; this remains for embeds / fallbacks.
 */

const W = 640;
const H = 360;

function esc(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function truncate(s: string, max = 36): string {
	return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function project(
	points: { lat: number; lng: number }[],
): { x: number; y: number }[] {
	const pad = 56;
	const lats = points.map((p) => p.lat);
	const lngs = points.map((p) => p.lng);
	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);
	const minLng = Math.min(...lngs);
	const maxLng = Math.max(...lngs);
	const latRange = maxLat - minLat || 0.01;
	const lngRange = maxLng - minLng || 0.01;
	const span = Math.max(latRange, lngRange);
	return points.map((p) => ({
		x: pad + ((p.lng - minLng) / lngRange) * (W - pad * 2) * (lngRange / span),
		y: H - pad - ((p.lat - minLat) / latRange) * (H - pad * 2) * (latRange / span),
	}));
}

function svgRoute(
	labels: string[],
	polyline: [number, number][],
	markerIdx: number[],
	distanceNote: string,
	isFallback: boolean,
): Response {
	const pts = project(polyline.map(([lat, lng]) => ({ lat, lng })));
	const pathD = pts
		.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
		.join(' ');

	const markerMeta = [
		{ key: 'A', color: '#255dc4', shape: 'circle' as const },
		{ key: 'B', color: '#202b41', shape: 'square' as const },
	];
	if (labels.length === 3) {
		markerMeta.splice(1, 0, { key: 'S', color: '#2f8f6b', shape: 'circle' });
	}

	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
	svg += `<rect width="${W}" height="${H}" fill="#eef3fb"/>`;
	for (let gx = 40; gx < W; gx += 50) {
		svg += `<line x1="${gx}" y1="0" x2="${gx}" y2="${H}" stroke="#e0e8f4" stroke-width="1"/>`;
	}
	for (let gy = 40; gy < H; gy += 50) {
		svg += `<line x1="0" y1="${gy}" x2="${W}" y2="${gy}" stroke="#e0e8f4" stroke-width="1"/>`;
	}
	// soft underlay then main route
	svg += `<path d="${pathD}" fill="none" stroke="#9db9e8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>`;
	svg += `<path d="${pathD}" fill="none" stroke="#255dc4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"${isFallback ? ' stroke-dasharray="8 6"' : ''}/>`;

	markerIdx.forEach((pi, i) => {
		const p = pts[pi];
		const m = markerMeta[i];
		if (!p || !m) return;
		if (m.shape === 'square') {
			svg += `<rect x="${(p.x - 11).toFixed(1)}" y="${(p.y - 11).toFixed(1)}" width="22" height="22" rx="4" fill="${m.color}" stroke="#fff" stroke-width="2"/>`;
		} else {
			svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="11" fill="${m.color}" stroke="#fff" stroke-width="2"/>`;
		}
		svg += `<text x="${p.x.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="#fff">${m.key}</text>`;
		const ly = Math.min(H - 28, p.y + 28);
		svg += `<text x="${p.x.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="11" font-weight="700" fill="#202b41">${esc(truncate(labels[i] ?? ''))}</text>`;
	});

	svg += `<text x="${W / 2}" y="${H - 14}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#5c687b">${esc(distanceNote)}</text>`;
	svg += `</svg>`;
	return new Response(svg, {
		headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
	});
}

export const loader = withApi(async ({ request }) => {
	const url = new URL(request.url);
	const origin = (url.searchParams.get('origin') ?? '').trim();
	const destination = (url.searchParams.get('destination') ?? '').trim();
	const waypoint = (url.searchParams.get('waypoint') ?? '').trim();
	const key = process.env.GOOGLE_MAPS_API_KEY;

	if (!origin || !destination) {
		return apiError(422, 'origin and destination query params are required');
	}

	const [originPlace, destPlace, stopPlace] = await Promise.all([
		resolvePlace(origin, key, request.signal),
		resolvePlace(destination, key, request.signal),
		waypoint ? resolvePlace(waypoint, key, request.signal) : Promise.resolve(null),
	]);

	if (!originPlace || !destPlace) {
		const msg = 'Map unavailable — could not locate these addresses';
		const svg =
			`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="220" viewBox="0 0 ${W} 220">` +
			`<rect width="${W}" height="220" fill="#f3f7fe"/>` +
			`<text x="320" y="112" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="#7d899c">${esc(msg)}</text></svg>`;
		return new Response(svg, {
			headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
		});
	}

	const points = [originPlace, ...(stopPlace ? [stopPlace] : []), destPlace];
	const route = await fetchDrivingRoute(points, key, request.signal);
	const polyline = route?.polyline ?? points.map((p) => [p.lat, p.lng] as [number, number]);

	// Try Google Static Maps with the real polyline when key works
	if (key && route?.source === 'google') {
		try {
			const pathPts = polyline
				.filter((_, i) => i % Math.ceil(polyline.length / 80) === 0 || i === polyline.length - 1)
				.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
				.join('|');
			let mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${W}x${H}&scale=2&maptype=roadmap`;
			mapUrl += `&path=color:0x255dc4ff%7Cweight:4%7C${pathPts}`;
			mapUrl += `&markers=color:0x255dc4%7Clabel:A%7C${originPlace.lat},${originPlace.lng}`;
			if (stopPlace) mapUrl += `&markers=color:0x2f8f6b%7Clabel:S%7C${stopPlace.lat},${stopPlace.lng}`;
			mapUrl += `&markers=color:0x202b41%7Clabel:B%7C${destPlace.lat},${destPlace.lng}`;
			mapUrl += `&key=${key}`;
			const mapRes = await fetch(mapUrl, { signal: request.signal });
			if (mapRes.ok) {
				const buffer = await mapRes.arrayBuffer();
				return new Response(buffer, {
					headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300' },
				});
			}
		} catch {
			// SVG below
		}
	}

	const labels = stopPlace
		? [originPlace.label || origin, stopPlace.label || waypoint, destPlace.label || destination]
		: [originPlace.label || origin, destPlace.label || destination];

	// Marker indices along the polyline: start, optional mid closest to stop, end
	const markerIdx = [0];
	if (stopPlace && polyline.length > 2) {
		let best = 1;
		let bestD = Infinity;
		for (let i = 1; i < polyline.length - 1; i++) {
			const d = haversineMiles(polyline[i][0], polyline[i][1], stopPlace.lat, stopPlace.lng);
			if (d < bestD) {
				bestD = d;
				best = i;
			}
		}
		markerIdx.push(best);
	}
	markerIdx.push(polyline.length - 1);

	const miles = (route?.distanceMeters ?? 0) / 1609.344;
	const mins = Math.round((route?.durationSeconds ?? 0) / 60);
	let note = '';
	if (miles > 0) {
		note = `≈ ${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
		if (mins > 0) note += ` · ~${mins} min drive`;
		if (route?.source === 'straight') note += ' (straight-line)';
	} else {
		note = 'Route confirmed before pickup';
	}

	return svgRoute(labels, polyline, markerIdx, note, route?.source === 'straight');
});
