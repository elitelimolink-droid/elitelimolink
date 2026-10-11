import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { loadBusinessPricing, normalizeBizId } from '@/lib/business-pricing.server';
import { BookingExperience } from '@/components/home/booking-experience';

const DEFAULT_BUSINESS_NAME = 'ELITELIMOLINK';

/**
 * Resolves the business brand name for the `?biz=<operatorUserId>` booking
 * link so the browser tab and page metadata show the correct location's
 * name. The full pricing snapshot is NOT seeded here: this loader is a GET
 * response, and the platform edge-caches GET responses (overriding the app's
 * Cache-Control) for up to 7 days. Seeding pricing from it would bake a
 * stale snapshot into the server-rendered HTML — customers would see the
 * operator's previous rates until the cache expired, even after the operator
 * saved new prices. Instead the booking flow loads live pricing through the
 * never-cached POST /api/pricing (`usePricing`), so the panel always
 * reflects the operator's current saved rates.
 */
export async function loader({ url }: Route.LoaderArgs) {
  const bizId = normalizeBizId(url.searchParams.get('biz'));
  let businessName = DEFAULT_BUSINESS_NAME;
  try {
    const bp = await loadBusinessPricing(bizId);
    if (bp.businessName) businessName = bp.businessName;
  } catch {
    // fall back to the default brand; live pricing loads client-side
  }
  return { businessName };
}

export function meta({ matches, location, loaderData }: Route.MetaArgs) {
  const businessName = loaderData?.businessName || DEFAULT_BUSINESS_NAME;
  return seo({ matches, location }, {
    title: `${businessName} | Reservations`,
    description: `Request a private ride with ${businessName}. Choose your pickup, date and time, vehicle, and share your details in minutes.`
  });
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  return <BookingExperience initialBusinessName={loaderData.businessName} />;
}
