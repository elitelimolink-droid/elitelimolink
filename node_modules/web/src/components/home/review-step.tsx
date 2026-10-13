import { ArrowLeft, ArrowRight, Baby, CalendarDays, CarFront, Clock3, CreditCard, DoorOpen, Percent, UserRound } from 'lucide-react';
import type { ReservationDraft } from '@/lib/reservation';
import { formatTripDate } from '@/lib/reservation';
import { type FareQuote, type TipChoice, NO_TIP, formatFare } from '@/lib/pricing';
import { RouteMap } from '@/components/home/route-map';

type Props = {
  draft: ReservationDraft;
  onBack: () => void;
  onSubmit: () => void;
  error: string;
  submitting: boolean;
  vehicleName?: string;
  /** Server-authoritative total from /api/fare-quote — what the customer pays. */
  quote: FareQuote | null;
  quoting: boolean;
  /** Operator-controlled price visibility. When false, all prices stay hidden. */
  fareVisible: boolean;
  currency: string;
  /** Customer-chosen tip (review step). */
  tip: TipChoice;
  setTip: (tip: TipChoice) => void;
  tipEnabled: boolean;
  taxEnabled: boolean;
  tollsEnabled: boolean;
  /** Operator-controlled payment requirement. When false, checkout is skipped
   *  and the reservation is confirmed directly from the booking page. */
  paymentRequired: boolean;
};

/**
 * Final review. The customer sees the full trip and pays to complete the
 * booking. The exact total is still calculated server-side from the verified
 * driving mileage and the operator's rates, and is collected through the
 * hosted checkout — the booking is completed by the payment, not before.
 * Price amounts and the fare breakdown are shown only when the operator's
 * price-visibility toggle is on; otherwise every price stays hidden while
 * the server-side calculation and charged total remain intact.
 */
