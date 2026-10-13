export type Service = 'ride' | 'hourly';
export type Vehicle = 'sedan' | 'suv' | 'van';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export const RESERVATION_STATUSES: ReservationStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
];

/** Treat an empty/missing status as pending so legacy rows render correctly. */
export function normalizeStatus(value: unknown): ReservationStatus {
  return (RESERVATION_STATUSES as string[]).includes(String(value ?? ''))
    ? (value as ReservationStatus)
    : 'pending';
}

export type ReservationDraft = {
  service: Service;
  pickup: string;
  dropoff: string;
  // Optional additional stop the customer can add between pickup and dropoff.
  // Empty string means no extra stop was requested. `extraStopToggle` tracks
  // the UI switch independently so the address is preserved if toggled off.
  extraStop: string;
  extraStopToggle: boolean;
  date: string;
  time: string;
  returnTrip: boolean;
  returnDate: string;
  returnTime: string;
  hours: number;
  vehicle: Vehicle;
  passengers: number;
  name: string;
  email: string;
  phone: string;
  flight: string;
  notes: string;
  // Optional customer-selected add-ons. Each notes an extra charge applies;
  // no specific amount is stored — dispatch confirms the charge. Both default
  // to false so customers can leave either unselected.
  carSeat: boolean;
  insidePickup: boolean;
  // Verified coordinates captured when the customer picks an autocomplete
  // suggestion or a typed address verifies. The route map uses them to render
  // from the exact selected location. Not persisted with the request.
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  extraStopCoords?: { lat: number; lng: number };
  // Computed live during the trip step; persisted on submit so the dispatch
  // email and dashboard can quote the same estimate the customer saw.
  distanceMiles?: number;
  estimatedFare?: number;
  estimatedFareText?: string;
};

export const vehicles: { id: Vehicle; name: string; detail: string; capacity: number }[] = [
  { id: 'sedan', name: 'Executive sedan', detail: 'A refined ride for everyday travel', capacity: 3 },
  { id: 'suv', name: 'Premium SUV', detail: 'More space for people and luggage', capacity: 6 },
  { id: 'van', name: 'Passenger van', detail: 'Travel together, comfortably', capacity: 8 },
];

export function dateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export type PickupSortable = {
  pickupAt?: string | null;
  created?: string | null;
};

/**
 * Sort reservations by service date/time so the most upcoming pickups are
 * easiest to find: upcoming pickups first (soonest first), then past pickups
 * (most recent first), then undated records (newest request first).
 * Safe to call during client render — the dashboard/dispatch lists only sort
 * records loaded after mount, never during SSR.
 */
export function compareByPickup<T extends PickupSortable>(a: T, b: T): number {
  const now = Date.now();
  const ta = a.pickupAt ? new Date(a.pickupAt).getTime() : NaN;
  const tb = b.pickupAt ? new Date(b.pickupAt).getTime() : NaN;
  const upcomingA = !Number.isNaN(ta) && ta >= now;
  const upcomingB = !Number.isNaN(tb) && tb >= now;
  if (upcomingA && upcomingB) return ta - tb;
  if (upcomingA) return -1;
  if (upcomingB) return 1;
  if (!Number.isNaN(ta) && !Number.isNaN(tb)) return tb - ta;
  if (!Number.isNaN(ta)) return -1;
  if (!Number.isNaN(tb)) return 1;
  return (b.created ?? '').localeCompare(a.created ?? '');
}


export function formatTripDate(date: string, time: string): string {
  if (!date || !time) return 'Choose a date and time';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(dateTime(date, time));
}
