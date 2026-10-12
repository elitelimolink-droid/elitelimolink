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
  SunMedium,
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

  // Tab & search filtering - Native App layout defaults to upcoming trips
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all' | 'settings'>('upcoming');
  const [search, setSearch] = useState('');
  const [driveMenuOpen, setDriveMenuOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Trip action progression state
  const [actingTripId, setActingTripId] = useState('');
  const [actionError, setActionError] = useState('');

  // GPS Broadcast, WakeLock & Drive View State
  const [gpsStatus, setGpsStatus] = useState<'requesting' | 'active' | 'standby' | 'denied' | 'unsupported'>('requesting');
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; speed: number; heading: number } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('ell_last_driver_coords');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
            return { lat: parsed.lat, lng: parsed.lng, speed: parsed.speed || 0, heading: parsed.heading || 0 };
          }
        }
      } catch {}
    }
    return null;
  });
  const [screenAwake, setScreenAwake] = useState(true);
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
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            'ell_last_driver_coords',
            JSON.stringify({ lat, lng, speed: speedMph, heading, updatedAt: Date.now() })
          );
        } catch {}
      }
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
          tripId: activeRide?.id || driveViewTripId || undefined,
          onDuty: true,
        }),
      });
    } catch {
      // silent
    }
  }

  // Screen Wake Lock: Keeps the chauffeur's phone screen awake while driving
  useEffect(() => {
    let wakeLockSentinel: any = null;
    let isMounted = true;

    async function enableWakeLock() {
      if (typeof window === 'undefined') return;
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          if (isMounted) setScreenAwake(true);
          wakeLockSentinel.addEventListener('release', () => {
            if (isMounted) setScreenAwake(false);
          });
        }
      } catch {
        if (isMounted) setScreenAwake(false);
      }
    }

    void enableWakeLock();

    // Acquire on first touch/tap if browser requires user gesture
    function onUserGesture() {
      void enableWakeLock();
    }
    window.addEventListener('pointerdown', onUserGesture, { once: true });
    window.addEventListener('touchstart', onUserGesture, { once: true });

    // Re-acquire wake lock and trigger GPS broadcast when phone screen turns on / unlocks
    function onWakeOrFocus() {
      if (document.visibilityState === 'visible') {
        void enableWakeLock();
        void broadcastCurrentOrPickup();
      }
    }

    document.addEventListener('visibilitychange', onWakeOrFocus);
    window.addEventListener('focus', onWakeOrFocus);
    window.addEventListener('pageshow', onWakeOrFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('pointerdown', onUserGesture);
      window.removeEventListener('touchstart', onUserGesture);
      document.removeEventListener('visibilitychange', onWakeOrFocus);
      window.removeEventListener('focus', onWakeOrFocus);
      window.removeEventListener('pageshow', onWakeOrFocus);
      try {
        if (wakeLockSentinel) void wakeLockSentinel.release();
      } catch {}
    };
  }, []);

  // Background GPS Heartbeat Worker: Keeps live GPS streaming even if tab/phone is backgrounded or screen sleeps
  useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    let worker: Worker | null = null;
    let workerUrl = '';
    try {
      const code = `
        var timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage('ping');
              }, 8000);
            }
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([code], { type: 'application/javascript' });
      workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);
      worker.onmessage = () => {
        void broadcastCurrentOrPickup();
      };
      worker.postMessage('start');
    } catch {}

    return () => {
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
      }
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, [activeRide?.id, activeRide?.pickup]);

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
    if (activeTab === 'upcoming') {
      list = list.filter((t) => getTripStage(t) < 4);
    } else if (activeTab === 'past') {
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
    <div className="driver-app-shell">
      {/* Slide-out Menu Drawer containing the Dashboard Stats, Tabs, and Search */}
      {driveMenuOpen && (
        <div
          className="trip-scrim"
          style={{ zIndex: 100000, background: 'rgba(0,0,0,0.65)' }}
          onClick={() => setDriveMenuOpen(false)}
        >
          <div className="driver-drivemenu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="driver-drivemenu-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="brand-mark" style={{ width: 24, height: 24, fontSize: 11, borderRadius: 6 }}>E<span>L</span></span>
                <div>
                  <strong style={{ fontSize: 14, color: '#fff', display: 'block' }}>ELITELIMOLINK</strong>
                  <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>CHAUFFEUR PORTAL</span>
                </div>
              </div>
              <button type="button" onClick={() => setDriveMenuOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>

            <div className="driver-drivemenu-body">
              {/* 1. Chauffeur Stats 2x2 Grid (Moved inside menu) */}
              <div className="driver-drivemenu-section">
                <span className="driver-drivemenu-label">Chauffeur Dashboard Overview</span>
                <div className="driver-drawer-stats">
                  <div className="driver-drawer-stat">
                    <span className="driver-drawer-stat-num">{stats.total}</span>
                    <span className="driver-drawer-stat-label">Assigned Trips</span>
                  </div>
                  <div className="driver-drawer-stat" style={{ borderLeft: '3px solid #2563eb' }}>
                    <span className="driver-drawer-stat-num" style={{ color: '#60a5fa' }}>{stats.today}</span>
                    <span className="driver-drawer-stat-label">Today’s Schedule</span>
                  </div>
                  <div className="driver-drawer-stat" style={{ borderLeft: '3px solid #0284c7' }}>
                    <span className="driver-drawer-stat-num" style={{ color: '#38bdf8' }}>{stats.active}</span>
                    <span className="driver-drawer-stat-label">Active / Pending</span>
                  </div>
                  <div className="driver-drawer-stat" style={{ borderLeft: '3px solid #16a34a' }}>
                    <span className="driver-drawer-stat-num" style={{ color: '#4ade80' }}>{stats.completed}</span>
                    <span className="driver-drawer-stat-label">Completed Rides</span>
                  </div>
                </div>
              </div>

              {/* 2. Navigation Views & Filters (Moved inside menu) */}
              <div className="driver-drivemenu-section">
                <span className="driver-drivemenu-label">Views &amp; Filters</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    type="button"
                    className="driver-drivemenu-link"
                    style={{ background: '#2563eb', color: '#fff' }}
                    onClick={() => {
                      setDriveMenuOpen(false);
                      setIsDriveModalOpen(true);
                      if (activeRide) setDriveViewTripId(activeRide.id);
                      else if (sorted.length > 0 && !driveViewTripId) setDriveViewTripId(sorted[0].id);
                    }}
                  >
                    <Compass size={16} /> 🚗 Driver View HUD
                    {activeRide && <span className="fleet-live-pulse" style={{ marginLeft: 'auto' }} />}
                  </button>
                  <button
                    type="button"
                    className={`driver-drivemenu-link btn-upcoming${activeTab === 'upcoming' ? ' active' : ''}`}
                    onClick={() => {
                      setDriveMenuOpen(false);
                      setActiveTab('upcoming');
                    }}
                  >
                    <Sparkles size={16} color="#818cf8" /> Upcoming Trips
                    <span className="badge-pill" style={{ marginLeft: 'auto', background: '#312e81', color: '#c7d2fe' }}>{stats.active}</span>
                  </button>
                  <button
                    type="button"
                    className={`driver-drivemenu-link btn-past${activeTab === 'past' ? ' active' : ''}`}
                    onClick={() => {
                      setDriveMenuOpen(false);
                      setActiveTab('past');
                    }}
                  >
                    <CheckCircle2 size={16} color="#34d399" /> Completed Rides
                    <span className="badge-pill" style={{ marginLeft: 'auto', background: '#064e3b', color: '#a7f3d0' }}>{stats.completed}</span>
                  </button>
                  <button
                    type="button"
                    className={`driver-drivemenu-link btn-all${activeTab === 'all' ? ' active' : ''}`}
                    onClick={() => {
                      setDriveMenuOpen(false);
                      setActiveTab('all');
                    }}
                  >
                    <Calendar size={16} color="#38bdf8" /> All Trips Schedule
                    <span className="badge-pill" style={{ marginLeft: 'auto', background: '#0c4a6e', color: '#bae6fd' }}>{stats.total}</span>
                  </button>
                  <button
                    type="button"
                    className={`driver-drivemenu-link btn-settings${activeTab === 'settings' ? ' active' : ''}`}
                    onClick={() => {
                      setDriveMenuOpen(false);
                      setActiveTab('settings');
                    }}
                  >
                    <Settings size={16} color="#fbbf24" /> Profile &amp; Vehicle
                  </button>
                </div>
              </div>

              {/* 3. Search & Refresh Filter (Moved inside menu) */}
              <div className="driver-drivemenu-section">
                <span className="driver-drivemenu-label">Search &amp; Sync</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search guest, address, flight…"
                      className="standard-input"
                      style={{ background: '#131d2e', borderColor: '#1e293b', color: '#fff', fontSize: 13, padding: '8px 28px 8px 10px', height: 38 }}
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        style={{ position: 'absolute', right: 8, top: 10, border: 0, background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="driver-tool-btn"
                    style={{ height: 38, padding: '0 12px', background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}
                    onClick={() => void loadTrips()}
                    title="Refresh Schedule"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {/* 4. Switch Mission (if multiple active trips) */}
              {sorted.filter((x) => getTripStage(x) < 4).length > 1 && (
                <div className="driver-drivemenu-section">
                  <span className="driver-drivemenu-label">Switch Mission</span>
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
                            setIsDriveModalOpen(true);
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
                </div>
              )}

              {/* 5. Quick Contacts & Sign Out */}
              <div className="driver-drivemenu-section">
                <span className="driver-drivemenu-label">Assistance &amp; Session</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <a href="tel:+12015550199" className="driver-drivemenu-link btn-dispatch">
                    <Phone size={15} color="#ffffff" /> Call Central Dispatch (Office)
                  </a>
                  <a
                    href="/dashboard"
                    className="driver-drivemenu-link"
                    style={{ background: '#1e3a8a', color: '#93c5fd', fontWeight: 800, border: '1px solid #3b82f6' }}
                    onClick={() => setDriveMenuOpen(false)}
                  >
                    <Compass size={15} color="#93c5fd" /> Operatör Dashboard
                  </a>
                  <button
                    type="button"
                    className="driver-drivemenu-link btn-signout"
                    onClick={() => {
                      setDriveMenuOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut size={15} color="#ffffff" /> Sign Out (Chauffeur Portal)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="driver-app-container">
        {/* App Top Header - Matches native "My Trips" app */}
        <header className="driver-app-header">
          <button
            type="button"
            className="driver-app-menu-btn"
            onClick={() => setDriveMenuOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="driver-app-title">My Trips</h1>
          <div className="driver-app-header-right">
            <a
              href="/dashboard"
              style={{
                textDecoration: 'none',
                fontSize: 11,
                fontWeight: 700,
                color: '#93c5fd',
                background: '#1e293b',
                padding: '5px 9px',
                borderRadius: 6,
                border: '1px solid #334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Operatör Dashboard'a Geç"
            >
              Dashboard →
            </a>
            <span className="driver-duty-badge" title="Live status">
              <span className="driver-duty-dot" /> On Duty
            </span>
            <ThemeToggle className="theme-toggle compact" />
          </div>
        </header>

        {/* Two Native App Tabs (UPCOMING / PAST) */}
        <nav className="driver-app-tabs" aria-label="Trip tabs">
          <button
            type="button"
            className={`driver-app-tab${activeTab === 'upcoming' ? ' active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            UPCOMING
          </button>
          <button
            type="button"
            className={`driver-app-tab${activeTab === 'past' ? ' active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            PAST
          </button>
        </nav>

        {/* Search Active Notification Pill */}
        {search && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
            <span style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>Filtering: "{search}"</span>
            <button type="button" onClick={() => setSearch('')} style={{ border: 0, background: 'transparent', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Clear</button>
          </div>
        )}

        {/* App Content Area */}
        <div className="driver-app-body">
          {actionError && (
            <p className="form-error" role="alert" style={{ marginBottom: 16 }}>
              {actionError}
            </p>
          )}

          {/* Tab 1, 2, 3: Trips List */}
          {activeTab !== 'settings' ? (
            <div>
              {loading ? (
                <div className="dash-loading" style={{ margin: 'auto', padding: '60px 0' }}><Loader2 size={24} className="animate-spin" /> Loading assigned trips…</div>
              ) : error ? (
                <p className="form-error" role="alert">{error}</p>
              ) : filteredTrips.length === 0 ? (
                activeTab === 'upcoming' ? (
                  /* EXACT EMPTY STATE ILLUSTRATION MATCHING USER'S SCREENSHOT */
                  <div className="driver-app-empty">
                    <div className="driver-empty-illustration">
                      <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="68" cy="136" rx="26" ry="7" fill="#000000" opacity="0.7" />
                        <ellipse cx="172" cy="116" rx="15" ry="4.5" fill="#000000" opacity="0.5" />
                        <path d="M 80 130 C 105 100 135 95 170 114" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                        <path d="M172 78 C160 78 150 88 150 100 C150 116 172 130 172 130 C172 130 194 116 194 100 C194 88 184 78 172 78 Z" fill="#38bdf8" />
                        <circle cx="172" cy="98" r="6" fill="#ffffff" />
                        <path d="M68 28 C45 28 26 47 26 70 C26 102 68 132 68 132 C68 132 110 102 110 70 C110 47 91 28 68 28 Z" fill="#2563eb" />
                        <g transform="translate(48, 52)">
                          <path d="M5 16 C5 14 7 12 10 11 L13 6 C14 4 16 3 19 3 L21 3 C24 3 26 4 27 6 L30 11 C33 12 35 14 35 16 L35 25 C35 26.5 34 27.5 32.5 27.5 L31 27.5 L31 29 C31 30.5 29.5 31.5 28 31.5 L27 31.5 C25.5 31.5 24 30.5 24 29 L24 27.5 L16 27.5 L16 29 C16 30.5 14.5 31.5 13 31.5 L12 31.5 C10.5 31.5 9 30.5 9 29 L9 27.5 L7.5 27.5 C6 27.5 5 26.5 5 25 Z" fill="#ffffff" />
                          <path d="M11 11 L13.5 7 C14 6 15 5.5 17 5.5 L23 5.5 C25 5.5 26 6 26.5 7 L29 11 Z" fill="#64748b" opacity="0.6" />
                          <rect x="15" y="18" width="10" height="4" rx="2" fill="#64748b" opacity="0.5" />
                          <circle cx="9" cy="18" r="2.5" fill="#e2e8f0" />
                          <circle cx="31" cy="18" r="2.5" fill="#e2e8f0" />
                        </g>
                      </svg>
                    </div>
                    <h2 className="driver-empty-title">No upcoming trips</h2>
                    <p className="driver-empty-desc">You will see trips needing your attention here</p>
                  </div>
                ) : (
                  <div className="driver-app-empty">
                    <CheckCircle2 size={44} color="#94a3b8" style={{ marginBottom: 16 }} />
                    <h2 className="driver-empty-title">No past trips</h2>
                    <p className="driver-empty-desc">Your completed trips and history will appear here</p>
                  </div>
                )
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

                      {/* High-Impact Driver Route Journey Card (Pickup & Dropoff) */}
                      <div className="driver-route-card">
                        {t.pickup && (
                          <div className="driver-route-leg">
                            <div className="driver-route-leg-head">
                              <span className="driver-route-badge pickup">
                                <MapPin size={13} /> Pickup Location
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {t.flight && (
                                  <a
                                    href={`https://www.google.com/search?q=${encodeURIComponent(t.flight + ' flight status')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="driver-flight-pill"
                                    style={{ textDecoration: 'none' }}
                                    title="Check live flight tracking"
                                  >
                                    <Plane size={11} /> Flight {t.flight}
                                  </a>
                                )}
                                <span className="driver-time-pill">
                                  <Clock size={11} /> {clock(t.pickupAt)}
                                </span>
                              </div>
                            </div>
                            <h3 className="driver-route-address">{t.pickup}</h3>
                            <div className="driver-route-nav-row">
                              <a
                                href={googleMapsUrl(t.pickup)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-route-nav-btn google"
                                title="Navigate to Pickup with Google Maps"
                              >
                                <Navigation size={13} /> Google Maps
                              </a>
                              <a
                                href={wazeUrl(t.pickup)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-route-nav-btn waze"
                                title="Navigate to Pickup with Waze"
                              >
                                <Compass size={13} /> Waze
                              </a>
                              <a
                                href={appleMapsUrl(t.pickup)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-route-nav-btn apple"
                                title="Navigate to Pickup with Apple Maps"
                              >
                                <Navigation size={13} /> Apple Maps
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="driver-route-connector" />

                        {t.extraStop && (
                          <>
                            <div className="driver-route-leg" style={{ background: 'rgba(234, 179, 8, 0.08)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(234, 179, 8, 0.25)' }}>
                              <div className="driver-route-leg-head">
                                <span className="driver-route-badge stop">
                                  ⚠️ Extra Stop
                                </span>
                              </div>
                              <h4 className="driver-route-address" style={{ fontSize: 15 }}>{t.extraStop}</h4>
                              <div className="driver-route-nav-row">
                                <a href={googleMapsUrl(t.extraStop)} target="_blank" rel="noopener noreferrer" className="driver-route-nav-btn google">
                                  <Navigation size={13} /> Google
                                </a>
                                <a href={wazeUrl(t.extraStop)} target="_blank" rel="noopener noreferrer" className="driver-route-nav-btn waze">
                                  <Compass size={13} /> Waze
                                </a>
                                <a href={appleMapsUrl(t.extraStop)} target="_blank" rel="noopener noreferrer" className="driver-route-nav-btn apple">
                                  <Navigation size={13} /> Apple
                                </a>
                              </div>
                            </div>
                            <div className="driver-route-connector" />
                          </>
                        )}

                        {t.dropoff && (
                          <div className="driver-route-leg">
                            <div className="driver-route-leg-head">
                              <span className="driver-route-badge dropoff">
                                <Flag size={13} /> Dropoff Location
                              </span>
                            </div>
                            <h3 className="driver-route-address">{t.dropoff}</h3>
                            <div className="driver-route-nav-row">
                              <a
                                href={googleMapsUrl(t.dropoff)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-route-nav-btn google"
                                title="Navigate to Dropoff with Google Maps"
                              >
                                <Navigation size={13} /> Google Maps
                              </a>
                              <a
                                href={wazeUrl(t.dropoff)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-route-nav-btn waze"
                                title="Navigate to Dropoff with Waze"
                              >
                                <Compass size={13} /> Waze
                              </a>
                              <a
                                href={appleMapsUrl(t.dropoff)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-route-nav-btn apple"
                                title="Navigate to Dropoff with Apple Maps"
                              >
                                <Navigation size={13} /> Apple Maps
                              </a>
                            </div>
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
                            setIsDriveModalOpen(true);
                          }}
                          title="Open Cockpit Drive View HUD"
                        >
                          <Compass size={14} /> 🚗 Open Drive View HUD
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
      </div>

      {/* Chauffeur In-Vehicle Drive View Fullscreen Cockpit HUD (When Driver Opens It) */}
      {isDriveModalOpen && (() => {
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
                    <span className="brand-mark" style={{ width: 24, height: 24, fontSize: 11, borderRadius: 6 }}>E<span>L</span></span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '.04em' }}>ELITELIMOLINK</span>
                  </div>
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
                  <span className="driver-wakelock-pill" title="Screen Wake Lock is active">
                    <SunMedium size={12} /> Screen Awake
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="fleet-live-pulse" />
                    <strong style={{ fontSize: 14, color: '#fff' }}>
                      STANDBY COCKPIT
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="driver-tool-btn"
                    style={{ background: '#334155', color: '#fff', border: 0, fontWeight: 700 }}
                    onClick={() => setIsDriveModalOpen(false)}
                  >
                    <X size={15} /> Exit HUD
                  </button>
                  <a
                    href="tel:+12015550199"
                    className="driver-tool-btn"
                    style={{ background: '#0284c7', color: '#fff', border: 0, fontWeight: 800 }}
                  >
                    <Phone size={13} /> Dispatch Office
                  </a>
                </div>
              </header>

              {/* Standby HUD Body */}
              <div className="driver-driveview-hud">
                <div className="driver-hud-destination">
                  <div className="driver-hud-dest-label">
                    <MapPin size={15} color="#38bdf8" />
                    <span>CHAUFFEUR STATUS</span>
                    <span className="driver-time-pill" style={{ color: '#4ade80' }}>
                      <span className="driver-duty-dot" style={{ background: '#22c55e' }} /> On Duty
                    </span>
                  </div>
                  <h2 className="driver-hud-dest-address">Awaiting Next Dispatch Assignment</h2>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>
                    Your vehicle is connected live to Central Dispatch. When an assignment is sent, your HUD navigation activates automatically.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    <a
                      href="tel:+12015550199"
                      className="driver-hud-nav-btn google"
                      style={{ padding: '12px 14px', fontSize: 14 }}
                    >
                      <Phone size={16} /> Call Dispatch Office (201) 555-0199
                    </a>
                  </div>
                </div>

                {/* Duty Ready Banner */}
                <div className="driver-hud-big-action done" style={{ background: '#131d2e', border: '1px solid #1e293b', color: '#38bdf8' }}>
                  <Sparkles size={18} /> READY FOR DISPATCH ASSIGNMENT
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
                  <span className="brand-mark" style={{ width: 24, height: 24, fontSize: 11, borderRadius: 6 }}>E<span>L</span></span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '.04em' }}>ELITELIMOLINK</span>
                </div>
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
                <span className="driver-wakelock-pill" title="Screen Wake Lock is active">
                  <SunMedium size={12} /> Screen Awake
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="fleet-live-pulse" />
                  <strong style={{ fontSize: 14, color: '#fff' }}>
                    {t.name || 'Guest'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="driver-tool-btn"
                  style={{ background: '#334155', color: '#fff', border: 0, fontWeight: 700, padding: '6px 12px' }}
                  onClick={() => setIsDriveModalOpen(false)}
                >
                  <X size={15} /> Exit HUD
                </button>
                {t.phone && (
                  <>
                    <a
                      href={`tel:${t.phone.replace(/[^\d+]/g, '')}`}
                      className="driver-tool-btn"
                      style={{ background: '#2563eb', color: '#fff', border: 0, fontWeight: 800, padding: '6px 10px' }}
                    >
                      <Phone size={13} /> Call
                    </a>
                    <a
                      href={`sms:${t.phone.replace(/[^\d+]/g, '')}`}
                      className="driver-tool-btn"
                      style={{ background: '#0284c7', color: '#fff', border: 0, fontWeight: 800, padding: '6px 10px' }}
                    >
                      <MessageSquare size={13} /> SMS
                    </a>
                  </>
                )}
              </div>
            </header>

            <div className="driver-driveview-hud">
              {/* High-Impact Driver Route Journey Card in Drive View HUD */}
              <div className="driver-route-card" style={{ background: '#131d2e', borderColor: '#1e293b' }}>
                {/* 1. Pickup Leg */}
                <div className="driver-route-leg" style={{ opacity: stage >= 3 ? 0.7 : 1 }}>
                  <div className="driver-route-leg-head">
                    <span className="driver-route-badge pickup">
                      <MapPin size={13} /> {stage >= 3 ? '✓ Picked Up' : 'Pickup Location'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {t.flight && (
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(t.flight + ' flight status')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="driver-flight-pill"
                          style={{ textDecoration: 'none' }}
                        >
                          <Plane size={11} /> Flight {t.flight}
                        </a>
                      )}
                      <span className="driver-time-pill">
                        <Clock size={11} /> {clock(t.pickupAt)}
                      </span>
                    </div>
                  </div>
                  <h2 className="driver-route-address" style={{ fontSize: isPickupTarget ? 19 : 16 }}>
                    {t.pickup || 'Address to be confirmed'}
                  </h2>
                  {isPickupTarget && t.pickup && (
                    <div className="driver-route-nav-row">
                      <a
                        href={googleMapsUrl(t.pickup)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="driver-route-nav-btn google"
                      >
                        <Navigation size={13} /> Google Maps
                      </a>
                      <a
                        href={wazeUrl(t.pickup)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="driver-route-nav-btn waze"
                      >
                        <Compass size={13} /> Waze
                      </a>
                      <a
                        href={appleMapsUrl(t.pickup)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="driver-route-nav-btn apple"
                      >
                        <Navigation size={13} /> Apple Maps
                      </a>
                    </div>
                  )}
                </div>

                <div className="driver-route-connector" />

                {/* 2. Extra Stop if present */}
                {t.extraStop && (
                  <>
                    <div className="driver-route-leg" style={{ background: 'rgba(234, 179, 8, 0.12)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                      <div className="driver-route-leg-head">
                        <span className="driver-route-badge stop">
                          ⚠️ Extra Stop
                        </span>
                      </div>
                      <h4 className="driver-route-address" style={{ fontSize: 15 }}>{t.extraStop}</h4>
                      <div className="driver-route-nav-row">
                        <a href={googleMapsUrl(t.extraStop)} target="_blank" rel="noopener noreferrer" className="driver-route-nav-btn google">
                          <Navigation size={13} /> Google
                        </a>
                        <a href={wazeUrl(t.extraStop)} target="_blank" rel="noopener noreferrer" className="driver-route-nav-btn waze">
                          <Compass size={13} /> Waze
                        </a>
                        <a href={appleMapsUrl(t.extraStop)} target="_blank" rel="noopener noreferrer" className="driver-route-nav-btn apple">
                          <Navigation size={13} /> Apple
                        </a>
                      </div>
                    </div>
                    <div className="driver-route-connector" />
                  </>
                )}

                {/* 3. Dropoff Leg */}
                <div className="driver-route-leg" style={{ opacity: isPickupTarget ? 0.85 : 1 }}>
                  <div className="driver-route-leg-head">
                    <span className="driver-route-badge dropoff">
                      <Flag size={13} /> {stage === 4 ? '✓ Dropped Off' : 'Dropoff Location'}
                    </span>
                  </div>
                  <h2 className="driver-route-address" style={{ fontSize: !isPickupTarget ? 19 : 16 }}>
                    {t.dropoff || 'Address to be confirmed'}
                  </h2>
                  {(!isPickupTarget || stage >= 2) && t.dropoff && (
                    <div className="driver-route-nav-row">
                      <a
                        href={googleMapsUrl(t.dropoff)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="driver-route-nav-btn google"
                      >
                        <Navigation size={13} /> Google Maps
                      </a>
                      <a
                        href={wazeUrl(t.dropoff)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="driver-route-nav-btn waze"
                      >
                        <Compass size={13} /> Waze
                      </a>
                      <a
                        href={appleMapsUrl(t.dropoff)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="driver-route-nav-btn apple"
                      >
                        <Navigation size={13} /> Apple Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Giant Mission Step Progression Button - Directly Below Destination */}
              <div>
                {stage === 0 && (
                  <button
                    type="button"
                    className="driver-hud-big-action accept"
                    disabled={isBusy}
                    onClick={() => handleTripAction(t.id, 'accept')}
                  >
                    {isBusy ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
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
                    {isBusy ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} strokeWidth={3} />}
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
                    {isBusy ? <Loader2 size={20} className="animate-spin" /> : <UserCheck size={20} strokeWidth={3} />}
                    PASSENGER ON BOARD (TO DROPOFF)
                  </button>
                )}

                {stage === 3 && (
                  <button
                    type="button"
                    className="driver-hud-big-action dropoff"
                    disabled={isBusy}
                    onClick={() => handleTripAction(t.id, 'dropoff')}
                  >
                    {isBusy ? <Loader2 size={20} className="animate-spin" /> : <Flag size={20} strokeWidth={3} />}
                    COMPLETE TRIP (DROPPED OFF)
                  </button>
                )}

                {stage === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="driver-hud-big-action done">
                      <CheckCircle2 size={20} /> TRIP COMPLETED SUCCESSFULLY
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
                            <Navigation size={18} /> NEXT MISSION: {nextTrip.name || 'Guest'} ({clock(nextTrip.pickupAt)})
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
                            setIsDriveModalOpen(false);
                            setActiveTab('upcoming');
                          }}
                        >
                          <Compass size={18} /> RETURN TO MY TRIPS
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Compact In-Drive Notes Section */}
              <div className="driver-hud-notes-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8' }}>
                    Trip Notes &amp; Tolls
                  </span>
                  {t.driverNotes && (
                    <span style={{ color: '#4ade80', fontSize: 11 }}>
                      ✓ Saved
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="driver-note-textarea"
                    style={{ background: '#090d16', borderColor: '#334155', color: '#fff', minHeight: 'auto', height: 38, padding: '6px 10px', fontSize: 13, flex: 1 }}
                    value={currentDraft}
                    onChange={(e) => setNotesDraft((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    placeholder="Toll receipts, luggage, delay notes..."
                  />
                  <button
                    type="button"
                    className={`driver-note-save-btn${isNoteSaved ? ' saved' : ''}`}
                    style={{ marginTop: 0, padding: '0 14px', height: 38, whiteSpace: 'nowrap' }}
                    disabled={isNoteBusy}
                    onClick={() => handleSaveNote(t.id)}
                  >
                    {isNoteBusy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {isNoteSaved ? 'Saved!' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Invisible looping video element to prevent screen sleep on iOS / mobile Safari */}
      <video
        playsInline
        muted
        loop
        autoPlay
        style={{ position: 'fixed', top: -100, left: -100, width: 1, height: 1, opacity: 0.001, pointerEvents: 'none' }}
        src="data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAADpmcmVlAAAAG21kYXQAAAGzAAABt///wAAAAAg="
      />
    </div>
  );
}
