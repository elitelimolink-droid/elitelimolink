import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { loadBusinessPricing, resolveBusinessId } from '@/lib/business-pricing.server';
import { BookingExperience } from '@/components/home/booking-experience';

const DEFAULT_BUSINESS_NAME = 'ELITELIMOLINK';

/**
 * Resolves the business brand and settings for the requested booking page.
 * Supports:
 *  - Custom domains (e.g. teterborocarservice.online -> Teterboro Airport Car Service)
 *  - Direct path slugs (e.g. /teterboro-airport-car-service)
 *  - Traditional query parameter (?biz=...)
 *  - Root domain fallback (elitelimolink.com -> ELITELIMOLINK)
 */
export async function loader({ request, url, params }: Route.LoaderArgs) {
  const host = request.headers.get('host') || '';
  const searchBiz = url.searchParams.get('biz');
  const slug = (params as Record<string, string | undefined>)?.bizSlug;

  // Filter out any known static paths that aren't business slugs
  if (slug && ['login', 'dashboard', 'dispatch', 'driver', 'api', 'payment', 'robots.txt', 'sitemap.xml', 'favicon.ico', 'assets', 'images'].includes(slug.toLowerCase())) {
    throw new Response('Not Found', { status: 404 });
  }

  const bizId = await resolveBusinessId(slug || searchBiz, host);
  let businessName = DEFAULT_BUSINESS_NAME;
  try {
    const bp = await loadBusinessPricing(bizId);
    if (bp.businessName) businessName = bp.businessName;
  } catch {
    // fall back to default brand
  }

  // If an explicit path slug was requested, ensure it actually matches the business
  if (slug) {
    const slugNorm = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const nameNorm = (businessName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const isIdMatch = bizId.toLowerCase() === slugNorm;
    const isNameMatch = nameNorm === slugNorm || nameNorm.includes(slugNorm) || slugNorm.includes(nameNorm);
    if (!isIdMatch && !isNameMatch) {
      throw new Response('Not Found', { status: 404 });
    }
  }

  return { businessName, bizId };
}

export function meta({ matches, location, loaderData }: Route.MetaArgs) {
  const businessName = loaderData?.businessName || DEFAULT_BUSINESS_NAME;
  return seo({ matches, location }, {
    title: `${businessName} | Reservations`,
    description: `Request a private ride with ${businessName}. Choose your pickup, date and time, vehicle, and share your details in minutes.`
  });
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  return <BookingExperience initialBusinessName={loaderData?.businessName} initialBizId={loaderData?.bizId} />;
}