export function ReviewStep({ draft, onBack, onSubmit, error, submitting, vehicleName, quote, quoting, fareVisible, currency, tip, setTip, tipEnabled, taxEnabled, tollsEnabled, paymentRequired }: Props) {
  const totalReady = Boolean(quote?.ok && quote.fareText);
  const showPrices = fareVisible && Boolean(quote?.ok);
  const tipPresets = [15, 18, 20, 25];
  // When payment is not required, the customer can confirm without a quote
  // (no charge is made). When payment is required, a trustworthy fare must
  // be ready before the button is enabled.
  const canConfirm = paymentRequired ? (totalReady && !quoting) : true;

  return <>
    <div className="step-scroll">
      <div className="step-heading"><span className="eyebrow">ONE LAST LOOK</span><h2>Review & pay.</h2><p>{fareVisible ? 'Check your trip, choose your tip, and see your exact total before you pay to complete your booking.' : 'Check your trip, then pay to complete your booking.'}</p></div>
      {draft.service === 'ride' && draft.pickup && draft.dropoff && <RouteMap origin={draft.pickup} destination={draft.dropoff} waypoint={draft.extraStop} variant="inline" originCoords={draft.pickupCoords} destinationCoords={draft.dropoffCoords} waypointCoords={draft.extraStopCoords} />}
      <div className="review-panel">
        <div className="review-panel-head"><span>YOUR TRIP</span><span className="status-pill">Pay to book</span></div>
        <div className="review-route"><div><span className="pickup-marker" /><strong>{draft.pickup}</strong></div>{draft.service === 'ride' && draft.extraStop && <div><span className="stop-marker" /><strong>{draft.extraStop}</strong></div>}{draft.service === 'ride' && <div><span className="dropoff-marker" /><strong>{draft.dropoff}</strong></div>}</div>
        <div className="review-data"><div><CalendarDays size={18} /><span>Pickup</span><strong>{formatTripDate(draft.date, draft.time)}</strong></div>{draft.service === 'hourly' && <div><Clock3 size={18} /><span>Duration</span><strong>{draft.hours} hours</strong></div>}{draft.returnTrip && <div><CalendarDays size={18} /><span>Return</span><strong>{formatTripDate(draft.returnDate, draft.returnTime)}</strong></div>}<div><CarFront size={18} /><span>Vehicle</span><strong>{quote?.tierName ?? vehicleName ?? draft.vehicle}</strong></div><div><UserRound size={18} /><span>Passengers</span><strong>{draft.passengers}</strong></div></div>
        {(draft.carSeat || draft.insidePickup) && (
          <div className="review-add-ons">
            <span>ADD-ONS</span>
            <div className="review-add-on-list">
              {draft.carSeat && <span><Baby size={14} /> Car seat {fareVisible && quote?.carSeatAmount ? `+${formatFare(quote.carSeatAmount, currency)}` : ''}</span>}
              {draft.insidePickup && <span><DoorOpen size={14} /> Inside pickup {fareVisible && quote?.insidePickupAmount ? `+${formatFare(quote.insidePickupAmount, currency)}` : ''}</span>}
            </div>
          </div>
        )}

      </div>
      {showPrices && quote && (
        <div className="fare-breakdown">
          <div className="fare-breakdown-head"><span>PRICE BREAKDOWN</span></div>
          <div><span>Subtotal</span><strong>{formatFare(quote.subtotal ?? 0, currency)}</strong></div>
          {draft.carSeat && (
            <div><span>Car seat</span><strong>{quote.carSeatAmount ? formatFare(quote.carSeatAmount, currency) : 'No charge'}</strong></div>
          )}
          {draft.service === 'ride' && draft.extraStop && (
            <div><span>Extra stop</span><strong>{quote.extraStopAmount ? formatFare(quote.extraStopAmount, currency) : 'No charge'}</strong></div>
          )}
          {draft.insidePickup && (
            <div><span>Inside pickup</span><strong>{quote.insidePickupAmount ? formatFare(quote.insidePickupAmount, currency) : 'No charge'}</strong></div>
          )}
          {tollsEnabled ? (
            quote.tollsAvailable
              ? <div><span>Tolls</span><strong>{formatFare(quote.tollAmount ?? 0, currency)}</strong></div>
              : <div className="tolls-unavailable"><span>Tolls</span><em>Unavailable</em></div>
          ) : <div className="fare-line-muted"><span>Tolls</span><em>Not included</em></div>}
          <div className="tip-row">
            <span className="tip-row-label"><Percent size={13} /> Add a tip</span>
            <div className="tip-selector">
              {tipPresets.map(p => (
                <button key={p} type="button" className={`tip-option ${tip.kind === 'percent' && tip.percent === p ? 'chosen' : ''}`} onClick={() => setTip({ kind: 'percent', percent: p, amount: 0 })}>{p}%</button>
              ))}
              <div className={`tip-custom ${tip.kind === 'amount' ? 'active' : ''}`}>
                <span className="tip-custom-symbol">$</span>
                <input type="number" min="0" step="1" inputMode="decimal" placeholder="Custom" value={tip.kind === 'amount' && tip.amount > 0 ? tip.amount : ''} onChange={e => setTip({ kind: 'amount', percent: 0, amount: Number(e.target.value) || 0 })} aria-label="Custom tip amount" />
              </div>
              <button type="button" className={`tip-option ${tip.kind === 'none' ? 'chosen' : ''}`} onClick={() => setTip(NO_TIP)}>No tip</button>
            </div>
          </div>
          {tip.kind !== 'none' && quote.tipAmount ? (
            <div><span>Tip {tip.kind === 'percent' ? `(${tip.percent}%)` : ''}</span><strong>{formatFare(quote.tipAmount, currency)}</strong></div>
          ) : null}
          {taxEnabled ? (
            <div><span>Tax</span><strong>{formatFare(quote.taxAmount ?? 0, currency)}</strong></div>
          ) : <div className="fare-line-muted"><span>Tax</span><em>Not configured</em></div>}
          <div className="fare-breakdown-total"><span>Total</span><strong>{quote.fareText}</strong></div>
        </div>
      )}
      <div className="review-contact"><span>CONTACT DETAILS</span><strong>{draft.name}</strong><p>{draft.email}<br />{draft.phone}</p></div>
      {(draft.flight || draft.notes) && <div className="review-contact"><span>ADDITIONAL NOTES</span>{draft.flight && <p>Flight: {draft.flight}</p>}{draft.notes && <p>{draft.notes}</p>}</div>}
      <div className="review-disclaimer"><CreditCard size={17} /><p>{paymentRequired ? 'Payment is collected through secure checkout to complete your booking — if payment is canceled, nothing is charged and your request is not booked.' : 'Your reservation is confirmed directly — no online payment is needed. We will reach out with any pickup details.'}</p></div>
    </div>
    <div className="booking-bottom">{error && <p className="form-error" role="alert">{error}</p>}<div className="bottom-actions"><button type="button" className="back-button" onClick={onBack} disabled={submitting} aria-label="Go back"><ArrowLeft size={19} /></button><button type="button" className="primary-button" onClick={onSubmit} disabled={submitting || !canConfirm}>{submitting ? 'Confirming booking…' : (paymentRequired && !totalReady ? 'Retry fare calculation' : 'Confirm booking')} {!submitting && <ArrowRight size={17} />}</button></div></div>
  </>;
}
