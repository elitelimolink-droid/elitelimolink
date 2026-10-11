import { apiError, json, readJsonBody, withApi } from '@/lib/api.server';
import { fetchDrivingRoute } from '@/lib/geo.server';
import { loadBusinessPricing, resolveBusinessId } from '@/lib/business-pricing.server';
import { buildFareBreakdown, estimateHourlyFare, estimateRideFare, formatFare, type TipChoice, type TierFare } from '@/lib/pricing';

type Coords = { lat?: number; lng?: number };

type QuoteBody = {
  service?: string;
  hours?: number;
  vehicle?: string;
  biz?: string;
  returnTrip?: boolean;
  pickupCoords?: Coords;
  dropoffCoords?: Coords;
  extraStopCoords?: Coords;
  // Customer-chosen tip on the review step. Overrides the operator's default
  // tip percentage so the total always reflects what the customer selected.
  tipKind?: string;
  tipPercent?: number;
  tipAmount?: number;
  // Customer-selected optional add-ons. Each applies the operator's flat
  // add-on price to the total when selected.
  carSeat?: boolean;
  insidePickup?: boolean;
  extraStop?: boolean;
};

/**
 * Normalizes the customer's tip selection into a TipChoice the breakdown
 * helper understands. Invalid values fall back to "no tip" rather than
 * failing the quote — the customer can always retry with a valid amount.
 */
function resolveTip(body: QuoteBody): TipChoice | undefined {
  const kind = body.tipKind;
  if (kind === 'none') return { kind: 'none', percent: 0, amount: 0 };
  if (kind === 'amount') {
    const amount = Number(body.tipAmount);
    if (!Number.isFinite(amount) || amount < 0) return { kind: 'none', percent: 0, amount: 0 };
    return { kind: 'amount', percent: 0, amount: Math.round(amount * 100) / 100 };
  }
  if (kind === 'percent') {
    const percent = Number(body.tipPercent);
    if (!Number.isFinite(percent) || percent < 0) return { kind: 'none', percent: 0, amount: 0 };
    return { kind: 'percent', percent: Math.min(100, percent), amount: 0 };
  }
  // No tip selection sent (e.g. the trip-step live estimate) — let the
  // operator's default tip setting apply.
  return undefined;
}

/**
 * POST /api/fare-quote — the authoritative fare calculation for the booking
 * flow. An action (POST) so it is never edge-cached: every quote is computed
 * fresh from the operator's current rates and the exact driving route between
 * the customer's VERIFIED coordinates (captured when they picked an address
 * suggestion), never from a typed-address guess.
 *
 * Point-to-point rides resolve the driving route (pickup → optional extra
 * stop → dropoff) via Google Directions or OSRM and price the exact mileage;
 * a straight-line fallback is refused rather than quoted, so an unavailable
 * route never produces a misleading fare. A round trip doubles the mileage
 * (outbound + return). Hourly service prices hours × tier multiplier.
 *
 * The client displays the returned total and pays exactly this amount at
 * checkout, so what the customer sees, what is charged, and what is stored on
 * the reservation are always the same number.
 */
