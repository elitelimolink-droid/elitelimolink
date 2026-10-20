import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, CalendarDays, CarFront, Check, Clock3, MapPin, ShieldCheck } from 'lucide-react';
import pb from '@/lib/pocketbase-client';
import type { ReservationDraft } from '@/lib/reservation';
import { dateTime, formatTripDate } from '@/lib/reservation';

import { NO_TIP, type FareQuote, type TipChoice } from '@/lib/pricing';
import { usePricing } from '@/hooks/use-pricing';
import { TripStep } from '@/components/home/trip-step';
import { VehicleStep } from '@/components/home/vehicle-step';
import { DetailsStep } from '@/components/home/details-step';
import { ReviewStep } from '@/components/home/review-step';
import { PaymentStep } from '@/components/home/payment-step';
import { RouteMap } from '@/components/home/route-map';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useActivityTracker } from '@/lib/activity-tracker';

const initialDraft: ReservationDraft = { service: 'ride', pickup: '', dropoff: '', extraStop: '', extraStopToggle: false, date: '', time: '', returnTrip: false, returnDate: '', returnTime: '', hours: 3, vehicle: 'sedan', passengers: 1, name: '', email: '', phone: '', flight: '', notes: '', carSeat: false, insidePickup: false };
const stages = ['Trip', 'Vehicle', 'Details', 'Review'];

