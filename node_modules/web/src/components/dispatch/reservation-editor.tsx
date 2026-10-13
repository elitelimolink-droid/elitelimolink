import { useEffect, useState } from 'react';
import { Baby, Check, DoorOpen, Loader2, Phone, Save, Trash2, X } from 'lucide-react';
import pb from '@/lib/pocketbase-client';
import { handlePbAuthError } from '@/lib/pb-auth-error';
import {
  dateTime,
  formatTripDate,
  normalizeStatus,
  RESERVATION_STATUSES,
  type ReservationStatus,
  type Service,
  type Vehicle,
} from '@/lib/reservation';
import { SERVICE_LABELS, STATUS_META } from '@/data/dispatch';
import { useVehicleTierName } from '@/hooks/use-vehicle-tiers';
import { StatusBadge } from '@/components/dispatch/status-badge';
import { PaymentManagement } from '@/components/dispatch/payment-management';

export type ReservationRecord = {
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
  carSeat: boolean;
  insidePickup: boolean;
  status: string;
  distanceMiles: number;
  estimatedFare: number;
  estimatedFareText: string;
  pickupLocal: string;
  returnLocal: string;
  paid: boolean;
  captured: boolean;
  squareOrderId: string;
  sourceName: string;
  // Optional driver assigned to this trip (id of a `drivers` record).
  driver: string;
  driverStatus?: string;
  driverNotes?: string;
  created: string;
  updated: string;
};

type FormState = {
  status: ReservationStatus;
  service: Service;
  pickup: string;
  dropoff: string;
  extraStop: string;
  pickupDate: string;
  pickupTime: string;
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
  carSeat: boolean;
  insidePickup: boolean;
  estimatedFareText: string;
  distanceMiles: string;
  paid: boolean;
  captured: boolean;
  driver: string;
};

const isoToDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const isoToTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function toForm(r: ReservationRecord): FormState {
  const returnTrip = Boolean(r.returnAt);
  return {
    status: normalizeStatus(r.status),
    service: (r.service === 'hourly' ? 'hourly' : 'ride') as Service,
    pickup: r.pickup ?? '',
    dropoff: r.dropoff ?? '',
    extraStop: r.extraStop ?? '',
    pickupDate: isoToDate(r.pickupAt),
    pickupTime: isoToTime(r.pickupAt),
    returnTrip,
    returnDate: returnTrip ? isoToDate(r.returnAt) : '',
    returnTime: returnTrip ? isoToTime(r.returnAt) : '',
    hours: Number(r.hours) || 2,
    vehicle: ((['sedan', 'suv', 'van'].includes(r.vehicle) ? r.vehicle : 'sedan') as Vehicle),
    passengers: Number(r.passengers) || 1,
    name: r.name ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    flight: r.flight ?? '',
    notes: r.notes ?? '',
    carSeat: !!r.carSeat,
    insidePickup: !!r.insidePickup,
    estimatedFareText: r.estimatedFareText ?? '',
    distanceMiles: r.distanceMiles != null ? String(r.distanceMiles) : '',
    paid: !!r.paid,
    captured: !!r.captured,
    driver: (r as { driver?: string }).driver ?? '',
  };
}

