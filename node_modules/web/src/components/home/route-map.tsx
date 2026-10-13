import { useEffect, useId, useRef, useState } from 'react';
import type { Map as LeafletMap, Polyline as LeafletPolyline, LayerGroup } from 'leaflet';

type RoutePayload = {
	ok: boolean;
	error?: string;
	origin?: { lat: number; lng: number; label: string } | null;
	destination?: { lat: number; lng: number; label: string } | null;
	waypoint?: { lat: number; lng: number; label: string } | null;
	polyline: [number, number][];
	distanceMeters: number;
	durationSeconds: number;
	source: string | null;
};

type TrafficLevel = 'free' | 'slow' | 'heavy';

type TrafficSegment = {
	coords: [number, number][];
	jamFactor: number;
	level: TrafficLevel;
};

type TrafficPayload = {
	available: boolean;
	segments?: TrafficSegment[];
	updatedAt?: number;
};

const TRAFFIC_COLORS: Record<TrafficLevel, string> = {
	free: '#2f9e54',
	slow: '#e8a317',
	heavy: '#d23b3b',
};

/**
 * Live route map for the booking flow. Fetches resolved coordinates + a driving
 * polyline from `/api/route-data`, then renders OpenStreetMap tiles with A / S / B
 * markers via Leaflet (client-only). Falls back to a clear status message when
 * locations cannot be resolved.
 */
