import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeftRight,
  Baby,
  Bell,
  Calendar,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  DoorOpen,
  ExternalLink,
  Filter,
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

const DEFAULT_ASSIGNED_TRIPS: AssignedTrip[] = [
  {
    id: 'trip_hdgcyj',
    service: 'airport',
    pickup: 'JFK International Airport, Terminal 4 Arrivals, Queens, NY 11430',
    dropoff: 'The Plaza Hotel, 768 5th Ave, New York, NY 10019',
    extraStop: '',
    pickupAt: '2026-10-23T09:45:00',
    returnAt: '',
    hours: 2,
    vehicle: 'suv',
    passengers: 2,
    name: 'Ellen Rogers',
    email: 'ellen.rogers@luxurytravel.com',
    phone: '+1 (212) 555-0144',
    flight: '',
    notes: 'Passenger has 2 large suitcases. Inside baggage claim greeting requested.',
    driverNotes: '',
    driverStatus: 'pending',
    carSeat: false,
    insidePickup: true,
    status: 'confirmed',
    estimatedFareText: '$185.00',
    pickupLocal: 'Fri Oct 23, 9:45 AM',
    sourceName: 'ELITE LIMO LINK',
  },
  {
    id: 'trip_rz6zh7',
    service: 'transfer',
    pickup: 'The Plaza Hotel, 768 5th Ave, New York, NY 10019',
    dropoff: 'JFK International Airport, Terminal 4 Departures, Queens, NY 11430',
    extraStop: '',
    pickupAt: '2026-10-25T11:30:00',
    returnAt: '',
    hours: 2,
    vehicle: 'suv',
    passengers: 2,
    name: 'Ellen Rogers',
    email: 'ellen.rogers@luxurytravel.com',
    phone: '+1 (212) 555-0144',
    flight: '',
    notes: 'Return transfer to JFK Airport. Flight departure at 2:45 PM.',
    driverNotes: '',
    driverStatus: 'pending',
    carSeat: false,
    insidePickup: false,
    status: 'confirmed',
    estimatedFareText: '$185.00',
    pickupLocal: 'Sun Oct 25, 11:30 AM',
    sourceName: 'ELITE LIMO LINK',
  },
  {
    id: 'trip_pr61ew',
    service: 'airport',
    pickup: 'Newark Liberty International Airport (EWR), Terminal B, Newark, NJ 07114',
    dropoff: 'Hyatt Regency Jersey City, 2 Exchange Pl, Jersey City, NJ 07302',
    extraStop: '',
    pickupAt: '2026-10-30T11:45:00',
    returnAt: '2026-11-02T08:30:00',
    hours: 3,
    vehicle: 'sedan',
    passengers: 1,
    name: 'Larry Mayhew',
    email: 'larry.m@corporatepartners.com',
    phone: '+1 (201) 555-0182',
    flight: 'AA1842',
    notes: 'American Airlines flight AA1842 from Dallas DFW.',
    driverNotes: '',
    driverStatus: 'pending',
    carSeat: false,
    insidePickup: true,
    status: 'confirmed',
    estimatedFareText: '$145.00',
    pickupLocal: 'Fri Oct 30, 11:45 AM',
    sourceName: 'ELITE LIMO LINK',
  },
  {
    id: 'trip_wk2byk',
    service: 'airport',
    pickup: 'Hyatt Regency Jersey City, 2 Exchange Pl, Jersey City, NJ 07302',
    dropoff: 'LaGuardia Airport (LGA), Terminal B, Flushing, NY 11371',
    extraStop: '',
    pickupAt: '2026-11-02T08:30:00',
    returnAt: '2026-11-02T16:00:00',
    hours: 2,
    vehicle: 'sedan',
    passengers: 1,
    name: 'Larry Mayhew',
    email: 'larry.m@corporatepartners.com',
    phone: '+1 (201) 555-0182',
    flight: 'AA2044',
    notes: 'American Airlines flight AA2044. Return transfer.',
    driverNotes: '',
    driverStatus: 'pending',
    carSeat: false,
    insidePickup: false,
    status: 'confirmed',
    estimatedFareText: '$165.00',
    pickupLocal: 'Mon Nov 2, 8:30 AM',
    sourceName: 'ELITE LIMO LINK',
  },
];

function formatOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDateGroup(iso: string) {
  if (!iso) return 'Date to confirm';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date to confirm';
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const day = formatOrdinal(d.getDate());
  return `${weekday}, ${month} ${day}`;
}

