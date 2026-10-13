import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Baby,
  CalendarDays,
  CarFront,
  DoorOpen,
  Inbox,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

type SortId = 'created' | 'pickup';
const SORT_LABELS: Record<SortId, string> = {
  created: 'Newest request',
  pickup: 'Upcoming pickup',
};
import pb from '@/lib/pocketbase-client';
import { handlePbAuthError } from '@/lib/pb-auth-error';
import { compareByPickup, normalizeStatus, RESERVATION_STATUSES, type ReservationStatus } from '@/lib/reservation';
import { STATUS_FILTERS } from '@/data/dispatch';
import { useVehicleTierName } from '@/hooks/use-vehicle-tiers';
import { StatusBadge } from '@/components/dispatch/status-badge';
import { ReservationEditor, type ReservationRecord } from '@/components/dispatch/reservation-editor';

type FilterId = 'all' | ReservationStatus;

const matchesSearch = (r: ReservationRecord, q: string) => {
  if (!q) return true;
  const hay = `${r.name} ${r.email} ${r.phone} ${r.pickup} ${r.dropoff} ${r.sourceName} ${r.id} RB-${r.id.slice(-8).toUpperCase()}`.toLowerCase();
  return hay.includes(q.toLowerCase());
};

export function DispatchCenter() {
  const tierName = useVehicleTierName();
  const [all, setAll] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [sort, setSort] = useState<SortId>('pickup');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [livePulse, setLivePulse] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const reconcileTimer = useRef<number | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const records = await pb.collection('reservations').getFullList<ReservationRecord>({
        sort: '-created',
        requestKey: null,
      });
      setAll(records);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError('Couldn’t load reservations. Please sign in again.');
    } finally {
      setLoading(false);
    }
  }

  // Silent background refresh: re-fetches the full reservation list without
  // toggling the loading spinner, so polling and tab-focus refreshes keep the
  // data in sync across devices without flashing the UI. Realtime delivers
  // instant updates, but a dropped subscription, expired token, or sleeping
  // device can miss an event; a periodic silent refresh guarantees every
  // device converges to the exact same reservation data.
  async function refresh() {
    try {
      const records = await pb.collection('reservations').getFullList<ReservationRecord>({
        sort: '-created',
        requestKey: null,
      });
      setAll(records);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      // silent: background refresh failures don't disrupt the dispatch view
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Re-fetch when the tab regains focus so a device that was asleep (phone,
  // tablet, or a laptop that was powered off) catches every reservation that
  // arrived while it was offline. Realtime only delivers events that happen
  // while subscribed, so a sleeping device misses them without this — the
  // server is the single source of truth, not any one operator's screen.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    // Mobile browsers restore pages from the back-forward cache when the user
    // navigates back; realtime subscriptions are stale by then. A `pageshow`
    // refresh converges the dispatch board to current server data on return.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted || document.visibilityState === 'visible') refresh();
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
  // loses connectivity. Polling on a short cadence while the tab is visible
  // guarantees every device converges to identical reservation data,
  // including updates made on either device. Pauses while hidden.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = window.setInterval(tick, 10000);
    return () => window.clearInterval(timer);
  }, []);

  // Realtime: keep the dispatch board live as bookings are created, edited,
  // or removed — from this dashboard, another tab, or a brand-new customer.
  useEffect(() => {
    void pb
      .collection('reservations')
      .subscribe('*', (e) => {
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1200);
        if (e.action === 'create') {
          setFlashId(e.record.id);
          setTimeout(() => setFlashId((cur) => (cur === e.record.id ? null : cur)), 2600);
        }
        setAll((prev) => {
          if (e.action === 'delete') return prev.filter((r) => r.id !== e.record.id);
          const next = e.record as unknown as ReservationRecord;
          const exists = prev.some((r) => r.id === next.id);
          return exists
            ? prev.map((r) => (r.id === next.id ? next : r))
            : [next, ...prev];
        });
        // Reconcile with the server shortly after any realtime change so
        // mobile and iPad converge to identical data even if a realtime
        // event is partial or arrives out of order.
        if (reconcileTimer.current) window.clearTimeout(reconcileTimer.current);
        reconcileTimer.current = window.setTimeout(() => { void refresh(); }, 2500);
      })
      .catch((err) => console.error('Realtime subscription failed', err));

    return () => {
      if (reconcileTimer.current) window.clearTimeout(reconcileTimer.current);
      void pb.collection('reservations').unsubscribe('*').catch(() => {});
    };
  }, []);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: all.length };
    RESERVATION_STATUSES.forEach((s) => {
      base[s] = all.filter((r) => normalizeStatus(r.status) === s).length;
    });
    return base;
  }, [all]);

  const visible = useMemo(() => {
    const q = search.trim();
    const list = all
      .filter((r) => (filter === 'all' ? true : normalizeStatus(r.status) === filter))
      .filter((r) => matchesSearch(r, q));
    if (sort === 'pickup') {
      // Service date/time: upcoming pickups first (soonest first), then past
      // pickups, then undated — the next rides to handle are always on top.
      return [...list].sort(compareByPickup);
    }
    return list;
  }, [all, filter, search, sort]);

  const selected = selectedId ? all.find((r) => r.id === selectedId) ?? null : null;

  return (
    <section className="dispatch-shell">
      <div className="dispatch-controls">
        <div className="search-field">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search name, address, email, phone, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search reservations"
          />
        </div>
        <button type="button" className="refresh-button" onClick={load} aria-label="Refresh reservations">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="sort-row" role="group" aria-label="Sort reservations">
        <span className="sort-label">Sort by</span>
        {(Object.keys(SORT_LABELS) as SortId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`sort-chip${sort === id ? ' active' : ''}`}
            aria-pressed={sort === id}
            onClick={() => setSort(id)}
          >
            {SORT_LABELS[id]}
          </button>
        ))}
      </div>

      <div className="status-filters" role="tablist" aria-label="Filter by status">
        {STATUS_FILTERS.map((f) => {
          const count = counts[f.id] ?? 0;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`status-filter${active ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              <span>{f.label}</span>
              <em>{count}</em>
            </button>
          );
        })}
      </div>

      <div className="dispatch-live">
        <span className={`live-dot${livePulse ? ' pulse' : ''}`} />
        <span>Realtime · {all.length} total reservation{all.length === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <div className="dispatch-loading"><Loader2 size={22} /> Loading reservations…</div>
      ) : error ? (
        <div className="dispatch-error">{error}</div>
      ) : visible.length === 0 ? (
        <div className="dispatch-empty">
          <Inbox size={30} />
          <p>
            {all.length === 0
              ? 'No reservations yet. New booking requests will appear here in real time.'
              : 'No reservations match your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="dispatch-table" role="list">
          <div className="dispatch-row dispatch-row-head">
            <span>Passenger</span>
            <span>Route</span>
            <span>Pickup</span>
            <span>Vehicle</span>
            <span>Fare</span>
            <span>Status</span>
          </div>
          {visible.map((r) => {
            const status = normalizeStatus(r.status);
            return (
              <button
                key={r.id}
                type="button"
                role="listitem"
                className={`dispatch-row${selectedId === r.id ? ' selected' : ''}${flashId === r.id ? ' flash' : ''}`}
                onClick={() => setSelectedId(r.id)}
              >
                <div className="dr-passenger">
                  <strong>{r.name || '—'}</strong>
                  <span className="dr-ref">RB-{r.id.slice(-8).toUpperCase()}</span>
                  {r.sourceName && <span className="dr-source">{r.sourceName}</span>}
                  {r.paid && <span className="paid-badge">{r.captured ? 'Captured' : 'Authorized'}</span>}
                </div>
                <div className="dr-route">
                  <span><MapPin size={13} /> {r.pickup || '—'}</span>
                  {r.extraStop && <span><span className="stop-marker" style={{ width: 11, height: 11, borderWidth: 2 }} /> {r.extraStop}</span>}
                  {r.dropoff && <span><span className="dropoff-marker mini" /> {r.dropoff}</span>}
                </div>
                <div className="dr-pickup">
                  <CalendarDays size={13} />
                  <span>{r.pickupLocal || '—'}</span>
                </div>
                <div className="dr-vehicle">
                  <CarFront size={14} />
                  <span>{tierName(r.vehicle)}</span>
                  <em><Users size={11} /> {r.passengers}</em>
                  {r.carSeat && <em className="dr-addon"><Baby size={11} /> Seat</em>}
                  {r.insidePickup && <em className="dr-addon"><DoorOpen size={11} /> Inside</em>}
                </div>
                <div className="dr-fare">
                  <strong>{r.estimatedFareText || 'To quote'}</strong>
                  {r.distanceMiles ? <small>{Number(r.distanceMiles).toFixed(1)} mi</small> : null}
                </div>
                <div className="dr-status">
                  <StatusBadge value={status} size="sm" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ReservationEditor
          key={selected.id}
          reservation={selected}
          onClose={() => setSelectedId(null)}
          onSaved={(updated) => {
            setAll((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          }}
          onDeleted={(id) => {
            setAll((prev) => prev.filter((r) => r.id !== id));
            setSelectedId(null);
          }}
        />
      )}
    </section>
  );
}
