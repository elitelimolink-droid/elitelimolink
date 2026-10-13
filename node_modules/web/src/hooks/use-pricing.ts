import { useEffect, useState } from 'react';
import { DEFAULT_PRICING, DEFAULT_TIERS, type PricingSettings, type VehicleTier } from '@/lib/pricing';

export type PricingSnapshot = PricingSettings & {
  vehicleTiers: VehicleTier[];
  mapsConfigured: boolean;
  squareConfigured: boolean;
  // PUBLIC Square application id for the Web Payments SDK (browser-side).
  // Empty until SQUARE_APP_ID is configured. The secret access token is never
  // sent to the browser — only this public id, the location id, and the
  // environment.
  squareAppId: string;
  squareLocationId: string;
  squareEnvironment: 'production' | 'sandbox';
  hasSettings: boolean;
  // The operator (business) this snapshot belongs to. The booking flow
  // attaches it to the reservation so it lands in that operator's dashboard.
  bizId: string;
  businessName: string;
};

const FALLBACK: PricingSnapshot = {
  ...DEFAULT_PRICING,
  vehicleTiers: DEFAULT_TIERS,
  mapsConfigured: false,
  squareConfigured: false,
  squareAppId: '',
  squareLocationId: '',
  squareEnvironment: 'production',
  hasSettings: false,
  bizId: '',
  businessName: '',
};

/**
 * Loads the public pricing snapshot from `/api/pricing`. Used by the booking
 * flow to render live fare estimates and the configurable vehicle categories.
 * Pass a `biz` operator id (from a `?biz=` booking link) to load that
 * business's rates, categories, and name instead of the primary operator's.
 * Safe to call from any component — the endpoint is public and cacheable.
 *
 * Reliability: the platform edge-caches GET responses by URL, so each load
 * uses a unique `?t=` cache-buster to always reach the server. The fetch is
 * retried a few times on failure (a transient network blip would otherwise
 * leave the customer on default pricing forever), and re-runs when the tab
 * regains focus so operator rate changes propagate to a booking the customer
 * already has open.
 *
 * State: `loading` is true until the first attempt settles; `loaded` is true
 * only after a successful fetch (so callers can avoid quoting a default-based
 * fare); `error` is true only after every retry has failed (so callers can
 * surface a visible "rates unavailable" notice instead of silently showing
 * defaults).
 */
export function usePricing(biz?: string) {
  // The booking page's server loader is an edge-cached GET, so any snapshot
  // it could seed here would be stale in production (the platform caches GET
  // responses for up to 7 days and overrides Cache-Control). Seed with the
  // safe FALLBACK and treat pricing as unloaded until the fresh POST
  // /api/pricing — which is never edge-cached — resolves. The booking flow
  // therefore never displays fares or add-on prices computed from a stale
  // snapshot; it always reflects the operator's current saved rates once the
  // fresh snapshot arrives (a fraction of a second after hydration).
  const [pricing, setPricing] = useState<PricingSnapshot>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let attempt = 0;
    let timer: number | undefined;
    let recoveryTimer: number | undefined;

    const load = () => {
      attempt += 1;
      // POST (not GET) so the snapshot is never served stale by the edge
      // cache — POST responses are not cached by URL, so a saved pricing
      // change (fare visibility, add-on prices, tip/tax, tier rates)
      // reliably appears on the booking page on the next refresh. A GET
      // `/api/pricing?t=` could be cached and serve the previous values.
      fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ biz: biz ?? '' }),
        cache: 'no-store',
      })
        .then(res => {
          if (!res.ok) throw new Error(`pricing ${res.status}`);
          return res.json();
        })
        .then((data: Partial<PricingSnapshot>) => {
          if (!active) return;
          setPricing({
            ...DEFAULT_PRICING,
            ...data,
            vehicleTiers: data.vehicleTiers && data.vehicleTiers.length ? data.vehicleTiers : DEFAULT_TIERS,
            mapsConfigured: !!data.mapsConfigured,
            squareConfigured: !!data.squareConfigured,
            squareAppId: data.squareAppId ?? '',
            squareLocationId: data.squareLocationId ?? '',
            squareEnvironment: data.squareEnvironment === 'sandbox' ? 'sandbox' : 'production',
            hasSettings: !!data.hasSettings,
            bizId: data.bizId ?? '',
            businessName: data.businessName ?? '',
          });
          setLoaded(true);
          setError(false);
          setLoading(false);
          // Stop any pending recovery poll — we have fresh rates.
          if (recoveryTimer) { window.clearTimeout(recoveryTimer); recoveryTimer = undefined; }
        })
        .catch(() => {
          if (!active) return;
          // Retry up to 5 times with a short backoff so a momentary network
          // failure (e.g. an app reload right after the operator saved new
          // rates) doesn't strand the customer on default pricing.
          if (attempt < 5) {
            timer = window.setTimeout(load, 600 * attempt);
          } else {
            setError(true);
            setLoading(false);
            // Keep retrying in the background on a slow cadence so the booking
            // flow auto-recovers the operator's live rates once the server is
            // reachable again — without requiring the customer to refresh or
            // switch tabs.
            recoveryTimer = window.setTimeout(() => { attempt = 0; load(); }, 8000);
          }
        });
    };

    load();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        attempt = 0;
        if (recoveryTimer) { window.clearTimeout(recoveryTimer); recoveryTimer = undefined; }
        load();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
      if (recoveryTimer) window.clearTimeout(recoveryTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [biz]);

  return { pricing, loading, loaded, error };
}