export function RouteMap({
	origin,
	destination,
	waypoint,
	variant = 'inline',
	originCoords,
	destinationCoords,
	waypointCoords,
}: {
	origin: string;
	destination: string;
	waypoint?: string;
	variant?: 'inline' | 'aside';
	/** Verified coordinates captured when the customer picked a suggestion;
	 *  used directly so the map renders from the exact chosen location. */
	originCoords?: { lat: number; lng: number } | null;
	destinationCoords?: { lat: number; lng: number } | null;
	waypointCoords?: { lat: number; lng: number } | null;
}) {
	const mapId = useId().replace(/:/g, '');
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<LeafletMap | null>(null);
	const layerRef = useRef<LayerGroup | null>(null);
	const lineRef = useRef<LeafletPolyline | null>(null);
	const trafficLayerRef = useRef<LayerGroup | null>(null);
	const leafletRef = useRef<typeof import('leaflet') | null>(null);
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const [message, setMessage] = useState('Loading route map…');
	const [meta, setMeta] = useState<string | null>(null);
	const [traffic, setTraffic] = useState<{
		state: 'loading' | 'available' | 'unavailable';
		segments: TrafficSegment[];
	}>({ state: 'unavailable', segments: [] });

	const stop = waypoint?.trim() ?? '';

	useEffect(() => {
		if (!origin || !destination) return;
		let cancelled = false;
		const params = new URLSearchParams({ origin, destination });
		if (stop) params.set('waypoint', stop);
		if (originCoords) {
			params.set('originLat', String(originCoords.lat));
			params.set('originLng', String(originCoords.lng));
		}
		if (destinationCoords) {
			params.set('destinationLat', String(destinationCoords.lat));
			params.set('destinationLng', String(destinationCoords.lng));
		}
		if (stop && waypointCoords) {
			params.set('waypointLat', String(waypointCoords.lat));
			params.set('waypointLng', String(waypointCoords.lng));
		}

		setStatus('loading');
		setMessage('Loading route map…');
		setMeta(null);
		setTraffic({ state: 'unavailable', segments: [] });
		if (trafficLayerRef.current) trafficLayerRef.current.clearLayers();

		(async () => {
			try {
				const res = await fetch(`/api/route-data?${params.toString()}`);
				if (!res.ok) throw new Error(`route-data ${res.status}`);
				const data = (await res.json()) as RoutePayload;
				if (cancelled) return;

				if (!data.ok || !data.origin || !data.destination || data.polyline.length < 2) {
					setStatus('error');
					setMessage(data.error || 'Map unavailable for these locations.');
					return;
				}

				const L = await import('leaflet');
				leafletRef.current = L;
				// Ensure default marker images resolve under Vite
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				delete (L.Icon.Default.prototype as any)._getIconUrl;
				L.Icon.Default.mergeOptions({
					iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
					iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
					shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
				});

				if (!containerRef.current) return;

				if (!mapRef.current) {
					const map = L.map(containerRef.current, {
						zoomControl: false,
						attributionControl: true,
						scrollWheelZoom: false,
					});
					L.control.zoom({ position: 'topright' }).addTo(map);
					L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
						maxZoom: 18,
					}).addTo(map);
					mapRef.current = map;
					layerRef.current = L.layerGroup().addTo(map);
					trafficLayerRef.current = L.layerGroup().addTo(map);
				}

				const map = mapRef.current;
				const layers = layerRef.current!;
				layers.clearLayers();
				if (lineRef.current) {
					lineRef.current.remove();
					lineRef.current = null;
				}

				const makeDivIcon = (letter: string, color: string, square = false) =>
					L.divIcon({
						className: 'route-marker-icon',
						html: `<span class="route-pin ${square ? 'square' : 'circle'}" style="--pin:${color}">${letter}</span>`,
						iconSize: [28, 28],
						iconAnchor: [14, 14],
					});

				L.marker([data.origin.lat, data.origin.lng], {
					icon: makeDivIcon('A', '#255dc4'),
					title: data.origin.label,
				})
					.bindTooltip(data.origin.label, { direction: 'top', offset: [0, -12] })
					.addTo(layers);

				if (data.waypoint) {
					L.marker([data.waypoint.lat, data.waypoint.lng], {
						icon: makeDivIcon('S', '#2f8f6b'),
						title: data.waypoint.label,
					})
						.bindTooltip(data.waypoint.label, { direction: 'top', offset: [0, -12] })
						.addTo(layers);
				}

				L.marker([data.destination.lat, data.destination.lng], {
					icon: makeDivIcon('B', '#202b41', true),
					title: data.destination.label,
				})
					.bindTooltip(data.destination.label, { direction: 'top', offset: [0, -12] })
					.addTo(layers);

				const line = L.polyline(data.polyline, {
					color: '#255dc4',
					weight: 5,
					opacity: 0.9,
					lineJoin: 'round',
					lineCap: 'round',
				}).addTo(map);
				lineRef.current = line;

				const bounds = line.getBounds();
				map.fitBounds(bounds.pad(0.18), { animate: false });
				// Leaflet needs a kick after layout in flex/grid panes
				requestAnimationFrame(() => {
					map.invalidateSize();
					map.fitBounds(bounds.pad(0.18), { animate: false });
				});

				const miles = data.distanceMeters / 1609.344;
				const mins = Math.round(data.durationSeconds / 60);
				const bits: string[] = [];
				if (miles > 0) bits.push(`≈ ${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`);
				if (mins > 0) bits.push(`~${mins} min drive`);
				if (data.source === 'straight') bits.push('straight-line estimate');
				setMeta(bits.join(' · ') || null);
				setStatus('ready');
				setMessage('');
			} catch {
				if (!cancelled) {
					setStatus('error');
					setMessage('Map temporarily unavailable. Your reservation is unaffected.');
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [origin, destination, stop, originCoords, destinationCoords, waypointCoords]);

	// Live traffic overlay: once the route is rendered, ask `/api/traffic` for
	// flow segments along it. When traffic data is available, draw each segment
	// colored by congestion level on top of the route. When it isn't (no
	// provider key, provider error, or no coverage), the route stays as-is — a
	// graceful, non-blocking fallback.
	useEffect(() => {
		if (status !== 'ready' || !origin || !destination) return;
		let cancelled = false;
		const params = new URLSearchParams({ origin, destination });
		if (stop) params.set('waypoint', stop);
		if (originCoords) {
			params.set('originLat', String(originCoords.lat));
			params.set('originLng', String(originCoords.lng));
		}
		if (destinationCoords) {
			params.set('destinationLat', String(destinationCoords.lat));
			params.set('destinationLng', String(destinationCoords.lng));
		}
		if (stop && waypointCoords) {
			params.set('waypointLat', String(waypointCoords.lat));
			params.set('waypointLng', String(waypointCoords.lng));
		}

		setTraffic({ state: 'loading', segments: [] });

		(async () => {
			try {
				const res = await fetch(`/api/traffic?${params.toString()}`);
				if (!res.ok) {
					if (!cancelled) setTraffic({ state: 'unavailable', segments: [] });
					return;
				}
				const data = (await res.json()) as TrafficPayload;
				if (cancelled) return;
				if (!data.available || !data.segments || data.segments.length === 0) {
					setTraffic({ state: 'unavailable', segments: [] });
					return;
				}
				setTraffic({ state: 'available', segments: data.segments });
			} catch {
				if (!cancelled) setTraffic({ state: 'unavailable', segments: [] });
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [status, origin, destination, stop, originCoords, destinationCoords, waypointCoords]);

	// Render / refresh traffic segments whenever they change.
	useEffect(() => {
		const layer = trafficLayerRef.current;
		if (!layer) return;
		layer.clearLayers();
		if (traffic.state !== 'available' || traffic.segments.length === 0) return;
		const L = leafletRef.current;
		if (!L) return;
		for (const seg of traffic.segments) {
			if (seg.coords.length < 2) continue;
			L.polyline(seg.coords, {
				color: TRAFFIC_COLORS[seg.level],
				weight: 5,
				opacity: 0.95,
				lineJoin: 'round',
				lineCap: 'round',
			}).addTo(layer);
		}
	}, [traffic]);

	// Tear down map on unmount
	useEffect(() => {
		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
				layerRef.current = null;
				lineRef.current = null;
			}
		};
	}, []);

	if (!origin || !destination) return null;

	const label =
		stop
			? 'Map of your route from pickup to dropoff via your extra stop'
			: 'Map of your route from pickup to dropoff';

	return (
		<div
			className={`route-map route-map-live route-map-${variant}`}
			role="img"
			aria-label={label}
		>
			<div
				ref={containerRef}
				id={`route-map-${mapId}`}
				className="route-map-canvas"
				aria-hidden={status !== 'ready'}
			/>
			{status === 'loading' ? (
				<div className="route-map-overlay">
					<span className="route-map-spinner" aria-hidden />
					<span>{message}</span>
				</div>
			) : null}
			{status === 'error' ? (
				<div className="route-map-overlay route-map-overlay-error">
					<span>{message}</span>
				</div>
			) : null}
			{status === 'ready' && meta ? <div className="route-map-meta">{meta}</div> : null}
			{status === 'ready' ? <TrafficLegend traffic={traffic} /> : null}
		</div>
	);
}

function TrafficLegend({
	traffic,
}: {
	traffic: { state: 'loading' | 'available' | 'unavailable'; segments: TrafficSegment[] };
}) {
	if (traffic.state === 'loading') {
		return (
			<div className="route-map-traffic route-map-traffic-loading" role="status">
				<span className="route-map-spinner route-map-spinner-sm" aria-hidden />
				<span>Checking live traffic…</span>
			</div>
		);
	}

	if (traffic.state === 'unavailable') {
		return (
			<div className="route-map-traffic route-map-traffic-off" role="status">
				<span className="traffic-dot traffic-dot-off" aria-hidden />
				<span>Live traffic unavailable</span>
			</div>
		);
	}

	const hasHeavy = traffic.segments.some((s) => s.level === 'heavy');
	const hasSlow = traffic.segments.some((s) => s.level === 'slow');
	const headline = hasHeavy ? 'Heavy traffic on route' : hasSlow ? 'Some slowdowns on route' : 'Free-flowing';

	return (
		<div className="route-map-traffic" role="status" aria-label={`Live traffic: ${headline}`}>
			<div className="route-map-traffic-head">
				<span className={`traffic-dot traffic-dot-${hasHeavy ? 'heavy' : hasSlow ? 'slow' : 'free'}`} aria-hidden />
				<span className="route-map-traffic-title">{headline}</span>
			</div>
			<div className="route-map-traffic-key">
				<span><span className="traffic-dot traffic-dot-free" aria-hidden />Free flow</span>
				<span><span className="traffic-dot traffic-dot-slow" aria-hidden />Slow</span>
				<span><span className="traffic-dot traffic-dot-heavy" aria-hidden />Heavy</span>
			</div>
		</div>
	);
}
