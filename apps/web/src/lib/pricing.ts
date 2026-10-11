// Fare calculation helpers shared by the booking flow and the dashboard.

export type PricingSettings = {
  baseRate: number;
  minimumFare: number;
  perMileRate: number;
  hourlyRate: number;
  currency: string;
  // Operator-controlled add-ons. All default off / 0 so existing operators
  // see no change until they opt in from the dashboard.
  tipEnabled: boolean;
  tipPercent: number;
  taxEnabled: boolean;
  taxPercent: number;
  tollsEnabled: boolean;
  // Administrator-controlled price visibility. When true, estimated prices are
  // shown to customers during booking; when false, fares stay concealed. The
  // server-side fare calculation and payment totals are unaffected.
  fareVisible: boolean;
  // Administrator-controlled payment requirement. When true (default), the
  // booking flow sends the customer to hosted checkout to pay before the
  // reservation is completed. When false, checkout is skipped entirely and
  // the reservation is completed directly from the booking page (saved as
  // confirmed, no charge).
  paymentRequired: boolean;
  // Operator-set flat prices for the optional booking add-ons. Each is a
  // dollar amount the operator configures from the dashboard; the booking
  // flow adds the selected add-on's price to the total and shows it as a
  // line item when price visibility is on. 0 means no charge.
  carSeatPrice: number;
  extraStopPrice: number;
  insidePickupPrice: number;
  // Operator-controlled minimum advance notice before pickup, in hours
  // (1–24). Customers cannot place a reservation with a pickup sooner than
  // this window. Applies to all vehicles.
  minAdvanceHours: number;
};

export const DEFAULT_PRICING: PricingSettings = {
  baseRate: 5,
  minimumFare: 25,
  perMileRate: 3.5,
  hourlyRate: 65,
  currency: 'USD',
  tipEnabled: false,
  tipPercent: 15,
  taxEnabled: false,
  taxPercent: 0,
  tollsEnabled: false,
  fareVisible: true,
  paymentRequired: true,
  carSeatPrice: 0,
  extraStopPrice: 0,
  insidePickupPrice: 0,
  minAdvanceHours: 2,
};

/**
 * A configurable vehicle category. The operator edits these from the dashboard;
 * the booking flow reads the active tiers through /api/pricing. `minFare` is a
 * per-tier floor (in addition to the global minimum fare), and `multiplier`
 * scales the distance/hourly calculation so premium tiers cost proportionally
 * more.
 */
export type VehicleTier = {
  key: string;
  name: string;
  detail: string;
  capacity: number;
  minFare: number;
  multiplier: number;
  /** Per-mile rate specific to this vehicle tier, used for distance fares. */
  perMileRate: number;
  active: boolean;
  sort: number;
  /** Public URL of the operator-uploaded photo for this category, or '' when none. */
  photo?: string;
};

export const DEFAULT_TIERS: VehicleTier[] = [
  { key: 'sedan', name: 'Executive sedan', detail: 'A refined ride for everyday travel', capacity: 3, minFare: 25, multiplier: 1, perMileRate: 0, active: true, sort: 1 },
  { key: 'suv', name: 'Premium SUV', detail: 'More space for people and luggage', capacity: 6, minFare: 45, multiplier: 1.3, perMileRate: 0, active: true, sort: 2 },
  { key: 'van', name: 'Passenger van', detail: 'Travel together, comfortably', capacity: 8, minFare: 65, multiplier: 1.6, perMileRate: 0, active: true, sort: 3 },
];

type TierPricing = Pick<VehicleTier, 'minFare' | 'multiplier' | 'perMileRate'>;

/**
 * Point-to-point ride fare: base + per-mile × distance, floored at the
 * tier's own minimum fare (or the global minimum fare when the tier has
 * none set).
 *
 * Both the global settings and per-tier rates work in harmony:
 * - If the operator changes the global per-mile rate or base rate, all vehicle
 *   fares scale dynamically according to their category multiplier.
 * - If a tier specifies a distinct custom per-mile rate, it is honored.
 * - The minimum fare floor enforces whichever is higher: the global floor or
 *   the tier-specific floor.
 */
export function estimateRideFare(settings: PricingSettings, distanceMiles: number, tier?: TierPricing): number {
  const multiplier = tier?.multiplier && tier.multiplier > 0 ? tier.multiplier : 1;
  const basePerMile = Number(settings.perMileRate) > 0 ? Number(settings.perMileRate) : DEFAULT_PRICING.perMileRate;
  const tierPerMile = tier?.perMileRate && tier.perMileRate > 0
    ? tier.perMileRate
    : basePerMile * multiplier;
  const tierBaseRate = (tier?.minFare !== undefined && tier.minFare !== null && tier.minFare > 0)
    ? tier.minFare
    : (Number(settings.baseRate) || 0);
  const raw = tierBaseRate + tierPerMile * Math.max(0, distanceMiles);
  const floor = tierBaseRate > 0 ? tierBaseRate : (settings.minimumFare ?? 0);
  return Math.max(floor, raw);
}

/**
 * The guaranteed minimum fare for a point-to-point ride: the higher of
 * the tier's minimum fare and the global minimum fare.
 */
export function rideFareFloor(settings: PricingSettings, tier?: TierPricing): number {
  return Math.max(tier?.minFare ?? 0, settings.minimumFare ?? 0);
}

/** Hourly chauffeur fare: hourly rate × hours × tier multiplier, floored at the maximum of tier/global minimum. */
export function estimateHourlyFare(settings: PricingSettings, hours: number, tier?: TierPricing): number {
  const multiplier = tier?.multiplier && tier.multiplier > 0 ? tier.multiplier : 1;
  const raw = (Number(settings.hourlyRate) || DEFAULT_PRICING.hourlyRate) * Math.max(0, hours) * multiplier;
  const floor = Math.max(tier?.minFare ?? 0, settings.minimumFare ?? 0);
  return Math.max(floor, raw);
}

