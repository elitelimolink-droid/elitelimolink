import { useState } from 'react';
import { Baby, CalendarDays, CarFront, Check, ChevronRight, Clock3, DoorOpen, MapPin, Repeat2, StickyNote, UserRound, X } from 'lucide-react';
import type { ReservationDraft } from '@/lib/reservation';
import { dateTime, formatTripDate } from '@/lib/reservation';
import { LocationField } from '@/components/home/location-field';
import { RouteMap } from '@/components/home/route-map';
import { WheelPicker, type WheelItem } from '@/components/home/wheel-picker';
import { formatFare } from '@/lib/pricing';

type Props = {
  draft: ReservationDraft;
  update: (patch: Partial<ReservationDraft>) => void;
  onNext: () => void;
  error: string;
  setError: (value: string) => void;
  mapsConfigured: boolean;
  /** Operator-controlled price visibility. When false, all prices stay hidden. */
  fareVisible: boolean;
  currency: string;
  /** Operator-set flat add-on prices, shown next to each toggle when visible. */
  carSeatPrice: number;
  extraStopPrice: number;
  insidePickupPrice: number;
  /** Operator-controlled minimum advance notice before pickup, in hours (1–24). */
  minAdvanceHours: number;
};

// Service window: 6:00 AM through 11:30 PM, in minutes since midnight.
const OPEN_MINUTES = 6 * 60;
const CLOSE_MINUTES = 23 * 60 + 30;
const MINUTE_STEPS = ['00', '30'];

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function buildDate(month: string, day: string, picker: 'pickup' | 'return', pickupDate: string, todayString: string) {
  const today = new Date();
  const todayYear = today.getFullYear();
  // Try current year first; if that date is before today (for pickup) or before pickup, roll to next year.
  let year = todayYear;
  const candidateThisYear = `${year}-${month}-${day}`;
  const minDate = picker === 'return' && pickupDate > todayString ? pickupDate : todayString;
  if (candidateThisYear < minDate) {
    year = todayYear + 1;
  }
  return `${year}-${month}-${day}`;
}

