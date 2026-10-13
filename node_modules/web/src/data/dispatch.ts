import type { ReservationStatus } from '@/lib/reservation';

export type StatusMeta = {
  id: ReservationStatus;
  label: string;
  dot: string;
  chip: string;
  description: string;
};

export const STATUS_META: Record<ReservationStatus, StatusMeta> = {
  pending: {
    id: 'pending',
    label: 'Pending',
    dot: '#d99a2b',
    chip: 'status-pending',
    description: 'New request — awaiting operator review.',
  },
  confirmed: {
    id: 'confirmed',
    label: 'Confirmed',
    dot: '#255dc4',
    chip: 'status-confirmed',
    description: 'Booking accepted and scheduled with a driver.',
  },
  completed: {
    id: 'completed',
    label: 'Completed',
    dot: '#239476',
    chip: 'status-completed',
    description: 'Trip finished successfully.',
  },
  cancelled: {
    id: 'cancelled',
    label: 'Cancelled',
    dot: '#b5333b',
    chip: 'status-cancelled',
    description: 'Booking cancelled by operator or customer.',
  },
  no_show: {
    id: 'no_show',
    label: 'No-show',
    dot: '#8a94a5',
    chip: 'status-no-show',
    description: 'Driver arrived but the passenger did not.',
  },
};

export const STATUS_FILTERS: { id: 'all' | ReservationStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'no_show', label: 'No-show' },
];

export const VEHICLE_LABELS: Record<string, string> = {
  sedan: 'Executive sedan',
  suv: 'Premium SUV',
  van: 'Passenger van',
};

export const SERVICE_LABELS: Record<string, string> = {
  ride: 'Point-to-point',
  hourly: 'Hourly chauffeur',
};