/**
 * A fare quote computed server-side by /api/fare-quote from the operator's
 * current rates and the exact driving mileage between the customer's
 * verified coordinates. `ok: false` means no trustworthy fare could be
 * calculated (e.g. the driving route was unavailable) — the booking flow
 * must not quote or charge a fare in that case.
 *
 * The breakdown (subtotal, tolls, tip, tax, total) is authoritative on the
 * server and is what the customer pays at checkout. `tollsAvailable` is
 * false when tolls could not be estimated (no maps key or route provider
 * does not return tolls) — the booking flow shows "tolls unavailable"
 * rather than inventing a value.
 */
export type FareQuote = {
  ok: boolean;
  fare?: number;
  subtotal?: number;
  tollAmount?: number;
  tipAmount?: number;
  taxAmount?: number;
  carSeatAmount?: number;
  extraStopAmount?: number;
  insidePickupAmount?: number;
  miles?: number;
  fareText?: string;
  distanceText?: string;
  durationText?: string;
  tierName?: string;
  roundTrip?: boolean;
  tollsAvailable?: boolean;
  message?: string;
  // Per-vehicle actual calculated fares for the customer's verified route,
  // so the vehicle selection step can show each tier's real fare instead of
  // a minimum starting price. Present only when a verified fare was
  // computed; absent when the route could not be resolved.
  tierFares?: TierFare[];
};

export type TierFare = {
  key: string;
  name: string;
  fare: number;
  fareText: string;
  // Full breakdown for this tier, mirroring the top-level quote breakdown so
  // the vehicle selection step can show subtotal, add-ons, tolls, tip, tax,
  // and total per vehicle. Populated only when a verified fare was computed.
  subtotal?: number;
  tollAmount?: number;
  tipAmount?: number;
  taxAmount?: number;
  carSeatAmount?: number;
  extraStopAmount?: number;
  insidePickupAmount?: number;
  tollsAvailable?: boolean;
  miles?: number;
  distanceText?: string;
  durationText?: string;
};

export function formatFare(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/** Rounds to the nearest cent, guarding floating-point drift in totals. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * The customer's tip choice on the review step. `kind` distinguishes a
 * percentage tip, a fixed dollar amount, or no tip at all. The server
 * recomputes the authoritative total from this — the customer's selection
 * overrides the operator's default tip percentage.
 */
export type TipChoice = {
  kind: 'none' | 'percent' | 'amount';
  percent: number;
  amount: number;
};

export const NO_TIP: TipChoice = { kind: 'none', percent: 0, amount: 0 };

/**
 * Builds the full fare breakdown from a base subtotal (the distance/hourly
 * fare) plus optional tolls, tip, and tax. Tip applies to the subtotal only
 * (not to tolls or tax); tax applies to subtotal + tolls. Everything is
 * rounded to the cent so the customer pays exactly what is displayed.
 *
 * `tipOverride` lets the customer choose their own tip (a percentage or a
 * fixed amount) on the review step — when present it replaces the operator's
 * default tip percentage so the total always reflects the customer's
 * selection. Tax remains operator-controlled and server-authoritative.
 */
export type FareAddons = {
  carSeat?: boolean;
  extraStop?: boolean;
  insidePickup?: boolean;
};

export type FareBreakdown = {
  subtotal: number;
  tollAmount: number;
  tipAmount: number;
  taxAmount: number;
  total: number;
  carSeatAmount: number;
  extraStopAmount: number;
  insidePickupAmount: number;
};

export function buildFareBreakdown(
  settings: PricingSettings,
  subtotal: number,
  tolls: number,
  tipOverride?: TipChoice,
  addons?: FareAddons,
): FareBreakdown {
  const useTolls = settings.tollsEnabled ? Math.max(0, tolls) : 0;
  // Operator-set flat add-on prices, applied only when the customer selected
  // that add-on. The operator owns these values — none are invented.
  const carSeatAmount = addons?.carSeat ? Math.max(0, settings.carSeatPrice ?? 0) : 0;
  const extraStopAmount = addons?.extraStop ? Math.max(0, settings.extraStopPrice ?? 0) : 0;
  const insidePickupAmount = addons?.insidePickup ? Math.max(0, settings.insidePickupPrice ?? 0) : 0;
  const addonsTotal = round2(carSeatAmount + extraStopAmount + insidePickupAmount);
  let tipAmount = 0;
  if (tipOverride && tipOverride.kind !== 'none') {
    if (tipOverride.kind === 'amount' && tipOverride.amount > 0) {
      tipAmount = tipOverride.amount;
    } else if (tipOverride.kind === 'percent' && tipOverride.percent > 0) {
      tipAmount = subtotal * (Math.max(0, tipOverride.percent) / 100);
    }
  } else if (settings.tipEnabled) {
    tipAmount = subtotal * (Math.max(0, settings.tipPercent) / 100);
  }
  tipAmount = round2(tipAmount);
  // Tax applies to the fare plus add-ons plus tolls — all taxable services.
  const taxAmount = settings.taxEnabled ? round2((subtotal + addonsTotal + useTolls) * (Math.max(0, settings.taxPercent) / 100)) : 0;
  const total = round2(subtotal + addonsTotal + useTolls + tipAmount + taxAmount);
  return {
    subtotal: round2(subtotal),
    tollAmount: round2(useTolls),
    tipAmount,
    taxAmount,
    total,
    carSeatAmount: round2(carSeatAmount),
    extraStopAmount: round2(extraStopAmount),
    insidePickupAmount: round2(insidePickupAmount),
  };
}
