import { useEffect, useRef, useState, useId } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import {
  CarFront,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Gauge,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import pb from '@/lib/pocketbase-client';

export type DriverFleetItem = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  vehicle: string;
  active: boolean;
  onDuty: boolean;
  lat: number | null;
  lng: number | null;
  heading: number;
  speed: number;
  lastLocationUpdate: string | null;
  activeTrip: {
    id: string;
    passengerName: string;
    phone: string;
    pickup: string;
    dropoff: string;
    extraStop: string;
    pickupAt: string;
    driverStatus: string;
    status: string;
    sourceName: string;
    flight: string;
    vehicle: string;
  } | null;
};

function formatAgo(iso: string | null): string {
  if (!iso) return 'No GPS signal';
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 15) return 'Live (Just now)';
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function FleetMap({
  initialFocusedDriverId,
  onClose,
}: {
  initialFocusedDriverId?: string;
  onClose?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  const [drivers, setDrivers] = useState<DriverFleetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(initialFocusedDriverId ?? null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'idle'>('all');
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  // Geocoded cache for passenger addresses to draw route lines from driver to customer
  const geocodeCache = useRef<Record<string, { lat: number; lng: number }>>({});

  async function loadFleet() {
    try {
      const res = await fetch('/api/driver-location', {
        headers: {
          Authorization: `Bearer ${pb.authStore.token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load fleet');
      }
      const data = await res.json();
      const list: DriverFleetItem[] = data.drivers || [];
      setDrivers(list);
      setLastRefreshed(Date.now());
      setError('');
    } catch (err) {
      setError('Could not update live driver locations.');
    } finally {
      setLoading(false);
    }
  }

  // Periodic polling every 10 seconds
  useEffect(() => {
    void loadFleet();
    const interval = window.setInterval(() => {
      void loadFleet();
    }, 10000);
    return () => window.clearInterval(interval);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current) return;
      if (!leafletRef.current) {
        leafletRef.current = await import('leaflet');
      }
      const L = leafletRef.current;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        // Default center: NYC / Tri-State Metro area
        const map = L.map(containerRef.current, {
          center: [40.758, -73.9855],
          zoom: 11,
          zoomControl: false,
          attributionControl: true,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        }).addTo(map);

        mapRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
        routeLayerRef.current = L.layerGroup().addTo(map);
      }
    }

    void initMap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Helper to resolve coordinates for an address (using /api/geocode or fallback)
  async function resolveAddressCoords(addr: string): Promise<{ lat: number; lng: number } | null> {
    if (!addr) return null;
    if (geocodeCache.current[addr]) return geocodeCache.current[addr];
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(addr)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.coords) {
          geocodeCache.current[addr] = data.coords;
          return data.coords;
        }
      }
    } catch {
      // non-fatal
    }
    return null;
  }

  // Update Map Markers and Route Lines whenever drivers update
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;

    if (!L || !map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    const bounds: [number, number][] = [];

    // Filtered driver list
    for (const d of drivers) {
      if (typeof d.lat !== 'number' || typeof d.lng !== 'number') continue;
      bounds.push([d.lat, d.lng]);

      const isSelected = d.id === selectedDriverId;
      const hasActiveTrip = Boolean(d.activeTrip);
      const tripStatus = d.activeTrip?.driverStatus || 'idle';

      // Status color
      let statusColor = '#64748b'; // grey idle
      let statusText = 'Idle / Available';
      if (tripStatus === 'accepted') {
        statusColor = '#2563eb'; // blue en route to pickup
        statusText = 'En Route to Pickup';
      } else if (tripStatus === 'arrived') {
        statusColor = '#0284c7'; // cyan arrived at pickup
        statusText = 'Arrived at Pickup';
      } else if (tripStatus === 'on_board') {
        statusColor = '#7c3aed'; // purple passenger on board
        statusText = 'Passenger On Board';
      } else if (hasActiveTrip) {
        statusColor = '#2563eb';
        statusText = 'Assigned to Trip';
      }

      // Custom vehicle pin
      const markerHtml = `
        <div class="driver-map-pin ${isSelected ? 'selected' : ''}" style="--pin-color: ${statusColor};">
          <div class="driver-pin-pulse"></div>
          <div class="driver-pin-body">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div class="driver-pin-label">${d.name.split(' ')[0]}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'driver-leaflet-marker',
        html: markerHtml,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const marker = L.marker([d.lat, d.lng], { icon: customIcon });

      // Click on driver marker
      marker.on('click', () => {
        setSelectedDriverId(d.id);
        map.setView([d.lat!, d.lng!], Math.max(map.getZoom(), 13), { animate: true });
      });

      markersLayer.addLayer(marker);

      // If this driver is selected and has an active trip with pickup address:
      // Draw the route line to customer!
      if (isSelected && d.activeTrip?.pickup) {
        void (async () => {
          const pickupCoords = await resolveAddressCoords(d.activeTrip!.pickup);
          if (pickupCoords && mapRef.current) {
            const pBounds: [number, number][] = [[d.lat!, d.lng!], [pickupCoords.lat, pickupCoords.lng]];

            // Pickup pin (Marker A)
            const pickupIcon = L.divIcon({
              className: 'route-marker-icon',
              html: `<span class="route-pin circle" style="--pin: #16a34a;">A</span>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            const pMarker = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon }).bindPopup(
              `<strong>Pickup Location:</strong><br/>${d.activeTrip!.pickup}`
            );
            routeLayer.addLayer(pMarker);

            // Connect driver to pickup with a styled dashed line
            const connector = L.polyline(
              [
                [d.lat!, d.lng!],
                [pickupCoords.lat, pickupCoords.lng],
              ],
              {
                color: statusColor,
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.85,
              }
            );
            routeLayer.addLayer(connector);

            // If dropoff exists, also place dropoff pin (Marker B)
            if (d.activeTrip!.dropoff) {
              const dropCoords = await resolveAddressCoords(d.activeTrip!.dropoff);
              if (dropCoords) {
                pBounds.push([dropCoords.lat, dropCoords.lng]);
                const dropIcon = L.divIcon({
                  className: 'route-marker-icon',
                  html: `<span class="route-pin square" style="--pin: #2563eb;">B</span>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                });
                const dMarker = L.marker([dropCoords.lat, dropCoords.lng], { icon: dropIcon }).bindPopup(
                  `<strong>Dropoff:</strong><br/>${d.activeTrip!.dropoff}`
                );
                routeLayer.addLayer(dMarker);

                const dropLine = L.polyline(
                  [
                    [pickupCoords.lat, pickupCoords.lng],
                    [dropCoords.lat, dropCoords.lng],
                  ],
                  {
                    color: '#2563eb',
                    weight: 3,
                    opacity: 0.6,
                  }
                );
                routeLayer.addLayer(dropLine);
              }
            }

            // Fit map to show both driver and customer pickup
            map.fitBounds(L.latLngBounds(pBounds), { padding: [50, 50], maxZoom: 15 });
          }
        })();
      }
    }

    // Auto-fit to all drivers if no specific driver is selected
    if (!selectedDriverId && bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 });
    }
  }, [drivers, selectedDriverId]);

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) || null;

  // Filtered list for sidebar
  const visibleDrivers = drivers.filter((d) => {
    if (filter === 'active' && !d.activeTrip) return false;
    if (filter === 'idle' && d.activeTrip) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.vehicle || '').toLowerCase().includes(q) ||
        (d.activeTrip?.passengerName || '').toLowerCase().includes(q) ||
        (d.activeTrip?.pickup || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fleet-view-container">
      {/* Header bar */}
      <div className="fleet-view-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="fleet-live-pulse" />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Live Driver Drive View</h2>
          <span className="driver-brand-tag" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
            {drivers.filter((d) => d.lat !== null).length} of {drivers.length} GPS Active
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="driver-tool-btn" onClick={() => void loadFleet()} title="Refresh GPS">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {onClose && (
            <button type="button" className="driver-tool-btn" onClick={onClose}>
              <X size={15} /> Close Map
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Sidebar + Interactive Map */}
      <div className="fleet-grid">
        {/* Left: Driver list & Active mission card */}
        <aside className="fleet-sidebar">
          {/* Filter Pills */}
          <div className="driver-tab-group" style={{ width: '100%', marginBottom: 12 }}>
            <button
              type="button"
              className={`driver-tab-btn${filter === 'all' ? ' active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setFilter('all')}
            >
              All ({drivers.length})
            </button>
            <button
              type="button"
              className={`driver-tab-btn${filter === 'active' ? ' active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setFilter('active')}
            >
              On Mission ({drivers.filter((d) => Boolean(d.activeTrip)).length})
            </button>
            <button
              type="button"
              className={`driver-tab-btn${filter === 'idle' ? ' active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setFilter('idle')}
            >
              Idle
            </button>
          </div>

          {/* Quick Search */}
          <div className="driver-search-wrap" style={{ width: '100%', maxWidth: '100%', marginBottom: 12 }}>
            <Search size={14} />
            <input
              type="search"
              placeholder="Search driver, car, guest…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Driver List Roster */}
          <div className="fleet-roster">
            {visibleDrivers.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--ink-light)', fontSize: 13 }}>
                No drivers found.
              </p>
            ) : (
              visibleDrivers.map((d) => {
                const isSelected = d.id === selectedDriverId;
                const hasGps = typeof d.lat === 'number' && typeof d.lng === 'number';
                const trip = d.activeTrip;

                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`fleet-driver-card${isSelected ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedDriverId(d.id);
                      if (hasGps && mapRef.current) {
                        mapRef.current.setView([d.lat!, d.lng!], 14, { animate: true });
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{d.name}</strong>
                      <span className={`fleet-status-pill ${trip ? 'active' : hasGps ? 'idle' : 'offline'}`}>
                        {trip ? trip.driverStatus.replace('_', ' ').toUpperCase() : hasGps ? 'IDLE' : 'NO GPS'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--ink-mid)' }}>
                      <span><CarFront size={13} style={{ display: 'inline', marginRight: 3 }} /> {d.vehicle}</span>
                      <span>•</span>
                      <span>{formatAgo(d.lastLocationUpdate)}</span>
                    </div>

                    {trip && (
                      <div className="fleet-driver-trip-summary">
                        <span style={{ fontWeight: 700, color: '#1e40af' }}>Passenger: {trip.passengerName}</span>
                        <div style={{ fontSize: 11, color: 'var(--ink-mid)', marginTop: 2 }}>
                          📍 Pickup: {trip.pickup}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Interactive Live Map */}
        <div className="fleet-map-wrapper">
          <div ref={containerRef} className="fleet-leaflet-map" />

          {/* Floating Selected Driver Live Mission Card Overlay */}
          {selectedDriver && (
            <div className="fleet-floating-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{selectedDriver.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--ink-mid)', marginTop: 2 }}>
                    {selectedDriver.vehicle.toUpperCase()} • {formatAgo(selectedDriver.lastLocationUpdate)}
                  </div>
                </div>
                <button
                  type="button"
                  style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--ink-light)' }}
                  onClick={() => setSelectedDriverId(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Live Driving Metrics */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, fontSize: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Gauge size={14} color="#2563eb" /> <strong>{selectedDriver.speed} mph</strong>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Compass size={14} color="#0284c7" /> <strong>{selectedDriver.heading}° Heading</strong>
                </span>
                {selectedDriver.phone && (
                  <a
                    href={`tel:${selectedDriver.phone.replace(/[^\d+]/g, '')}`}
                    style={{ marginLeft: 'auto', color: '#16a34a', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Phone size={13} /> Call Chauffeur
                  </a>
                )}
              </div>

              {/* Active Trip Destination & Status */}
              {selectedDriver.activeTrip ? (
                <div style={{ marginTop: 12, padding: 12, background: '#f8fbff', borderRadius: 10, border: '1px solid #dbeafe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#1e40af' }}>
                      CURRENT MISSION: {selectedDriver.activeTrip.driverStatus.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-light)' }}>
                      Guest: {selectedDriver.activeTrip.passengerName}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, marginTop: 6, color: 'var(--ink)' }}>
                    <div><strong>Pickup:</strong> {selectedDriver.activeTrip.pickup}</div>
                    {selectedDriver.activeTrip.dropoff && (
                      <div style={{ marginTop: 3 }}><strong>Dropoff:</strong> {selectedDriver.activeTrip.dropoff}</div>
                    )}
                  </div>

                  {selectedDriver.lat !== null && selectedDriver.lng !== null && (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Navigation size={13} />
                      En route status: Chauffeur GPS tracked live on map
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-mid)' }}>
                  No active reservation in progress. Driver is on duty and available for assignments.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
