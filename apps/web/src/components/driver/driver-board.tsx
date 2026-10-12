import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Baby,
  Calendar,
  CarFront,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  DoorOpen,
  ExternalLink,
  Flag,
  Loader2,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  Phone,
  Plane,
  Radio,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import pb from '@/lib/pocketbase-client';
import { useDriverAuth, type DriverRecord } from '@/hooks/use-driver-auth';
import {
  compareByPickup,
  normalizeStatus,
  vehicles,
  type Vehicle,
} from '@/lib/reservation';
import { StatusBadge } from '@/components/dispatch/status-badge';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export type AssignedTrip = {
  id: string;
  service: string;
  pickup: string;
  dropoff: string;
  extraStop: string;
  pickupAt: string;
  returnAt: string;
  hours: number;
  vehicle: string;
  passengers: number;
  name: string;
  email: string;
  phone: string;
  flight: string;
  notes: string;
  driverNotes?: string;
  driverStatus?: string;
  carSeat: boolean;
  insidePickup: boolean;
  status: string;
  estimatedFareText: string;
  pickupLocal: string;
  sourceName: string;
};

function clock(iso: string) {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function dayLabel(iso: string) {
  if (!iso) return 'Date to confirm';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date to confirm';
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return 'Today, ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function googleMapsUrl(addr: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
}

function wazeUrl(addr: string) {
  return `https://waze.com/ul?q=${encodeURIComponent(addr)}&navigate=yes`;
}

function appleMapsUrl(addr: string) {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(addr)}`;
}

function headingName(deg: number): string {
  if (deg >= 337.5 || deg < 22.5) return 'N';
  if (deg >= 22.5 && deg < 67.5) return 'NE';
  if (deg >= 67.5 && deg < 112.5) return 'E';
  if (deg >= 112.5 && deg < 157.5) return 'SE';
  if (deg >= 157.5 && deg < 202.5) return 'S';
  if (deg >= 202.5 && deg < 247.5) return 'SW';
  if (deg >= 247.5 && deg < 292.5) return 'W';
  return 'NW';
}

/**
 * Maps the reservation record into a 0-4 lifecycle step:
 * 0: Assigned (waiting for driver to accept)
 * 1: Accepted (driver accepted the ride)
 * 2: Arrived (driver arrived at pickup)
 * 3: On Board (passenger picked up, ride in progress)
 * 4: Completed (passenger dropped off, trip finished)
 */
function getTripStage(t: AssignedTrip): number {
  const st = normalizeStatus(t.status);
  if (st === 'completed' || t.driverStatus === 'dropped_off') return 4;
  if (t.driverStatus === 'on_board') return 3;
  if (t.driverStatus === 'arrived') return 2;
  if (t.driverStatus === 'accepted') return 1;
  return 0;
}

export function DriverBoard({
  driverId,
  driverEmail,
}: {
  driverId: string;
  driverEmail: string;
}) {
  const { logout, refresh } = useDriverAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<AssignedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab & search filtering - Drive View HUD is permanently open and default
  const [activeTab, setActiveTab] = useState<'active' | 'drive' | 'completed' | 'all' | 'settings'>('drive');
  const [search, setSearch] = useState('');
  const [driveMenuOpen, setDriveMenuOpen] = useState(false);

  // Trip action progression state
  const [actingTripId, setActingTripId] = useState('');
  const [actionError, setActionError] = useState('');

  // GPS Broadcast & Drive View State
  const [gpsStatus, setGpsStatus] = useState<'requesting' | 'active' | 'standby' | 'denied' | 'unsupported'>('requesting');
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; speed: number; heading: number } | null>(null);
  const [driveViewTripId, setDriveViewTripId] = useState<string | null>(null);

  // Notes state per trip
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState('');
  const [savedNoteId, setSavedNoteId] = useState('');

  // Profile editing state
  const [profile, setProfile] = useState({ name: '', phone: '', vehicle: 'sedan' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password change state
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  async function loadTrips() {
    setError('');
    try {
      const records = await pb.collection('reservations').getFullList<AssignedTrip>({
        sort: 'pickupAt',
        requestKey: null,
      });
      setTrips(records);
      // Initialize notes draft from loaded trips
      const initialNotes: Record<string, string> = {};
      for (const r of records) {
        if (r.driverNotes) initialNotes[r.id] = r.driverNotes;
      }
      setNotesDraft(initialNotes);

      // Auto-select active or upcoming ride so Drive View opens immediately
      const active = records.find((t) => {
        const stage = getTripStage(t);
        return stage >= 1 && stage <= 3;
      });
      if (active) {
        setDriveViewTripId(active.id);
      } else {
        const sortedRecs = [...records].sort(compareByPickup);
        const upcoming = sortedRecs.find((t) => getTripStage(t) < 4);
        if (upcoming) setDriveViewTripId(upcoming.id);
        else if (sortedRecs.length > 0) setDriveViewTripId(sortedRecs[0].id);
      }
    } catch {
      setError('Couldn’t load your trips. Please sign in again.');
    }
  }

  async function loadProfile() {
    if (!driverId) return;
    try {
      const rec = await pb.collection('drivers').getOne<DriverRecord>(driverId);
      setProfile({
        name: rec.name ?? '',
        phone: rec.phone ?? '',
        vehicle: rec.vehicle ?? 'sedan',
      });
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    setLoading(true);
    void loadTrips().finally(() => setLoading(false));
    void loadProfile();
  }, [driverId]);

  // Realtime: keep the trip list live so new assignments appear instantly
  useEffect(() => {
    void pb
      .collection('reservations')
      .subscribe('*', (e) => {
        setTrips((prev) => {
          if (e.action === 'delete') return prev.filter((r) => r.id !== e.record.id);
          const next = e.record as unknown as AssignedTrip;
          return prev.some((r) => r.id === next.id)
            ? prev.map((r) => (r.id === next.id ? next : r))
            : [next, ...prev];
        });
      })
      .catch(() => {});
    return () => {
      void pb.collection('reservations').unsubscribe('*').catch(() => {});
    };
  }, []);

  /**
   * Action handler: Accept, Arrive, Pick Up, Drop Off
   */
  async function handleTripAction(tripId: string, action: 'accept' | 'arrive' | 'pickup' | 'dropoff') {
    if (actingTripId) return;
    setActingTripId(tripId);
    setActionError('');

    // Optimistic local update
    const previous = trips.find((t) => t.id === tripId);
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        if (action === 'accept') {
          return { ...t, driverStatus: 'accepted', status: t.status === 'pending' ? 'confirmed' : t.status };
        }
        if (action === 'arrive') {
          return { ...t, driverStatus: 'arrived' };
        }
        if (action === 'pickup') {
          return { ...t, driverStatus: 'on_board' };
        }
        if (action === 'dropoff') {
          return { ...t, driverStatus: 'dropped_off', status: 'completed' };
        }
        return t;
      })
    );

    try {
      const res = await fetch('/api/driver-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({ tripId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update trip status.');
      }

      // If driver doesn't have active GPS lock, broadcast the pickup geocode immediately
      if (!lastCoords && previous?.pickup) {
        void (async () => {
          try {
            const gRes = await fetch(`/api/geocode?address=${encodeURIComponent(previous.pickup)}`);
            if (gRes.ok) {
              const gData = await gRes.json();
              if (typeof gData.lat === 'number' && typeof gData.lng === 'number') {
                setLastCoords({ lat: gData.lat, lng: gData.lng, speed: 0, heading: 0 });
                setGpsStatus('active');
                await fetch('/api/driver-location', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${pb.authStore.token}`,
                  },
                  body: JSON.stringify({
                    lat: gData.lat,
                    lng: gData.lng,
                    heading: 0,
                    speed: 0,
                    tripId,
                    onDuty: true,
                  }),
                });
              }
            }
          } catch {}
        })();
      }
    } catch (err) {
      // Revert optimistic update
      if (previous) {
        setTrips((prev) => prev.map((t) => (t.id === tripId ? previous : t)));
      }
      setActionError(err instanceof Error ? err.message : 'Could not update trip. Please try again.');
    } finally {
      setActingTripId('');
    }
  }

  /**
   * Saves or updates a driver's note for a specific trip
   */
  async function handleSaveNote(tripId: string) {
    if (savingNoteId) return;
    setSavingNoteId(tripId);
    const noteContent = (notesDraft[tripId] || '').trim();

    try {
      const res = await fetch('/api/driver-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({ tripId, action: 'note', note: noteContent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save note.');
      }
      setTrips((prev) =>
        prev.map((t) => (t.id === tripId ? { ...t, driverNotes: noteContent } : t))
      );
      setSavedNoteId(tripId);
      window.setTimeout(() => setSavedNoteId(''), 2500);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save note.');
    } finally {
      setSavingNoteId('');
    }
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingProfile || !driverId) return;
    setSavingProfile(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      await pb.collection('drivers').update(driverId, {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        vehicle: profile.vehicle,
      });
      await refresh();
      setProfileSaved(true);
    } catch {
      setProfileError('Couldn’t save your profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingPw || !driverId) return;
    if (pw.password.length < 8) {
      setPwError('Choose a password of at least 8 characters.');
      return;
    }
    if (pw.password !== pw.confirm) {
      setPwError('The passwords don’t match.');
      return;
    }
    setSavingPw(true);
    setPwError('');
    setPwSaved(false);
    try {
      await pb.collection('drivers').update(driverId, {
        password: pw.password,
        passwordConfirm: pw.confirm,
      });
      setPw({ password: '', confirm: '' });
      setPwSaved(true);
    } catch {
      setPwError('Couldn’t change your password. Please try again.');
    } finally {
      setSavingPw(false);
    }
  }

  function signOut() {
    logout();
    navigate('/driver/login');
  }

  // Filtered trips
  const sorted = useMemo(() => [...trips].sort(compareByPickup), [trips]);

  const activeRide = useMemo(() => {
    return trips.find((t) => {
      const stage = getTripStage(t);
      return stage >= 1 && stage <= 3;
    });
  }, [trips]);

  // Drive View auto-selection: keep active or next assigned ride locked into the cockpit
  useEffect(() => {
    if (trips.length === 0) return;
    const currentExists = trips.some((t) => t.id === driveViewTripId);
    if (!driveViewTripId || !currentExists) {
      if (activeRide) {
        setDriveViewTripId(activeRide.id);
      } else {
        const upcoming = sorted.find((t) => getTripStage(t) < 4);
        if (upcoming) setDriveViewTripId(upcoming.id);
        else if (sorted.length > 0) setDriveViewTripId(sorted[0].id);
      }
    }
  }, [trips, activeRide, sorted, driveViewTripId]);

  async function reportDriverGps(lat: number, lng: number, heading: number, speedMph: number) {
    try {
      await fetch('/api/driver-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({
          lat,
          lng,
          heading,
          speed: speedMph,
          tripId: activeRide?.id,
          onDuty: true,
        }),
      });
    } catch {
      // silent
    }
  }

  async function broadcastCurrentOrPickup() {
    setActionError('');
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const heading = pos.coords.heading || 0;
        const speedMph = pos.coords.speed ? Math.round(pos.coords.speed * 2.23694) : 0;
        setGpsStatus('active');
        setLastCoords({ lat, lng, speed: speedMph, heading });
        void reportDriverGps(lat, lng, heading, speedMph);
      },
      async () => {
        // Fallback to active ride pickup address or fleet base
        const targetAddr = activeRide?.pickup || sorted[0]?.pickup;
        if (targetAddr) {
          try {
            const res = await fetch(`/api/geocode?address=${encodeURIComponent(targetAddr)}`);
            if (res.ok) {
              const data = await res.json();
              if (typeof data.lat === 'number' && typeof data.lng === 'number') {
                setLastCoords({ lat: data.lat, lng: data.lng, speed: 0, heading: 0 });
                setGpsStatus('active');
                void reportDriverGps(data.lat, data.lng, 0, 0);
                return;
              }
            }
          } catch {}
        }
        // Base fallback: Teterboro Hub
        setLastCoords({ lat: 40.8501, lng: -74.0608, speed: 0, heading: 0 });
        setGpsStatus('standby');
        void reportDriverGps(40.8501, -74.0608, 0, 0);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  // Keep driver GPS broadcast streaming live to dispatch
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('unsupported');
      return;
    }

    let isMounted = true;
    let lastReportTime = 0;

    function handlePosition(pos: GeolocationPosition) {
      if (!isMounted) return;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const heading = pos.coords.heading || 0;
      const speedMph = pos.coords.speed ? Math.round(pos.coords.speed * 2.23694) : 0;

      setGpsStatus('active');
      setLastCoords({ lat, lng, speed: speedMph, heading });

      const now = Date.now();
      if (now - lastReportTime >= 6000) {
        lastReportTime = now;
        void reportDriverGps(lat, lng, heading, speedMph);
      }
    }

    function handleGpsError(err: GeolocationPositionError) {
      if (!isMounted) return;
      if (err.code === err.PERMISSION_DENIED) {
        setGpsStatus('denied');
        return;
      }

      // If high accuracy failed with "Location unavailable" or TIMEOUT,
      // fall back to standard/Wi-Fi/IP location
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        () => {
          if (!isMounted) return;
          setGpsStatus('standby');
          // If active trip exists and no coords set yet, geocode pickup
          if (activeRide?.pickup && !lastCoords) {
            void (async () => {
              try {
                const res = await fetch(`/api/geocode?address=${encodeURIComponent(activeRide.pickup)}`);
                if (res.ok) {
                  const data = await res.json();
                  if (typeof data.lat === 'number' && typeof data.lng === 'number' && isMounted) {
                    setLastCoords({ lat: data.lat, lng: data.lng, speed: 0, heading: 0 });
                    void reportDriverGps(data.lat, data.lng, 0, 0);
                  }
                }
              } catch {}
            })();
          }
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 }
      );
    }

    // High accuracy watch
    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleGpsError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );

    // Periodic heartbeat every 12 seconds with low-accuracy fallback
    const intervalId = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        () => {
          navigator.geolocation.getCurrentPosition(handlePosition, () => {}, {
            enableHighAccuracy: false,
            timeout: 10000,
          });
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }, 12000);

    return () => {
      isMounted = false;
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(intervalId);
    };
  }, [activeRide?.id, activeRide?.pickup]);

  const stats = useMemo(() => {
    const today = new Date();
    let todayCount = 0;
    let activeCount = 0;
    let completedCount = 0;

    for (const t of trips) {
      const stage = getTripStage(t);
      if (stage === 4) {
        completedCount++;
      } else {
        activeCount++;
      }
      if (t.pickupAt) {
        const d = new Date(t.pickupAt);
        if (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        ) {
          todayCount++;
        }
      }
    }
    return {
      total: trips.length,
      active: activeCount,
      completed: completedCount,
      today: todayCount,
    };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    let list = sorted;
    if (activeTab === 'active') {
      list = list.filter((t) => getTripStage(t) < 4);
    } else if (activeTab === 'completed') {
      list = list.filter((t) => getTripStage(t) === 4);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.name || '').toLowerCase().includes(q) ||
          (t.pickup || '').toLowerCase().includes(q) ||
          (t.dropoff || '').toLowerCase().includes(q) ||
          (t.flight || '').toLowerCase().includes(q) ||
          (t.sourceName || '').toLowerCase().includes(q) ||
          (t.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [sorted, activeTab, search]);

  return (
    <main className="dashboard-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="dashboard-header">
        <a
          href="/driver"
          className="page-brand"
          style={{ textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('drive');
          }}
        >
          <span className="brand-mark">E<span>L</span></span>
          <span className="brand-word">ELITELIMOLINK<span className="brand-sub"> / CHAUFFEUR</span></span>
        </a>
        <div className="dashboard-user">
          <button
            type="button"
            className="driver-driveview-pill"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: activeTab === 'drive' ? '#2563eb' : undefined,
              color: activeTab === 'drive' ? '#fff' : undefined,
            }}
            onClick={() => {
              setActiveTab('drive');
              if (activeRide) setDriveViewTripId(activeRide.id);
              else if (sorted.length > 0 && !driveViewTripId) setDriveViewTripId(sorted[0].id);
            }}
            title="Open Driver View HUD"
          >
            <Compass size={13} /> Driver View
          </button>
          <button
            type="button"
            className={`driver-gps-pill ${gpsStatus === 'active' ? 'active' : gpsStatus === 'denied' ? 'denied' : ''}`}
            onClick={() => void broadcastCurrentOrPickup()}
            style={{ cursor: 'pointer', border: 0 }}
            title="Click to refresh or broadcast location"
          >
            <span
              className="driver-duty-dot"
              style={{
                background:
                  gpsStatus === 'active' ? '#22c55e' : gpsStatus === 'denied' ? '#ef4444' : '#eab308',
              }}
            />
            {gpsStatus === 'active'
              ? 'GPS Live'
              : gpsStatus === 'denied'
              ? 'GPS Off (Tap to Set)'
              : gpsStatus === 'standby'
              ? 'Standby (Tap to Send)'
              : 'GPS Connecting…'}
          </button>
          <span className="driver-duty-badge">
            <span className="driver-duty-dot" /> On Duty
          </span>
          <span style={{ fontWeight: 600 }}>{profile.name || driverEmail}</span>
          <ThemeToggle className="theme-toggle compact" />
          <button type="button" className="dashboard-link" onClick={signOut}>
            <LogOut size={14} style={{ display: 'inline', marginRight: 4 }} /> Sign out
          </button>
        </div>
      </header>

      <div className="dashboard-shell">
        <div className="dashboard-intro">
          <span className="eyebrow">CHAUFFEUR PORTAL</span>
          <h1>Driver Mission Center</h1>
          <p>
            Manage active assignments in real time. Accept trips, notify arrival, confirm passenger pickup,
            complete drop-off, and add trip notes.
          </p>
        </div>

        {/* Active Ride In Progress Banner with Instant Drive View Access */}
        {activeRide && (
          <div className="driver-active-banner">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="fleet-live-pulse" />
                <strong style={{ fontSize: 15, color: '#38bdf8' }}>Active Ride In Progress: {activeRide.name || 'Guest'}</strong>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                {getTripStage(activeRide) <= 2 ? `Heading to Pickup: ${activeRide.pickup}` : `En Route to Dropoff: ${activeRide.dropoff}`}
              </p>
            </div>
            <button
              type="button"
              className="driver-driveview-pill"
              style={{ fontSize: 13, padding: '10px 18px', background: '#2563eb', color: '#fff', border: 0 }}
              onClick={() => {
                setDriveViewTripId(activeRide.id);
                setActiveTab('drive');
              }}
            >
              <Compass size={16} /> Open Drive View HUD
            </button>
          </div>
        )}

        {/* Driver Summary Statistics Bar */}
        <div className="driver-stats-grid">
          <div className="driver-stat-card">
            <span className="driver-stat-num">{stats.total}</span>
            <span className="driver-stat-label">Assigned Trips</span>
          </div>
          <div className="driver-stat-card" style={{ borderLeft: '3px solid #2563eb' }}>
            <span className="driver-stat-num" style={{ color: '#2563eb' }}>{stats.today}</span>
            <span className="driver-stat-label">Today’s Schedule</span>
          </div>
          <div className="driver-stat-card" style={{ borderLeft: '3px solid #0284c7' }}>
            <span className="driver-stat-num" style={{ color: '#0284c7' }}>{stats.active}</span>
            <span className="driver-stat-label">Active / Pending</span>
          </div>
          <div className="driver-stat-card" style={{ borderLeft: '3px solid #16a34a' }}>
            <span className="driver-stat-num" style={{ color: '#16a34a' }}>{stats.completed}</span>
            <span className="driver-stat-label">Completed Rides</span>
          </div>
        </div>

        {/* Filter and Tab Control Bar */}
        <div className="driver-filter-bar">
          <div className="driver-tab-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'active'}
              className={`driver-tab-btn${activeTab === 'active' ? ' active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <Sparkles size={14} /> Active &amp; Upcoming
              <span className="badge-pill">{stats.active}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'drive'}
              className={`driver-tab-btn driver-tab-drive${activeTab === 'drive' ? ' active' : ''}`}
              onClick={() => {
                setActiveTab('drive');
                if (activeRide) {
                  setDriveViewTripId(activeRide.id);
                } else if (sorted.length > 0) {
                  setDriveViewTripId(sorted[0].id);
                }
              }}
            >
              <Compass size={14} /> 🚗 Driver View
              {activeRide && <span className="fleet-live-pulse" />}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'completed'}
              className={`driver-tab-btn${activeTab === 'completed' ? ' active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              <CheckCircle2 size={14} /> Completed
              <span className="badge-pill">{stats.completed}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              className={`driver-tab-btn${activeTab === 'all' ? ' active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Trips
              <span className="badge-pill">{stats.total}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'settings'}
              className={`driver-tab-btn${activeTab === 'settings' ? ' active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={14} /> Profile &amp; Vehicle
            </button>
          </div>

          {activeTab !== 'settings' && (
            <div className="driver-search-wrap">
              <Search size={15} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search passenger, address, flight…"
                aria-label="Search trips"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 10, top: 10, border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--ink-light)' }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {actionError && (
          <p className="form-error" role="alert" style={{ marginBottom: 16 }}>
            {actionError}
          </p>
        )}

        {/* Tab 1, 2, 3: Trips List */}
        {activeTab !== 'settings' ? (
          <div>
            {loading ? (
              <div className="dash-loading"><Loader2 size={20} /> Loading assigned trips…</div>
            ) : error ? (
              <p className="form-error" role="alert">{error}</p>
            ) : filteredTrips.length === 0 ? (
              <div className="reservations-empty" style={{ padding: '48px 20px', background: '#fff', borderRadius: 16, border: '1px solid var(--border-ride)' }}>
                <RefreshCw size={28} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {search ? 'No trips match your search.' : activeTab === 'completed' ? 'No completed trips yet.' : 'No active trips at this moment.'}
                </p>
                <small style={{ color: 'var(--ink-mid)' }}>New rides assigned by dispatch will appear here automatically.</small>
              </div>
            ) : (
              <div>
                {filteredTrips.map((t) => {
                  const stage = getTripStage(t);
                  const st = normalizeStatus(t.status);
                  const round = Boolean(t.returnAt);
                  const isBusy = actingTripId === t.id;
                  const isNoteBusy = savingNoteId === t.id;
                  const isNoteSaved = savedNoteId === t.id;
                  const currentDraft = notesDraft[t.id] ?? t.driverNotes ?? '';

                  return (
                    <article
                      key={t.id}
                      className={`driver-mission-item${stage > 0 && stage < 4 ? ' is-active' : ''}`}
                    >
                      {/* Mission Top Header */}
                      <div className="driver-mission-top">
                        <div>
                          <h2 className="driver-guest-title">
                            <User size={18} color="var(--blue)" />
                            {t.name || 'Unnamed Guest'}
                            {t.sourceName && (
                              <span className="driver-brand-tag">{t.sourceName}</span>
                            )}
                          </h2>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: 'var(--ink-light)', fontWeight: 600 }}>
                              REF: RB-{t.id.slice(-8).toUpperCase()}
                            </span>
                            <StatusBadge value={st} />
                          </div>
                        </div>

                        {/* Pickup Time & Date Chip */}
                        <div className="driver-time-chip">
                          <Clock size={16} color="var(--blue)" />
                          <strong>{clock(t.pickupAt)}</strong>
                          <small>{dayLabel(t.pickupAt)}</small>
                        </div>
                      </div>

                      {/* Route Section with Instant Google Maps Navigation */}
                      <div className="reservation-card-route" style={{ margin: 0 }}>
                        {t.pickup && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                            <span>
                              <span className="pickup-marker" /> <strong>Pickup:</strong> {t.pickup}
                            </span>
                            <a
                              href={googleMapsUrl(t.pickup)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="driver-tool-btn"
                              title="Navigate to Pickup"
                            >
                              <Navigation size={13} color="#2563eb" /> Navigate
                            </a>
                          </div>
                        )}
                        {t.extraStop && (
                          <div>
                            <span className="stop-marker" /> <strong>Extra stop:</strong> {t.extraStop}
                          </div>
                        )}
                        {t.dropoff && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                            <span>
                              <span className="dropoff-marker mini" /> <strong>Dropoff:</strong> {t.dropoff}
                            </span>
                            <a
                              href={googleMapsUrl(t.dropoff)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="driver-tool-btn"
                              title="Navigate to Dropoff"
                            >
                              <Navigation size={13} color="#16a34a" /> Navigate
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Meta Information (Vehicle, Passenger count, Phone, Flight, Special Requests) */}
                      <div className="reservation-card-meta" style={{ margin: 0, gap: 10 }}>
                        {t.vehicle && (
                          <span>
                            <CarFront size={14} /> {vehicles.find((v) => v.id === t.vehicle)?.name ?? t.vehicle}
                          </span>
                        )}
                        {t.passengers > 0 && <span><Users size={14} /> {t.passengers} passengers</span>}
                        {round && <span><RefreshCw size={14} /> Round trip</span>}
                        {t.flight && (
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(t.flight + ' flight status')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="driver-tool-btn"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                          >
                            <Plane size={13} /> Flight {t.flight}
                          </a>
                        )}
                        {t.carSeat && <span style={{ color: '#b45309' }}><Baby size={14} /> Car seat required</span>}
                        {t.insidePickup && <span style={{ color: '#2563eb' }}><DoorOpen size={14} /> Inside pickup / Meet &amp; Greet</span>}
                        {t.phone && (
                          <a
                            href={`tel:${t.phone.replace(/[^\d+]/g, '')}`}
                            className="driver-tool-btn"
                            style={{ color: '#1d4ed8', fontWeight: 800 }}
                          >
                            <Phone size={13} /> Call {t.phone}
                          </a>
                        )}
                      </div>

                      {/* Customer / Dispatch Notes if present */}
                      {t.notes && (
                        <div style={{ fontSize: 12, background: '#f8fafc', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', color: 'var(--ink-mid)' }}>
                          <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 2 }}>Passenger Instructions:</strong>
                          {t.notes}
                        </div>
                      )}

                      {/* Drive View HUD Shortcut Button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '6px 0' }}>
                        <button
                          type="button"
                          className="driver-driveview-pill"
                          onClick={() => {
                            setDriveViewTripId(t.id);
                            setActiveTab('drive');
                          }}
                          title="Open Cockpit Drive View HUD"
                        >
                          <Compass size={14} /> 🚗 Drive View HUD
                        </button>
                        {stage >= 1 && stage <= 3 && (
                          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span className="fleet-live-pulse" /> Live Trip GPS Active
                          </span>
                        )}
                      </div>

                      {/* 4-Step Interactive Chauffeur Workflow Pipeline */}
                      <div className="driver-pipeline-container">
                        <div className={`driver-pipe-step${stage >= 1 ? ' done' : stage === 0 ? ' current' : ''}`}>
                          <span className="driver-pipe-num">{stage >= 1 ? '✓' : '1'}</span>
                          <span>Accept Ride</span>
                        </div>
                        <div className={`driver-pipe-divider${stage >= 1 ? ' done' : ''}`} />

                        <div className={`driver-pipe-step${stage >= 2 ? ' done' : stage === 1 ? ' current' : ''}`}>
                          <span className="driver-pipe-num">{stage >= 2 ? '✓' : '2'}</span>
                          <span>Arrived</span>
                        </div>
                        <div className={`driver-pipe-divider${stage >= 2 ? ' done' : ''}`} />

                        <div className={`driver-pipe-step${stage >= 3 ? ' done' : stage === 2 ? ' current' : ''}`}>
                          <span className="driver-pipe-num">{stage >= 3 ? '✓' : '3'}</span>
                          <span>On Board</span>
                        </div>
                        <div className={`driver-pipe-divider${stage >= 3 ? ' done' : ''}`} />

                        <div className={`driver-pipe-step${stage === 4 ? ' done' : stage === 3 ? ' current' : ''}`}>
                          <span className="driver-pipe-num">{stage === 4 ? '✓' : '4'}</span>
                          <span>Drop Off</span>
                        </div>
                      </div>

                      {/* Driver Action Control Buttons */}
                      <div className="driver-actions-bar">
                        {stage === 0 && (
                          <button
                            type="button"
                            className="driver-primary-btn btn-accept"
                            disabled={isBusy}
                            onClick={() => handleTripAction(t.id, 'accept')}
                          >
                            {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2.5} />}
                            Accept Ride
                          </button>
                        )}

                        {stage === 1 && (
                          <button
                            type="button"
                            className="driver-primary-btn btn-arrive"
                            disabled={isBusy}
                            onClick={() => handleTripAction(t.id, 'arrive')}
                          >
                            {isBusy ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} strokeWidth={2.5} />}
                            I’ve Arrived at Pickup
                          </button>
                        )}

                        {stage === 2 && (
                          <button
                            type="button"
                            className="driver-primary-btn btn-pickup"
                            disabled={isBusy}
                            onClick={() => handleTripAction(t.id, 'pickup')}
                          >
                            {isBusy ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} strokeWidth={2.5} />}
                            Pick Up Passenger (On Board)
                          </button>
                        )}

                        {stage === 3 && (
                          <button
                            type="button"
                            className="driver-primary-btn btn-dropoff"
                            disabled={isBusy}
                            onClick={() => handleTripAction(t.id, 'dropoff')}
                          >
                            {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} strokeWidth={2.5} />}
                            Drop Off Passenger (Complete Trip)
                          </button>
                        )}

                        {stage === 4 && (
                          <div className="driver-primary-btn btn-done">
                            <CheckCircle2 size={18} /> Ride Completed
                          </div>
                        )}
                      </div>

                      {/* Dedicated Driver Trip Notes Area (Şoför Notu Bölümü) */}
                      <div className="driver-note-box">
                        <div className="driver-note-head">
                          <span>Driver Trip Notes &amp; Summary</span>
                          {t.driverNotes && (
                            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                              ✓ Saved on Record
                            </span>
                          )}
                        </div>

                        {t.driverNotes && (
                          <div className="driver-notes-history">
                            {t.driverNotes}
                          </div>
                        )}

                        <textarea
                          className="driver-note-textarea"
                          rows={2}
                          value={currentDraft}
                          onChange={(e) =>
                            setNotesDraft((prev) => ({ ...prev, [t.id]: e.target.value }))
                          }
                          placeholder={
                            stage === 4
                              ? 'Add drop-off notes (e.g. passenger safely dropped off at Terminal 4, toll receipt $15.50, smooth trip)...'
                              : 'Add notes about this ride (toll fees, luggage count, special requests, passenger comments)...'
                          }
                        />

                        <button
                          type="button"
                          className={`driver-note-save-btn${isNoteSaved ? ' saved' : ''}`}
                          disabled={isNoteBusy}
                          onClick={() => handleSaveNote(t.id)}
                        >
                          {isNoteBusy ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : isNoteSaved ? (
                            <Check size={13} strokeWidth={3} />
                          ) : (
                            <Save size={13} />
                          )}
                          {isNoteSaved ? 'Saved!' : isNoteBusy ? 'Saving…' : 'Save Driver Note'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Tab 4: Driver Profile & Vehicle Settings */
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
            <form className="dash-card" onSubmit={saveProfile}>
              <div className="dash-card-head">
                <span className="dash-card-icon"><Users size={18} /></span>
                <div>
                  <h2>Your Chauffeur Profile</h2>
                  <p>Visible to central dispatch when assigning trips.</p>
                </div>
              </div>
              <label className="input-label">Full name
                <input
                  className="standard-input"
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label className="input-label" style={{ marginTop: 13 }}>Phone number
                <input
                  className="standard-input"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
              </label>
              <label className="input-label" style={{ marginTop: 13 }}>Preferred Vehicle
                <select
                  className="standard-input"
                  value={profile.vehicle}
                  onChange={(e) => setProfile((p) => ({ ...p, vehicle: e.target.value as Vehicle }))}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.capacity} passengers)
                    </option>
                  ))}
                </select>
              </label>
              {profileError && (
                <p className="form-error" role="alert" style={{ marginTop: 13 }}>
                  {profileError}
                </p>
              )}
              <div className="dash-actions" style={{ marginTop: 18 }}>
                <button type="submit" className="primary-button" disabled={savingProfile}>
                  {savingProfile ? (
                    'Saving…'
                  ) : (
                    <>
                      {profileSaved ? <Check size={17} /> : <Save size={17} />}
                      {profileSaved ? 'Profile Saved' : 'Save Profile'}
                    </>
                  )}
                </button>
              </div>
            </form>

            <form className="dash-card" onSubmit={savePassword}>
              <div className="dash-card-head">
                <span className="dash-card-icon"><LockKeyhole size={18} /></span>
                <div>
                  <h2>Security &amp; Password</h2>
                  <p>Choose and control your private password.</p>
                </div>
              </div>
              <label className="input-label">New password
                <input
                  className="standard-input"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={pw.password}
                  onChange={(e) => setPw((p) => ({ ...p, password: e.target.value }))}
                />
              </label>
              <label className="input-label" style={{ marginTop: 13 }}>Confirm new password
                <input
                  className="standard-input"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                />
              </label>
              {pwError && (
                <p className="form-error" role="alert" style={{ marginTop: 13 }}>
                  {pwError}
                </p>
              )}
              <div className="dash-actions" style={{ marginTop: 18 }}>
                <button type="submit" className="primary-button" disabled={savingPw}>
                  {savingPw ? (
                    'Updating…'
                  ) : (
                    <>
                      {pwSaved ? <Check size={17} /> : <Save size={17} />}
                      {pwSaved ? 'Password Updated' : 'Update Password'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Chauffeur In-Vehicle Drive View Fullscreen Cockpit HUD (Always Open in Drive Mode) */}
      {(activeTab === 'drive' || driveViewTripId) && (() => {
        const t = driveViewTripId
          ? trips.find((x) => x.id === driveViewTripId)
          : (activeRide || sorted.find((x) => getTripStage(x) < 4) || sorted[0] || null);

        // Standby Cockpit HUD when no trip is currently assigned
        if (!t) {
          return (
            <div className="driver-driveview-modal" role="dialog" aria-modal="true" aria-label="Chauffeur Standby Cockpit">
              {/* Standby Drawer */}
              {driveMenuOpen && (
                <div
                  className="trip-scrim"
                  style={{ zIndex: 100000, background: 'rgba(0,0,0,0.65)' }}
                  onClick={() => setDriveMenuOpen(false)}
                >
                  <div className="driver-drivemenu-drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="driver-drivemenu-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="fleet-live-pulse" />
                        <strong style={{ fontSize: 15, color: '#38bdf8' }}>Driver View Menu</strong>
                      </div>
                      <button type="button" onClick={() => setDriveMenuOpen(false)} aria-label="Close menu">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="driver-drivemenu-body">
                      <div className="driver-drivemenu-section">
                        <span className="driver-drivemenu-label">Assigned Missions</span>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                          No active rides assigned. Central Dispatch will stream new assignments directly to your HUD.
                        </p>
                      </div>

                      <div className="driver-drivemenu-section">
                        <span className="driver-drivemenu-label">Quick Contacts</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <a href="tel:+12015550199" className="driver-drivemenu-link">
                            <Phone size={15} color="#eab308" /> Call Central Dispatch (Office)
                          </a>
                        </div>
                      </div>

                      <div className="driver-drivemenu-section">
                        <span className="driver-drivemenu-label">Mission Center</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <button
                            type="button"
                            className="driver-drivemenu-link"
                            onClick={() => {
                              setDriveMenuOpen(false);
                              setActiveTab('all');
                            }}
                          >
                            <CheckCircle2 size={15} /> All Trips Schedule
                          </button>
                          <button
                            type="button"
                            className="driver-drivemenu-link"
                            onClick={() => {
                              setDriveMenuOpen(false);
                              setActiveTab('settings');
                            }}
                          >
                            <Settings size={15} /> Chauffeur Profile &amp; Vehicle
                          </button>
                          <button
                            type="button"
                            className="driver-drivemenu-link"
                            style={{ color: '#ef4444' }}
                            onClick={() => {
                              setDriveMenuOpen(false);
                              signOut();
                            }}
                          >
                            <LogOut size={15} /> Sign Out (Chauffeur Portal)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Standby Topbar */}
              <header className="driver-driveview-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="driver-tool-btn"
                    style={{ background: '#2563eb', color: '#fff', border: 0, fontWeight: 800 }}
                    onClick={() => setDriveMenuOpen(true)}
                    aria-label="Open Driver View Menu"
                  >
                    <Menu size={16} /> Driver Menu
                  </button>
                  <button
                    type="button"
                    className="driver-tool-btn"
                    style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
                    onClick={() => setActiveTab('all')}
                    title="View All Scheduled Trips"
                  >
                    <Calendar size={14} /> All Trips
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="fleet-live-pulse" />
                    <strong style={{ fontSize: 15, letterSpacing: '.03em', color: '#fff' }}>
                      DRIVE VIEW · CHAUFFEUR STANDBY
                    </strong>
                    <span style={{ fontSize: 12, color: '#38bdf8', fontWeight: 700 }}>
                      (Awaiting Dispatch Assignment)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <a
                    href="tel:+12015550199"
                    className="driver-tool-btn"
                    style={{ background: '#0284c7', color: '#fff', border: 0, fontWeight: 800 }}
                  >
                    <Phone size={14} /> Dispatch Office
                  </a>
                </div>
              </header>

              {/* Standby HUD Body */}
              <div className="driver-driveview-hud">
                <div className="driver-hud-destination">
                  <div className="driver-hud-dest-label">
                    <MapPin size={16} color="#38bdf8" />
                    <span>Cockpit Status · Standby &amp; Telemetry Active</span>
                  </div>
                  <h2 className="driver-hud-dest-address">Awaiting Next Dispatch Assignment</h2>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
                    Your vehicle is connected live to Central Dispatch. When a mission is assigned to your vehicle, your Cockpit HUD will automatically activate with turn-by-turn navigation and passenger routing.
                  </p>
                  <div className="driver-hud-nav-buttons">
                    <a
                      href="tel:+12015550199"
                      className="driver-hud-nav-btn google"
                    >
                      <Phone size={18} /> Call Dispatch (201) 555-0199
                    </a>
                    <button
                      type="button"
                      className="driver-hud-nav-btn apple"
                      onClick={() => void broadcastCurrentOrPickup()}
                    >
                      <Radio size={18} /> Ping GPS to Dispatch
                    </button>
                  </div>
                </div>

                {/* Telemetry Readout */}
                <div className="driver-hud-telemetry">
                  <div className="driver-hud-tele-card">
                    <span className="driver-hud-tele-val">{lastCoords?.speed ?? 0} MPH</span>
                    <span className="driver-hud-tele-lbl">Vehicle Speed</span>
                  </div>
                  <div className="driver-hud-tele-card">
                    <span className="driver-hud-tele-val">
                      {headingName(lastCoords?.heading ?? 0)} ({Math.round(lastCoords?.heading ?? 0)}°)
                    </span>
                    <span className="driver-hud-tele-lbl">Compass Heading</span>
                  </div>
                  <div className="driver-hud-tele-card">
                    <button
                      type="button"
                      onClick={() => void broadcastCurrentOrPickup()}
                      style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
                      title="Tap to refresh location broadcast"
                    >
                      <span className="driver-hud-tele-val" style={{ fontSize: 15, color: gpsStatus === 'active' ? '#4ade80' : '#fbbf24', display: 'block' }}>
                        {gpsStatus === 'active'
                          ? '🟢 Live GPS Stream'
                          : gpsStatus === 'denied'
                          ? '🔴 GPS Off (Tap to Set)'
                          : '🟡 Standby (Tap to Send)'}
                      </span>
                      <span className="driver-hud-tele-lbl">Dispatch Link 📡</span>
                    </button>
                  </div>
                  <div className="driver-hud-tele-card">
                    <span className="driver-hud-tele-val">{profile.vehicle?.toUpperCase() || 'SEDAN'}</span>
                    <span className="driver-hud-tele-lbl">Assigned Vehicle</span>
                  </div>
                </div>

                {/* Duty Banner */}
                <div className="driver-hud-big-action done" style={{ background: '#131d2e', border: '1px solid #1e293b', color: '#38bdf8' }}>
                  <Sparkles size={22} /> CHAUFFEUR ON DUTY · SYSTEM READY FOR DISPATCH
                </div>
              </div>
            </div>
          );
        }

        const stage = getTripStage(t);
        const isPickupTarget = stage <= 2;
        const targetAddress = isPickupTarget ? t.pickup : t.dropoff;
        const targetLabel = isPickupTarget ? 'Passenger Pickup' : 'Passenger Dropoff';
        const isBusy = actingTripId === t.id;
        const isNoteBusy = savingNoteId === t.id;
        const isNoteSaved = savedNoteId === t.id;
        const currentDraft = notesDraft[t.id] ?? t.driverNotes ?? '';

        return (
          <div className="driver-driveview-modal" role="dialog" aria-modal="true" aria-label="Chauffeur Drive View">
            {/* Driver View Slide-out Menu Drawer */}
            {driveMenuOpen && (
              <div
                className="trip-scrim"
                style={{ zIndex: 100000, background: 'rgba(0,0,0,0.65)' }}
                onClick={() => setDriveMenuOpen(false)}
              >
                <div className="driver-drivemenu-drawer" onClick={(e) => e.stopPropagation()}>
                  <div className="driver-drivemenu-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="fleet-live-pulse" />
                      <strong style={{ fontSize: 15, color: '#38bdf8' }}>Driver View Menu</strong>
                    </div>
                    <button type="button" onClick={() => setDriveMenuOpen(false)} aria-label="Close menu">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="driver-drivemenu-body">
                    {/* Switch Active Mission */}
                    <div className="driver-drivemenu-section">
                      <span className="driver-drivemenu-label">Switch Mission / Assigned Rides</span>
                      {sorted.filter((x) => getTripStage(x) < 4).length === 0 ? (
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No other active trips.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {sorted
                            .filter((x) => getTripStage(x) < 4)
                            .map((trip) => (
                              <button
                                key={trip.id}
                                type="button"
                                className={`driver-drivemenu-item${trip.id === driveViewTripId ? ' active' : ''}`}
                                onClick={() => {
                                  setDriveViewTripId(trip.id);
                                  setDriveMenuOpen(false);
                                }}
                              >
                                <div>
                                  <strong>{trip.name || 'Guest'}</strong>
                                  <small>{clock(trip.pickupAt)} · {trip.pickup?.slice(0, 22)}…</small>
                                </div>
                                {trip.id === driveViewTripId && <Check size={16} color="#38bdf8" />}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Turn-by-Turn Navigation Apps */}
                    <div className="driver-drivemenu-section">
                      <span className="driver-drivemenu-label">Turn-by-Turn GPS Navigation</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {targetAddress && (
                          <>
                            <a
                              href={googleMapsUrl(targetAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="driver-drivemenu-link"
                              onClick={() => setDriveMenuOpen(false)}
                            >
                              <Navigation size={15} color="#3b82f6" /> Launch Google Maps
                            </a>
                            <a
                              href={wazeUrl(targetAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="driver-drivemenu-link"
                              onClick={() => setDriveMenuOpen(false)}
                            >
                              <Compass size={15} color="#0284c7" /> Launch Waze
                            </a>
                            <a
                              href={appleMapsUrl(targetAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="driver-drivemenu-link"
                              onClick={() => setDriveMenuOpen(false)}
                            >
                              <Navigation size={15} color="#94a3b8" /> Launch Apple Maps
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fast Contacts */}
                    <div className="driver-drivemenu-section">
                      <span className="driver-drivemenu-label">Quick Contacts</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {t.phone && (
                          <>
                            <a href={`tel:${t.phone.replace(/[^\d+]/g, '')}`} className="driver-drivemenu-link">
                              <Phone size={15} color="#22c55e" /> Call Passenger ({t.phone})
                            </a>
                            <a href={`sms:${t.phone.replace(/[^\d+]/g, '')}`} className="driver-drivemenu-link">
                              <MessageSquare size={15} color="#38bdf8" /> SMS Passenger
                            </a>
                          </>
                        )}
                        <a href="tel:+12015550199" className="driver-drivemenu-link">
                          <Phone size={15} color="#eab308" /> Call Central Dispatch (Office)
                        </a>
                      </div>
                    </div>

                    {/* Navigation To Other Tabs */}
                    <div className="driver-drivemenu-section">
                      <span className="driver-drivemenu-label">Mission Center</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          type="button"
                          className="driver-drivemenu-link"
                          onClick={() => {
                            setDriveMenuOpen(false);
                            setActiveTab('all');
                          }}
                        >
                          <CheckCircle2 size={15} /> All Trips Schedule
                        </button>
                        <button
                          type="button"
                          className="driver-drivemenu-link"
                          onClick={() => {
                            setDriveMenuOpen(false);
                            setActiveTab('settings');
                          }}
                        >
                          <Settings size={15} /> Chauffeur Profile &amp; Vehicle
                        </button>
                        <button
                          type="button"
                          className="driver-drivemenu-link"
                          style={{ color: '#ef4444' }}
                          onClick={() => {
                            setDriveMenuOpen(false);
                            signOut();
                          }}
                        >
                          <LogOut size={15} /> Sign Out (Chauffeur Portal)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <header className="driver-driveview-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="driver-tool-btn"
                  style={{ background: '#2563eb', color: '#fff', border: 0, fontWeight: 800 }}
                  onClick={() => setDriveMenuOpen(true)}
                  aria-label="Open Driver View Menu"
                >
                  <Menu size={16} /> Driver Menu
                </button>
                <button
                  type="button"
                  className="driver-tool-btn"
                  style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
                  onClick={() => setActiveTab('all')}
                  title="View All Scheduled Trips"
                >
                  <Calendar size={14} /> All Trips
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="fleet-live-pulse" />
                  <strong style={{ fontSize: 15, letterSpacing: '.03em', color: '#fff' }}>
                    DRIVE VIEW · {t.name || 'Guest'}
                  </strong>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    (RB-{t.id.slice(-8).toUpperCase()})
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {t.phone && (
                  <>
                    <a
                      href={`tel:${t.phone.replace(/[^\d+]/g, '')}`}
                      className="driver-tool-btn"
                      style={{ background: '#2563eb', color: '#fff', border: 0, fontWeight: 800 }}
                    >
                      <Phone size={14} /> Call Guest
                    </a>
                    <a
                      href={`sms:${t.phone.replace(/[^\d+]/g, '')}`}
                      className="driver-tool-btn"
                      style={{ background: '#0284c7', color: '#fff', border: 0, fontWeight: 800 }}
                    >
                      <MessageSquare size={14} /> SMS
                    </a>
                  </>
                )}
              </div>
            </header>

            <div className="driver-driveview-hud">
              {/* Destination & Instant Turn-by-Turn GPS Navigation Card */}
              <div className="driver-hud-destination">
                <div className="driver-hud-dest-label">
                  <MapPin size={16} color="#38bdf8" />
                  <span>Next Destination · {targetLabel}</span>
                  {t.flight && (
                    <span style={{ background: '#1e293b', color: '#7dd3fc', padding: '2px 8px', borderRadius: 4, marginLeft: 'auto' }}>
                      Flight: {t.flight}
                    </span>
                  )}
                </div>
                <h2 className="driver-hud-dest-address">{targetAddress || 'Address to be confirmed'}</h2>

                {t.extraStop && (
                  <div style={{ fontSize: 13, color: '#facc15', marginBottom: 14 }}>
                    ⚠️ Extra Stop on route: {t.extraStop}
                  </div>
                )}

                {targetAddress && (
                  <div className="driver-hud-nav-buttons">
                    <a
                      href={googleMapsUrl(targetAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="driver-hud-nav-btn google"
                    >
                      <Navigation size={18} /> Google Maps
                    </a>
                    <a
                      href={wazeUrl(targetAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="driver-hud-nav-btn waze"
                    >
                      <Compass size={18} /> Waze
                    </a>
                    <a
                      href={appleMapsUrl(targetAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="driver-hud-nav-btn apple"
                    >
                      <Navigation size={18} /> Apple Maps
                    </a>
                  </div>
                )}
              </div>

              {/* Chauffeur Telemetry Cockpit Readout */}
              <div className="driver-hud-telemetry">
                <div className="driver-hud-tele-card">
                  <span className="driver-hud-tele-val">{lastCoords?.speed ?? 0} MPH</span>
                  <span className="driver-hud-tele-lbl">Vehicle Speed</span>
                </div>
                <div className="driver-hud-tele-card">
                  <span className="driver-hud-tele-val">
                    {headingName(lastCoords?.heading ?? 0)} ({Math.round(lastCoords?.heading ?? 0)}°)
                  </span>
                  <span className="driver-hud-tele-lbl">Compass Heading</span>
                </div>
                <div className="driver-hud-tele-card">
                  <button
                    type="button"
                    onClick={() => void broadcastCurrentOrPickup()}
                    style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
                    title="Tap to refresh or broadcast location"
                  >
                    <span className="driver-hud-tele-val" style={{ fontSize: 15, color: gpsStatus === 'active' ? '#4ade80' : '#fbbf24', display: 'block' }}>
                      {gpsStatus === 'active'
                        ? '🟢 Live GPS Stream'
                        : gpsStatus === 'denied'
                        ? '🔴 GPS Off (Tap to Set)'
                        : '🟡 Standby (Tap to Send)'}
                    </span>
                    <span className="driver-hud-tele-lbl">Dispatch Link 📡</span>
                  </button>
                </div>
                <div className="driver-hud-tele-card">
                  <span className="driver-hud-tele-val">{clock(t.pickupAt)}</span>
                  <span className="driver-hud-tele-lbl">Scheduled Time</span>
                </div>
              </div>

              {/* Giant Mission Step Progression Button */}
              <div>
                {stage === 0 && (
                  <button
                    type="button"
                    className="driver-hud-big-action accept"
                    disabled={isBusy}
                    onClick={() => handleTripAction(t.id, 'accept')}
                  >
                    {isBusy ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} strokeWidth={3} />}
                    ACCEPT RIDE &amp; START ROUTE
                  </button>
                )}

                {stage === 1 && (
                  <button
                    type="button"
                    className="driver-hud-big-action arrive"
                    disabled={isBusy}
                    onClick={() => handleTripAction(t.id, 'arrive')}
                  >
                    {isBusy ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} strokeWidth={3} />}
                    I’VE ARRIVED AT PICKUP LOCATION
                  </button>
                )}

                {stage === 2 && (
                  <button
                    type="button"
                    className="driver-hud-big-action pickup"
                    disabled={isBusy}
                    onClick={() => handleTripAction(t.id, 'pickup')}
                  >
                    {isBusy ? <Loader2 size={24} className="animate-spin" /> : <UserCheck size={24} strokeWidth={3} />}
                    PASSENGER ON BOARD (PROCEED TO DROPOFF)
                  </button>
                )}

                {stage === 3 && (
                  <button
                    type="button"
                    className="driver-hud-big-action dropoff"
                    disabled={isBusy}
                    onClick={() => handleTripAction(t.id, 'dropoff')}
                  >
                    {isBusy ? <Loader2 size={24} className="animate-spin" /> : <Flag size={24} strokeWidth={3} />}
                    COMPLETE TRIP (PASSENGER SAFELY DROPPED OFF)
                  </button>
                )}

                {stage === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="driver-hud-big-action done">
                      <CheckCircle2 size={24} /> TRIP COMPLETED SUCCESSFULLY
                    </div>
                    {(() => {
                      const nextTrip = sorted.find((x) => x.id !== t.id && getTripStage(x) < 4);
                      if (nextTrip) {
                        return (
                          <button
                            type="button"
                            className="driver-hud-big-action accept"
                            onClick={() => setDriveViewTripId(nextTrip.id)}
                          >
                            <Navigation size={22} /> NEXT MISSION: {nextTrip.name || 'Guest'} ({clock(nextTrip.pickupAt)})
                          </button>
                        );
                      }
                      return (
                        <button
                          type="button"
                          className="driver-hud-big-action arrive"
                          style={{ background: '#1e293b', border: '1px solid #334155' }}
                          onClick={() => {
                            setDriveViewTripId(null);
                            setActiveTab('drive');
                          }}
                        >
                          <Compass size={22} /> RETURN TO STANDBY COCKPIT HUD
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* In-Drive Notes Section */}
              <div className="driver-hud-destination" style={{ padding: 18 }}>
                <div className="driver-hud-dest-label">
                  <span>Trip Notes &amp; Status Report</span>
                  {t.driverNotes && (
                    <span style={{ color: '#4ade80', fontSize: 11, marginLeft: 'auto' }}>
                      ✓ Note recorded in database
                    </span>
                  )}
                </div>
                <textarea
                  className="driver-note-textarea"
                  rows={2}
                  style={{ background: '#090d16', borderColor: '#334155', color: '#fff' }}
                  value={currentDraft}
                  onChange={(e) => setNotesDraft((prev) => ({ ...prev, [t.id]: e.target.value }))}
                  placeholder="Record toll receipts, passenger notes, luggage or delay details..."
                />
                <button
                  type="button"
                  className={`driver-note-save-btn${isNoteSaved ? ' saved' : ''}`}
                  style={{ marginTop: 8 }}
                  disabled={isNoteBusy}
                  onClick={() => handleSaveNote(t.id)}
                >
                  {isNoteBusy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {isNoteSaved ? 'Note Saved!' : isNoteBusy ? 'Saving…' : 'Save Trip Note'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