function getTripRef(t: AssignedTrip): string {
  if (t.id.startsWith('trip_')) {
    return t.id.replace('trip_', '').toUpperCase();
  }
  return t.id.length > 6 ? t.id.slice(-6).toUpperCase() : t.id.toUpperCase();
}

function formatFlightSummary(flight: string) {
  if (!flight) return '';
  if (flight.toUpperCase().startsWith('AA')) {
    return `(AA) America...`;
  }
  return flight;
}

function getStageBadgeLabel(stage: number, driverStatus?: string) {
  if (stage === 4 || driverStatus === 'dropped_off') return 'Completed';
  if (stage === 3 || driverStatus === 'on_board') return 'On Board';
  if (stage === 2 || driverStatus === 'arrived') return 'Arrived';
  if (stage === 1 || driverStatus === 'accepted') return 'En Route';
  return 'Pending';
}

function getStageClassName(stage: number) {
  if (stage === 4) return 'completed';
  if (stage === 3) return 'onboard';
  if (stage === 2) return 'arrived';
  if (stage === 1) return 'enroute';
  return 'pending';
}

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
  const [trips, setTrips] = useState<AssignedTrip[]>(DEFAULT_ASSIGNED_TRIPS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab & search filtering - Native App layout defaults to upcoming trips
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all' | 'settings'>('upcoming');
  const [timeFilter, setTimeFilter] = useState<'next30' | 'today' | 'next7' | 'all' | 'past'>('next30');
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
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
      const combined =
        records.length > 0
          ? [...records, ...DEFAULT_ASSIGNED_TRIPS.filter((d) => !records.some((r) => r.id === d.id))]
          : DEFAULT_ASSIGNED_TRIPS;
      setTrips(combined);
      // Initialize notes draft from loaded trips
      const initialNotes: Record<string, string> = {};
      for (const r of combined) {
        if (r.driverNotes) initialNotes[r.id] = r.driverNotes;
      }
      setNotesDraft(initialNotes);

      // Auto-select active or upcoming ride so Drive View opens immediately
      const active = combined.find((t) => {
        const stage = getTripStage(t);
        return stage >= 1 && stage <= 3;
      });
      if (active) {
        setDriveViewTripId(active.id);
      } else {
        const sortedRecs = [...combined].sort(compareByPickup);
        const upcoming = sortedRecs.find((t) => getTripStage(t) < 4);
        if (upcoming) setDriveViewTripId(upcoming.id);
        else if (sortedRecs.length > 0) setDriveViewTripId(sortedRecs[0].id);
      }
    } catch {
      // Non-fatal, keep default assigned trips
      setTrips(DEFAULT_ASSIGNED_TRIPS);
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

  const filterLabel = useMemo(() => {
    const sortText = sortOrder === 'oldest' ? 'oldest trip date first' : 'newest trip date first';
    switch (timeFilter) {
      case 'next30':
        return `Next 30 days, ${sortText}`;
      case 'today':
        return `Today's schedule, ${sortText}`;
      case 'next7':
        return `Next 7 days, ${sortText}`;
      case 'past':
        return `Completed trips (Past)`;
      case 'all':
      default:
        return `All assigned trips, ${sortText}`;
    }
  }, [timeFilter, sortOrder]);

  const filteredTrips = useMemo(() => {
    let list = [...trips];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;
    const next7End = todayStart + 7 * 24 * 60 * 60 * 1000;
    const next30End = todayStart + 30 * 24 * 60 * 60 * 1000;

    if (activeTab === 'past' || timeFilter === 'past') {
      list = list.filter((t) => {
        const st = normalizeStatus(t.status);
        return st === 'completed' || t.driverStatus === 'dropped_off';
      });
    } else {
      if (timeFilter !== 'all' && activeTab !== 'all') {
        list = list.filter((t) => {
          const st = normalizeStatus(t.status);
          return st !== 'completed' && t.driverStatus !== 'dropped_off';
        });
      }

      if (timeFilter === 'today') {
        list = list.filter((t) => {
          if (!t.pickupAt) return false;
          const time = new Date(t.pickupAt).getTime();
          return time >= todayStart && time <= todayEnd;
        });
      } else if (timeFilter === 'next7') {
        list = list.filter((t) => {
          if (!t.pickupAt) return true;
          const time = new Date(t.pickupAt).getTime();
          return time >= todayStart - 86400000 && time <= next7End;
        });
      } else if (timeFilter === 'next30') {
        list = list.filter((t) => {
          if (!t.pickupAt) return true;
          const time = new Date(t.pickupAt).getTime();
          return time >= todayStart - 86400000 && time <= next30End;
        });
      }
    }

    list.sort((a, b) => {
      const timeA = a.pickupAt ? new Date(a.pickupAt).getTime() : 0;
      const timeB = b.pickupAt ? new Date(b.pickupAt).getTime() : 0;
      return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
    });

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
  }, [trips, activeTab, timeFilter, sortOrder, search]);

  const groupedTrips = useMemo(() => {
    const groups: { dateKey: string; dateLabel: string; trips: AssignedTrip[] }[] = [];
    const map = new Map<string, AssignedTrip[]>();

    for (const trip of filteredTrips) {
      const key = trip.pickupAt ? trip.pickupAt.slice(0, 10) : 'tbd';
      const existing = map.get(key);
      if (existing) {
        existing.push(trip);
      } else {
        const arr = [trip];
        map.set(key, arr);
        groups.push({
          dateKey: key,
          dateLabel: formatDateGroup(trip.pickupAt),
          trips: arr,
        });
      }
    }

    return groups;
  }, [filteredTrips]);

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
        {/* App Top Header - Matches Reference Dashboard Design */}
        <header className="driver-dashboard-header">
          <button
            type="button"
            className="driver-header-icon-btn"
            onClick={() => setDriveMenuOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="driver-dashboard-title">Dashboard</h1>
          <div className="driver-dashboard-actions">
            <button
              type="button"
              className={`driver-header-icon-btn${searchOpen ? ' active' : ''}`}
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              className={`driver-header-icon-btn${notificationsOpen ? ' active' : ''}`}
              onClick={() => setNotificationsOpen((v) => !v)}
              aria-label="Notifications"
              style={{ position: 'relative' }}
            >
              <Bell size={20} />
              {stats.active > 0 && <span className="driver-bell-dot" />}
            </button>
          </div>
        </header>

        {/* Sub-header Filter Bar Matching Reference Design */}
        <div className="driver-filter-subbar">
          <button
            type="button"
            className="driver-filter-subbar-btn"
            onClick={() => setFilterOpen((v) => !v)}
            aria-label="Change time and sort filter"
          >
            <span className="driver-filter-text">{filterLabel}</span>
            <span className="driver-funnel-icon">
              <Filter size={18} />
            </span>
          </button>
        </div>

        {/* Filter Selection Dropdown Modal / Popover */}
        {filterOpen && (
          <div className="driver-filter-dropdown">
            <div className="driver-filter-dropdown-head">
              <span>Filter &amp; Sort Schedule</span>
              <button type="button" onClick={() => setFilterOpen(false)} aria-label="Close filter">
                <X size={16} />
              </button>
            </div>
            <div className="driver-filter-options">
              <button
                type="button"
                className={`driver-filter-opt${timeFilter === 'next30' ? ' active' : ''}`}
                onClick={() => {
                  setTimeFilter('next30');
                  setActiveTab('upcoming');
                  setFilterOpen(false);
                }}
              >
                Next 30 days
              </button>
              <button
                type="button"
                className={`driver-filter-opt${timeFilter === 'today' ? ' active' : ''}`}
                onClick={() => {
                  setTimeFilter('today');
                  setActiveTab('upcoming');
                  setFilterOpen(false);
                }}
              >
                Today's schedule
              </button>
              <button
                type="button"
                className={`driver-filter-opt${timeFilter === 'next7' ? ' active' : ''}`}
                onClick={() => {
                  setTimeFilter('next7');
                  setActiveTab('upcoming');
                  setFilterOpen(false);
                }}
              >
                Next 7 days
              </button>
              <button
                type="button"
                className={`driver-filter-opt${timeFilter === 'all' ? ' active' : ''}`}
                onClick={() => {
                  setTimeFilter('all');
                  setActiveTab('all');
                  setFilterOpen(false);
                }}
              >
                All assigned trips
              </button>
              <button
                type="button"
                className={`driver-filter-opt${timeFilter === 'past' ? ' active' : ''}`}
                onClick={() => {
                  setTimeFilter('past');
                  setActiveTab('past');
                  setFilterOpen(false);
                }}
              >
                Completed rides (Past)
              </button>
            </div>
            <div className="driver-filter-sort-row">
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                Sort Order:
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className={`driver-sort-pill${sortOrder === 'oldest' ? ' active' : ''}`}
                  onClick={() => {
                    setSortOrder('oldest');
                    setFilterOpen(false);
                  }}
                >
                  Oldest first
                </button>
                <button
                  type="button"
                  className={`driver-sort-pill${sortOrder === 'newest' ? ' active' : ''}`}
                  onClick={() => {
                    setSortOrder('newest');
                    setFilterOpen(false);
                  }}
                >
                  Newest first
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Search Bar (When Search icon is clicked) */}
        {searchOpen && (
          <div className="driver-inline-searchbar">
            <Search size={16} color="#94a3b8" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest, code #, address, flight…"
              autoFocus
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </div>
        )}

        {/* Notifications Bar (When Bell icon is clicked) */}
        {notificationsOpen && (
          <div className="driver-notifications-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: '#fff' }}>Chauffeur Schedule Alerts</strong>
              <button type="button" onClick={() => setNotificationsOpen(false)} style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>✓ You have <strong>{stats.active}</strong> active or upcoming missions.</div>
              <div>✓ <strong>{stats.today}</strong> rides scheduled for today.</div>
              <div>✓ Live Dispatch GPS broadcast is connected.</div>
            </div>
          </div>
        )}

        {/* App Body Area */}
        <div className="driver-app-body">
          {actionError && (
            <p className="form-error" role="alert" style={{ marginBottom: 16 }}>
              {actionError}
            </p>
          )}

          {/* Main Dashboard Trips View */}
          {activeTab !== 'settings' ? (
            <div>
              {loading ? (
                <div className="dash-loading" style={{ margin: 'auto', padding: '60px 0' }}>
                  <Loader2 size={24} className="animate-spin" /> Loading assigned trips…
                </div>
              ) : error ? (
                <p className="form-error" role="alert">{error}</p>
              ) : filteredTrips.length === 0 ? (
                <div className="driver-app-empty">
                  <CheckCircle2 size={44} color="#94a3b8" style={{ marginBottom: 16 }} />
                  <h2 className="driver-empty-title">No trips found</h2>
                  <p className="driver-empty-desc">No assignments matched your current filters.</p>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ marginTop: 14 }}
                    onClick={() => {
                      setTimeFilter('next30');
                      setSearch('');
                      setActiveTab('upcoming');
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="driver-dashboard-list">
                  {groupedTrips.map((group) => (
                    <section key={group.dateKey} className="driver-date-section">
                      <h2 className="driver-date-header">{group.dateLabel}</h2>

                      <div className="driver-compact-group">
                        {group.trips.map((t) => {
                          const stage = getTripStage(t);
                          const isExpanded = expandedTripId === t.id;
                          const refCode = getTripRef(t);
                          const round = Boolean(t.returnAt);
                          const isBusy = actingTripId === t.id;
                          const isNoteBusy = savingNoteId === t.id;
                          const isNoteSaved = savedNoteId === t.id;
                          const currentDraft = notesDraft[t.id] ?? t.driverNotes ?? '';

                          return (
                            <article
                              key={t.id}
                              className={`driver-compact-card${isExpanded ? ' is-expanded' : ''}${stage >= 1 && stage <= 3 ? ' is-active' : ''}`}
                            >
                              {/* High-Density Compact Clickable Row Matching Reference Image */}
                              <div
                                className="driver-compact-summary"
                                onClick={() => setExpandedTripId(isExpanded ? null : t.id)}
                                role="button"
                                tabIndex={0}
                              >
                                {/* Row 1: Passenger Name + #Code on left, Pickup Time on right */}
                                <div className="driver-compact-row-top">
                                  <div className="driver-compact-identity">
                                    <strong className="driver-compact-name">{t.name || 'Guest'}</strong>
                                    <span className="driver-compact-ref">#{refCode}</span>
                                  </div>
                                  <strong className="driver-compact-time">{clock(t.pickupAt)}</strong>
                                </div>

                                {/* Row 2: Visual indicators (Calendar, Round trip, Flight info) */}
                                <div className="driver-compact-row-mid">
                                  <span className="driver-compact-icon" title="Scheduled ride">
                                    <Calendar size={13} />
                                  </span>
                                  {round && (
                                    <>
                                      <span className="driver-compact-dot">•</span>
                                      <span className="driver-compact-attr">
                                        <ArrowLeftRight size={12} /> Round trip
                                      </span>
                                    </>
                                  )}
                                  {t.flight && (
                                    <>
                                      <span className="driver-compact-dot">•</span>
                                      <span className="driver-compact-attr flight">
                                        <Plane size={12} /> {formatFlightSummary(t.flight)}
                                      </span>
                                    </>
                                  )}
                                  <span className="driver-compact-chevron" style={{ marginLeft: 'auto' }}>
                                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                  </span>
                                </div>

                                {/* Row 3: Vibrant Badges (Confirmed + • + Stage) */}
                                <div className="driver-compact-row-badges">
                                  <span className="driver-badge-confirmed">Confirmed</span>
                                  <span className="driver-compact-dot">•</span>
                                  <span className={`driver-badge-stage ${getStageClassName(stage)}`}>
                                    {getStageBadgeLabel(stage, t.driverStatus)}
                                  </span>
                                </div>
                              </div>

                              {/* Tap-to-Expand Interactive Detail Accordion */}
                              {isExpanded && (
                                <div className="driver-compact-expanded-body">
                                  {/* Route Journey Card (Pickup, Extra Stop, Dropoff) */}
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
                                            title="Navigate with Google Maps"
                                          >
                                            <Navigation size={13} /> Google Maps
                                          </a>
                                          <a
                                            href={wazeUrl(t.pickup)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="driver-route-nav-btn waze"
                                            title="Navigate with Waze"
                                          >
                                            <Compass size={13} /> Waze
                                          </a>
                                          <a
                                            href={appleMapsUrl(t.pickup)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="driver-route-nav-btn apple"
                                            title="Navigate with Apple Maps"
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
                                            title="Navigate with Google Maps"
                                          >
                                            <Navigation size={13} /> Google Maps
                                          </a>
                                          <a
                                            href={wazeUrl(t.dropoff)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="driver-route-nav-btn waze"
                                            title="Navigate with Waze"
                                          >
                                            <Compass size={13} /> Waze
                                          </a>
                                          <a
                                            href={appleMapsUrl(t.dropoff)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="driver-route-nav-btn apple"
                                            title="Navigate with Apple Maps"
                                          >
                                            <Navigation size={13} /> Apple Maps
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Meta Info (Vehicle, Passenger count, Phone, Flight) */}
                                  <div className="reservation-card-meta" style={{ margin: 0, gap: 10 }}>
                                    {t.vehicle && (
                                      <span>
                                        <CarFront size={14} /> {vehicles.find((v) => v.id === t.vehicle)?.name ?? t.vehicle}
                                      </span>
                                    )}
                                    {t.passengers > 0 && <span><Users size={14} /> {t.passengers} passengers</span>}
                                    {round && <span><RefreshCw size={14} /> Round trip</span>}
                                    {t.carSeat && <span style={{ color: '#b45309' }}><Baby size={14} /> Car seat required</span>}
                                    {t.insidePickup && <span style={{ color: '#2563eb' }}><DoorOpen size={14} /> Inside pickup / Meet &amp; Greet</span>}
                                    {t.phone && (
                                      <a
                                        href={`tel:${t.phone.replace(/[^\d+]/g, '')}`}
                                        className="driver-tool-btn"
                                        style={{ color: '#38bdf8', fontWeight: 800 }}
                                      >
                                        <Phone size={13} /> Call {t.phone}
                                      </a>
                                    )}
                                  </div>

                                  {/* Customer Notes */}
                                  {t.notes && (
                                    <div style={{ fontSize: 12, background: '#131d2e', padding: '10px 14px', borderRadius: 10, border: '1px solid #1e293b', color: '#cbd5e1' }}>
                                      <strong style={{ color: '#fff', display: 'block', marginBottom: 2 }}>Passenger Instructions:</strong>
                                      {t.notes}
                                    </div>
                                  )}

                                  {/* Cockpit HUD Button */}
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
                                      <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                        <span className="fleet-live-pulse" /> Live Trip GPS Active
                                      </span>
                                    )}
                                  </div>

                                  {/* 4-Step Interactive Workflow Pipeline */}
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

                                  {/* Dedicated Driver Trip Notes Area */}
                                  <div className="driver-note-box">
                                    <div className="driver-note-head">
                                      <span>Driver Trip Notes &amp; Summary</span>
                                      {t.driverNotes && (
                                        <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>
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
                                          ? 'Add drop-off notes (toll receipt, smooth trip)...'
                                          : 'Add notes about this ride (toll fees, luggage count, special requests)...'
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
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
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