export function ReservationEditor({
  reservation,
  onClose,
  onSaved,
  onDeleted,
}: {
  reservation: ReservationRecord;
  onClose: () => void;
  onSaved: (updated: ReservationRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(reservation));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [drivers, setDrivers] = useState<{ id: string; name: string; email: string; active: boolean }[]>([]);
  const tierName = useVehicleTierName();

  // Load active drivers so the operator can assign a trip. Operators can list
  // every driver (the `drivers` collection listRule allows any signed-in
  // `users` account). Failures are non-fatal — the select just stays empty.
  useEffect(() => {
    pb.collection('drivers')
      .getFullList<{ id: string; name: string; email: string; active: boolean }>({
        sort: 'name',
        requestKey: null,
      })
      .then((rows) => setDrivers(rows.filter((d) => d.active)))
      .catch(() => {});
  }, []);

  // Re-sync when a different reservation is opened.
  useEffect(() => {
    setForm(toForm(reservation));
    setSaved(false);
    setError('');
    setConfirmDelete(false);
  }, [reservation.id]);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving && !deleting) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving, deleting]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function validate(): string {
    if (form.name.trim().length < 2) return 'Enter the passenger’s full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
    if (form.phone.replace(/\D/g, '').length < 7) return 'Enter a valid phone number.';
    if (!form.pickup.trim()) return 'Pickup address is required.';
    if (form.service === 'ride' && !form.dropoff.trim()) return 'Dropoff address is required for a point-to-point ride.';
    if (!form.pickupDate || !form.pickupTime) return 'Pickup date and time are required.';
    if (form.returnTrip && (!form.returnDate || !form.returnTime)) return 'Return date and time are required.';
    if (form.passengers < 1) return 'Passengers must be at least 1.';
    return '';
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    const payload = {
      status: form.status,
      service: form.service,
      pickup: form.pickup.trim(),
      dropoff: form.service === 'ride' ? form.dropoff.trim() : '',
      extraStop: form.service === 'ride' ? form.extraStop.trim() : '',
      pickupAt: dateTime(form.pickupDate, form.pickupTime).toISOString(),
      returnAt: form.returnTrip ? dateTime(form.returnDate, form.returnTime).toISOString() : '',
      pickupLocal: formatTripDate(form.pickupDate, form.pickupTime),
      returnLocal: form.returnTrip ? formatTripDate(form.returnDate, form.returnTime) : '',
      hours: form.service === 'hourly' ? Number(form.hours) || 2 : 2,
      vehicle: form.vehicle,
      passengers: Number(form.passengers) || 1,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      flight: form.flight.trim(),
      notes: form.notes.trim(),
      carSeat: !!form.carSeat,
      insidePickup: !!form.insidePickup,
      estimatedFareText: form.estimatedFareText.trim(),
      distanceMiles: form.distanceMiles === '' ? null : Number(form.distanceMiles),
      paid: !!form.paid,
      driver: form.driver || null,
    };
    try {
      const updated = await pb.collection('reservations').update<ReservationRecord>(reservation.id, payload);
      setSaved(true);
      onSaved(updated);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError('Couldn’t save changes. Please sign in again and retry.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setError('');
    try {
      await pb.collection('reservations').delete(reservation.id);
      onDeleted(reservation.id);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError('Couldn’t delete this reservation. Please try again.');
      setDeleting(false);
    }
  }

  const ref = `RB-${reservation.id.slice(-8).toUpperCase()}`;

  return (
    <div className="editor-scrim" role="dialog" aria-modal="true" aria-label={`Reservation ${ref}`} onClick={(e) => { if (e.target === e.currentTarget && !saving && !deleting) onClose(); }}>
      <div className="editor-panel">
        <div className="editor-head">
          <div className="editor-head-title">
            <span className="editor-ref">{ref}</span>
            <StatusBadge value={form.status} />
            {reservation.sourceName && <span className="editor-source">{reservation.sourceName}</span>}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close editor">
            <X size={18} />
          </button>
        </div>

        <form className="editor-body" onSubmit={save}>
          <fieldset className="editor-fieldset">
            <legend>Booking status</legend>
            <label className="editor-label">Current status
              <div className="status-select-wrap">
                <span className="status-dot status-dot-inline" style={{ background: STATUS_META[form.status].dot }} aria-hidden="true" />
                <select
                  className="standard-input status-select"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as ReservationStatus)}
                >
                  {RESERVATION_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
            </label>
            <p className="editor-hint">{STATUS_META[form.status].description}</p>
          </fieldset>

          <fieldset className="editor-fieldset">
            <legend>Trip</legend>
            <div className="service-tabs">
              {(['ride', 'hourly'] as Service[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`service-tab${form.service === s ? ' selected' : ''}`}
                  onClick={() => set('service', s)}
                >
                  {SERVICE_LABELS[s]}
                </button>
              ))}
            </div>

            <label className="editor-label">Pickup
              <input className="standard-input" value={form.pickup} onChange={(e) => set('pickup', e.target.value)} placeholder="Pickup address" />
            </label>
            {form.service === 'ride' && (
              <label className="editor-label">Dropoff
                <input className="standard-input" value={form.dropoff} onChange={(e) => set('dropoff', e.target.value)} placeholder="Dropoff address" />
              </label>
            )}
            {form.service === 'ride' && (
              <label className="editor-label">Extra stop <span className="optional">optional</span>
                <input className="standard-input" value={form.extraStop} onChange={(e) => set('extraStop', e.target.value)} placeholder="Additional stop along the way" />
              </label>
            )}

            <div className="editor-grid-two">
              <label className="editor-label">Pickup date
                <input className="standard-input" type="date" value={form.pickupDate} onChange={(e) => set('pickupDate', e.target.value)} />
              </label>
              <label className="editor-label">Pickup time
                <input className="standard-input" type="time" value={form.pickupTime} onChange={(e) => set('pickupTime', e.target.value)} />
              </label>
            </div>

            <label className="toggle-row">
              <input type="checkbox" className="switch-input" checked={form.returnTrip} onChange={(e) => set('returnTrip', e.target.checked)} />
              <span className="switch-track" aria-hidden="true" />
              <span>Round trip (add a return)</span>
            </label>
            {form.returnTrip && (
              <div className="editor-grid-two">
                <label className="editor-label">Return date
                  <input className="standard-input" type="date" value={form.returnDate} onChange={(e) => set('returnDate', e.target.value)} />
                </label>
                <label className="editor-label">Return time
                  <input className="standard-input" type="time" value={form.returnTime} onChange={(e) => set('returnTime', e.target.value)} />
                </label>
              </div>
            )}

            {form.service === 'hourly' && (
              <label className="editor-label">Duration (hours)
                <input className="standard-input" type="number" min={2} max={12} value={form.hours} onChange={(e) => set('hours', Number(e.target.value))} />
              </label>
            )}

            <label className="editor-label">Vehicle
              <select className="standard-input" value={form.vehicle} onChange={(e) => set('vehicle', e.target.value as Vehicle)}>
                {(['sedan', 'suv', 'van'] as Vehicle[]).map((id) => (
                  <option key={id} value={id}>{tierName(id)}</option>
                ))}
              </select>
            </label>

            <div className="passenger-control">
              <div><strong>Passengers</strong><span>Seats to reserve</span></div>
              <div className="passenger-stepper">
                <button type="button" onClick={() => set('passengers', Math.max(1, form.passengers - 1))} disabled={form.passengers <= 1}>−</button>
                <strong>{form.passengers}</strong>
                <button type="button" onClick={() => set('passengers', Math.min(8, form.passengers + 1))} disabled={form.passengers >= 8}>+</button>
              </div>
            </div>

            <label className="editor-label">Assigned driver <span className="optional">optional</span>
              <select className="standard-input" value={form.driver} onChange={(e) => set('driver', e.target.value)}>
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name || d.email}</option>
                ))}
              </select>
            </label>

            {reservation.driverStatus && (
              <div style={{ margin: '6px 0 10px', padding: '6px 12px', background: '#eef4ff', borderRadius: 8, fontSize: 12, color: 'var(--blue)', fontWeight: 700 }}>
                Chauffeur status: {reservation.driverStatus.replace('_', ' ').toUpperCase()}
              </div>
            )}
            {reservation.driverNotes && (
              <div style={{ margin: '6px 0 10px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: 'var(--ink)' }}>
                <strong style={{ display: 'block', marginBottom: 2, color: 'var(--ink)' }}>Chauffeur note:</strong>
                {reservation.driverNotes}
              </div>
            )}

            <div className="editor-add-ons">
              <span className="editor-add-ons-label">Optional add-ons <span className="optional">extra charge</span></span>
              <label className="toggle-row">
                <input type="checkbox" className="switch-input" checked={form.carSeat} onChange={(e) => set('carSeat', e.target.checked)} />
                <span className="switch-track" aria-hidden="true" />
                <Baby size={16} />
                <span>Car seat</span>
              </label>
              <label className="toggle-row">
                <input type="checkbox" className="switch-input" checked={form.insidePickup} onChange={(e) => set('insidePickup', e.target.checked)} />
                <span className="switch-track" aria-hidden="true" />
                <DoorOpen size={16} />
                <span>Inside pickup</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="editor-fieldset">
            <legend>Passenger contact</legend>
            <label className="editor-label">Full name
              <input className="standard-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Passenger name" />
            </label>
            <div className="editor-grid-two">
              <label className="editor-label">Email
                <input className="standard-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email" />
              </label>
              <label className="editor-label">Phone
                <input className="standard-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone" />
                {form.phone.trim() && (
                  <a className="editor-call-link" href={`tel:${form.phone.replace(/[^\d+]/g, '')}`}>
                    <Phone size={13} /> Call {form.phone}
                  </a>
                )}
              </label>
            </div>
            <label className="editor-label">Flight number <span className="optional">optional</span>
              <input className="standard-input" value={form.flight} onChange={(e) => set('flight', e.target.value)} placeholder="e.g. UA 1234" />
            </label>
            <label className="editor-label">Notes <span className="optional">optional</span>
              <textarea className="standard-input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Special instructions, luggage, child seats…" />
            </label>
          </fieldset>

          <fieldset className="editor-fieldset">
            <legend>Fare &amp; payment</legend>
            <div className="editor-grid-two">
              <label className="editor-label">Fare (display)
                <input className="standard-input" value={form.estimatedFareText} onChange={(e) => set('estimatedFareText', e.target.value)} placeholder="e.g. $48.50" />
              </label>
              <label className="editor-label">Distance (mi)
                <input className="standard-input" type="number" step="0.1" min={0} value={form.distanceMiles} onChange={(e) => set('distanceMiles', e.target.value)} placeholder="0.0" />
              </label>
            </div>
            <label className="toggle-row">
              <input type="checkbox" className="switch-input" checked={form.paid} onChange={(e) => set('paid', e.target.checked)} />
              <span className="switch-track" aria-hidden="true" />
              <span>Marked as paid{reservation.squareOrderId ? ' · Square' : ''}</span>
            </label>

            <PaymentManagement
              reservationId={reservation.id}
              squareOrderId={reservation.squareOrderId}
              paid={form.paid}
              captured={form.captured}
              fareText={form.estimatedFareText}
              onCaptured={() => {
                setForm((prev) => ({ ...prev, captured: true, paid: true }));
                onSaved({ ...reservation, captured: true, paid: true });
              }}
            />
          </fieldset>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="editor-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving…' : <>{saved ? <Check size={17} /> : <Save size={17} />} {saved ? 'Saved' : 'Save changes'}</>}
            </button>
            {saved && <span className="saved-note">Reservation updated.</span>}
          </div>

          <div className="editor-delete-zone">
            {confirmDelete ? (
              <div className="confirm-delete">
                <span>Delete this reservation permanently?</span>
                <div className="confirm-delete-actions">
                  <button type="button" className="ghost-button" onClick={() => setConfirmDelete(false)} disabled={deleting}>Keep it</button>
                  <button type="button" className="danger-button" onClick={remove} disabled={deleting}>
                    {deleting ? <Loader2 size={15} /> : <Trash2 size={15} />} Delete
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="delete-link" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} /> Delete reservation
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
