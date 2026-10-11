import { json, withApi, readJsonBody } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import { DEFAULT_PRICING, DEFAULT_TIERS, type VehicleTier } from '@/lib/pricing';

/** Clamps the advance-notice setting to the supported 1–24 hour range. */
function clampAdvanceHours(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_PRICING.minAdvanceHours;
  return Math.min(24, Math.max(1, Math.round(n)));
}

type SettingsRecord = {
  owner?: string;
  businessName?: string;
  baseRate?: number;
  minimumFare?: number;
  perMileRate?: number;
  hourlyRate?: number;
  currency?: string;
  tipEnabled?: boolean;
  tipPercent?: number;
  taxEnabled?: boolean;
  taxPercent?: number;
  tollsEnabled?: boolean;
  fareVisible?: boolean;
  paymentRequired?: boolean;
  carSeatPrice?: number;
  extraStopPrice?: number;
  insidePickupPrice?: number;
  minAdvanceHours?: number;
};

type TierRecord = {
  id?: string;
  key?: string;
  name?: string;
  detail?: string;
  capacity?: number;
  minFare?: number;
  multiplier?: number;
  perMileRate?: number;
  active?: boolean;
  sort?: number;
  photo?: string;
};

// Browser-reachable PocketBase file path. Photos live on the publicly-readable
// vehicle_tiers collection, so no auth token is needed to load them.
const PB_PUBLIC_URL = '/hcgi/platform';
const tierPhotoUrl = (id?: string, photo?: string) =>
  id && photo ? `${PB_PUBLIC_URL}/api/files/vehicle_tiers/${id}/${photo}` : '';

/** Operator user ids are 15-char lowercase alnum; anything else is ignored. */
function normalizeBizId(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  return /^[a-z0-9]{15}$/.test(value) ? value : '';
}

/**
 * Builds the public pricing snapshot for one business. A valid `bizId` serves
 * that operator's settings; an empty one serves the primary (oldest) operator
 * so the main booking page keeps quoting the original business. The dispatch
 * email and other operator settings stay private; `mapsConfigured` /
 * `squareConfigured` tell the UI which integrations are live.
 *
 * Shared by the GET loader (cacheable) and the POST action (never cached) so
 * the booking flow can always reach a fresh snapshot regardless of edge
 * caching — operator rate/visibility changes reliably appear on the booking
 * page.
 */
