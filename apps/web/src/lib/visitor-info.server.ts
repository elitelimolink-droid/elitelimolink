import ipaddr from 'ipaddr.js';
import logger from '@/lib/logger.server';

/**
 * Server-side visitor context for the activity feed: the requesting IP,
 * a coarse browser/device/OS read off the User-Agent, and an approximate
 * IP-derived location (city / region / country) when one can be obtained
 * reliably.
 *
 * Privacy contract:
 * - NEVER precise GPS. Location is derived only from the visitor's public IP
 *   via a third-party geo-IP service, which resolves to a city/region at best.
 * - NEVER passwords, payment credentials, or form contents — those are not
 *   part of this module and are never captured by the activity tracker.
 * - When location cannot be determined (private/loopback IP, service
 *   unavailable, rate limited), every field is left empty and the feed labels
 *   it "Location unavailable". No location detail is ever invented.
 */

export type GeoInfo = {
	city: string;
	region: string;
	countryName: string;
	countryCode: string;
};

export type VisitorInfo = {
	ip: string;
	browser: string;
	device: string;
	os: string;
	/** Human-readable label, e.g. "Brooklyn, NY, US" or "" when unavailable. */
	location: string;
	city: string;
	region: string;
	countryName: string;
	countryCode: string;
	/** True whenever a location was resolved (it is always approximate). */
	locationApprox: boolean;
};

/** Extracts the visitor's public IP from the proxy-forwarded headers. */
export function visitorIp(request: Request): string {
	const [forwarded] = request.headers.get('x-forwarded-for')?.split(',') ?? [];
	const address = forwarded?.trim() || request.headers.get('x-real-ip')?.trim() || '';
	return address;
}

/** True only for a routable public IPv4/IPv6 address (not loopback/private). */
function isPublicIp(address: string): boolean {
	if (!address) return false;
	try {
		const parsed = ipaddr.parse(address);
		if (parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) {
			return isPublicIp(parsed.toIPv4Address().toString());
		}
		return parsed.range() === 'unicast';
	} catch {
		return false;
	}
}

/**
 * Coarse User-Agent parsing — no dependency, good enough for a feed label.
 * Order matters: Edge and Opera must be checked before Chrome, etc.
 */
export function parseUserAgent(ua: string): { browser: string; device: string; os: string } {
	const u = ua || '';

	let browser = 'Unknown';
	if (/edg\//i.test(u)) browser = 'Edge';
	else if (/opr\/|opera/i.test(u)) browser = 'Opera';
	else if (/chrome|crios/i.test(u)) browser = 'Chrome';
	else if (/firefox|fxios/i.test(u)) browser = 'Firefox';
	else if (/safari/i.test(u)) browser = 'Safari';

	let os = 'Unknown';
	if (/windows nt/i.test(u)) os = 'Windows';
	else if (/iphone|ipad|ipod/i.test(u)) os = 'iOS';
	else if (/mac os x|macintosh/i.test(u)) os = 'macOS';
	else if (/android/i.test(u)) os = 'Android';
	else if (/linux/i.test(u)) os = 'Linux';

	const device = /ipad|tablet|playbook|silk/i.test(u)
		? 'Tablet'
		: /mobile|iphone|ipod|android.*mobile|blackberry|opera mini|windows phone/i.test(u)
			? 'Mobile'
			: 'Desktop';

	return { browser, device, os };
}

const GEO_CACHE = new Map<string, { info: GeoInfo | null; ts: number }>();
const GEO_TTL_MS = 30 * 60 * 1000;
const GEO_TIMEOUT_MS = 2500;

/**
 * Resolves an approximate location for a public IP via a free geo-IP service.
 * Results are cached per IP for 30 minutes so repeated activity pings from the
 * same visitor do not hammer the service. Any failure (private IP, timeout,
 * non-200, malformed body, rate limit) returns null — the feed then labels
 * location as unavailable rather than guessing.
 */
async function geolocate(ip: string): Promise<GeoInfo | null> {
	if (!isPublicIp(ip)) return null;

	const cached = GEO_CACHE.get(ip);
	if (cached && Date.now() - cached.ts < GEO_TTL_MS) return cached.info;

	let info: GeoInfo | null = null;
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
		const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
			signal: controller.signal,
			headers: { Accept: 'application/json' },
		});
		clearTimeout(timer);
		if (res.ok) {
			const data = (await res.json()) as {
				city?: string;
				region?: string;
				country_name?: string;
				country?: string;
				error?: boolean;
			};
			if (!data.error) {
				info = {
					city: (data.city || '').trim(),
					region: (data.region || '').trim(),
					countryName: (data.country_name || '').trim(),
					countryCode: (data.country || '').trim().toUpperCase(),
				};
			}
		}
	} catch (err) {
		// Network/timeout/abort — non-fatal. Location is simply unavailable.
		logger.info(`geo-IP lookup failed for ${ip}: ${err instanceof Error ? err.message : 'unknown'}`);
	}

	GEO_CACHE.set(ip, { info, ts: Date.now() });
	return info;
}

function locationLabel(g: GeoInfo | null): string {
	if (!g) return '';
	const parts = [g.city, g.region, g.countryCode].filter(Boolean);
	return parts.join(', ');
}

/**
 * Builds the full visitor context for a request: IP, parsed User-Agent, and
 * approximate IP-derived location. Safe to call on every activity batch — the
 * geo lookup is cached per IP.
 */
export async function getVisitorInfo(request: Request): Promise<VisitorInfo> {
	const ip = visitorIp(request);
	const { browser, device, os } = parseUserAgent(request.headers.get('user-agent') || '');
	const geo = await geolocate(ip);
	const location = locationLabel(geo);
	return {
		ip,
		browser,
		device,
		os,
		location,
		city: geo?.city ?? '',
		region: geo?.region ?? '',
		countryName: geo?.countryName ?? '',
		countryCode: geo?.countryCode ?? '',
		locationApprox: Boolean(location),
	};
}
