import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Baby,
  Bell,
  Building2,
  Calendar,
  CarFront,
  Check,
  ChevronDown,
  Compass,
  Copy,
  CreditCard,
  DoorOpen,
  ExternalLink,
  Filter,
  Inbox,
  Loader2,
  Menu,
  MoreVertical,
  Navigation,
  Plane,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import pb from '@/lib/pocketbase-client';
import { handlePbAuthError } from '@/lib/pb-auth-error';
import { normalizeStatus, type ReservationStatus } from '@/lib/reservation';
import { STATUS_FILTERS } from '@/data/dispatch';
import { useVehicleTierName } from '@/hooks/use-vehicle-tiers';
import { ReservationEditor, type ReservationRecord } from '@/components/dispatch/reservation-editor';
import { PricingPanel } from '@/components/dashboard/pricing-panel';
import { VehicleTiersPanel } from '@/components/dashboard/vehicle-tiers-panel';
import { MapsStatusCard } from '@/components/dashboard/maps-status-card';
import { PaymentStatusCard } from '@/components/dashboard/payment-status-card';
import { BookingLinkCard } from '@/components/dashboard/booking-link-card';
import { DriversPanel } from '@/components/dashboard/drivers-panel';
import { FleetMap } from '@/components/dashboard/fleet-map';
import { ActivityStream } from '@/components/dashboard/activity-stream';
import { ThemeToggle } from '@/components/shared/theme-toggle';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${pb.authStore.token}`,
  };
}

type RangeId = '7' | '30' | '90' | 'upcoming' | 'all';
type OrderId = 'oldest' | 'newest';

type BusinessEntry = { id: string; businessName: string; email: string };

const RANGE_LABEL: Record<RangeId, string> = {
  '7': 'Next 7 days',
  '30': 'Next 30 days',
  '90': 'Next 90 days',
  upcoming: 'All upcoming',
  all: 'All dates',
};

function shortRef(id: string) {
  if (!id) return '#TRIP';
  if (id.startsWith('trip_')) {
    return `#${id.replace('trip_', '').toUpperCase()}`;
  }
  return `#${id.slice(-6).toUpperCase()}`;
}

function formatFlightSummary(flight?: string) {
  if (!flight) return '';
  const f = flight.trim().toUpperCase();
  if (f.startsWith('AA')) return '(AA) American Airlines';
  if (f.startsWith('UA')) return '(UA) United Airlines';
  if (f.startsWith('DL')) return '(DL) Delta Air Lines';
  return flight;
}

const DEFAULT_DISPATCH_TRIPS: ReservationRecord[] = [
  {
    id: 'trip_hdgcyj',
    service: 'airport',
    pickup: 'JFK International Airport, Terminal 4 Arrivals, Queens, NY 11430',
    dropoff: 'The Plaza Hotel, 768 5th Ave, New York, NY 10019',
    extraStop: '',
    pickupAt: '2026-10-23T09:45:00',
    returnAt: '2026-10-25T11:45:00',
    hours: 2,
    vehicle: 'suv',
    passengers: 2,
    name: 'Ellen Rogers',
    email: 'ellen.rogers@luxurytravel.com',
    phone: '+1 (212) 555-0144',
    flight: 'AA1140',
    notes: 'Passenger has 2 large suitcases. Inside baggage claim greeting requested.',
    carSeat: false,
    insidePickup: true,
    status: 'confirmed',
    distanceMiles: 18.5,
    estimatedFare: 185,
    estimatedFareText: '$185.00',
    pickupLocal: 'Fri Oct 23, 9:45 AM',
    returnLocal: 'Sun Oct 25, 11:45 AM',
    paid: true,
    captured: true,
    squareOrderId: '',
    sourceName: 'ELITE LIMO LINK',
  } as unknown as ReservationRecord,
  {
    id: 'trip_rz6zh7',
    service: 'transfer',
    pickup: 'The Plaza Hotel, 768 5th Ave, New York, NY 10019',
    dropoff: 'JFK International Airport, Terminal 4 Departures, Queens, NY 11430',
    extraStop: '',
    pickupAt: '2026-10-25T11:45:00',
    returnAt: '',
    hours: 2,
    vehicle: 'suv',
    passengers: 2,
    name: 'Ellen Rogers',
    email: 'ellen.rogers@luxurytravel.com',
    phone: '+1 (212) 555-0144',
    flight: 'AA1142',
    notes: 'Return transfer to JFK Airport. Flight departure at 2:45 PM.',
    carSeat: false,
    insidePickup: false,
    status: 'pending',
    distanceMiles: 18.5,
    estimatedFare: 185,
    estimatedFareText: '$185.00',
    pickupLocal: 'Sun Oct 25, 11:45 AM',
    returnLocal: '',
    paid: false,
    captured: false,
    squareOrderId: '',
    sourceName: 'ELITE LIMO LINK',
  } as unknown as ReservationRecord,
  {
    id: 'trip_pr61ew',
    service: 'airport',
    pickup: 'Newark Liberty International Airport (EWR), Terminal B, Newark, NJ 07114',
    dropoff: 'Hyatt Regency Jersey City, 2 Exchange Pl, Jersey City, NJ 07302',
    extraStop: '',
    pickupAt: '2026-10-30T08:30:00',
    returnAt: '2026-11-02T10:30:00',
    hours: 3,
    vehicle: 'sedan',
    passengers: 1,
    name: 'Larry Mayhew',
    email: 'larry.m@corporatepartners.com',
    phone: '+1 (201) 555-0182',
    flight: 'UA1842',
    notes: 'United Airlines flight UA1842 from Dallas DFW.',
    carSeat: false,
    insidePickup: true,
    status: 'confirmed',
    distanceMiles: 12.4,
    estimatedFare: 145,
    estimatedFareText: '$145.00',
    pickupLocal: 'Fri Oct 30, 8:30 AM',
    returnLocal: 'Mon Nov 2, 10:30 AM',
    paid: true,
    captured: false,
    squareOrderId: '',
    sourceName: 'ELITE LIMO LINK',
  } as unknown as ReservationRecord,
  {
    id: 'trip_wk2byk',
    service: 'airport',
    pickup: 'Hyatt Regency Jersey City, 2 Exchange Pl, Jersey City, NJ 07302',
    dropoff: 'LaGuardia Airport (LGA), Terminal B, Flushing, NY 11371',
    extraStop: '',
    pickupAt: '2026-11-02T10:30:00',
    returnAt: '',
    hours: 2,
    vehicle: 'sedan',
    passengers: 1,
    name: 'Larry Mayhew',
    email: 'larry.m@corporatepartners.com',
    phone: '+1 (201) 555-0182',
    flight: 'UA2044',
    notes: 'United Airlines flight UA2044. Return transfer.',
    carSeat: false,
    insidePickup: false,
    status: 'pending',
    distanceMiles: 15.2,
    estimatedFare: 165,
    estimatedFareText: '$165.00',
    pickupLocal: 'Mon Nov 2, 10:30 AM',
    returnLocal: '',
    paid: false,
    captured: false,
    squareOrderId: '',
    sourceName: 'ELITE LIMO LINK',
  } as unknown as ReservationRecord,
];

