import { ArrowLeft, ArrowRight, CarFront, Check, Loader2, UsersRound } from 'lucide-react';
import type { ReservationDraft } from '@/lib/reservation';
import { type TierFare, type VehicleTier, formatFare } from '@/lib/pricing';

/** Ride price only — tax and gratuity stay off this screen. */
function baseFare(fare: TierFare | undefined): number | null {
  if (!fare || typeof fare.subtotal !== 'number' || !Number.isFinite(fare.subtotal)) return null;
  return fare.subtotal;
}

type Props = {
  draft: ReservationDraft;
  update: (patch: Partial<ReservationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  error: string;
  tiers: VehicleTier[];
  /** Operator-controlled price visibility. When false, all prices stay hidden. */
  fareVisible: boolean;
  /** Per-vehicle actual calculated fares for the customer's verified route.
   *  Present only when a verified fare was computed; absent while quoting or
   *  when the route could not be resolved (no price is shown in that case). */
  tierFares?: TierFare[];
  quoting: boolean;
  currency: string;
};

/**
 * Vehicle selection driven by the operator's configurable tiers. Each tier
 * shows its display name, description, passenger capacity, and the base fare
 * for the verified route. Tax and gratuity are not included here — they are
 * applied and itemized only on the final payment screen. Selecting a tier
 * clamps the passenger count to that tier's capacity.
 */
export function VehicleStep({ draft, update, onBack, onNext, error, tiers, fareVisible, tierFares, quoting, currency }: Props) {
  const activeTiers = [...tiers].filter(t => t.active).sort((a, b) => a.sort - b.sort);
  const selected = activeTiers.find(t => t.key === draft.vehicle) ?? activeTiers[0];
  const capacity = selected?.capacity ?? 3;
  const fareFor = (key: string) => tierFares?.find(f => f.key === key);

  return <>
    <div className="step-scroll">
      <div className="step-heading"><span className="eyebrow">THE RIGHT RIDE FOR YOU</span><h2>Choose your vehicle.</h2><p>Pick the space that fits your plans. We’ll confirm your trip details before pickup.</p></div>
      <div className="vehicle-list">{activeTiers.map(vehicle => <button type="button" key={vehicle.key} className={`vehicle-option ${draft.vehicle === vehicle.key ? 'chosen' : ''}`} onClick={() => update({ vehicle: vehicle.key as ReservationDraft['vehicle'], passengers: Math.min(draft.passengers, vehicle.capacity) })}>
        <span className="vehicle-art">{vehicle.photo ? <img src={vehicle.photo} alt={vehicle.name} loading="lazy" /> : <CarFront size={27} strokeWidth={1.5} />}</span>
        <span className="vehicle-copy"><strong>{vehicle.name}</strong><small>{vehicle.detail}</small><em><UsersRound size={13} /> Up to {vehicle.capacity} passengers</em></span>
        {fareVisible && (() => {
          const f = fareFor(vehicle.key);
          const base = baseFare(f);
          if (f && base !== null) return <span className="vehicle-price"><strong>{formatFare(base, currency)}</strong></span>;
          if (quoting) return <span className="vehicle-price vehicle-price-loading"><Loader2 size={15} /></span>;
          return null;
        })()}
        <span className="vehicle-check">{draft.vehicle === vehicle.key && <Check size={15} strokeWidth={3} />}</span>
      </button>)}</div>
      <div className="passenger-control"><div><strong>Passengers</strong><span>How many people are traveling?</span></div><div className="passenger-stepper"><button type="button" onClick={() => update({ passengers: Math.max(1, draft.passengers - 1) })} disabled={draft.passengers <= 1} aria-label="Fewer passengers">−</button><strong>{draft.passengers}</strong><button type="button" onClick={() => update({ passengers: Math.min(capacity, draft.passengers + 1) })} disabled={draft.passengers >= capacity} aria-label="More passengers">+</button></div></div>
      <p className="quiet-note">{fareVisible ? 'Prices shown are the base fare only. Tax and gratuity are added on the payment screen.' : 'Choose the space that fits your plans. We’ll confirm your trip details before pickup.'}</p>
    </div>
    <div className="booking-bottom"><div className="bottom-actions"><button type="button" className="back-button" onClick={onBack} aria-label="Go back"><ArrowLeft size={19} /></button><button type="button" className="primary-button" onClick={onNext}>Continue <ArrowRight size={17} /></button></div>{error && <p className="form-error" role="alert">{error}</p>}</div>
  </>;
}
