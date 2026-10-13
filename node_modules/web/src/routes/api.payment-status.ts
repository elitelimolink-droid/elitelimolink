import { json, withApi } from '@/lib/api.server';
import logger from '@/lib/logger.server';

/**
 * GET /api/payment-status — public, cacheable snapshot of the Square card-
 * payment readiness. Verifies the Square access token and configured location
 * server-side (so the token and account details never reach the browser) and
 * returns only the booleans the dashboard needs to tell the operator whether
 * real cards can be accepted right now.
 *
 * The booking flow charges the customer through Square Online Checkout
 * (`/api/square-checkout`), so whether a real card is charged is decided by the
 * Square credentials in `apps/web/.env`. "Live" means `SQUARE_ACCESS_TOKEN` and
 * `SQUARE_LOCATION_ID` are present AND the location is reachable on the Square
 * account.
 *
 * When Square is not yet configured, the response marks live processing as
 * pending — it never claims real payments are active.
 */
export const loader = withApi(async ({ request }) => {
	const accessToken = process.env.SQUARE_ACCESS_TOKEN;
	const locationId = process.env.SQUARE_LOCATION_ID;
	const appId = process.env.SQUARE_APP_ID;
	const configured = Boolean(accessToken && locationId && appId);

	let paymentsLive = false;

	if (configured) {
		const base = process.env.SQUARE_ENVIRONMENT === 'sandbox'
			? 'https://connect.squareupsandbox.com'
			: 'https://connect.squareup.com';
		try {
			const res = await fetch(`${base}/v2/locations`, {
				headers: { Authorization: `Bearer ${accessToken}` },
				signal: request.signal,
			});
			if (res.ok) {
				const data = (await res.json()) as { locations?: { id?: string }[] };
				const locations = data.locations ?? [];
				// Live only when the configured location actually exists on the
				// Square account — a present-but-invalid token/location is still
				// "needs configuration", never reported as live.
				paymentsLive = locations.some(l => l.id === locationId);
			}
		} catch (err) {
			logger.error('payment-status: square locations check failed', String(err));
		}
	}

	return json(
		{
			paymentsLive,
			squareConfigured: configured,
			needsConfiguration: !paymentsLive,
		},
		{ headers: { 'Cache-Control': 'public, max-age=30' } },
	);
});