export function TripStep({ draft, update, onNext, error, setError, mapsConfigured, fareVisible, currency, carSeatPrice, extraStopPrice, insidePickupPrice, minAdvanceHours }: Props) {
  const [picker, setPicker] = useState<'pickup' | 'return' | null>(null);
  const [tempMonth, setTempMonth] = useState('');
  const [tempDay, setTempDay] = useState('');
  const [tempTime, setTempTime] = useState('');
  const [pickerError, setPickerError] = useState('');
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const tempDate = tempMonth && tempDay ? buildDate(tempMonth, tempDay, picker ?? 'pickup', draft.date, todayString) : '';

  function openPicker(which: 'pickup' | 'return') {
    const existing = which === 'pickup' ? draft.date : draft.returnDate;
    // Default the calendar to the current month and day (or the pickup date
    // for returns) so the customer starts from today instead of a blank
    // "Month / Day" state. The year is resolved by buildDate.
    const fallback = which === 'return' && draft.date ? draft.date : todayString;
    const base = existing || fallback;
    setTempMonth(base.slice(5, 7));
    setTempDay(base.slice(8, 10));
    setTempTime((which === 'pickup' ? draft.time : draft.returnTime) || '09:00');
    setPickerError('');
    setPicker(which);
  }
  const hour24 = tempTime ? Number(tempTime.slice(0, 2)) : 9;
  const minute = tempTime ? tempTime.slice(3, 5) : '00';
  const hour12 = hour24 % 12 || 12;
  const meridiem = hour24 < 12 ? 'AM' : 'PM';

  // Rotating the hour, minute, or AM/PM drum rebuilds the 24-hour "HH:MM"
  // value the rest of the reservation flow already understands. Selections
  // outside the 6:00 AM – 11:30 PM service window clamp to the nearest edge.
  function applyWheel(patch: { hour?: string; minute?: string; meridiem?: string }) {
    const nextHour12 = patch.hour ?? String(hour12);
    const nextMinute = patch.minute ?? minute;
    const nextMeridiem = patch.meridiem ?? meridiem;
    let h = Number(nextHour12) % 12;
    if (nextMeridiem === 'PM') h += 12;
    let mins = h * 60 + Number(nextMinute);
    mins = Math.min(CLOSE_MINUTES, Math.max(OPEN_MINUTES, mins));
    setTempTime(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`);
    setPickerError('');
  }

  const hourItems: WheelItem[] = Array.from({ length: 12 }, (_, index) => {
    const h12 = index + 1;
    const h24ForMeridiem = meridiem === 'AM' ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
    const mins = h24ForMeridiem * 60 + Number(minute);
    return { value: String(h12), label: String(h12), disabled: mins < OPEN_MINUTES || mins > CLOSE_MINUTES };
  });
  const minuteItems: WheelItem[] = MINUTE_STEPS.map(m => ({ value: m, label: m }));
  const meridiemItems: WheelItem[] = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' },
  ];

  function saveTime() {
    if (!tempDate || !tempTime) { setPickerError('Choose both a date and a time.'); return; }
    const chosen = dateTime(tempDate, tempTime);
    const minHours = Math.min(24, Math.max(1, Math.round(minAdvanceHours || 2)));
    if (Number.isNaN(chosen.getTime()) || (picker === 'pickup' && chosen.getTime() < Date.now() + minHours * 60 * 60 * 1000)) {
      setPickerError(`Please choose a pickup at least ${minHours} hour${minHours === 1 ? '' : 's'} from now.`); return;
    }
    if (picker === 'return' && (!draft.date || !draft.time || chosen <= dateTime(draft.date, draft.time))) {
      setPickerError('Your return must be after your pickup.'); return;
    }
    if (picker === 'pickup') update({ date: tempDate, time: tempTime, returnDate: '', returnTime: '' });
    else update({ returnDate: tempDate, returnTime: tempTime });
    setPicker(null);
    setError('');
  }

  return <>
    <div className="step-scroll">
      <div className="service-tabs" role="group" aria-label="Service type">
        <button type="button" className={`service-tab ${draft.service === 'ride' ? 'selected' : ''}`} onClick={() => update({ service: 'ride' })}><CarFront size={18} /> Ride</button>
        <button type="button" className={`service-tab ${draft.service === 'hourly' ? 'selected' : ''}`} onClick={() => update({ service: 'hourly', returnTrip: false, extraStopToggle: false })}><Clock3 size={18} /> Hourly</button>
      </div>
      <div className="booking-row"><UserRound size={19} className="row-icon" /><span>For me</span><Check size={17} className="row-end" /></div>
      <button type="button" className="booking-row row-button" onClick={() => openPicker('pickup')}><CalendarDays size={19} className="row-icon" /><span className={!draft.date ? 'placeholder' : ''}>{formatTripDate(draft.date, draft.time)}</span><ChevronRight size={18} className="row-end" /></button>
      {draft.service === 'hourly' && <div className="booking-row"><Clock3 size={19} className="row-icon" /><span>{draft.hours} hours</span><div className="stepper"><button type="button" onClick={() => update({ hours: Math.max(2, draft.hours - 1) })} aria-label="Fewer hours" disabled={draft.hours <= 2}>−</button><button type="button" onClick={() => update({ hours: Math.min(12, draft.hours + 1) })} aria-label="More hours" disabled={draft.hours >= 12}>+</button></div></div>}
      <LocationField value={draft.pickup} onChange={v => { update({ pickup: v }); setError(''); }} onCoords={c => update({ pickupCoords: c ?? undefined })} placeholder="Add pickup location..." ariaLabel="Pickup location" marker="pickup" mapsConfigured={mapsConfigured} />
      {draft.service === 'ride' && <LocationField value={draft.dropoff} onChange={v => { update({ dropoff: v }); setError(''); }} onCoords={c => update({ dropoffCoords: c ?? undefined })} placeholder="Add dropoff location..." ariaLabel="Dropoff location" marker="dropoff" mapsConfigured={mapsConfigured} />}
      <label className="booking-row trip-note-row">
        <StickyNote size={19} className="row-icon" />
        <textarea className="trip-note-input" rows={2} placeholder="Note" value={draft.notes} onChange={e => update({ notes: e.target.value })} maxLength={1000} aria-label="Note" />
      </label>
      <div className="add-ons">
        <span className="add-ons-label">Optional add-ons</span>
        {draft.service === 'ride' && (
          <div className="add-on-wrap">
            <label className="booking-row return-row add-on-row">
              <MapPin size={19} className="row-icon" />
              <span className="add-on-copy">Add an extra stop</span>
              <input type="checkbox" checked={draft.extraStopToggle} onChange={e => update({ extraStopToggle: e.target.checked, extraStop: e.target.checked ? draft.extraStop : '' })} className="switch-input" aria-label="Add an extra stop" />
              <span className="switch-track" aria-hidden="true" />
            </label>
            {fareVisible && draft.extraStopToggle && (
              <div className="add-on-price-beneath">{extraStopPrice > 0 ? `+${formatFare(extraStopPrice, currency)}` : 'No charge'}</div>
            )}
          </div>
        )}
        <div className="add-on-wrap">
          <label className="booking-row return-row add-on-row">
            <Baby size={19} className="row-icon" />
            <span className="add-on-copy">Car seat</span>
            <input type="checkbox" checked={draft.carSeat} onChange={e => update({ carSeat: e.target.checked })} className="switch-input" aria-label="Add a car seat" />
            <span className="switch-track" aria-hidden="true" />
          </label>
          {fareVisible && draft.carSeat && (
            <div className="add-on-price-beneath">{carSeatPrice > 0 ? `+${formatFare(carSeatPrice, currency)}` : 'No charge'}</div>
          )}
        </div>
        <div className="add-on-wrap">
          <label className="booking-row return-row add-on-row">
            <DoorOpen size={19} className="row-icon" />
            <span className="add-on-copy">Inside pickup</span>
            <input type="checkbox" checked={draft.insidePickup} onChange={e => update({ insidePickup: e.target.checked })} className="switch-input" aria-label="Add inside pickup" />
            <span className="switch-track" aria-hidden="true" />
          </label>
          {fareVisible && draft.insidePickup && (
            <div className="add-on-price-beneath">{insidePickupPrice > 0 ? `+${formatFare(insidePickupPrice, currency)}` : 'No charge'}</div>
          )}
        </div>
      </div>
      {draft.service === 'ride' && draft.extraStopToggle && (
        <LocationField value={draft.extraStop} onChange={v => { update({ extraStop: v }); setError(''); }} onCoords={c => update({ extraStopCoords: c ?? undefined })} placeholder="Add an optional stop along the way..." ariaLabel="Extra stop location" marker="stop" mapsConfigured={mapsConfigured} />
      )}
      {draft.service === 'ride' && draft.pickup.trim().length >= 5 && draft.dropoff.trim().length >= 5 && <RouteMap origin={draft.pickup} destination={draft.dropoff} waypoint={draft.extraStop} variant="inline" originCoords={draft.pickupCoords} destinationCoords={draft.dropoffCoords} waypointCoords={draft.extraStopCoords} />}
      {draft.service === 'ride' && <><label className="booking-row return-row"><Repeat2 size={19} className="row-icon" /><span>Add return trip</span><input type="checkbox" checked={draft.returnTrip} onChange={e => update({ returnTrip: e.target.checked, returnDate: '', returnTime: '' })} className="switch-input" /><span className="switch-track" aria-hidden="true" /></label>
        {draft.returnTrip && <button type="button" className="booking-row row-button" onClick={() => openPicker('return')}><CalendarDays size={19} className="row-icon" /><span className={!draft.returnDate ? 'placeholder' : ''}>{draft.returnDate ? formatTripDate(draft.returnDate, draft.returnTime) : 'Choose return date and time'}</span><ChevronRight size={18} className="row-end" /></button>}</>}
      <p className="under-form">A better way to get there. <strong>Booked and paid in one place.</strong></p>
    </div>
    <div className="booking-bottom">{error && <p className="form-error" role="alert">{error}</p>}<button type="button" className="primary-button" onClick={onNext}>Continue <ChevronRight size={17} /></button></div>
    {picker && <div className="modal-scrim" onMouseDown={e => { if (e.target === e.currentTarget) setPicker(null); }}><div className="date-modal" role="dialog" aria-modal="true" aria-label={picker === 'pickup' ? 'Choose pickup date and time' : 'Choose return date and time'}>
      <div className="modal-head"><div><span className="eyebrow">SCHEDULE YOUR RIDE</span><h2>{picker === 'pickup' ? 'When do you need this?' : 'When is your return?'}</h2></div><button type="button" className="icon-button" onClick={() => setPicker(null)} aria-label="Close"><X size={19} /></button></div>
      <label className="input-label" htmlFor="trip-month">Choose a date</label>
      <div className="monthday-picker">
        <select id="trip-month" className="standard-input monthday-select" value={tempMonth} onChange={e => { setTempMonth(e.target.value); setTempDay(''); setPickerError(''); }}>
          <option value="">Month</option>
          {months.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
        </select>
        <select id="trip-day" className="standard-input monthday-select" value={tempDay} disabled={!tempMonth} onChange={e => { setTempDay(e.target.value); setPickerError(''); }}>
          <option value="">Day</option>
          {tempMonth && Array.from({ length: daysInMonth(Number(tempMonth), picker === 'return' && draft.date ? Number(draft.date.slice(0, 4)) : today.getFullYear()) }, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{Number(d)}</option>)}
        </select>
      </div>
      <div className="input-label time-label">Choose a pickup time <span aria-live="polite">{hour12}:{minute} {meridiem}</span></div>
      <div className="time-wheels">
        <WheelPicker ariaLabel="Hour" items={hourItems} value={String(hour12)} onChange={h => applyWheel({ hour: h })} />
        <WheelPicker ariaLabel="Minutes" items={minuteItems} value={minute} onChange={m => applyWheel({ minute: m })} />
        <WheelPicker ariaLabel="AM or PM" items={meridiemItems} value={meridiem} onChange={mer => applyWheel({ meridiem: mer })} />
      </div>
      <p className="wheel-hint">Spin each wheel to set your time — like tuning a radio dial.</p>
      {pickerError && <p className="form-error" role="alert">{pickerError}</p>}<button type="button" className="primary-button modal-save" onClick={saveTime}>Confirm time <Check size={17} /></button>
    </div></div>}
  </>;
}