async function buildPricingSnapshot(rawBizId: string | null | undefined, cacheable = true) {
  const configured = Boolean(process.env.GOOGLE_MAPS_API_KEY);
  const bizId = normalizeBizId(rawBizId);

  // Resolve the target operator's settings row.
  let record: SettingsRecord | null = null;
  let owner = '';
  try {
    if (bizId) {
      const result = await pocketbaseAdmin.listRecords<SettingsRecord>('settings', {
        perPage: 1,
        sort: '-updated,-created',
        filter: `owner = "${bizId}"`,
      });
      record = result.items[0] ?? null;
      owner = bizId;
    } else {
      // No business specified: serve the most recently updated active operator's snapshot
      // so rate changes reliably appear on the main booking page.
      const result = await pocketbaseAdmin.listRecords<SettingsRecord>('settings', {
        perPage: 1,
        sort: '-updated,-created',
      });
      record = result.items[0] ?? null;
      owner = record?.owner ?? '';
    }
  } catch {
    record = null;
  }

  const pricing = record
    ? {
        baseRate: record.baseRate ?? DEFAULT_PRICING.baseRate,
        minimumFare: record.minimumFare ?? DEFAULT_PRICING.minimumFare,
        perMileRate: record.perMileRate ?? DEFAULT_PRICING.perMileRate,
        hourlyRate: record.hourlyRate ?? DEFAULT_PRICING.hourlyRate,
        currency: record.currency ?? DEFAULT_PRICING.currency,
        tipEnabled: !!record.tipEnabled,
        tipPercent: record.tipPercent ?? DEFAULT_PRICING.tipPercent,
        taxEnabled: !!record.taxEnabled,
        taxPercent: record.taxPercent ?? DEFAULT_PRICING.taxPercent,
        tollsEnabled: !!record.tollsEnabled,
        fareVisible: record.fareVisible !== false,
        paymentRequired: record.paymentRequired !== false,
        carSeatPrice: record.carSeatPrice ?? DEFAULT_PRICING.carSeatPrice,
        extraStopPrice: record.extraStopPrice ?? DEFAULT_PRICING.extraStopPrice,
        insidePickupPrice: record.insidePickupPrice ?? DEFAULT_PRICING.insidePickupPrice,
        minAdvanceHours: clampAdvanceHours(record.minAdvanceHours),
      }
    : DEFAULT_PRICING;

  const businessName = record?.businessName ?? '';

  // Active vehicle tiers for the same operator, in display order. Falls back
  // to the built-in defaults when the operator has none (or is unknown) so
  // the booking flow always has three categories to show.
  let vehicleTiers: VehicleTier[] = DEFAULT_TIERS;
  if (owner) {
    try {
      const result = await pocketbaseAdmin.listRecords<TierRecord>('vehicle_tiers', {
        sort: 'sort',
        perPage: 50,
        filter: `owner = "${owner}"`,
      });
      if (result.items.length) {
        vehicleTiers = result.items
          .filter(r => r.active !== false)
          .map(r => ({
            key: r.key ?? '',
            name: r.name ?? r.key ?? '',
            detail: r.detail ?? '',
            capacity: r.capacity ?? 3,
            minFare: r.minFare ?? 0,
            multiplier: r.multiplier ?? 1,
            perMileRate: r.perMileRate ?? 0,
            active: r.active !== false,
            sort: r.sort ?? 0,
            photo: tierPhotoUrl(r.id, r.photo),
          }));
      }
    } catch {
      vehicleTiers = DEFAULT_TIERS;
    }
  }

  return json(
    {
      ...pricing,
      businessName,
      vehicleTiers,
      mapsConfigured: configured,
      // The in-page Square card form needs the PUBLIC application id (browser
      // SDK) plus the secret access token and location id (server-side). All
      // three must be configured before a required-payment booking can charge
      // a card. Only the public app id + environment are sent to the browser;
      // the access token never leaves the server.
      squareConfigured: Boolean(
        process.env.SQUARE_APP_ID && process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID,
      ),
      squareAppId: process.env.SQUARE_APP_ID ?? '',
      squareLocationId: process.env.SQUARE_LOCATION_ID ?? '',
      squareEnvironment: process.env.SQUARE_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production',
      hasSettings: Boolean(record),
      bizId: owner,
    },
    // The GET loader is public, cacheable data (the platform edge-caches GET
    // by URL regardless). The POST action — which the booking flow's
    // `usePricing` hook calls specifically to pick up operator rate/visibility
    // changes without serving a stale edge-cached snapshot — MUST be
    // `no-store`, otherwise a saved change (e.g. enabling customer price
    // visibility) can be held back for the cache window and the customer
    // panel keeps rendering the previous settings.
    { headers: { 'Cache-Control': cacheable ? 'public, max-age=10' : 'no-store' } },
  );
}

/**
 * GET /api/pricing — public, cacheable pricing snapshot. Kept for any
 * cache-friendly caller, but the booking flow uses the POST action below so
 * operator rate/visibility changes are never served stale by the edge cache.
 */
export const loader = withApi(async ({ request }) => {
  const url = new URL(request.url);
  return buildPricingSnapshot(url.searchParams.get('biz'));
});

/**
 * POST /api/pricing — the same public pricing snapshot, served as an action so
 * it is NEVER edge-cached (POST responses are not cached by URL). The booking
 * flow's `usePricing` hook calls this so a saved pricing change — fare
 * visibility, add-on prices, tip/tax, vehicle tier rates — reliably appears on
 * the booking page on the next refresh, instead of a stale cached GET.
 *
 * Body: { biz?: '<operatorUserId>' }
 */
export const action = withApi(async ({ request }) => {
  let body: { biz?: string } = {};
  try {
    body = await readJsonBody<{ biz?: string }>(request);
  } catch {
    // empty or invalid body — serve the primary business snapshot
  }
  // `cacheable: false` → `no-store`: this is the refresh path the booking flow
  // relies on, so it must always return the operator's latest saved settings.
  return buildPricingSnapshot(body.biz, false);
});
