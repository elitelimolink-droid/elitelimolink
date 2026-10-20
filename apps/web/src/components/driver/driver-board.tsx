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
import { AppShortcutButton } from '@/components/common/app-shortcut-button';
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

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request?: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

export type TripTimeWindow = {
  minutesUntilPickup: number | null;
  canUpdateOnTheWay: boolean;
  canUpdateArrived: boolean;
  onTheWayWaitLabel: string;
  arrivedWaitLabel: string;
  pickupCountdownLabel: string;
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

function formatDurationMinutes(mins: number): string {
  const rounded = Math.max(1, Math.ceil(mins));
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const remH = h % 24;
    return remH > 0 ? `${d}d ${remH}h` : `${d}d`;
  }
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Evaluates time-window rules for a reservation's scheduled pickup time:
 * - "On the Way" can only be updated starting 1 hour (60 minutes) before pickupAt.
 * - "Arrived" can only be updated within the final 25 minutes before pickupAt.
 */
function getTripTimeWindow(pickupAt: string, nowMs: number): TripTimeWindow {
  if (!pickupAt) {
    return {
      minutesUntilPickup: null,
      canUpdateOnTheWay: true,
      canUpdateArrived: true,
      onTheWayWaitLabel: 'Available now',
      arrivedWaitLabel: 'Available now',
      pickupCountdownLabel: 'Schedule TBD',
    };
  }
  const pickupMs = new Date(pickupAt).getTime();
  if (Number.isNaN(pickupMs)) {
    return {
      minutesUntilPickup: null,
      canUpdateOnTheWay: true,
      canUpdateArrived: true,
      onTheWayWaitLabel: 'Available now',
      arrivedWaitLabel: 'Available now',
      pickupCountdownLabel: 'Schedule TBD',
    };
  }

  const minutesUntilPickup = (pickupMs - nowMs) / 60000;
  const canUpdateOnTheWay = minutesUntilPickup <= 60;
  const canUpdateArrived = minutesUntilPickup <= 25;

  const onTheWayWaitMins = Math.max(0, minutesUntilPickup - 60);
  const arrivedWaitMins = Math.max(0, minutesUntilPickup - 25);

  const onTheWayWaitLabel = canUpdateOnTheWay
    ? 'Window Open (≤ 1 hr before pickup)'
    : `Unlocks in ${formatDurationMinutes(onTheWayWaitMins)} (1 hr before pickup)`;

  const arrivedWaitLabel = canUpdateArrived
    ? 'Window Open (≤ 25 min before pickup)'
    : `Unlocks in ${formatDurationMinutes(arrivedWaitMins)} (25 min before pickup)`;

  let pickupCountdownLabel = '';
  if (minutesUntilPickup > 0) {
    pickupCountdownLabel = `Pickup in ${formatDurationMinutes(minutesUntilPickup)}`;
  } else if (minutesUntilPickup >= -90) {
    pickupCountdownLabel = 'Pickup Window Active';
  } else {
    pickupCountdownLabel = 'Past Scheduled Pickup';
  }

  return {
    minutesUntilPickup,
    canUpdateOnTheWay,
    canUpdateArrived,
    onTheWayWaitLabel,
    arrivedWaitLabel,
    pickupCountdownLabel,
  };
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

function smsBodyUrl(phone: string, bodyText: string) {
  const clean = (phone || '').replace(/[^\d+]/g, '');
  if (!clean) return '#';
  const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const sep = isIos ? '&' : '?';
  return `sms:${clean}${sep}body=${encodeURIComponent(bodyText)}`;
}

/**
 * Maps the reservation record into a 0-4 lifecycle step:
 * 0: Assigned (waiting for driver to start / on the way)
 * 1: On the Way / Accepted (driver is on the way to pickup)
 * 2: Arrived (driver arrived at pickup)
 * 3: On Board (passenger picked up, ride in progress)
 * 4: Completed (passenger dropped off, trip finished)
 */
function getTripStage(t: AssignedTrip): number {
  const st = normalizeStatus(t.status);
  if (st === 'completed' || t.driverStatus === 'dropped_off') return 4;
  if (t.driverStatus === 'on_board') return 3;
  if (t.driverStatus === 'arrived') return 2;
  if (t.driverStatus === 'accepted' || t.driverStatus === 'on_the_way') return 1;
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

  // Live clock tick (every 15 seconds) so 60-min and 25-min windows unlock automatically
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  // Tab & search filtering - Drive View HUD is permanently open and default
  const [activeTab, setActiveTab] = useState<'active' | 'drive' | 'completed' | 'all' | 'settings'>('drive');
  const [search, setSearch] = useState('');
  const [driveMenuOpen, setDriveMenuOpen] = useState(false);

  // Trip action progression state
  const [actingTripId, setActingTripId] = useState('');
  const [actionError, setActionError] = useState('');

  // Automated SMS Notification State & History
  const [smsBanner, setSmsBanner] = useState<{
    tripId: string;
    customerName: string;
    phone: string;
    message: string;
    status: 'on_the_way' | 'arrived';
    sentAt: string;
  } | null>(null);

  const [smsSentLog, setSmsSentLog] = useState<
    Record<string, { on_the_way?: string; arrived?: string }>
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('ell_driver_sms_log');
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore storage errors
      }
    }
    return {};
  });

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
      } catch {
        // ignore storage errors
      }
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
   * Action handler: On the Way (Accept), Arrive, Pick Up, Drop Off
   * Enforces pickup time windows:
   * - On the Way: only starting 1 hour (60 minutes) before pickupAt
   * - Arrived: only within the final 25 minutes before pickupAt
   * Automatically dispatches customer SMS notifications:
   * - On the Way -> "Your driver is on the way."
   * - Arrived -> "Your driver has arrived."
   */
  async function handleTripAction(
    tripId: string,
    action: 'accept' | 'on_the_way' | 'arrive' | 'pickup' | 'dropoff'
  ) {
    if (actingTripId) return;
    setActionError('');

    const previous = trips.find((t) => t.id === tripId);
    if (previous) {
      const tw = getTripTimeWindow(previous.pickupAt, Date.now());
      if ((action === 'accept' || action === 'on_the_way') && !tw.canUpdateOnTheWay) {
        setActionError(
          `“On the Way” status can only be updated starting 1 hour before pickup (${tw.onTheWayWaitLabel}).`
        );
        return;
      }
      if (action === 'arrive' && !tw.canUpdateArrived) {
        setActionError(
          `“Arrived” status can only be updated within the final 25 minutes before pickup (${tw.arrivedWaitLabel}).`
        );
        return;
      }
    }

    setActingTripId(tripId);

    const customerName = previous?.name || 'Customer';
    const customerPhone = previous?.phone || '';
    const sentStamp = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    // Determine automated SMS message for on_the_way and arrived statuses
    const autoSmsInfo: {
      statusKey: 'on_the_way' | 'arrived';
      message: string;
    } | null =
      action === 'accept' || action === 'on_the_way'
        ? { statusKey: 'on_the_way', message: 'Your driver is on the way.' }
        : action === 'arrive'
        ? { statusKey: 'arrived', message: 'Your driver has arrived.' }
        : null;

    // Optimistic local update
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== tripId) return t;
        if (action === 'accept' || action === 'on_the_way') {
          return {
            ...t,
            driverStatus: 'on_the_way',
            status: t.status === 'pending' ? 'confirmed' : t.status,
          };
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

    if (autoSmsInfo) {
      setSmsSentLog((prev) => {
        const next = {
          ...prev,
          [tripId]: {
            ...(prev[tripId] || {}),
            [autoSmsInfo.statusKey]: sentStamp,
          },
        };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('ell_driver_sms_log', JSON.stringify(next));
          } catch {
            // ignore storage errors
          }
        }
        return next;
      });

      setSmsBanner({
        tripId,
        customerName,
        phone: customerPhone,
        message: autoSmsInfo.message,
        status: autoSmsInfo.statusKey,
        sentAt: sentStamp,
      });
    }

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
          } catch {
            // non-fatal
          }
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
        } catch {
          // ignore storage errors
        }
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
    let wakeLockSentinel: WakeLockSentinelLike | null = null;
    let isMounted = true;

    async function enableWakeLock() {
      if (typeof window === 'undefined') return;
      try {
        const nav = navigator as NavigatorWithWakeLock;
        if (nav.wakeLock?.request) {
          wakeLockSentinel = await nav.wakeLock.request('screen');
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

    function onUserGesture() {
      void enableWakeLock();
    }
    window.addEventListener('pointerdown', onUserGesture, { once: true });
    window.addEventListener('touchstart', onUserGesture, { once: true });

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
      } catch {
        // ignore release errors
      }
    };
  }, []);

  // Background GPS Heartbeat Worker: Keeps live GPS streaming even if tab/phone is backgrounded
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
    } catch {
      // ignore worker errors
    }

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
          } catch {
            // ignore geocode fallback errors
          }
        }
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

      navigator.geolocation.getCurrentPosition(
        handlePosition,
        () => {
          if (!isMounted) return;
          setGpsStatus('standby');
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
              } catch {
                // ignore geocode fallback error
              }
            })();
          }
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 }
      );
    }

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleGpsError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );

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

  const gpsLabel =
    gpsStatus === 'active'
      ? 'GPS Live'
      : gpsStatus === 'standby'
      ? 'GPS Standby'
      : gpsStatus === 'denied'
      ? 'GPS Blocked'
      : 'GPS Connecting';

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
          <img src="/icons/driver-icon.jpg" alt="BookNowLux Chauffeur" className="brand-logo-badge driver" style={{ width: 34, height: 34 }} />
          <span className="brand-word">BookNowLux<span className="brand-sub"> / CHAUFFEUR</span></span>
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
          <span
            className="driver-wakelock-pill"
            title={screenAwake ? 'Screen Wake Lock is active' : 'Tap anywhere to keep screen awake'}
          >
            <SunMedium size={12} /> {screenAwake ? 'Screen Awake' : 'Wake Ready'}
          </span>
          <span
            className="driver-duty-badge"
            title="Real-time GPS telemetry status"
          >
            <Radio size={12} style={{ marginRight: 4 }} />
            {gpsLabel}
          </span>
          <span style={{ fontWeight: 600 }}>{profile.name || driverEmail}</span>
          <AppShortcutButton variant="driver" buttonLabel="Kısayol" />
          <ThemeToggle className="theme-toggle compact" />
          <button type="button" className="dashboard-link" onClick={signOut}>
            <LogOut size={14} style={{ display: 'inline', marginRight: 4 }} /> Sign out
          </button>
        </div>
      </header>

      <div className="dashboard-shell">
        <div className="dashboard-intro">
          <span className="eyebrow">CHAUFFEUR MISSION PORTAL</span>
          <h1>Driver Mission Center</h1>
          <p>
            Manage active assignments in real time. <strong>On the Way</strong> unlocks 1 hour before pickup
            (auto-sends <em>“Your driver is on the way.”</em>) and <strong>Arrived</strong> unlocks 25 minutes
            before pickup (auto-sends <em>“Your driver has arrived.”</em>).
          </p>
        </div>

        {/* Active Ride In Progress Banner with Instant Drive View Access */}
        {activeRide && (
          <div className="driver-active-banner">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="fleet-live-pulse" />
                <strong style={{ fontSize: 15, color: '#38bdf8' }}>
                  Active Ride In Progress: {activeRide.name || 'Guest'}
                </strong>
                {activeRide.sourceName && (
                  <span className="driver-brand-tag">{activeRide.sourceName}</span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                {getTripStage(activeRide) <= 2
                  ? `Heading to Pickup: ${activeRide.pickup}`
                  : `En Route to Dropoff: ${activeRide.dropoff}`}
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
            <span className="driver-stat-label">Active / Upcoming</span>
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
                placeholder="Search passenger, address, flight, brand…"
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

        {/* Automated Customer SMS Dispatched Notification Banner */}
        {smsBanner && (
          <div
            role="status"
            style={{
              marginBottom: 16,
              padding: '14px 16px',
              background: smsBanner.status === 'arrived' ? '#f0fdf4' : '#eff6ff',
              border: `1.5px solid ${smsBanner.status === 'arrived' ? '#22c55e' : '#3b82f6'}`,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: smsBanner.status === 'arrived' ? '#16a34a' : '#2563eb',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={17} />
              </span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: smsBanner.status === 'arrived' ? '#15803d' : '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  ✓ Automated SMS Sent to {smsBanner.customerName}{smsBanner.phone ? ` (${smsBanner.phone})` : ''} • {smsBanner.sentAt}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  “{smsBanner.message}”
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {smsBanner.phone && (
                <a
                  href={smsBodyUrl(smsBanner.phone, smsBanner.message)}
                  className="driver-tool-btn"
                  style={{ background: '#0f172a', color: '#fff', border: 0, fontWeight: 700, padding: '6px 12px', fontSize: 12 }}
                >
                  <MessageSquare size={13} /> Open in Phone SMS
                </a>
              )}
              <button
                type="button"
                onClick={() => setSmsBanner(null)}
                style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#64748b', padding: 4 }}
                aria-label="Dismiss SMS notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
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
                  const tripSms = smsSentLog[t.id] || {};
                  const onTheWaySent = stage >= 1 || Boolean(tripSms.on_the_way);
                  const arrivedSent = stage >= 2 || Boolean(tripSms.arrived);
                  const tw = getTripTimeWindow(t.pickupAt, nowMs);

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
                            {stage < 4 && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  background: tw.canUpdateArrived
                                    ? '#dcfce7'
                                    : tw.canUpdateOnTheWay
                                    ? '#dbeafe'
                                    : '#f1f5f9',
                                  color: tw.canUpdateArrived
                                    ? '#166534'
                                    : tw.canUpdateOnTheWay
                                    ? '#1e40af'
                                    : '#475569',
                                }}
                              >
                                ⏰ {tw.pickupCountdownLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pickup Time & Date Chip */}
                        <div className="driver-time-chip">
                          <Clock size={16} color="var(--blue)" />
                          <strong>{clock(t.pickupAt)}</strong>
                          <small>{dayLabel(t.pickupAt)}</small>
                        </div>
                      </div>

                      {/* Route Section with Instant Google Maps & Waze Navigation */}
                      <div className="reservation-card-route" style={{ margin: 0 }}>
                        {t.pickup && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                            <span>
                              <span className="pickup-marker" /> <strong>Pickup:</strong> {t.pickup}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <a
                                href={googleMapsUrl(t.pickup)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-tool-btn"
                                title="Navigate to Pickup with Google Maps"
                              >
                                <Navigation size={13} color="#2563eb" /> Maps
                              </a>
                              <a
                                href={wazeUrl(t.pickup)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-tool-btn"
                                title="Navigate to Pickup with Waze"
                              >
                                <Compass size={13} color="#0284c7" /> Waze
                              </a>
                            </div>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <a
                                href={googleMapsUrl(t.dropoff)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-tool-btn"
                                title="Navigate to Dropoff with Google Maps"
                              >
                                <Navigation size={13} color="#16a34a" /> Maps
                              </a>
                              <a
                                href={wazeUrl(t.dropoff)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="driver-tool-btn"
                                title="Navigate to Dropoff with Waze"
                              >
                                <Compass size={13} color="#0284c7" /> Waze
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
                        <button
                          type="button"
                          disabled={isBusy || !tw.canUpdateOnTheWay}
                          onClick={() => handleTripAction(t.id, 'on_the_way')}
                          className={`driver-pipe-step${stage >= 1 ? ' done' : stage === 0 ? ' current' : ''}`}
                          style={{
                            border: 0,
                            background: 'transparent',
                            cursor: !tw.canUpdateOnTheWay ? 'not-allowed' : 'pointer',
                            padding: 0,
                            opacity: !tw.canUpdateOnTheWay && stage < 1 ? 0.55 : 1,
                          }}
                          title={
                            tw.canUpdateOnTheWay
                              ? 'Set status to On the Way & send "Your driver is on the way."'
                              : tw.onTheWayWaitLabel
                          }
                        >
                          <span className="driver-pipe-num">
                            {stage >= 1 ? '✓' : !tw.canUpdateOnTheWay ? '🔒' : '1'}
                          </span>
                          <span>On the Way</span>
                        </button>
                        <div className={`driver-pipe-divider${stage >= 1 ? ' done' : ''}`} />

                        <button
                          type="button"
                          disabled={isBusy || !tw.canUpdateArrived}
                          onClick={() => handleTripAction(t.id, 'arrive')}
                          className={`driver-pipe-step${stage >= 2 ? ' done' : stage === 1 ? ' current' : ''}`}
                          style={{
                            border: 0,
                            background: 'transparent',
                            cursor: !tw.canUpdateArrived ? 'not-allowed' : 'pointer',
                            padding: 0,
                            opacity: !tw.canUpdateArrived && stage < 2 ? 0.55 : 1,
                          }}
                          title={
                            tw.canUpdateArrived
                              ? 'Set status to Arrived & send "Your driver has arrived."'
                              : tw.arrivedWaitLabel
                          }
                        >
                          <span className="driver-pipe-num">
                            {stage >= 2 ? '✓' : !tw.canUpdateArrived ? '🔒' : '2'}
                          </span>
                          <span>Arrived</span>
                        </button>
                        <div className={`driver-pipe-divider${stage >= 2 ? ' done' : ''}`} />

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleTripAction(t.id, 'pickup')}
                          className={`driver-pipe-step${stage >= 3 ? ' done' : stage === 2 ? ' current' : ''}`}
                          style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 0 }}
                        >
                          <span className="driver-pipe-num">{stage >= 3 ? '✓' : '3'}</span>
                          <span>On Board</span>
                        </button>
                        <div className={`driver-pipe-divider${stage >= 3 ? ' done' : ''}`} />

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleTripAction(t.id, 'dropoff')}
                          className={`driver-pipe-step${stage === 4 ? ' done' : stage === 3 ? ' current' : ''}`}
                          style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 0 }}
                        >
                          <span className="driver-pipe-num">{stage === 4 ? '✓' : '4'}</span>
                          <span>Drop Off</span>
                        </button>
                      </div>

                      {/* Driver Action Control Buttons */}
                      <div className="driver-actions-bar">
                        {stage === 0 && (
                          <button
                            type="button"
                            className="driver-primary-btn btn-accept"
                            disabled={isBusy || !tw.canUpdateOnTheWay}
                            onClick={() => handleTripAction(t.id, 'on_the_way')}
                            style={
                              !tw.canUpdateOnTheWay
                                ? { background: '#64748b', cursor: 'not-allowed', opacity: 0.85 }
                                : undefined
                            }
                          >
                            {isBusy ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : !tw.canUpdateOnTheWay ? (
                              <LockKeyhole size={16} />
                            ) : (
                              <Navigation size={16} strokeWidth={2.5} />
                            )}
                            {tw.canUpdateOnTheWay
                              ? 'On the Way — Notify Customer (“Your driver is on the way.”)'
                              : `On the Way Locked • ${tw.onTheWayWaitLabel}`}
                          </button>
                        )}

                        {stage === 1 && (
                          <button
                            type="button"
                            className="driver-primary-btn btn-arrive"
                            disabled={isBusy || !tw.canUpdateArrived}
                            onClick={() => handleTripAction(t.id, 'arrive')}
                            style={
                              !tw.canUpdateArrived
                                ? { background: '#64748b', cursor: 'not-allowed', opacity: 0.85 }
                                : undefined
                            }
                          >
                            {isBusy ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : !tw.canUpdateArrived ? (
                              <LockKeyhole size={16} />
                            ) : (
                              <MapPin size={16} strokeWidth={2.5} />
                            )}
                            {tw.canUpdateArrived
                              ? 'Arrived — Notify Customer (“Your driver has arrived.”)'
                              : `Arrived Locked • ${tw.arrivedWaitLabel}`}
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

                      {/* Automated Customer SMS Notifications & Time-Window Status Box */}
                      <div
                        style={{
                          padding: '12px 14px',
                          background: '#f8fafc',
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <MessageSquare size={13} color="#2563eb" /> Automated Customer SMS &amp; Time Windows
                          </span>
                          {t.phone && (
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                              Recipient: {t.phone}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
                          {/* Automated SMS 1: On the way (1 hour before pickup) */}
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: onTheWaySent ? '#eff6ff' : '#ffffff',
                              border: `1px solid ${onTheWaySent ? '#bfdbfe' : '#e2e8f0'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: onTheWaySent ? '#1d4ed8' : '#64748b' }}>
                                Status: On the Way {tripSms.on_the_way ? `(${tripSms.on_the_way})` : ''}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                “Your driver is on the way.”
                              </div>
                              <div style={{ fontSize: 11, color: tw.canUpdateOnTheWay ? '#16a34a' : '#d97706', fontWeight: 600, marginTop: 2 }}>
                                {tw.canUpdateOnTheWay ? '✓ 1-Hr Window Open' : `🔒 ${tw.onTheWayWaitLabel}`}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isBusy || !tw.canUpdateOnTheWay}
                              onClick={() => handleTripAction(t.id, 'on_the_way')}
                              style={{
                                border: 0,
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: !tw.canUpdateOnTheWay ? 'not-allowed' : 'pointer',
                                background: !tw.canUpdateOnTheWay
                                  ? '#e2e8f0'
                                  : onTheWaySent
                                  ? '#dbeafe'
                                  : '#2563eb',
                                color: !tw.canUpdateOnTheWay
                                  ? '#64748b'
                                  : onTheWaySent
                                  ? '#1e40af'
                                  : '#ffffff',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {!tw.canUpdateOnTheWay
                                ? '🔒 1 Hr Prior'
                                : onTheWaySent
                                ? '✓ Sent · Resend'
                                : 'Set On the Way'}
                            </button>
                          </div>

                          {/* Automated SMS 2: Arrived (25 minutes before pickup) */}
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: 10,
                              background: arrivedSent ? '#f0fdf4' : '#ffffff',
                              border: `1px solid ${arrivedSent ? '#bbf7d0' : '#e2e8f0'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: arrivedSent ? '#15803d' : '#64748b' }}>
                                Status: Arrived {tripSms.arrived ? `(${tripSms.arrived})` : ''}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                “Your driver has arrived.”
                              </div>
                              <div style={{ fontSize: 11, color: tw.canUpdateArrived ? '#16a34a' : '#d97706', fontWeight: 600, marginTop: 2 }}>
                                {tw.canUpdateArrived ? '✓ 25-Min Window Open' : `🔒 ${tw.arrivedWaitLabel}`}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isBusy || !tw.canUpdateArrived}
                              onClick={() => handleTripAction(t.id, 'arrive')}
                              style={{
                                border: 0,
                                borderRadius: 8,
                                padding: '6px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: !tw.canUpdateArrived ? 'not-allowed' : 'pointer',
                                background: !tw.canUpdateArrived
                                  ? '#e2e8f0'
                                  : arrivedSent
                                  ? '#dcfce7'
                                  : '#16a34a',
                                color: !tw.canUpdateArrived
                                  ? '#64748b'
                                  : arrivedSent
                                  ? '#166534'
                                  : '#ffffff',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {!tw.canUpdateArrived
                                ? '🔒 25 Min Prior'
                                : arrivedSent
                                ? '✓ Sent · Resend'
                                : 'Set Arrived'}
                            </button>
                          </div>
                        </div>
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
                    <img src="/icons/driver-icon.jpg" alt="BookNowLux" className="brand-logo-badge driver" style={{ width: 26, height: 26, borderRadius: 6 }} />
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '.04em' }}>BookNowLux</span>
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
                    <SunMedium size={12} /> {screenAwake ? 'Screen Awake' : 'Wake Ready'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="fleet-live-pulse" />
                    <strong style={{ fontSize: 14, color: '#fff' }}>
                      STANDBY COCKPIT
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                      <span className="driver-duty-dot" style={{ background: '#22c55e' }} /> On Duty ({gpsLabel})
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
        const tw = getTripTimeWindow(t.pickupAt, nowMs);

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

                    <div className="driver-drivemenu-section">
                      <span className="driver-drivemenu-label">Mission Center</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          type="button"
                          className="driver-drivemenu-link"
                          onClick={() => {
                            setDriveMenuOpen(false);
                            setDriveViewTripId(null);
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
                            setDriveViewTripId(null);
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
                  <img src="/icons/driver-icon.jpg" alt="BookNowLux" className="brand-logo-badge driver" style={{ width: 26, height: 26, borderRadius: 6 }} />
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '.04em' }}>BookNowLux</span>
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
                  onClick={() => {
                    setDriveViewTripId(null);
                    setActiveTab('all');
                  }}
                  title="View All Scheduled Trips"
                >
                  <Calendar size={14} /> All Trips
                </button>
                <span className="driver-wakelock-pill" title="Screen Wake Lock is active">
                  <SunMedium size={12} /> {screenAwake ? 'Screen Awake' : 'Wake Ready'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="fleet-live-pulse" />
                  <strong style={{ fontSize: 14, color: '#fff' }}>
                    {t.name || 'Guest'}
                  </strong>
                  {t.sourceName && (
                    <span className="driver-brand-tag">{t.sourceName}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              {/* Error Banner inside HUD if driver taps a locked status early */}
              {actionError && (
                <div
                  role="alert"
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1.5px solid #ef4444',
                    borderRadius: 10,
                    color: '#fecaca',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span>⚠️ {actionError}</span>
                  <button
                    type="button"
                    onClick={() => setActionError('')}
                    style={{ border: 0, background: 'transparent', color: '#fca5a5', cursor: 'pointer' }}
                    aria-label="Dismiss error"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Live Automated SMS Notification Toast inside HUD */}
              {smsBanner && smsBanner.tripId === t.id && (
                <div
                  role="status"
                  style={{
                    padding: '12px 14px',
                    background: smsBanner.status === 'arrived' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(37, 99, 235, 0.22)',
                    border: `1.5px solid ${smsBanner.status === 'arrived' ? '#22c55e' : '#3b82f6'}`,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MessageSquare size={18} color={smsBanner.status === 'arrived' ? '#4ade80' : '#60a5fa'} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: smsBanner.status === 'arrived' ? '#4ade80' : '#93c5fd', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        ✓ Automated SMS Dispatched to {smsBanner.customerName}{smsBanner.phone ? ` (${smsBanner.phone})` : ''} • {smsBanner.sentAt}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                        “{smsBanner.message}”
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {smsBanner.phone && (
                      <a
                        href={smsBodyUrl(smsBanner.phone, smsBanner.message)}
                        className="driver-tool-btn"
                        style={{ background: '#0284c7', color: '#fff', border: 0, fontWeight: 800, padding: '6px 10px', fontSize: 11 }}
                      >
                        <MessageSquare size={12} /> Send via Phone SMS
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSmsBanner(null)}
                      style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                      aria-label="Dismiss SMS banner"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Destination & Instant Turn-by-Turn GPS Navigation Card */}
              <div className="driver-hud-destination">
                <div className="driver-hud-dest-label">
                  <MapPin size={15} color="#38bdf8" />
                  <span>{targetLabel}</span>
                  {t.flight && (
                    <span className="driver-flight-pill">
                      Flight: {t.flight}
                    </span>
                  )}
                  <span className="driver-time-pill">
                    <Clock size={11} /> {clock(t.pickupAt)} ({tw.pickupCountdownLabel})
                  </span>
                </div>
                <h2 className="driver-hud-dest-address">{targetAddress || 'Address to be confirmed'}</h2>

                {t.extraStop && (
                  <div style={{ fontSize: 12, color: '#facc15', marginBottom: 10 }}>
                    ⚠️ Extra Stop: {t.extraStop}
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
                      <Navigation size={15} /> Google
                    </a>
                    <a
                      href={wazeUrl(targetAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="driver-hud-nav-btn waze"
                    >
                      <Compass size={15} /> Waze
                    </a>
                    <a
                      href={appleMapsUrl(targetAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="driver-hud-nav-btn apple"
                    >
                      <Navigation size={15} /> Apple
                    </a>
                  </div>
                )}
              </div>

              {/* Driver Status & Automated SMS Quick Control Strip (with 1-Hr & 25-Min Window Gating) */}
              {(() => {
                const tripSms = smsSentLog[t.id] || {};
                const onTheWaySent = stage >= 1 || Boolean(tripSms.on_the_way);
                const arrivedSent = stage >= 2 || Boolean(tripSms.arrived);
                return (
                  <div
                    style={{
                      background: '#131d2e',
                      border: '1px solid #1e293b',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <MessageSquare size={13} /> Status &amp; Automated Customer SMS
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {t.name || 'Customer'}{t.phone ? ` • ${t.phone}` : ''}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                      <button
                        type="button"
                        disabled={isBusy || !tw.canUpdateOnTheWay}
                        onClick={() => handleTripAction(t.id, 'on_the_way')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: stage === 1 ? '2px solid #38bdf8' : '1px solid #334155',
                          background: !tw.canUpdateOnTheWay
                            ? '#0f172a'
                            : onTheWaySent
                            ? 'rgba(37, 99, 235, 0.28)'
                            : '#1e293b',
                          color: '#fff',
                          cursor: !tw.canUpdateOnTheWay ? 'not-allowed' : 'pointer',
                          opacity: !tw.canUpdateOnTheWay ? 0.65 : 1,
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#60a5fa' }}>
                            {!tw.canUpdateOnTheWay ? '🔒' : '🚗'} Status: On the Way
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: onTheWaySent ? '#2563eb' : '#334155', color: '#fff' }}>
                            {onTheWaySent ? '✓ SMS SENT' : !tw.canUpdateOnTheWay ? '≤ 1 HR PRIOR' : 'AUTO-SMS'}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                          “Your driver is on the way.”
                        </span>
                        <span style={{ fontSize: 10, color: tw.canUpdateOnTheWay ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>
                          {tw.onTheWayWaitLabel}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy || !tw.canUpdateArrived}
                        onClick={() => handleTripAction(t.id, 'arrive')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: stage === 2 ? '2px solid #4ade80' : '1px solid #334155',
                          background: !tw.canUpdateArrived
                            ? '#0f172a'
                            : arrivedSent
                            ? 'rgba(22, 163, 74, 0.28)'
                            : '#1e293b',
                          color: '#fff',
                          cursor: !tw.canUpdateArrived ? 'not-allowed' : 'pointer',
                          opacity: !tw.canUpdateArrived ? 0.65 : 1,
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#4ade80' }}>
                            {!tw.canUpdateArrived ? '🔒' : '📍'} Status: Arrived
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: arrivedSent ? '#16a34a' : '#334155', color: '#fff' }}>
                            {arrivedSent ? '✓ SMS SENT' : !tw.canUpdateArrived ? '≤ 25 MIN PRIOR' : 'AUTO-SMS'}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                          “Your driver has arrived.”
                        </span>
                        <span style={{ fontSize: 10, color: tw.canUpdateArrived ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>
                          {tw.arrivedWaitLabel}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Giant Mission Step Progression Button - Directly Below Destination */}
              <div>
                {stage === 0 && (
                  <button
                    type="button"
                    className="driver-hud-big-action accept"
                    disabled={isBusy || !tw.canUpdateOnTheWay}
                    onClick={() => handleTripAction(t.id, 'on_the_way')}
                    style={
                      !tw.canUpdateOnTheWay
                        ? { background: '#334155', cursor: 'not-allowed', opacity: 0.85 }
                        : undefined
                    }
                  >
                    {isBusy ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : !tw.canUpdateOnTheWay ? (
                      <LockKeyhole size={20} />
                    ) : (
                      <Navigation size={20} strokeWidth={3} />
                    )}
                    {tw.canUpdateOnTheWay
                      ? 'ON THE WAY — SEND “YOUR DRIVER IS ON THE WAY.”'
                      : `ON THE WAY LOCKED • ${tw.onTheWayWaitLabel.toUpperCase()}`}
                  </button>
                )}

                {stage === 1 && (
                  <button
                    type="button"
                    className="driver-hud-big-action arrive"
                    disabled={isBusy || !tw.canUpdateArrived}
                    onClick={() => handleTripAction(t.id, 'arrive')}
                    style={
                      !tw.canUpdateArrived
                        ? { background: '#334155', cursor: 'not-allowed', opacity: 0.85 }
                        : undefined
                    }
                  >
                    {isBusy ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : !tw.canUpdateArrived ? (
                      <LockKeyhole size={20} />
                    ) : (
                      <MapPin size={20} strokeWidth={3} />
                    )}
                    {tw.canUpdateArrived
                      ? 'I’VE ARRIVED — SEND “YOUR DRIVER HAS ARRIVED.”'
                      : `ARRIVED LOCKED • ${tw.arrivedWaitLabel.toUpperCase()}`}
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
                            setActiveTab('drive');
                          }}
                        >
                          <Compass size={18} /> RETURN TO STANDBY COCKPIT
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
    </main>
  );
}