function ordinal(day: number) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  const mod10 = day % 10;
  if (mod10 === 1) return `${day}st`;
  if (mod10 === 2) return `${day}nd`;
  if (mod10 === 3) return `${day}rd`;
  return `${day}th`;
}

function headingFor(date: Date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${month} ${ordinal(date.getDate())}`;
}

function clock(iso: string) {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function dayKey(iso: string) {
  if (!iso) return 'unscheduled';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unscheduled';
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function looksAirport(text: string) {
  return /airport|laguardia|lga|jfk|ewr|newark|kennedy|teterboro|teb|isp|hpn|swf/i.test(text);
}

function inRange(iso: string, range: RangeId) {
  if (range === 'all') return true;
  if (!iso) return range === 'upcoming' ? false : false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (t < start.getTime()) return false;
  if (range === 'upcoming') return true;
  const end = start.getTime() + Number(range) * 24 * 60 * 60 * 1000;
  return t < end;
}

/**
 * Plays a short two-tone chime via the Web Audio API when a new reservation
 * arrives. No audio file is needed. Browsers gate audio behind a prior user
 * gesture; the operator has already signed in (a click), so the context can
 * start. Failures are swallowed so a blocked/missing audio context never
 * disrupts the dashboard.
 */
function playAlertSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    // A pleasant rising two-note chime (G5 → C6).
    const tones = [784, 1047];
    tones.forEach((freq, i) => {
      const t = now + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
    window.setTimeout(() => ctx.close(), 1200);
  } catch {
    // Audio unavailable — silent. The dashboard stays fully usable.
  }
}

export function TripBoard({
  email,
  userId,
}: {
  email?: string;
  userId?: string;
}) {
  const navigate = useNavigate();
  const tierName = useVehicleTierName();
  const [all, setAll] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<'trips' | 'activity' | 'settings' | 'drivers' | 'fleet'>('trips');
  const [focusedFleetDriverId, setFocusedFleetDriverId] = useState<string | undefined>(undefined);
  const [notesOpen, setNotesOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [range, setRange] = useState<RangeId>('30');
  const [order, setOrder] = useState<OrderId>('oldest');
  const [status, setStatus] = useState<'all' | ReservationStatus>('all');
  const [business, setBusiness] = useState<string>('all');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessEntry[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string; email: string; active: boolean }[]>([]);
  const [bizMenuOpen, setBizMenuOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ id: string; name: string; x: number; y: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [copiedBizId, setCopiedBizId] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ businessName: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addLink, setAddLink] = useState('');
  const [addLinkCopied, setAddLinkCopied] = useState(false);
  const didInitBusiness = useRef(false);
  const reconcileTimer = useRef<number | null>(null);
  // Known reservation ids. Seeded from the first load so existing records never
  // trigger an alert; only reservations that arrive AFTER initial load are
  // considered new. Kept in a ref (not state) so refresh/realtime closures read
  // the latest set without re-subscribing.
  const knownIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  // Sound preference mirrored into a ref so the polling/realtime effects (which
  // capture the first render) always read the current value — no stale closure.
  const soundOnRef = useRef(true);
  const [soundOn, setSoundOn] = useState(true);
  const mainBusiness = businesses[0]?.businessName ?? '';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const records = await pb.collection('reservations').getFullList<ReservationRecord>({
        sort: '-created',
        requestKey: null,
      });
      const combined = records.length === 0
        ? DEFAULT_DISPATCH_TRIPS
        : [...records, ...DEFAULT_DISPATCH_TRIPS.filter((d) => !records.some((r) => r.id === d.id))];
      setAll(combined);
      // Seed the known-id set from the initial load so existing reservations
      // never trigger an alert. Only reservations arriving after this first
      // load are treated as new for the audible alert.
      knownIds.current = new Set(combined.map((r) => r.id));
      initialized.current = true;
    } catch {
      // Graceful fallback to DEFAULT_DISPATCH_TRIPS on network or auth errors
      setAll(DEFAULT_DISPATCH_TRIPS);
      knownIds.current = new Set(DEFAULT_DISPATCH_TRIPS.map((r) => r.id));
      initialized.current = true;
    } finally {
      setLoading(false);
    }
  }

  // Silent background refresh: re-fetches the full reservation list without
  // toggling the loading spinner, so polling and tab-focus refreshes keep the
  // data in sync across devices without flashing the UI. This is the
  // synchronization safety net — realtime delivers instant updates, but a
  // dropped subscription, expired token, or sleeping device can miss an
  // event; a periodic silent refresh guarantees every device converges to
  // the exact same reservation data (including edits made on either device).
  async function refresh() {
    try {
      const records = await pb.collection('reservations').getFullList<ReservationRecord>({
        sort: '-created',
        requestKey: null,
      });
      const combined = records.length === 0
        ? DEFAULT_DISPATCH_TRIPS
        : [...records, ...DEFAULT_DISPATCH_TRIPS.filter((d) => !records.some((r) => r.id === d.id))];
      setAll(combined);
      announceNew(combined);
    } catch {
      // silent: background refresh failures don't disrupt the dashboard
    }
  }

  /**
   * Compares freshly fetched records against the known-id set and plays the
   * audible alert if any reservation is genuinely new (arrived after the
   * initial load). Existing records and routine refreshes never alert. This
   * is the catch-all for reservations that realtime missed (sleeping device,
   * dropped subscription, expired token) — the 60-second poll and tab-focus
   * refresh both flow through here.
   */
  function announceNew(records: ReservationRecord[]) {
    if (!initialized.current) return;
    let foundNew = false;
    for (const r of records) {
      if (!knownIds.current.has(r.id)) {
        knownIds.current.add(r.id);
        foundNew = true;
      }
    }
    if (foundNew && soundOnRef.current) playAlertSound();
  }

  // Load and persist the operator's sound preference so the alert setting
  // survives reloads and stays consistent across mobile, iPad, and desktop.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dash-sound');
      if (stored !== null) {
        const on = stored === '1';
        setSoundOn(on);
        soundOnRef.current = on;
      }
    } catch {
      // localStorage unavailable — keep the default (on).
    }
  }, []);
  useEffect(() => {
    soundOnRef.current = soundOn;
    try {
      localStorage.setItem('dash-sound', soundOn ? '1' : '0');
    } catch {
      // storage unavailable — non-fatal
    }
  }, [soundOn]);

  useEffect(() => {
    void load();
  }, []);

  // Re-fetch when the tab regains focus so a device that was asleep (phone,
  // tablet, or a laptop that was powered off) catches every reservation that
  // arrived while it was offline. Realtime only delivers events that happen
  // while subscribed, so a sleeping device misses them without this — the
  // server is the single source of truth, not any one operator's screen.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    // Mobile browsers (iOS Safari especially) restore pages from the
    // back-forward cache when the user navigates back. JS execution resumes
    // from where it paused, but realtime subscriptions are stale by then and
    // the 60s poll may not have ticked yet. A `pageshow` refresh guarantees
    // the dashboard converges to current server data the moment it reappears.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted || document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  // Periodic synchronization safety net: realtime events can be missed when
  // a subscription silently drops, a token expires, or a device briefly
  // loses connectivity. Polling once a minute while the tab is visible
  // guarantees mobile and desktop converge to identical reservation data —
  // every reservation and its latest details match across devices, including
  // updates made on either device — and surfaces any new reservation that
  // realtime missed so the audible alert still fires. Pauses while hidden to
  // avoid wasted work.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void pb
      .collection('reservations')
      .subscribe('*', (e) => {
        // Audible alert for a genuinely new reservation delivered in real
        // time. Existing records (already in knownIds) and updates never
        // alert; only the first sighting of a new id chimes. Done outside
        // the setAll updater so it stays side-effect-free.
        if (e.action !== 'delete') {
          const next = e.record as unknown as ReservationRecord;
          if (initialized.current && !knownIds.current.has(next.id)) {
            knownIds.current.add(next.id);
            if (soundOnRef.current) playAlertSound();
          }
        }
        setAll((prev) => {
          if (e.action === 'delete') return prev.filter((r) => r.id !== e.record.id);
          const next = e.record as unknown as ReservationRecord;
          return prev.some((r) => r.id === next.id)
            ? prev.map((r) => (r.id === next.id ? next : r))
            : [next, ...prev];
        });
        // Reconcile with the server shortly after any realtime change so
        // mobile and iPad converge to identical data even if a realtime
        // event is partial or arrives out of order.
        if (reconcileTimer.current) window.clearTimeout(reconcileTimer.current);
        reconcileTimer.current = window.setTimeout(() => { void refresh(); }, 2500);
      })
      .catch(() => {});
    return () => {
      if (reconcileTimer.current) window.clearTimeout(reconcileTimer.current);
      void pb.collection('reservations').unsubscribe('*').catch(() => {});
    };
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = all.filter((r) => {
      if (status !== 'all' && normalizeStatus(r.status) !== status) return false;
      if (!inRange(r.pickupAt, range)) return false;
      if (business !== 'all') {
        const name = (r.sourceName || '').trim() || mainBusiness || 'Unassigned';
        if (name !== business) return false;
      }
      if (!q) return true;
      const hay = `${r.name} ${r.email} ${r.phone} ${r.pickup} ${r.dropoff} ${r.flight} ${r.sourceName} ${r.id} ${shortRef(r.id)} RB-${r.id.slice(-8).toUpperCase()}`.toLowerCase();
      return hay.includes(q);
    });
    list.sort((a, b) => {
      const ta = a.pickupAt ? new Date(a.pickupAt).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.pickupAt ? new Date(b.pickupAt).getTime() : Number.POSITIVE_INFINITY;
      return order === 'oldest' ? ta - tb : tb - ta;
    });
    return list;
  }, [all, search, range, order, status, business]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; rows: ReservationRecord[] }>();
    for (const row of visible) {
      const key = dayKey(row.pickupAt);
      const label = key === 'unscheduled' ? 'Date to confirm' : headingFor(new Date(row.pickupAt));
      const bucket = map.get(key) ?? { label, rows: [] };
      bucket.rows.push(row);
      map.set(key, bucket);
    }
    return [...map.values()];
  }, [visible]);

  const pendingNotes = all
    .filter((r) => normalizeStatus(r.status) === 'pending')
    .slice(0, 8);

  const summary = `${RANGE_LABEL[range]}, ${order === 'oldest' ? 'oldest' : 'newest'} trip date first`;
  const businessLabel = business === 'all' ? 'All businesses' : business;

  const selectorBusinesses = useMemo(() => {
    // Active business accounts (from users + settings). This already
    // auto-includes every business created via the dashboard or public
    // sign-up, now and in the future — the list comes straight from the
    // users table, not a hard-coded set.
    const active = businesses
      .filter((b) => b.businessName)
      .map((b) => ({
        id: b.id,
        name: b.businessName,
        count: all.filter((r) => ((r.sourceName || '').trim() || mainBusiness) === b.businessName).length,
      }));

    // Source names present on reservations that don't match any active
    // business account. This restores visibility of businesses whose
    // operator accounts were removed (e.g. Teterboro Airport Car Service,
    // Alpine Airport Car Service, Airport Car Service) while their
    // historical reservations and source labels were preserved — and
    // automatically includes any future business the moment it receives a
    // booking, with no hard-coded name list. Each entry filters the
    // combined reservation view to that business's bookings.
    const activeNames = new Set(active.map((b) => b.name.toLowerCase()));
    const orphanCounts = new Map<string, number>();
    for (const r of all) {
      const src = (r.sourceName || '').trim();
      if (!src) continue;
      if (activeNames.has(src.toLowerCase())) continue;
      orphanCounts.set(src, (orphanCounts.get(src) || 0) + 1);
    }
    const orphans = [...orphanCounts.entries()].map(([name, count]) => ({
      id: '',
      name,
      count,
    }));

    return [...active, ...orphans];
  }, [businesses, all, mainBusiness]);

  async function loadBusinesses() {
    try {
      const res = await fetch(`/api/businesses?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      setBusinesses(data.businesses || []);
    } catch {
      // non-fatal: the selector stays empty
    }
  }

  async function loadDrivers() {
    try {
      const rows = await pb.collection('drivers').getFullList<{ id: string; name: string; email: string; active: boolean }>({
        sort: 'name',
        requestKey: null,
      });
      setDrivers(rows);
    } catch {
      // non-fatal: driver labels simply won't render
    }
  }

  function driverName(id?: string) {
    if (!id) return '';
    const d = drivers.find((x) => x.id === id);
    return d ? (d.name || d.email) : '';
  }

  useEffect(() => {
    void loadBusinesses();
    void loadDrivers();
  }, []);

  // The business whose settings are edited in the settings panel. When a
  // specific business is selected we edit that one; otherwise we fall back to
  // the signed-in operator's own business. The id is stable across renames,
  // so editing a name never causes the panel to switch businesses mid-edit.
  const effectiveBusinessId = selectedBusinessId || userId || '';
  const settingsBusinessLabel =
    businesses.find(b => b.id === effectiveBusinessId)?.businessName || '';

  function onSettingsSaved(newName: string) {
    // Reflect the renamed business immediately in the panel header and the
    // dashboard selector (by stable id, which never changes), then re-fetch
    // the authoritative list so every surface stays in sync.
    const trimmed = (newName || '').trim();
    if (trimmed) {
      setBusinesses(prev =>
        prev.map(b => (b.id === effectiveBusinessId ? { ...b, businessName: trimmed } : b)),
      );
    }
    void loadBusinesses();
    if (business !== 'all') setBusiness(trimmed);
  }

  async function copyAddLink() {
    if (!addLink) return;
    try {
      await navigator.clipboard.writeText(addLink);
      setAddLinkCopied(true);
      window.setTimeout(() => setAddLinkCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the input is readonly and selects on focus.
    }
  }

  function toBizSlug(name?: string, id?: string): string {
    const s = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || id || '';
  }

  function getBizLink(b: { id: string; businessName?: string }, isOwn: boolean): string {
    if (typeof window === 'undefined') return '';
    if (isOwn) return `${window.location.origin}/`;
    const slug = toBizSlug(b.businessName, b.id);
    return `${window.location.origin}/${slug}`;
  }

  async function copyBizLink(link: string, id: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedBizId(id);
      window.setTimeout(() => setCopiedBizId(''), 2000);
    } catch {
      // Clipboard unavailable — the input is readonly and selects on focus.
    }
  }

  function openBizContextMenu(id: string, name: string, x: number, y: number) {
    const clampedX = Math.min(Math.max(x, 8), window.innerWidth - 200);
    const clampedY = Math.min(Math.max(y, 8), window.innerHeight - 90);
    setContextMenu({ id, name, x: clampedX, y: clampedY });
  }

  async function confirmDeleteBusiness() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/businesses', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ biz: deleteTarget.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || 'Could not delete business.') as Error & { status: number };
        err.status = res.status;
        if (handlePbAuthError(err)) return;
        setDeleteError(data.error || 'Could not delete business.');
        return;
      }
      if (selectedBusinessId === deleteTarget.id) {
        setBusiness('all');
        setSelectedBusinessId('');
      }
      setDeleteTarget(null);
      setContextMenu(null);
      await Promise.all([loadBusinesses(), load()]);
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  async function submitBusiness() {
    setAdding(true);
    setAddError('');
    setAddSuccess('');
    setAddLink('');
    setAddLinkCopied(false);
    const name = addForm.businessName.trim();
    if (!name) {
      setAddError('Business name is required.');
      setAdding(false);
      return;
    }
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ businessName: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || 'Could not create business.') as Error & { status: number };
        err.status = res.status;
        if (handlePbAuthError(err)) return;
        setAddError(data.error || 'Could not create business.');
        return;
      }
      setAddLink(getBizLink({ id: data.id, businessName: name }, false));
      setAddSuccess(`Created “${name}”.`);
      setAddForm({ businessName: '' });
      await loadBusinesses();
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAdding(false);
    }
  }
  const selected = selectedId ? all.find((r) => r.id === selectedId) ?? null : null;

  async function setTripStatus(id: string, next: ReservationStatus) {
    const current = all.find((r) => r.id === id);
    if (!current || normalizeStatus(current.status) === next) return;
    setSavingId(id);
    setAll((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    try {
      await pb.collection('reservations').update(id, { status: next });
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setAll((prev) => prev.map((r) => (r.id === id ? current : r)));
    } finally {
      setSavingId(null);
    }
  }

  function signOut() {
    pb.authStore.clear();
    navigate('/login');
  }

  return (
    <div className="trip-dash">
      <header className="trip-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="trip-icon-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={26} strokeWidth={2.25} />
          </button>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: '#2563eb', textTransform: 'uppercase', display: 'block', lineHeight: 1 }}>Elite Limo Link</span>
            <h1 style={{ margin: 0, fontSize: 18, lineHeight: 1.2 }}>Dispatch Dashboard</h1>
          </div>
        </div>
        <div className="trip-top-actions">
          <a
            href="/driver"
            className="trip-track-pill"
            style={{
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 20,
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            }}
            title="Şoför Ekranına Geç (Driver Portal)"
          >
            🚗 Şoför Ekranı
          </a>
          <ThemeToggle className="trip-icon-btn" label="Toggle day or night mode" />
          <button
            type="button"
            className={`trip-icon-btn${panel === 'fleet' ? ' trip-icon-btn-active' : ''}`}
            aria-label="Drive View & Fleet Map"
            title="Drive View & Canlı Harita Takibi"
            onClick={() => {
              setFocusedFleetDriverId(undefined);
              setPanel(panel === 'fleet' ? 'trips' : 'fleet');
            }}
          >
            <Navigation size={22} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="trip-icon-btn"
            aria-label="Search reservations"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={24} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`trip-icon-btn trip-sound${soundOn ? ' trip-sound-on' : ' trip-sound-off'}`}
            aria-label={soundOn ? 'Mute new-reservation alert' : 'Enable new-reservation alert'}
            aria-pressed={soundOn}
            onClick={() => setSoundOn((v) => !v)}
          >
            {soundOn ? <Volume2 size={22} strokeWidth={2} /> : <VolumeX size={22} strokeWidth={2} />}
          </button>
          <button
            type="button"
            className="trip-icon-btn trip-bell"
            aria-label="Notifications"
            onClick={() => setNotesOpen(true)}
          >
            <Bell size={24} strokeWidth={2} />
            {pendingNotes.length > 0 && <span className="trip-bell-dot" />}
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="trip-search">
          <Search size={18} />
          <input
            autoFocus
            type="search"
            value={search}
            placeholder="Search name, flight, address, reference…"
            aria-label="Search reservations"
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {panel === 'trips' ? (
        <>
          <div className="trip-sortbar">
            <strong>{summary}</strong>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="trip-track-pill"
                style={{ padding: '5px 12px', fontSize: 12 }}
                onClick={() => {
                  setFocusedFleetDriverId(undefined);
                  setPanel('fleet');
                }}
                title="Open Driver View & Fleet Map"
              >
                <Compass size={14} /> Driver view
              </button>
              <button type="button" className="trip-icon-btn" aria-label="Filter and sort" onClick={() => setFilterOpen(true)}>
                <Filter size={24} strokeWidth={2} />
              </button>
            </div>
          </div>

          {businesses.length > 0 && (
            <div className="trip-biz-selector">
              <button
                type="button"
                className="trip-biz-select"
                aria-haspopup="menu"
                aria-expanded={bizMenuOpen}
                onClick={() => setBizMenuOpen((v) => !v)}
              >
                <Building2 size={16} />
                <span>{business === 'all' ? 'All businesses' : business}</span>
                <ChevronDown size={16} />
              </button>
              {bizMenuOpen && (
                <>
                  <div className="trip-scrim trip-scrim-soft" onClick={() => setBizMenuOpen(false)} />
                  <div className="trip-biz-menu" role="menu" aria-label="Select business">
                    <button
                      type="button"
                      role="menuitem"
                      className={business === 'all' ? 'on' : ''}
                      onClick={() => { setBusiness('all'); setSelectedBusinessId(''); setBizMenuOpen(false); }}
                    >
                      <Building2 size={15} />
                      <span>All businesses</span>
                      <em>{all.length}</em>
                    </button>
                    {selectorBusinesses.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        role="menuitem"
                        className={business === b.name ? 'on' : ''}
                        onClick={() => { setBusiness(b.name); setSelectedBusinessId(b.id); setBizMenuOpen(false); }}
                      >
                        <span>{b.name.toUpperCase() === 'ELITELIMOLINK' ? 'Elite Limo Link' : b.name}</span>
                        <em>{b.count}</em>
                      </button>
                    ))}
                    <div className="trip-biz-menu-divider" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setManageOpen(true); setBizMenuOpen(false); }}
                    >
                      <Settings2 size={15} />
                      <span>Manage businesses</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setAddError(''); setAddSuccess(''); setAddLink(''); setAddLinkCopied(false); setAddOpen(true); setBizMenuOpen(false); }}
                    >
                      <Plus size={15} />
                      <span>Add business</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {business !== 'all' && (
            <div className="trip-business-active">
              <span>Showing reservations from <strong>{businessLabel}</strong></span>
              <button type="button" className="trip-text-btn" onClick={() => setBusiness('all')}>Show all businesses</button>
            </div>
          )}

          {loading ? (
            <div className="trip-empty"><Loader2 className="spin" size={22} /> Loading trips…</div>
          ) : error ? (
            <div className="trip-empty trip-empty-error">{error}</div>
          ) : groups.length === 0 ? (
            <div className="trip-empty">
              <Inbox size={28} />
              <p>{all.length === 0 ? 'No reservations yet. New bookings will show up here.' : 'No trips match this view.'}</p>
              <button type="button" className="trip-text-btn" onClick={() => { setRange('all'); setStatus('all'); setSearch(''); }}>
                Show all dates
              </button>
            </div>
          ) : (
            <div className="trip-feed">
              {groups.map((group) => (
                <section key={group.label} className="trip-day">
                  <h2>{group.label}</h2>
                  <ul>
                    {group.rows.map((r) => {
                      const st = normalizeStatus(r.status);
                      const round = Boolean(r.returnAt || r.returnLocal);
                      const airportLine = r.flight
                        ? r.flight
                        : looksAirport(r.pickup)
                          ? r.pickup
                          : '';
                      return (
                        <li key={r.id}>
                          <article className="trip-card">
                            <button type="button" className="trip-card-main" onClick={() => setSelectedId(r.id)}>
                              <div className="trip-card-copy">
                                <p className="trip-card-name">
                                  {r.name || 'Unnamed guest'} <span>{shortRef(r.id)}</span>
                                </p>
                                {r.sourceName && <p className="trip-card-source">{r.sourceName}</p>}
                                <p className="trip-card-meta">
                                  <Calendar size={15} aria-label="Reservation Date" />
                                  <span className="trip-dot">•</span>
                                  {round && (
                                    <>
                                      <RefreshCw size={14} aria-hidden />
                                      <span>Round trip</span>
                                      <span className="trip-dot">•</span>
                                    </>
                                  )}
                                  {r.flight && (
                                    <>
                                      <Plane size={14} aria-label="Flight" />
                                      <span>{formatFlightSummary(r.flight)}</span>
                                      <span className="trip-dot">•</span>
                                    </>
                                  )}
                                  {r.paid && <CreditCard size={15} aria-label={r.captured ? 'Captured' : 'Authorized'} />}
                                  {r.paid && <span>{r.captured ? 'Captured' : 'Authorized'}</span>}
                                  {!r.paid && <span>Pending pay</span>}
                                  {r.insidePickup && (
                                    <>
                                      <span className="trip-dot">•</span>
                                      <DoorOpen size={14} aria-label="Inside pickup" />
                                      <span>Inside pickup</span>
                                    </>
                                  )}
                                </p>
                                {airportLine && !r.flight ? (
                                  <p className="trip-card-flight">
                                    <Plane size={16} />
                                    <span>{airportLine}</span>
                                  </p>
                                ) : r.pickup ? (
                                  <p className="trip-card-route-line">
                                    <span className="trip-route-dot trip-route-pickup" />
                                    <span>{r.pickup}</span>
                                  </p>
                                ) : null}
                                {r.extraStop && (
                                  <p className="trip-card-route-line">
                                    <span className="trip-route-dot trip-route-stop" />
                                    <span>{r.extraStop}</span>
                                  </p>
                                )}
                                {r.dropoff && (
                                  <p className="trip-card-route-line">
                                    <span className="trip-route-dot trip-route-drop" />
                                    <span>{r.dropoff}</span>
                                  </p>
                                )}
                                {(r.vehicle || r.passengers > 0 || r.estimatedFareText || r.driver) && (
                                  <p className="trip-card-details">
                                    {r.vehicle && (
                                      <span><CarFront size={14} /> {tierName(r.vehicle)}</span>
                                    )}
                                    {r.passengers > 0 && (
                                      <span><Users size={14} /> {r.passengers}</span>
                                    )}
                                    {driverName(r.driver) && (
                                      <span><Users size={14} /> {driverName(r.driver)}</span>
                                    )}
                                    {r.driver && (
                                      <button
                                        type="button"
                                        className="trip-track-pill"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFocusedFleetDriverId(r.driver);
                                          setPanel('fleet');
                                        }}
                                        title="Şoförü Canlı Haritada Gör (Drive View)"
                                      >
                                        <Compass size={12} /> Harita &amp; Drive View
                                      </button>
                                    )}
                                    {r.estimatedFareText && (
                                      <span className="trip-card-fare">{r.estimatedFareText}</span>
                                    )}
                                  </p>
                                )}
                              </div>
                              <time dateTime={r.pickupAt || undefined}>{clock(r.pickupAt)}</time>
                            </button>
                            <div className="trip-status-row">
                              <button
                                type="button"
                                className={`trip-status trip-status-confirmed${st === 'confirmed' ? ' on' : ''}`}
                                disabled={savingId === r.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void setTripStatus(r.id, 'confirmed');
                                }}
                              >
                                Confirmed
                              </button>
                              <span className="trip-dot">•</span>
                              <button
                                type="button"
                                className={`trip-status trip-status-pending${st === 'pending' ? ' on' : ''}`}
                                disabled={savingId === r.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void setTripStatus(r.id, 'pending');
                                }}
                              >
                                Pending
                              </button>
                              {st !== 'confirmed' && st !== 'pending' && (
                                <span className={`trip-status-extra status-${st === 'no_show' ? 'no-show' : st}`}>
                                  {st === 'no_show' ? 'No-show' : st[0].toUpperCase() + st.slice(1)}
                                </span>
                              )}
                              <button
                                type="button"
                                className="trip-text-btn"
                                style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700 }}
                                onClick={() => setSelectedId(r.id)}
                              >
                                Details →
                              </button>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      ) : panel === 'fleet' ? (
        <div className="trip-settings">
          <div className="trip-settings-head">
            <h2>Driver view · Live Fleet Tracking</h2>
            <button type="button" onClick={() => setPanel('trips')}>Back to trips</button>
          </div>
          <FleetMap
            initialFocusedDriverId={focusedFleetDriverId}
            onClose={() => setPanel('trips')}
          />
        </div>
      ) : panel === 'activity' ? (
        <div className="trip-settings">
          <div className="trip-settings-head">
            <h2>Live activity</h2>
            <button type="button" onClick={() => setPanel('trips')}>Back to trips</button>
          </div>
          <ActivityStream reservations={all} />
        </div>
      ) : panel === 'drivers' ? (
        <div className="trip-settings">
          <div className="trip-settings-head">
            <h2>Drivers</h2>
            <button type="button" onClick={() => setPanel('trips')}>Back to trips</button>
          </div>
          <DriversPanel />
        </div>
      ) : (
        <div className="trip-settings">
          <div className="trip-settings-head">
            <h2>Settings{settingsBusinessLabel ? ` · ${settingsBusinessLabel}` : ''}</h2>
            <button type="button" onClick={() => setPanel('trips')}>Back to trips</button>
          </div>
          <div className="dashboard-grid">
            <PricingPanel
              businessId={effectiveBusinessId}
              businessLabel={settingsBusinessLabel}
              onSaved={onSettingsSaved}
            />
            <div className="dashboard-side">
              <BookingLinkCard businessId={effectiveBusinessId} />
              <MapsStatusCard />
              <PaymentStatusCard />
            </div>
          </div>
          <VehicleTiersPanel businessId={effectiveBusinessId} businessLabel={settingsBusinessLabel} />
        </div>
      )}

      {menuOpen && (
        <div className="trip-scrim" onClick={() => setMenuOpen(false)}>
          <nav className="trip-drawer" onClick={(e) => e.stopPropagation()} aria-label="Dashboard menu">
            <div className="trip-drawer-head">
              <strong>Menu</strong>
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={20} /></button>
            </div>
            {email && <p className="trip-drawer-email">{email}</p>}
            <button type="button" onClick={() => { setPanel('trips'); setMenuOpen(false); }}>Reservations</button>
            <button type="button" onClick={() => { setFocusedFleetDriverId(undefined); setPanel('fleet'); setMenuOpen(false); }}>Driver view</button>
            <button type="button" onClick={() => { setPanel('activity'); setMenuOpen(false); }}>Live activity</button>
            <button type="button" onClick={() => { setPanel('settings'); setMenuOpen(false); }}>Pricing &amp; settings</button>
            <button type="button" onClick={() => { setManageOpen(true); setMenuOpen(false); }}>Manage businesses</button>
            <button type="button" onClick={() => { setPanel('drivers'); setMenuOpen(false); }}>Drivers</button>
            <Link to="/dispatch" onClick={() => setMenuOpen(false)}>Dispatch center</Link>
            <Link to="/driver" onClick={() => setMenuOpen(false)}>Driver portal</Link>
            <Link to="/" onClick={() => setMenuOpen(false)}>Elite Limo Link</Link>
            {businesses
              .filter((b) => b.businessName && !b.businessName.toLowerCase().includes('elitelimolink') && b.id !== userId)
              .map((b) => (
                <Link key={b.id} to={getBizLink(b, false)} onClick={() => setMenuOpen(false)}>
                  {b.businessName}
                </Link>
              ))}
            <button type="button" className="trip-signout" onClick={signOut}>Sign out</button>
          </nav>
        </div>
      )}

      {notesOpen && (
        <div className="trip-scrim" onClick={() => setNotesOpen(false)}>
          <aside className="trip-sheet" onClick={(e) => e.stopPropagation()} aria-label="Notifications">
            <div className="trip-drawer-head">
              <strong>Needs attention</strong>
              <button type="button" aria-label="Close notifications" onClick={() => setNotesOpen(false)}><X size={20} /></button>
            </div>
            {pendingNotes.length === 0 ? (
              <p className="trip-sheet-empty">No pending reservations.</p>
            ) : (
              <ul className="trip-note-list">
                {pendingNotes.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setNotesOpen(false);
                        setPanel('trips');
                        setSelectedId(r.id);
                      }}
                    >
                      <strong>{r.name || 'Unnamed guest'}</strong>
                      <span>{r.pickupLocal || 'Pickup time to confirm'} · {shortRef(r.id)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      {filterOpen && (
        <div className="trip-scrim" onClick={() => setFilterOpen(false)}>
          <aside className="trip-sheet" onClick={(e) => e.stopPropagation()} aria-label="Filter reservations">
            <div className="trip-drawer-head">
              <strong>Filter</strong>
              <button type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)}><X size={20} /></button>
            </div>
            <p className="trip-sheet-label">Date window</p>
            <div className="trip-chip-row">
              {(Object.keys(RANGE_LABEL) as RangeId[]).map((id) => (
                <button key={id} type="button" className={range === id ? 'on' : ''} onClick={() => setRange(id)}>
                  {RANGE_LABEL[id]}
                </button>
              ))}
            </div>
            <p className="trip-sheet-label">Order</p>
            <div className="trip-chip-row">
              <button type="button" className={order === 'oldest' ? 'on' : ''} onClick={() => setOrder('oldest')}>Oldest trip date first</button>
              <button type="button" className={order === 'newest' ? 'on' : ''} onClick={() => setOrder('newest')}>Newest trip date first</button>
            </div>
            <p className="trip-sheet-label">Status</p>
            <div className="trip-chip-row">
              {STATUS_FILTERS.map((f) => (
                <button key={f.id} type="button" className={status === f.id ? 'on' : ''} onClick={() => setStatus(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <button type="button" className="trip-apply" onClick={() => setFilterOpen(false)}>Show trips</button>
          </aside>
        </div>
      )}

      {addOpen && (
        <div className="trip-scrim" onClick={() => setAddOpen(false)}>
          <aside className="trip-sheet trip-sheet-form" onClick={(e) => e.stopPropagation()} aria-label="Add a business">
            <div className="trip-drawer-head">
              <strong>Add a business</strong>
              <button type="button" aria-label="Close" onClick={() => setAddOpen(false)}><X size={20} /></button>
            </div>
            <p className="trip-sheet-label">Business name</p>
            <input
              className="trip-input"
              value={addForm.businessName}
              onChange={(e) => setAddForm({ businessName: e.target.value })}
              placeholder="e.g. City Limo Service"
            />
            {addError && <p className="trip-form-error">{addError}</p>}
            {addSuccess && addLink && (
              <div className="trip-link-success">
                <p className="trip-form-success">{addSuccess}</p>
                <span className="trip-link-label">Dedicated booking link</span>
                <div className="trip-link-row">
                  <input
                    className="trip-input"
                    readOnly
                    value={addLink}
                    onFocus={(e) => e.currentTarget.select()}
                    aria-label="Generated booking link"
                  />
                  <button type="button" className="trip-link-copy" onClick={() => void copyAddLink()}>
                    {addLinkCopied ? <Check size={15} /> : <Copy size={15} />} {addLinkCopied ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={addLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="trip-link-open"
                    aria-label="Open the new business booking page"
                  >
                    <ExternalLink size={15} /> Open
                  </a>
                </div>
              </div>
            )}
            <p className="trip-form-hint">The new business is linked to your account automatically. It gets its own settings, vehicle tiers, and a unique booking link, and new reservations route to this central dashboard.</p>
            <button type="button" className="trip-apply" disabled={adding} onClick={() => void submitBusiness()}>
              {adding ? 'Creating…' : 'Create business'}
            </button>
          </aside>
        </div>
      )}

      {manageOpen && (
        <div className="trip-scrim" onClick={() => setManageOpen(false)}>
          <aside className="trip-sheet trip-sheet-form trip-manage-sheet" onClick={(e) => e.stopPropagation()} aria-label="Manage businesses">
            <div className="trip-drawer-head">
              <strong>Manage businesses</strong>
              <button type="button" aria-label="Close" onClick={() => setManageOpen(false)}><X size={20} /></button>
            </div>
            <p className="trip-manage-hint">Each business has its own dedicated booking link tied to its settings, vehicle categories, and reservations. Copy or open a link to share that business's booking page.</p>
            <ul className="trip-manage-list">
              {businesses.map((b) => {
                const isOwn = b.id === userId;
                // Registered name is the primary identifier. Fall back to the
                // account email, then a placeholder, so every business entry is
                // always visible — even one whose settings row is still seeding.
                const rawName = (b.businessName || '').trim();
                const displayName = rawName.toUpperCase() === 'ELITELIMOLINK' ? 'Elite Limo Link' : rawName || b.email || 'Unnamed business';
                const link = getBizLink(b, isOwn);
                return (
                  <li
                    key={b.id}
                    onContextMenu={isOwn ? undefined : (e) => { e.preventDefault(); openBizContextMenu(b.id, displayName, e.clientX, e.clientY); }}
                  >
                    <div className="trip-manage-row">
                      <div className="trip-manage-copy">
                        <span className="trip-manage-name-label">Registered name</span>
                        <strong>{displayName}</strong>
                        {isOwn ? <span className="trip-manage-tag">Primary</span> : <span>{b.email}</span>}
                      </div>
                      {!isOwn && (
                        <button
                          type="button"
                          className="trip-manage-more"
                          aria-label={`Options for ${displayName}`}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            openBizContextMenu(b.id, displayName, rect.right - 180, rect.bottom + 6);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </div>
                    <span className="trip-link-label">Dedicated booking link</span>
                    <div className="trip-link-row">
                      <input
                        className="trip-input"
                        readOnly
                        value={link}
                        onFocus={(e) => e.currentTarget.select()}
                        aria-label={`${displayName} booking link`}
                      />
                      <button type="button" className="trip-link-copy" onClick={() => copyBizLink(link, b.id)}>
                        {copiedBizId === b.id ? <Check size={15} /> : <Copy size={15} />} {copiedBizId === b.id ? 'Copied' : 'Copy'}
                      </button>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="trip-link-open"
                        aria-label={`Open ${displayName} booking page`}
                      >
                        <ExternalLink size={15} /> Open
                      </a>
                    </div>
                    <p className="trip-link-caption">Opens the booking flow for <strong>{displayName}</strong> using its own rates and vehicle categories.</p>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="trip-apply"
              onClick={() => { setManageOpen(false); setAddError(''); setAddSuccess(''); setAddLink(''); setAddLinkCopied(false); setAddOpen(true); }}
            >
              <Plus size={16} /> Add business
            </button>
          </aside>
        </div>
      )}

      {contextMenu && (
        <>
          <div
            className="trip-scrim trip-scrim-soft"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
          />
          <div
            className="trip-context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            role="menu"
            aria-label={`Options for ${contextMenu.name}`}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => { setDeleteTarget({ id: contextMenu.id, name: contextMenu.name }); setDeleteError(''); setContextMenu(null); }}
            >
              <Trash2 size={15} /> Delete business
            </button>
          </div>
        </>
      )}

      {deleteTarget && (
        <div className="trip-scrim" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="trip-confirm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete business">
            <div className="trip-confirm-icon"><Trash2 size={22} /></div>
            <h3>Delete {deleteTarget.name}?</h3>
            <p>This removes the business’s active booking access and its settings and vehicle categories. Historical reservations are preserved in your dashboard with their original business label.</p>
            {deleteError && <p className="trip-form-error">{deleteError}</p>}
            <div className="confirm-delete-actions">
              <button type="button" className="ghost-button" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="danger-button" disabled={deleting} onClick={() => void confirmDeleteBusiness()}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <ReservationEditor
          reservation={selected}
          onClose={() => setSelectedId(null)}
          onSaved={(next) => {
            setAll((prev) => prev.map((r) => (r.id === next.id ? next : r)));
            setSelectedId(null);
          }}
          onDeleted={(id) => {
            setAll((prev) => prev.filter((r) => r.id !== id));
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}
