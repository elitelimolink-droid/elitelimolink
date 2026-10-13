import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  ExternalLink,
  Globe,
  MapPin,
  Monitor,
  MousePointerClick,
  Plane,
  RefreshCw,
  Smartphone,
  Tablet,
  Users,
} from 'lucide-react';
import type { ReservationRecord } from '@/components/dispatch/reservation-editor';
import { normalizeStatus, type ReservationStatus } from '@/lib/reservation';
import { useVehicleTierName } from '@/hooks/use-vehicle-tiers';
import pb from '@/lib/pocketbase-client';

/**
 * A single activity entry derived from a reservation's latest change. We treat
 * each reservation as one event — its most recent create or update — so the
 * feed reflects the freshest activity and rebuilds identically after a refresh
 * (no separate event store needed). Realtime updates to the reservations list
 * flow in from the parent, so new bookings and edits appear here live.
 */
type ActivityEntry = {
  id: string;
  reservationId: string;
  kind: 'create' | 'update';
  when: string;
  name: string;
  sourceName: string;
  pickup: string;
  dropoff: string;
  flight: string;
  status: ReservationStatus;
  paid: boolean;
  vehicle: string;
  passengers: number;
  roundTrip: boolean;
};

type InteractionRecord = {
  id: string;
  type: string;
  label: string;
  target?: string;
  page?: string;
  session?: string;
  meta?: {
    step?: string;
    area?: string;
    browser?: string;
    device?: string;
    os?: string;
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    location?: string;
    locationApprox?: boolean;
    referrer?: string;
    viewport?: string;
    screen?: string;
    language?: string;
    title?: string;
  } & Record<string, unknown>;
  created: string;
};

type InteractionEntry = {
  id: string;
  kind: 'interaction';
  when: string;
  type: string;
  label: string;
  step?: string;
  area?: string;
  session?: string;
  page?: string;
  location?: string;
  locationApprox?: boolean;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  language?: string;
  viewport?: string;
};

type FeedEntry =
  | (ActivityEntry & { source: 'reservation' })
  | (InteractionEntry & { source: 'interaction' });

