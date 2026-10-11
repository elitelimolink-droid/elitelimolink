// Server-only helper: loads a business's pricing settings and vehicle tiers
// with superuser access, so fare calculations are authoritative on the server
// and never depend on client-supplied rates. Shared by /api/fare-quote.
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import { DEFAULT_PRICING, DEFAULT_TIERS, type PricingSettings, type VehicleTier } from '@/lib/pricing';

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
  /** Stored photo filename on the vehicle_tiers record, if any. */
  photo?: string;
};

// Browser-reachable PocketBase file path. Photos live on the publicly-readable
// vehicle_tiers collection, so no auth token is needed to load them.
const PB_PUBLIC_URL = '/hcgi/platform';
const tierPhotoUrl = (id?: string, photo?: string) =>
  id && photo ? `${PB_PUBLIC_URL}/api/files/vehicle_tiers/${id}/${photo}` : '';

export type BusinessPricing = {
  pricing: PricingSettings;
  tiers: VehicleTier[];
  businessName: string;
  /** The operator user id the snapshot belongs to ('' when unknown). */
  owner: string;
  /** True when a settings row was found for this operator. */
  hasSettings: boolean;
};

/** Operator user ids are 15-char lowercase alnum; anything else is ignored. */
export function normalizeBizId(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  return /^[a-z0-9]{15}$/.test(value) ? value : '';
}

/** Clamps the advance-notice setting to the supported 1–24 hour range. */
function clampAdvanceHours(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_PRICING.minAdvanceHours;
  return Math.min(24, Math.max(1, Math.round(n)));
}

/**
 * Resolves the pricing snapshot for one business. A valid `bizId` serves that
 * operator's settings; an empty one serves the primary (oldest) operator so
 * the main booking page keeps quoting the original business. Falls back to the
 * built-in defaults only when no settings row can be read at all.
 */
export async function loadBusinessPricing(bizId: string): Promise<BusinessPricing> {
  let record: SettingsRecord | null = null;
  let owner = '';
  try {
    if (bizId) {
      const result = await pocketbaseAdmin.listRecords<SettingsRecord>('settings', {
        perPage: 1,
        sort: '-created',
        filter: `owner = "${bizId}"`,
      });
      record = result.items[0] ?? null;
      owner = bizId;
    } else {
      const result = await pocketbaseAdmin.listRecords<SettingsRecord>('settings', {
        perPage: 1,
        sort: 'created',
      });
      record = result.items[0] ?? null;
      owner = record?.owner ?? '';
    }
  } catch {
    record = null;
  }

  const pricing: PricingSettings = record
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
        fareVisible: !!record.fareVisible,
        paymentRequired: record.paymentRequired !== false,
        carSeatPrice: record.carSeatPrice ?? DEFAULT_PRICING.carSeatPrice,
        extraStopPrice: record.extraStopPrice ?? DEFAULT_PRICING.extraStopPrice,
        insidePickupPrice: record.insidePickupPrice ?? DEFAULT_PRICING.insidePickupPrice,
        minAdvanceHours: clampAdvanceHours(record.minAdvanceHours),
      }
    : DEFAULT_PRICING;

  let tiers: VehicleTier[] = DEFAULT_TIERS;
  if (owner) {
    try {
      const result = await pocketbaseAdmin.listRecords<TierRecord>('vehicle_tiers', {
        sort: 'sort',
        perPage: 50,
        filter: `owner = "${owner}"`,
      });
      if (result.items.length) {
        tiers = result.items
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
      tiers = DEFAULT_TIERS;
    }
  }

  return { pricing, tiers, businessName: record?.businessName ?? '', owner, hasSettings: Boolean(record) };
}

/**
 * Resolves the business name for a reservation's owning operator, used by
 * the post-checkout confirmation pages so they show the correct location's
 * brand. Falls back to the primary operator's brand, then the default, so a
 * missing/legacy reservation never breaks the page.
 */
export async function loadBusinessNameByReservation(reservationId: string): Promise<string> {
  if (!reservationId) return loadPrimaryBusinessName();
  try {
    const reservation = await pocketbaseAdmin.getRecord<{ owner?: string }>('reservations', reservationId);
    const ownerId = normalizeBizId(reservation.owner);
    if (ownerId) {
      const { businessName } = await loadBusinessPricing(ownerId);
      if (businessName) return businessName;
    }
  } catch {
    // reservation missing or unreadable — fall through to primary brand
  }
  return loadPrimaryBusinessName();
}

/** The primary (oldest) operator's business name, or '' when unreadable. */
export async function loadPrimaryBusinessName(): Promise<string> {
  try {
    const { businessName } = await loadBusinessPricing('');
    return businessName;
  } catch {
    return '';
  }
}
