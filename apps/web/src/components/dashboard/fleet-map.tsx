import { useEffect, useRef, useState, useMemo } from 'react';
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
  Play,
  Square,
  RefreshCw,
  Search,
  Sparkles,
  User,
  Users,
  Building,
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
  hasLiveGps?: boolean;
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

// Base coordinates for Elite Limo Link / Teterboro Airport Fleet Hub
const FLEET_BASE_LAT = 40.8501;
const FLEET_BASE_LNG = -74.0608;

function formatAgo(iso: string | null): string {
  if (!iso) return 'Standby (Awaiting GPS lock)';
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 15) return 'Live (Just now)';
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
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
  const [actionInProgress, setActionInProgress] = useState(false);

  // Simulation state
  const [simulatingDriverId, setSimulatingDriverId] = useState<string | null>(null);
  const simIntervalRef = useRef<number | null>(null);

  // Geocoded cache for passenger addresses to draw route lines and place standby pins
  const geocodeCache = useRef<Record<string, { lat: number; lng: number }>>({});
  const [resolvedAddrs, setResolvedAddrs] = useState<Record<string, { lat: number; lng: number }>>({});

  // Helper to resolve coordinates for an address (using /api/geocode)
  async function resolveAddressCoords(addr: string): Promise<{ lat: number; lng: number } | null> {
    if (!addr) return null;
    if (geocodeCache.current[addr]) return geocodeCache.current[addr];
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(addr)}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.lat === 'number' && typeof data.lng === 'number') {
          const coords = { lat: data.lat, lng: data.lng };
          geocodeCache.current[addr] = coords;
          setResolvedAddrs((prev) => ({ ...prev, [addr]: coords }));
          return coords;
        }
      }
    } catch {
      // non-fatal
    }
    return null;
  }

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

      // Pre-resolve trip addresses in background
      for (const d of list) {
        if (d.activeTrip?.pickup) void resolveAddressCoords(d.activeTrip.pickup);
        if (d.activeTrip?.dropoff) void resolveAddressCoords(d.activeTrip.dropoff);
      }
    } catch (err) {
      setError('Could not update live driver locations.');
    } finally {
      setLoading(false);
    }
  }

  // Periodic polling every 8 seconds
  useEffect(() => {
    void loadFleet();
    const interval = window.setInterval(() => {
      void loadFleet();
    }, 8000);
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
        // Center: NYC / NJ Metro area
        const map = L.map(containerRef.current, {
          center: [FLEET_BASE_LAT, FLEET_BASE_LNG],
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

  // Clean up simulation when component unmounts
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        window.clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, []);

  /**
   * Calculates effective display coordinates for a driver.
   * If real GPS coordinates exist, uses them.
   * Otherwise uses active pickup geocode or Fleet Base with a slight offset.
   */
  function getDriverLocation(d: DriverFleetItem, index: number): {
    lat: number;
    lng: number;
    isLive: boolean;
    label: string;
  } {
    if (typeof d.lat === 'number' && typeof d.lng === 'number') {
      return {
        lat: d.lat,
        lng: d.lng,
        isLive: true,
        label: `${d.speed} mph`,
      };
    }

    // Fallback: check if active trip pickup coordinates are known
    if (d.activeTrip?.pickup && geocodeCache.current[d.activeTrip.pickup]) {
      const p = geocodeCache.current[d.activeTrip.pickup];
      return {
        lat: p.lat,
        lng: p.lng,
        isLive: false,
        label: 'Pickup Area (Standby)',
      };
    }

    // Fallback: Fleet Base (Teterboro Hub) with offset per driver index
    const offset = (index % 6) * 0.0025;
    return {
      lat: FLEET_BASE_LAT + offset,
      lng: FLEET_BASE_LNG + offset,
      isLive: false,
      label: 'Teterboro Base (Standby)',
    };
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

    // Render EVERY driver on the map
    drivers.forEach((d, index) => {
      const loc = getDriverLocation(d, index);
      bounds.push([loc.lat, loc.lng]);

      const isSelected = d.id === selectedDriverId;
      const hasActiveTrip = Boolean(d.activeTrip);
      const tripStatus = d.activeTrip?.driverStatus || 'idle';

      // Status color
      let statusColor = loc.isLive ? '#2563eb' : '#d97706'; // blue if live, amber if standby
      if (loc.isLive) {
        if (tripStatus === 'accepted') statusColor = '#2563eb';
        else if (tripStatus === 'arrived') statusColor = '#0284c7';
        else if (tripStatus === 'on_board') statusColor = '#7c3aed';
        else if (!hasActiveTrip) statusColor = '#16a34a'; // idle live available
      }

      // Marker HTML
      const markerHtml = `
        <div class="driver-map-pin ${isSelected ? 'selected' : ''}" style="--pin-color: ${statusColor};">
          <div class="driver-pin-pulse" style="${loc.isLive ? '' : 'animation-duration: 3s; opacity: 0.2;'}"></div>
          <div class="driver-pin-body" style="${loc.isLive ? '' : 'border: 2px dashed #fff;'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div class="driver-pin-label">
            ${d.name.split(' ')[0]}${loc.isLive ? '' : ' (Standby)'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'driver-leaflet-marker',
        html: markerHtml,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });

      // Click on driver marker
      marker.on('click', () => {
        setSelectedDriverId(d.id);
        map.setView([loc.lat, loc.lng], Math.max(map.getZoom(), 13), { animate: true });
      });

      markersLayer.addLayer(marker);

      // If selected and has active trip with pickup address, draw route
      if (isSelected && d.activeTrip?.pickup) {
        void (async () => {
          const pickupCoords = await resolveAddressCoords(d.activeTrip!.pickup);
          if (pickupCoords && mapRef.current) {
            const pBounds: [number, number][] = [[loc.lat, loc.lng], [pickupCoords.lat, pickupCoords.lng]];

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

            // Connect driver to pickup
            const connector = L.polyline(
              [
                [loc.lat, loc.lng],
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

            // Show both driver and route
            map.fitBounds(L.latLngBounds(pBounds), { padding: [50, 50], maxZoom: 15 });
          }
        })();
      }
    });

    // Auto-fit to all drivers if no driver selected
    if (!selectedDriverId && bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 });
    }
  }, [drivers, selectedDriverId, resolvedAddrs]);

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === selectedDriverId) || null,
    [drivers, selectedDriverId]
  );

  /**
   * Dispatcher Action: Place driver at assigned pickup address
   */
  async function handlePlaceAtPickup(driver: DriverFleetItem) {
    if (!driver.activeTrip?.pickup || actionInProgress) return;
    setActionInProgress(true);
    try {
      const coords = await resolveAddressCoords(driver.activeTrip.pickup);
      if (!coords) throw new Error('Could not resolve pickup address coordinates.');

      await fetch('/api/driver-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({
          driverId: driver.id,
          lat: coords.lat,
          lng: coords.lng,
          speed: 0,
          heading: 0,
          tripId: driver.activeTrip.id,
          onDuty: true,
        }),
      });

      await loadFleet();
      if (mapRef.current) {
        mapRef.current.setView([coords.lat, coords.lng], 14, { animate: true });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not place driver at pickup.');
    } finally {
      setActionInProgress(false);
    }
  }

  /**
   * Dispatcher Action: Place driver at Fleet Base (Teterboro)
   */
  async function handlePlaceAtBase(driver: DriverFleetItem) {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      await fetch('/api/driver-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({
          driverId: driver.id,
          lat: FLEET_BASE_LAT,
          lng: FLEET_BASE_LNG,
          speed: 0,
          heading: 90,
          onDuty: true,
        }),
      });

      await loadFleet();
      if (mapRef.current) {
        mapRef.current.setView([FLEET_BASE_LAT, FLEET_BASE_LNG], 14, { animate: true });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not place driver at base.');
    } finally {
      setActionInProgress(false);
    }
  }

  /**
   * Dispatcher Action: Start or stop Live Drive Simulation
   */
  async function toggleSimulation(driver: DriverFleetItem) {
    if (simulatingDriverId === driver.id) {
      if (simIntervalRef.current) {
        window.clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      setSimulatingDriverId(null);
      return;
    }

    if (simIntervalRef.current) {
      window.clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    setSimulatingDriverId(driver.id);

    // Target destination (pickup if available, else standard NYC route)
    let target = { lat: 40.758, lng: -73.9855 }; // Manhattan
    if (driver.activeTrip?.pickup) {
      const p = await resolveAddressCoords(driver.activeTrip.pickup);
      if (p) target = p;
    }

    let curLat = driver.lat ?? FLEET_BASE_LAT;
    let curLng = driver.lng ?? FLEET_BASE_LNG;

    simIntervalRef.current = window.setInterval(async () => {
      const dLat = target.lat - curLat;
      const dLng = target.lng - curLng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist < 0.003) {
        // Reached destination
        if (simIntervalRef.current) {
          window.clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
        setSimulatingDriverId(null);
        return;
      }

      // Step towards destination
      const nextLat = curLat + dLat * 0.12;
      const nextLng = curLng + dLng * 0.12;
      curLat = nextLat;
      curLng = nextLng;

      const heading = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
      const speed = 36;

      try {
        await fetch('/api/driver-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${pb.authStore.token}`,
          },
          body: JSON.stringify({
            driverId: driver.id,
            lat: nextLat,
            lng: nextLng,
            heading,
            speed,
            tripId: driver.activeTrip?.id,
            onDuty: true,
          }),
        });

        // Smooth local update
        setDrivers((prev) =>
          prev.map((d) =>
            d.id === driver.id
              ? {
                  ...d,
                  lat: nextLat,
                  lng: nextLng,
                  heading,
                  speed,
                  lastLocationUpdate: new Date().toISOString(),
                }
              : d
          )
        );
      } catch {}
    }, 3200);
  }

  // Filtered list for sidebar
  const visibleDrivers = drivers.filter((d) => {
    if (filter === 'active' && !d.activeTrip) return false;
    if (filter === 'idle' && d.activeTrip) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.vehicle || '').toLowerCase().includes(q) ||
        (d.activeTrip?.passengerName || '').toLowerCase().includes(q) ||
        (d.activeTrip?.pickup || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const liveGpsCount = drivers.filter((d) => typeof d.lat === 'number' && typeof d.lng === 'number').length;

  return (
    <div className="fleet-view-container">
      {/* Header bar */}
      <div className="fleet-view-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="fleet-live-pulse" />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Live Driver Drive View</h2>
          <span className="driver-brand-tag" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
            {liveGpsCount} Live GPS • {drivers.length - liveGpsCount} Standby ({drivers.length} Visible)
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
              Available
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
              visibleDrivers.map((d, idx) => {
                const isSelected = d.id === selectedDriverId;
                const loc = getDriverLocation(d, idx);
                const trip = d.activeTrip;

                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`fleet-driver-card${isSelected ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedDriverId(d.id);
                      if (mapRef.current) {
                        mapRef.current.setView([loc.lat, loc.lng], 14, { animate: true });
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{d.name}</strong>
                      <span className={`fleet-status-pill ${trip ? 'active' : loc.isLive ? 'idle' : 'standby'}`}>
                        {trip ? trip.driverStatus.replace('_', ' ').toUpperCase() : loc.isLive ? 'LIVE GPS' : 'STANDBY'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--ink-mid)' }}>
                      <span><CarFront size={13} style={{ display: 'inline', marginRight: 3 }} /> {d.vehicle}</span>
                      <span>•</span>
                      <span>{loc.isLive ? `${d.speed} mph` : 'Awaiting Phone GPS'}</span>
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

                  <div style={{ marginTop: 8, fontSize: 11, color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Navigation size={13} />
                    {typeof selectedDriver.lat === 'number'
                      ? 'Live GPS Tracked: Chauffeur broadcast streaming'
                      : 'Standby on Map: Awaiting phone GPS broadcast'}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-mid)' }}>
                  Driver is on duty and available for assignments.
                </div>
              )}

              {/* Dispatcher Location Controls */}
              <div className="fleet-dispatch-box" style={{ marginTop: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-mid)' }}>
                  Dispatcher Position &amp; Test Controls:
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {selectedDriver.activeTrip?.pickup && (
                    <button
                      type="button"
                      className="fleet-action-btn place-pickup"
                      onClick={() => void handlePlaceAtPickup(selectedDriver)}
                      disabled={actionInProgress}
                    >
                      <MapPin size={13} /> Place at Pickup Address
                    </button>
                  )}
                  <button
                    type="button"
                    className="fleet-action-btn place-base"
                    onClick={() => void handlePlaceAtBase(selectedDriver)}
                    disabled={actionInProgress}
                  >
                    <Building size={13} /> Place at Teterboro Base
                  </button>
                  <button
                    type="button"
                    className={`fleet-action-btn ${simulatingDriverId === selectedDriver.id ? 'sim-stop' : 'sim-start'}`}
                    onClick={() => void toggleSimulation(selectedDriver)}
                  >
                    {simulatingDriverId === selectedDriver.id ? <Square size={13} /> : <Play size={13} />}
                    {simulatingDriverId === selectedDriver.id ? 'Stop Simulation' : 'Simulate Live Drive (36 mph)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