function relTime(iso: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const sec = Math.round(diff / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function clockTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function shortRef(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

export function ActivityStream({ reservations }: { reservations: ReservationRecord[] }) {
  const tierName = useVehicleTierName();
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);

  // Load visitor interaction events (clicks, addresses, booking actions) from
  // the activity_events collection. Access rules scope these to the operator's
  // own and managed businesses, mirroring reservations — so business separation
  // and central-dashboard grouping are preserved. Realtime keeps the feed live.
  useEffect(() => {
    let active = true;
    pb.collection('activity_events')
      .getFullList<InteractionRecord>({ sort: '-created', perPage: 200, requestKey: null })
      .then((rows) => { if (active) setInteractions(rows); })
      .catch(() => { /* non-fatal: feed still shows reservation activity */ });

    void pb
      .collection('activity_events')
      .subscribe('*', (e) => {
        if (e.action === 'delete') {
          setInteractions((prev) => prev.filter((r) => r.id !== e.record.id));
          return;
        }
        const next = e.record as unknown as InteractionRecord;
        setInteractions((prev) =>
          prev.some((r) => r.id === next.id) ? prev.map((r) => (r.id === next.id ? next : r)) : [next, ...prev],
        );
      })
      .catch(() => {});

    return () => {
      active = false;
      void pb.collection('activity_events').unsubscribe('*').catch(() => {});
    };
  }, []);

  const reservationEntries = useMemo<ActivityEntry[]>(() => {
    const mapped = reservations.map((r) => {
      const created = r.created ? new Date(r.created).getTime() : 0;
      const updated = r.updated ? new Date(r.updated).getTime() : 0;
      // Treat as a "new booking" event when the record has never been updated
      // after creation (PocketBase stamps both on insert, so allow a small
      // tolerance window). Otherwise the latest event is an update.
      const kind: ActivityEntry['kind'] =
        updated - created > 1500 ? 'update' : 'create';
      const when = kind === 'update' ? r.updated : r.created;
      return {
        id: `${r.id}-${when}`,
        reservationId: r.id,
        kind,
        when,
        name: r.name || 'Unnamed guest',
        sourceName: (r.sourceName || '').trim(),
        pickup: r.pickup,
        dropoff: r.dropoff,
        flight: r.flight,
        status: normalizeStatus(r.status),
        paid: Boolean(r.paid),
        vehicle: r.vehicle,
        passengers: r.passengers,
        roundTrip: Boolean(r.returnAt || r.returnLocal),
      } satisfies ActivityEntry;
    });
    return mapped;
  }, [reservations]);

  const interactionEntries = useMemo<InteractionEntry[]>(() => {
    return interactions.map((e) => ({
      id: e.id,
      kind: 'interaction' as const,
      when: e.created,
      type: e.type || 'click',
      label: e.label,
      step: e.meta?.step,
      area: e.meta?.area,
      session: e.session,
      page: e.page,
      location: e.meta?.location,
      locationApprox: e.meta?.locationApprox,
      device: e.meta?.device,
      browser: e.meta?.browser,
      os: e.meta?.os,
      referrer: e.meta?.referrer,
      language: e.meta?.language,
      viewport: e.meta?.viewport,
    }));
  }, [interactions]);

  const feed = useMemo<FeedEntry[]>(() => {
    const combined: FeedEntry[] = [
      ...reservationEntries.map((e) => ({ ...e, source: 'reservation' as const })),
      ...interactionEntries.map((e) => ({ ...e, source: 'interaction' as const })),
    ];
    combined.sort((a, b) => {
      const ta = a.when ? new Date(a.when).getTime() : 0;
      const tb = b.when ? new Date(b.when).getTime() : 0;
      return tb - ta;
    });
    return combined.slice(0, 80);
  }, [reservationEntries, interactionEntries]);

  const newCount = reservationEntries.filter((e) => e.kind === 'create').length;
  const updateCount = reservationEntries.length - newCount;
  const visitCount = interactionEntries.filter((e) => e.type === 'visit').length;
  const interactionCount = interactionEntries.length - visitCount;

  return (
    <div className="activity-stream">
      <div className="activity-stream-head">
        <div className="activity-live">
          <span className="activity-live-dot" />
          <span>Live</span>
        </div>
        <p className="activity-stream-summary">
          {visitCount} visits · {newCount} new · {updateCount} updated · {interactionCount} site interactions
        </p>
      </div>

      {feed.length === 0 ? (
        <div className="activity-empty">
          <Clock size={26} />
          <p>No activity yet. New bookings, updates, and visitor interactions will appear here in real time.</p>
        </div>
      ) : (
        <ol className="activity-feed">
          {feed.map((e) => (
            <li key={`${e.source}-${e.id}`} className="activity-item">
              {e.source === 'reservation' ? (
                <ReservationEntryView entry={e} tierName={tierName} />
              ) : (
                <InteractionEntryView entry={e} />
              )}
            </li>
          ))}
        </ol>
      )}
      <p className="activity-footnote">
        Updates in real time. Site-visit entries show the page, timestamp, approximate IP-derived location (city/region/country), and browser/device — never precise GPS, passwords, or payment details. Location is labeled unavailable when it can't be reliably determined.
      </p>
    </div>
  );
}

function ReservationEntryView({
  entry: e,
  tierName,
}: {
  entry: ActivityEntry;
  tierName: (key: string) => string;
}) {
  const isNew = e.kind === 'create';
  return (
    <>
      <div className={`activity-icon ${isNew ? 'is-new' : 'is-update'}`}>
        {isNew ? <CalendarPlus size={15} /> : <Edit3 size={15} />}
      </div>
      <div className="activity-body">
        <div className="activity-top">
          <span className={`activity-kind ${isNew ? 'is-new' : 'is-update'}`}>
            {isNew ? 'New booking' : 'Updated'}
          </span>
          <span className="activity-ref">{shortRef(e.reservationId)}</span>
          <time className="activity-time" dateTime={e.when || undefined}>
            {relTime(e.when)}
          </time>
        </div>
        <p className="activity-customer">
          {e.name}
          {e.sourceName && <span className="activity-source">{e.sourceName}</span>}
        </p>
        <p className="activity-route">
          {e.flight ? (
            <span className="activity-flight"><Plane size={13} /> {e.flight}</span>
          ) : null}
          {e.pickup && (
            <>
              <span className="activity-pin pickup" />
              <span>{e.pickup}</span>
            </>
          )}
          {e.dropoff && (
            <>
              <ArrowRight size={12} className="activity-arrow" />
              <span className="activity-pin drop" />
              <span>{e.dropoff}</span>
            </>
          )}
        </p>
        <div className="activity-meta">
          <span className={`activity-status status-${e.status === 'no_show' ? 'no-show' : e.status}`}>
            <CheckCircle2 size={12} /> {STATUS_LABEL[e.status]}
          </span>
          {e.paid && (
            <span className="activity-paid"><CreditCard size={12} /> Paid</span>
          )}
          {e.roundTrip && (
            <span className="activity-round"><RefreshCw size={12} /> Round trip</span>
          )}
          {e.vehicle && (
            <span className="activity-vehicle">{tierName(e.vehicle)}</span>
          )}
          {e.passengers > 0 && (
            <span className="activity-pax"><Users size={12} /> {e.passengers}</span>
          )}
        </div>
      </div>
    </>
  );
}

function deviceIcon(device?: string) {
  if (device === 'Mobile') return <Smartphone size={12} />;
  if (device === 'Tablet') return <Tablet size={12} />;
  if (device) return <Monitor size={12} />;
  return null;
}

function InteractionEntryView({ entry: e }: { entry: InteractionEntry }) {
  const isVisit = e.type === 'visit';
  const isAddress = e.type === 'address';
  const isAction = e.type === 'action';

  // Location is always approximate (IP-derived) when present; never invented.
  const locationLabel = e.locationApprox && e.location
    ? e.location
    : e.location
      ? `~${e.location}`
      : '';

  if (isVisit) {
    const deviceBits = [e.device, e.browser, e.os].filter(Boolean);
    return (
      <>
        <div className="activity-icon is-visit">
          <Globe size={15} />
        </div>
        <div className="activity-body">
          <div className="activity-top">
            <span className="activity-kind is-visit">Site visit</span>
            {e.page && <span className="activity-step">{e.page}</span>}
            <time className="activity-time" dateTime={e.when || undefined}>
              {relTime(e.when)}
            </time>
          </div>
          <p className="activity-interaction-label">{e.label}</p>
          <div className="activity-meta">
            {locationLabel ? (
              <span className="activity-location"><MapPin size={12} /> {locationLabel} <em>approx.</em></span>
            ) : (
              <span className="activity-location activity-location-na"><MapPin size={12} /> Location unavailable</span>
            )}
            {deviceBits.length > 0 && (
              <span className="activity-device">{deviceIcon(e.device)} {deviceBits.join(' · ')}</span>
            )}
            {e.referrer && (
              <span className="activity-referrer"><ExternalLink size={12} /> from {e.referrer}</span>
            )}
            {e.language && <span className="activity-lang"><Globe size={12} /> {e.language}</span>}
            {e.viewport && <span className="activity-viewport">{e.viewport}</span>}
            {e.session && <span className="activity-session">visitor {e.session.slice(-6)}</span>}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`activity-icon ${isAddress ? 'is-address' : isAction ? 'is-action' : 'is-click'}`}>
        <MousePointerClick size={15} />
      </div>
      <div className="activity-body">
        <div className="activity-top">
          <span className={`activity-kind ${isAddress ? 'is-address' : isAction ? 'is-action' : 'is-click'}`}>
            {isAddress ? 'Address selected' : isAction ? 'Booking action' : 'Click'}
          </span>
          {e.step && <span className="activity-step">Step {e.step}</span>}
          <time className="activity-time" dateTime={e.when || undefined}>
            {relTime(e.when)}
          </time>
        </div>
        <p className="activity-interaction-label">{e.label}</p>
        <div className="activity-meta">
          {locationLabel && (
            <span className="activity-location"><MapPin size={12} /> {locationLabel}</span>
          )}
          {e.area && <span className="activity-area">📍 {e.area}</span>}
          {e.device && (
            <span className="activity-device">{deviceIcon(e.device)} {e.device}</span>
          )}
          {e.session && <span className="activity-session">visitor {e.session.slice(-6)}</span>}
        </div>
      </div>
    </>
  );
}

export { clockTime };