export const action = withApi(async ({ request }) => {
  const body = await readJsonBody<QuoteBody>(request);

  const service = body.service === 'ride' ? 'ride' : body.service === 'hourly' ? 'hourly' : '';
  if (!service) {
    return apiError(422, 'service must be "ride" or "hourly"');
  }

  const resolvedBizId = await resolveBusinessId(body.biz);
  const { pricing, tiers } = await loadBusinessPricing(resolvedBizId);
  const tipOverride = resolveTip(body);
  const addons = {
    carSeat: body.carSeat === true,
    insidePickup: body.insidePickup === true,
    extraStop: body.extraStop === true,
  };
  const tier = tiers.find(t => t.active && t.key === (body.vehicle ?? ''));
  if (!tier) {
    return apiError(422, 'unknown vehicle category');
  }

  if (service === 'hourly') {
    const hours = Number(body.hours);
    if (!Number.isFinite(hours) || hours < 2 || hours > 12) {
      return apiError(422, 'hours must be between 2 and 12');
    }
    const subtotal = estimateHourlyFare(pricing, hours, tier);
    const breakdown = buildFareBreakdown(pricing, subtotal, 0, tipOverride, addons);
    const tierFares: TierFare[] = tiers.filter(t => t.active).map(t => {
      const tSub = estimateHourlyFare(pricing, hours, t);
      const tBd = buildFareBreakdown(pricing, tSub, 0, tipOverride, addons);
      return {
        key: t.key, name: t.name, fare: tBd.total, fareText: formatFare(tBd.total, pricing.currency),
        subtotal: tBd.subtotal, tollAmount: tBd.tollAmount, tipAmount: tBd.tipAmount, taxAmount: tBd.taxAmount,
        carSeatAmount: tBd.carSeatAmount, extraStopAmount: tBd.extraStopAmount, insidePickupAmount: tBd.insidePickupAmount,
        tollsAvailable: true,
      };
    });
    return json({
      ok: true,
      fare: breakdown.total,
      subtotal: breakdown.subtotal,
      tollAmount: breakdown.tollAmount,
      tipAmount: breakdown.tipAmount,
      taxAmount: breakdown.taxAmount,
      carSeatAmount: breakdown.carSeatAmount,
      extraStopAmount: breakdown.extraStopAmount,
      insidePickupAmount: breakdown.insidePickupAmount,
      fareText: formatFare(breakdown.total, pricing.currency),
      tierName: tier.name,
      roundTrip: false,
      tollsAvailable: true,
      tierFares,
    });
  }

  const coord = (c: Coords | undefined): { lat: number; lng: number } | null => {
    if (!c || typeof c.lat !== 'number' || typeof c.lng !== 'number') return null;
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return null;
    if (Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180) return null;
    return { lat: c.lat, lng: c.lng };
  };
  const pickup = coord(body.pickupCoords);
  const dropoff = coord(body.dropoffCoords);
  const stop = coord(body.extraStopCoords);
  if (!pickup || !dropoff) {
    return apiError(422, 'verified pickup and dropoff coordinates are required to calculate an exact fare');
  }

  const points = [pickup, ...(stop ? [stop] : []), dropoff];
  const route = await fetchDrivingRoute(points, process.env.GOOGLE_MAPS_API_KEY, request.signal);

  // A straight-line fallback is not exact mileage — refuse to quote rather
  // than charge a guess. The customer is asked to try again.
  if (!route || route.source === 'straight' || !(route.distanceMeters > 0)) {
    return json({
      ok: false,
      message: 'We couldn’t calculate the exact driving distance right now. Please try again in a moment.',
    });
  }

  const roundTrip = body.returnTrip === true;
  let miles = route.distanceMeters / 1609.344;
  let durationSeconds = route.durationSeconds;
  // Tolls come from Google's route estimate. A round trip doubles them along
  // with the mileage. When the provider didn't return toll data (no key, or
  // OSRM fallback), tolls stay null and the booking flow marks tolls
  // unavailable rather than inventing a value.
  let tolls = route.tolls ?? null;
  if (roundTrip) {
    // Outbound + return over the same route.
    miles *= 2;
    durationSeconds *= 2;
    if (tolls !== null) tolls *= 2;
  }

  const subtotal = estimateRideFare(pricing, miles, tier);
  // tollsAvailable: true when tolls were either estimated (a number) or
  // genuinely not applicable (operator has tolls off). False only when the
  // operator wants tolls included but the route provider couldn't supply them.
  const tollsAvailable = !pricing.tollsEnabled || tolls !== null;
  const tollsForBreakdown = pricing.tollsEnabled ? (tolls ?? 0) : 0;
  const breakdown = buildFareBreakdown(pricing, subtotal, tollsForBreakdown, tipOverride, addons);
  // Per-vehicle actual calculated fares for the verified route, so the
  // vehicle selection step can show each tier's real fare. All tiers use
  // the same verified mileage and toll estimate; only the per-tier rate and
  // multiplier differ.
  const tierFares: TierFare[] = tiers.filter(t => t.active).map(t => {
    const tSub = estimateRideFare(pricing, miles, t);
    const tBd = buildFareBreakdown(pricing, tSub, tollsForBreakdown, tipOverride, addons);
    return {
      key: t.key, name: t.name, fare: tBd.total, fareText: formatFare(tBd.total, pricing.currency),
      subtotal: tBd.subtotal, tollAmount: tBd.tollAmount, tipAmount: tBd.tipAmount, taxAmount: tBd.taxAmount,
      carSeatAmount: tBd.carSeatAmount, extraStopAmount: tBd.extraStopAmount, insidePickupAmount: tBd.insidePickupAmount,
      tollsAvailable, miles, distanceText: `${miles.toFixed(1)} mi${roundTrip ? ' round trip' : ''}`,
      durationText: durationSeconds > 0 ? `~${Math.max(1, Math.round(durationSeconds / 60))} min` : '',
    };
  });
  return json({
    ok: true,
    fare: breakdown.total,
    subtotal: breakdown.subtotal,
    tollAmount: breakdown.tollAmount,
    tipAmount: breakdown.tipAmount,
    taxAmount: breakdown.taxAmount,
    carSeatAmount: breakdown.carSeatAmount,
    extraStopAmount: breakdown.extraStopAmount,
    insidePickupAmount: breakdown.insidePickupAmount,
    miles,
    roundTrip,
    fareText: formatFare(breakdown.total, pricing.currency),
    distanceText: `${miles.toFixed(1)} mi${roundTrip ? ' round trip' : ''}`,
    durationText: durationSeconds > 0 ? `~${Math.max(1, Math.round(durationSeconds / 60))} min` : '',
    tierName: tier.name,
    tollsAvailable,
    tierFares,
  });
});
