import { useEffect, useState } from 'react';
import pb from '@/lib/pocketbase-client';
import { DEFAULT_TIERS, type VehicleTier } from '@/lib/pricing';

type TierRecord = {
  key?: string;
  name?: string;
  detail?: string;
  capacity?: number;
  minFare?: number;
  multiplier?: number;
  perMileRate?: number;
  active?: boolean;
  sort?: number;
};

/**
 * Loads the signed-in operator's own vehicle tiers straight from PocketBase.
 * Used by operator-facing surfaces (dispatch center, reservation editor,
 * recent list) so vehicle labels match the operator's customized tier names.
 * The owner-scoped collection rules guarantee each operator only ever sees
 * their own categories — never another business's.
 */
export function useVehicleTiers(): VehicleTier[] {
  const [tiers, setTiers] = useState<VehicleTier[]>(DEFAULT_TIERS);
  useEffect(() => {
    let active = true;
    pb.collection('vehicle_tiers')
      .getFullList<TierRecord>({ sort: 'sort', requestKey: null })
      .then(rows => {
        if (!active || !rows.length) return;
        const mapped = rows
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
          }));
        if (mapped.length) setTiers(mapped);
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      active = false;
    };
  }, []);
  return tiers;
}

/** Returns a `key -> display name` lookup backed by the live tier config. */
export function useVehicleTierName() {
  const tiers = useVehicleTiers();
  return (key: string) => tiers.find(t => t.key === key)?.name ?? key;
}