export function BookingExperience({ initialBusinessName, initialBizId }: { initialBusinessName?: string; initialBizId?: string }) {
  // Multi-business booking links: path slug, `initialBizId`, or `/?biz=<operatorUserId>`
  // serves that operator's rates, categories, and brand.
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const biz = initialBizId || searchParams.get('biz') || '';
  const { pricing, loaded: pricingLoaded, error: pricingError } = usePricing(biz);
  const businessName = pricing.businessName || initialBusinessName || 'BookNowLux';
  // Anonymous interaction tracking: logs clicks, selected addresses, and
  // booking actions to the operator's Live activity feed. No passwords or
  // payment values are captured.
  useActivityTracker(pricing.bizId);
  const [draft, setDraft] = useState<ReservationDraft>(initialDraft);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Set once the reservation is saved (pending + unpaid) so a payment retry
  // reuses the same record instead of creating a duplicate request.
  const [reference, setReference] = useState('');
  // When online payment is required, the customer enters their card into
  // Square's secure in-page form. This holds the pending reservation id and
  // the exact fare to charge while the PaymentStep is shown.
  const [payReservationId, setPayReservationId] = useState('');
  const [payAmount, setPayAmount] = useState(0);
  const [payQuote, setPayQuote] = useState<FareQuote | null>(null);
  // Shown when payment is not required: the reservation is confirmed directly
  // on the booking page and the customer never leaves for checkout.
  const [done, setDone] = useState(false);
  // Server-authoritative fare quote from /api/fare-quote.
  const [quote, setQuote] = useState<FareQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  // Customer-chosen tip on the review step. Defaults to the operator's
  // suggested tip percentage once their live pricing snapshot loads, so an
  // operator who configured a default tip still sees it preselected — but
  // the customer can change it (or remove it) and the total follows.
  const [tip, setTip] = useState<TipChoice>(NO_TIP);
  // Administrator-controlled fare visibility. The operator toggles this from
  // the dashboard; the booking flow simply obeys it — customers can no
  // longer show or hide the fare themselves.
  const appliedDefaultTip = useRef(false);
  const update = (patch: Partial<ReservationDraft>) => setDraft(prev => ({ ...prev, ...patch }));
  function go(next: number) { setError(''); setStep(next); }

  const { service, hours, vehicle, returnTrip, pickupCoords, dropoffCoords, extraStopCoords, extraStopToggle, extraStop, carSeat, insidePickup } = draft;
  // An extra stop only joins the route (and the mileage) once it is verified.
  const useStop = service === 'ride' && extraStopToggle && extraStop.trim().length >= 5;

  // Once the operator's live pricing loads, preselect their default tip so an
  // operator who configured a suggested tip still sees it chosen — but only
  // the first time, so a customer who already adjusted their tip is never
  // overridden by a late pricing refresh.
  useEffect(() => {
    if (!pricingLoaded || appliedDefaultTip.current) return;
    appliedDefaultTip.current = true;
    if (pricing.tipEnabled && pricing.tipPercent > 0) {
      setTip({ kind: 'percent', percent: pricing.tipPercent, amount: 0 });
    }
  }, [pricingLoaded, pricing.tipEnabled, pricing.tipPercent]);

  // Compact signature of the operator's current rates, add-on prices, and
  // vehicle tiers. The fare is computed server-side from the live rates, but
  // the quote effect must re-run when those rates change — e.g. the operator
  // saved new prices in the dashboard and this booking page refreshed its
  // pricing snapshot (on remount or when the tab regained focus) — so the
  // displayed total never lags behind the operator's saved settings.
  const pricingSignature = [
    pricing.bizId, pricing.baseRate, pricing.minimumFare, pricing.perMileRate,
    pricing.hourlyRate, pricing.currency, pricing.tipEnabled, pricing.tipPercent,
    pricing.taxEnabled, pricing.taxPercent, pricing.tollsEnabled,
    pricing.carSeatPrice, pricing.extraStopPrice, pricing.insidePickupPrice,
    pricing.vehicleTiers.map(t => `${t.key}:${t.perMileRate}:${t.multiplier}:${t.minFare}:${t.active ? 1 : 0}`).join('|'),
  ].join('~');

  // Live server fare quote. Recomputed whenever the service, duration,
  // vehicle tier, return-trip flag, the customer's tip choice, any verified
  // coordinate, OR the operator's live rates/add-ons/tiers change — and only
  // once the operator's live pricing snapshot has loaded, so the total always
  // reflects the operator's current rates and the customer's selected tip.
  // The calculation itself is authoritative on the server: the client only
  // displays the result.
  useEffect(() => {
    if (!pricingLoaded) { setQuote(null); setQuoting(false); return; }
    if (service === 'ride' && (!pickupCoords || !dropoffCoords)) { setQuote(null); setQuoting(false); return; }

    const controller = new AbortController();
    let cancelled = false;
    setQuoting(true);
    const debounce = window.setTimeout(() => {
      fetch('/api/fare-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service, hours, vehicle, returnTrip,
          biz: pricing.bizId,
          pickupCoords, dropoffCoords,
          extraStopCoords: useStop ? extraStopCoords : undefined,
          carSeat, insidePickup, extraStop: useStop,
          tipKind: tip.kind, tipPercent: tip.percent, tipAmount: tip.amount,
        }),
        signal: controller.signal,
      })
        .then(res => { if (!res.ok) throw new Error(`fare-quote ${res.status}`); return res.json(); })
        .then((data: FareQuote) => { if (!cancelled) setQuote(data); })
        .catch(() => { if (!cancelled) setQuote(null); })
        .finally(() => { if (!cancelled) setQuoting(false); });
    }, 350);

    return () => { cancelled = true; window.clearTimeout(debounce); controller.abort(); };
  }, [service, hours, vehicle, returnTrip, pickupCoords, dropoffCoords, extraStopCoords, extraStopToggle, extraStop, carSeat, insidePickup, pricingLoaded, pricing.bizId, pricingSignature, tip.kind, tip.percent, tip.amount]);

  function validateTrip() {
    if (!draft.date || !draft.time) return 'Choose your pickup date and time.';
    const minHours = Math.min(24, Math.max(1, Math.round(pricing.minAdvanceHours || 2)));
    if (dateTime(draft.date, draft.time).getTime() < Date.now() + minHours * 60 * 60 * 1000) return `Pickup must be at least ${minHours} hour${minHours === 1 ? '' : 's'} from now. Please choose a later time.`;
    if (!draft.pickup.trim() || draft.pickup.trim().length < 5) return 'Enter a full pickup address or location.';
    if (draft.service === 'ride' && (!draft.dropoff.trim() || draft.dropoff.trim().length < 5)) return 'Enter a full dropoff address or location.';
    if (draft.service === 'ride' && draft.pickup.trim().toLowerCase() === draft.dropoff.trim().toLowerCase()) return 'Pickup and dropoff must be different.';
    // Distance-based pricing needs verified coordinates: the fare is computed
    // from the exact route between the selected locations, so a typed-but-
    // unverified address must not proceed to a quote.
    if (draft.service === 'ride' && !draft.pickupCoords) return 'Choose your pickup address from the suggestions so we can calculate your exact fare.';
    if (draft.service === 'ride' && !draft.dropoffCoords) return 'Choose your dropoff address from the suggestions so we can calculate your exact fare.';
    if (useStop && !extraStopCoords) return 'Choose your extra stop from the suggestions so we can calculate your exact fare.';
    if (draft.returnTrip && (!draft.returnDate || !draft.returnTime || dateTime(draft.returnDate, draft.returnTime) <= dateTime(draft.date, draft.time))) return 'Choose a return date and time after your pickup.';
    return '';
  }
  function tripNext() { const message = validateTrip(); if (message) { setError(message); return; } go(1); }
  function detailsNext() {
    if (draft.name.trim().length < 2) { setError('Enter your full name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) { setError('Enter a valid email address.'); return; }
    if (draft.phone.replace(/\D/g, '').length < 7) { setError('Enter a valid phone number.'); return; }
    go(3);
  }

  // A fresh, authoritative quote at submit time — the displayed total can
  // never be stale, and the customer is charged exactly what is stored.
  async function freshQuote(): Promise<FareQuote | null> {
    try {
      const res = await fetch('/api/fare-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: draft.service, hours: draft.hours, vehicle: draft.vehicle, returnTrip: draft.returnTrip,
          biz: pricing.bizId,
          pickupCoords: draft.pickupCoords, dropoffCoords: draft.dropoffCoords,
          extraStopCoords: useStop ? draft.extraStopCoords : undefined,
          carSeat: draft.carSeat, insidePickup: draft.insidePickup, extraStop: useStop,
          tipKind: tip.kind, tipPercent: tip.percent, tipAmount: tip.amount,
        }),
      });
      if (!res.ok) return null;
      return (await res.json()) as FareQuote;
    } catch {
      return null;
    }
  }

  async function submit() {
    if (submitting) return;
    const tripError = validateTrip();
    if (tripError) { setError(tripError); return; }
    setSubmitting(true); setError('');
    try {
      // Payment is required to complete the booking, and the charged amount is
      // the server-calculated total — re-quoted now so a stale route or rate
      // change can never produce a misleading charge.
      const quoteNow = await freshQuote();
      const hasQuote = Boolean(quoteNow?.ok && typeof quoteNow.fare === 'number');
      const fare = hasQuote ? (quoteNow as FareQuote).fare as number : 0;
      // Payment-required bookings must have a trustworthy fare before the
      // customer is charged. No-payment bookings proceed even when a quote
      // can't be computed (e.g. an unavailable route) -- the reservation is
      // still saved and confirmed.
      if (pricing.paymentRequired && !hasQuote) {
        setError(quoteNow?.message || 'We couldn’t calculate your exact fare right now. Please try again in a moment.');
        return;
      }

      // When online payment is required, the customer must complete Square
      // Checkout before the reservation is accepted. If Square is not yet
      // configured, do not create or accept any reservation — report that
      // setup is still needed so the operator knows card payments are off.
      if (pricing.paymentRequired && !pricing.squareConfigured) {
        setError('Online payment is required to confirm this booking, but card payments are not yet configured. Please contact us to complete your reservation.');
        return;
      }

      // Save the reservation first (pending + unpaid) so the request is never
      // lost, then collect payment. A retry after a failed checkout start
      // reuses this same record instead of creating a duplicate.
      let reservationId = reference;
      if (!reservationId) {
        const record = await pb.collection('reservations').create({
          service: draft.service, pickup: draft.pickup.trim(), dropoff: draft.service === 'ride' ? draft.dropoff.trim() : '', extraStop: draft.service === 'ride' ? draft.extraStop.trim() : '',
          pickupAt: dateTime(draft.date, draft.time).toISOString(), returnAt: draft.returnTrip ? dateTime(draft.returnDate, draft.returnTime).toISOString() : '',
          pickupLocal: formatTripDate(draft.date, draft.time), returnLocal: draft.returnTrip ? formatTripDate(draft.returnDate, draft.returnTime) : '',
          hours: draft.service === 'hourly' ? draft.hours : 2, vehicle: draft.vehicle, passengers: draft.passengers,
          name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.trim(), flight: draft.flight.trim(), notes: draft.notes.trim(),
          carSeat: draft.carSeat, insidePickup: draft.insidePickup,
          distanceMiles: quoteNow?.miles, estimatedFare: hasQuote ? fare : undefined, estimatedFareText: hasQuote ? quoteNow?.fareText : '',
          subtotal: hasQuote ? quoteNow?.subtotal : undefined, tollAmount: hasQuote ? quoteNow?.tollAmount : undefined, tipAmount: hasQuote ? quoteNow?.tipAmount : undefined, taxAmount: hasQuote ? quoteNow?.taxAmount : undefined,
          status: pricing.paymentRequired ? 'pending' : 'confirmed', paid: false,
          // Retain the booking source/business name on the reservation so the
          // operator can identify where each consolidated request originated,
          // even if the business is later renamed.
          sourceName: businessName,
          // Route the reservation to the operator whose booking page the
          // customer used, so it lands in that business's dashboard only.
          ...(pricing.bizId ? { owner: pricing.bizId } : {}),
        });
        reservationId = record.id;
        setReference(reservationId);
      }

      // No payment required: the reservation is already confirmed. Skip
      // checkout entirely and show the customer a completion confirmation
      // right on the booking page -- they never leave the site.
      if (!pricing.paymentRequired) {
        setDone(true);
        return;
      }

      // Required payment: show Square's secure in-page card form. The
      // reservation is already saved (pending + unpaid); the customer enters
      // their card into Square's iframe and the exact server-calculated fare
      // is charged through /api/square-pay. The reservation is confirmed only
      // after Square verifies the payment COMPLETED — a declined or abandoned
      // payment never accepts the booking.
      setPayAmount(fare);
      setPayQuote(quoteNow);
      setPayReservationId(reservationId);
      return;
    } catch {
      setError(pricing.paymentRequired
        ? (reference
          ? 'We couldn’t start payment for your saved request. Please try again — you won’t be charged twice.'
          : 'We couldn’t send your request. Please check your details and try again.')
        : 'We couldn’t complete your reservation. Please check your details and try again.');
    } finally { setSubmitting(false); }
  }

  function handlePaid() { setDone(true); }
  async function handlePayCancel() {
    // Customer backed out of the card form — abandon the pending unpaid
    // reservation so nothing is accepted without payment, then return to
    // the review step so they can retry from a fresh reservation.
    const id = payReservationId || reference;
    setPayReservationId('');
    setPayAmount(0);
    setPayQuote(null);
    if (id) {
      try {
        await fetch('/api/payment-abandon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: id }) });
      } catch {}
    }
    setReference('');
    setStep(3);
  }

  const tiers = pricing.vehicleTiers;
  const selectedTier = tiers.find(t => t.key === draft.vehicle);
  // A drivable route exists only for point-to-point rides once both the pickup
  // and dropoff are verified. The companion-pane map (desktop) and the inline
  // maps (mobile) both key off this so the customer can see where they're
  const hasRoute = draft.service === 'ride' && Boolean(draft.pickupCoords && draft.dropoffCoords);
  const brandInitials = (businessName || 'EL').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'EL';
  const markFirst = brandInitials[0] || 'E';
  const markSecond = brandInitials[1] || brandInitials[0] || 'L';
  return <main className="booking-page">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <div className="page-brand"><img src="/icons/booking-icon.jpg" alt={businessName} className="brand-logo-badge vip" /><span className="brand-word">{businessName}<span className="brand-sub"> / VIP RESERVATIONS</span></span></div>
    {done ? (
      <div className="payment-card">
        <ThemeToggle className="theme-toggle card-theme" />
        <div className="done-check"><Check size={29} strokeWidth={2.5} /></div>
        <span className="eyebrow">RESERVATION CONFIRMED</span>
        <h2>Your ride is booked.</h2>
        <p className="done-lead">Thanks{draft.name ? <>, <strong>{draft.name.split(' ')[0]}</strong></> : null}. Your reservation is complete and has been sent to {businessName}.{pricing.paymentRequired ? ' Your card has been authorized (a hold placed) for the fare — it is charged only after your ride is completed.' : ' We will reach out with any pickup details.'}</p>
        {reference && (
          <div className="done-card">
            <div className="done-card-top"><span>RESERVATION REFERENCE</span><strong>RB-{reference.slice(-8).toUpperCase()}</strong></div>
            <div className="done-card-line"><CalendarDays size={17} /><span>{formatTripDate(draft.date, draft.time)}</span></div>
            <div className="done-card-line"><MapPin size={17} /><span>{draft.pickup}{draft.service === 'ride' && draft.dropoff ? ` → ${draft.dropoff}` : ''}</span></div>
          </div>
        )}
        <p className="done-footnote">Save your reference for your records.</p>
        <button type="button" className="primary-button" onClick={() => {
          // Reset all in-memory booking state so the next ride starts fresh,
          // then redirect to the booking flow's first page for the correct
          // business. The completed reservation and payment record remain
          // saved in PocketBase and are not affected.
          setDraft(initialDraft);
          setStep(0);
          setReference('');
          setPayReservationId('');
          setPayAmount(0);
          setPayQuote(null);
          setTip(NO_TIP);
          setError('');
          setDone(false);
          appliedDefaultTip.current = false;
          navigate(biz ? `/?biz=${encodeURIComponent(biz)}` : '/');
        }}>Book another ride</button>
      </div>
    ) : (
    <div className="booking-frame">
      <div className="action-pane">
        <div className="action-header">{payReservationId ? <button type="button" onClick={handlePayCancel} className="header-back" aria-label="Go back"><ArrowLeft size={20} /></button> : step > 0 ? <button type="button" onClick={() => go(step - 1)} className="header-back" aria-label="Go back"><ArrowLeft size={20} /></button> : <span className="header-spacer" />}<span>Book a ride</span><ThemeToggle className="theme-toggle header-theme" /><span className="header-counter">{`0${step + 1} / 04`}</span></div>
        <div className="progress-rail" aria-label={`Step ${step + 1} of 4`}>{stages.map((stage, index) => <span key={stage} className={index <= step ? 'filled' : ''} />)}</div>
        {pricingError && !payReservationId && <p className="form-error" role="alert" style={{ margin: '0 16px 10px' }}>We couldn’t load live rates right now. Please refresh the page to see current pricing.</p>}
        {payReservationId ? (
          <PaymentStep reservationId={payReservationId} amount={payAmount} currency={pricing.currency} quote={payQuote} businessName={businessName} squareAppId={pricing.squareAppId} squareLocationId={pricing.squareLocationId} squareEnvironment={pricing.squareEnvironment} onPaid={handlePaid} onCancel={handlePayCancel} />
        ) : (
          <>
            {step === 0 && <TripStep draft={draft} update={update} onNext={tripNext} error={error} setError={setError} mapsConfigured={pricing.mapsConfigured} fareVisible={pricing.fareVisible} currency={pricing.currency} carSeatPrice={pricing.carSeatPrice} extraStopPrice={pricing.extraStopPrice} insidePickupPrice={pricing.insidePickupPrice} minAdvanceHours={pricing.minAdvanceHours} />}
            {step === 1 && <VehicleStep draft={draft} update={update} onBack={() => go(0)} onNext={() => go(2)} error={error} tiers={tiers} fareVisible={pricing.fareVisible} tierFares={quote?.tierFares} quoting={quoting} currency={pricing.currency} />}
            {step === 2 && <DetailsStep draft={draft} update={update} onBack={() => go(1)} onNext={detailsNext} error={error} setError={setError} />}
            {step === 3 && <ReviewStep draft={draft} onBack={() => go(2)} onSubmit={submit} error={error} submitting={submitting} vehicleName={selectedTier?.name} quote={quote} quoting={quoting} fareVisible={pricing.fareVisible} currency={pricing.currency} tip={tip} setTip={setTip} tipEnabled={pricing.tipEnabled} taxEnabled={pricing.taxEnabled} tollsEnabled={pricing.tollsEnabled} paymentRequired={pricing.paymentRequired} />}
          </>
        )}
      </div>
      <aside className="companion-pane"><div className="companion-top"><div className="operator-line"><span className="operator-name">{businessName}</span><span className="operator-separator" /><span className="operator-status"><span /> Accepting requests</span></div><div className="companion-copy"><span className="eyebrow">{`0${step + 1} — ${stages[step].toUpperCase()}`}</span><h1>{['Where to?', 'Ride your way.', 'The details matter.', 'Ready when you are.'][step]}</h1><p>{['Start with where and when. The rest takes a minute.', 'The right car makes every journey feel easier.', 'A few details so we can make this trip yours.', 'Check your journey, see your total, and pay to book.'][step]}</p></div>
        {hasRoute && <RouteMap origin={draft.pickup} destination={draft.dropoff} waypoint={draft.extraStop} variant="aside" originCoords={draft.pickupCoords} destinationCoords={draft.dropoffCoords} waypointCoords={draft.extraStopCoords} />}
        {!hasRoute && step === 0 ? <div className="intro-card"><div className="intro-graphic"><div className="route-orbit"><div className="orbit-car"><CarFront size={28} strokeWidth={1.7} /></div><span className="orbit-dot one" /><span className="orbit-dot two" /></div></div><div><span className="intro-caption">A BETTER WAY TO MOVE</span><h3>Your journey starts here.</h3><p>Book a point-to-point ride or keep a car and driver for the hours you need.</p></div></div> : <div className="side-summary"><div className="summary-top"><span>YOUR JOURNEY</span><span className="summary-line" /></div><div className="summary-item"><span className="summary-icon"><CalendarDays size={17} /></span><div><small>Pickup (A)</small><strong>{draft.pickup}</strong></div></div>{draft.service === 'ride' && draft.extraStop && <div className="summary-item"><span className="summary-icon"><MapPin size={18} /></span><div><small>Extra stop (S)</small><strong>{draft.extraStop}</strong></div></div>}{draft.service === 'ride' && <div className="summary-item"><span className="summary-icon"><MapPin size={18} /></span><div><small>Dropoff (B)</small><strong>{draft.dropoff}</strong></div></div>}<div className="summary-item"><span className="summary-icon"><CalendarDays size={17} /></span><div><small>Pickup time</small><strong>{formatTripDate(draft.date, draft.time)}</strong></div></div><div className="summary-item"><span className="summary-icon"><CarFront size={18} /></span><div><small>Your ride</small><strong>{selectedTier?.name ?? draft.vehicle}{draft.service === 'hourly' ? ` · ${draft.hours} hours` : ''}</strong></div></div>{draft.returnTrip && <div className="summary-item"><span className="summary-icon"><Clock3 size={17} /></span><div><small>Return</small><strong>{formatTripDate(draft.returnDate, draft.returnTime)}</strong></div></div>}</div>}
      </div><div className="companion-bottom"><div className="safety-line"><ShieldCheck size={16} /><span>Thoughtfully planned. Seamlessly booked.</span></div><span className="companion-handle">{businessName} / your journey</span></div></aside>
    </div>)}<footer className="site-footer"><span>© {new Date().getFullYear()} {businessName} reservations</span><a href="/dashboard" className="footer-link">Operator dashboard</a></footer>
  </main>;
}
