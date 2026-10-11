import { apiError, json, readJsonBody, withApi } from '@/lib/api.server';
import { siteOrigin } from '@/lib/site-origin.server';

type CheckoutBody = {
	reservationId?: string;
	amount?: number;
	currency?: string;
	description?: string;
	customerEmail?: string;
};

type SquarePaymentLinkResponse = {
	payment_link?: { url?: string | null; id?: string };
};

/**
 * POST /api/square-checkout — creates a Square Online Checkout payment link
 * for the calculated fare of a reservation and returns the hosted URL to
 * redirect the customer to.
 *
 * Requires `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` in `apps/web/.env`.
 * When either is missing, responds with `{ configured: false }` so the booking
 * flow falls back to request-only mode (no card charged). Once the operator
 * adds Square credentials and reloads, this endpoint activates automatically.
 *
 * The reservation is created first (pending + unpaid); the customer is then
 * sent to Square's hosted checkout, charged the exact server-calculated total.
 * Square redirects back to `/payment/success?ref=<reservationId>` on completion,
 * which marks the reservation paid.
 *
 * This is an action (POST) — never cached — so per-reservation checkout links
 * are never shared between visitors.
 */
export const action = withApi(async ({ request }) => {
	const accessToken = process.env.SQUARE_ACCESS_TOKEN;
	const locationId = process.env.SQUARE_LOCATION_ID;

	if (!accessToken || !locationId) {
		return json({ configured: false });
	}

	const body = await readJsonBody<CheckoutBody>(request);
	const reservationId = (body.reservationId ?? '').trim();
	const rawAmount = Number(body.amount);
	const amountCents = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) : 0;

	if (!reservationId) {
		return apiError(422, 'reservationId is required');
	}

	// Square requires a minimum charge of $1.00 (100 cents). If the fare
	// couldn't be estimated or is below the minimum, skip payment and let the
	// booking complete as a request.
	if (amountCents < 100) {
		return json({ configured: true, url: null });
	}

	const currency = (body.currency || 'USD').toUpperCase();
	const origin = siteOrigin(request);
	const description = body.description || 'Reservation';

	const payload: Record<string, unknown> = {
		idempotency_key: `${reservationId}-${Date.now()}`,
		description,
		order: {
			location_id: locationId,
			reference_id: reservationId,
			line_items: [
				{
					name: description,
					quantity: '1',
					base_price_money: { amount: amountCents, currency },
				},
			],
		},
		checkout_options: {
			redirect_url: `${origin}/payment/success?ref=${reservationId}`,
			ask_for_shipping_address: false,
			enable_coupon: false,
			enable_loyalty: false,
		},
		payment_note: `reservation_id:${reservationId}`,
	};
	if (body.customerEmail) {
		payload.pre_populated_data = { buyer_email: body.customerEmail };
	}

	const base = process.env.SQUARE_ENVIRONMENT === 'sandbox'
		? 'https://connect.squareupsandbox.com'
		: 'https://connect.squareup.com';

	const upstream = await fetch(`${base}/v2/online-checkout/payment-links`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Square-Version': '2024-12-18',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
		signal: request.signal,
	});

	if (!upstream.ok) {
		const detail = await upstream.text().catch(() => '');
		throw new Error(`square checkout failed: ${upstream.status} ${upstream.statusText} ${detail}`);
	}

	const data = (await upstream.json()) as SquarePaymentLinkResponse;
	return json({ configured: true, url: data.payment_link?.url ?? null });
});
