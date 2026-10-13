import { apiError, json, readJsonBody, withApi } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import logger from '@/lib/logger.server';

type SquareOrder = {
	id?: string;
	state?: string;
	reference_id?: string;
	total_money?: { amount?: number; currency?: string };
};
type SquareSearchResponse = { orders?: SquareOrder[] };

/**
 * Verifies with Square (server-side) that an order paid through hosted
 * checkout exists for this reservation and is COMPLETED. The reservation is
 * only confirmed once Square itself reports the payment — the customer's
 * arrival on the success page alone is never enough.
 *
 * Returns `configured: false` when Square credentials are missing, so the
 * caller can tell the customer verification is unavailable (and the operator
 * is told setup is still needed) instead of falsely confirming.
 */
async function verifySquarePayment(
	reservationId: string,
): Promise<{ verified: boolean; configured: boolean; orderId?: string }> {
	const accessToken = process.env.SQUARE_ACCESS_TOKEN;
	const locationId = process.env.SQUARE_LOCATION_ID;

	if (!accessToken || !locationId) {
		return { verified: false, configured: false };
	}

	const base = process.env.SQUARE_ENVIRONMENT === 'sandbox'
		? 'https://connect.squareupsandbox.com'
		: 'https://connect.squareup.com';

	try {
		const res = await fetch(`${base}/v2/orders/search`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Square-Version': '2024-12-18',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				location_ids: [locationId],
				query: {
					filter: {
						reference_ids: { reference_ids: [reservationId] },
						state_filter: { states: ['COMPLETED'] },
					},
				},
			}),
		});

		if (!res.ok) {
			logger.error('payment-complete: square order search failed', `${res.status} ${res.statusText}`);
			return { verified: false, configured: true };
		}

		const data = (await res.json()) as SquareSearchResponse;
		const orders = data.orders ?? [];
		if (orders.length > 0) {
			return { verified: true, configured: true, orderId: orders[0].id };
		}
		return { verified: false, configured: true };
	} catch (err) {
		logger.error('payment-complete: square order search failed', String(err));
		return { verified: false, configured: true };
	}
}

/**
 * POST /api/payment-complete — called by the payment success page after the
 * customer returns from hosted checkout. Verifies with Square that the order
 * for this reservation was actually paid, and only then marks the reservation
 * `paid` and `confirmed`. The reservation id is an unguessable 15-character
 * random key (the capability token); only someone who completed checkout for
 * that reservation (or the operator) knows it. Idempotent — confirming an
 * already-paid reservation re-verifies and is a no-op.
 *
 * An action (POST) so it is never edge-cached. Never confirms a reservation
 * without a verified Square payment.
 */
export const action = withApi(async ({ request }) => {
	const { ref } = await readJsonBody<{ ref?: string }>(request);
	const id = (ref ?? '').trim();

	if (!/^[a-z0-9]{15}$/.test(id)) {
		return apiError(422, 'a valid reservation reference is required');
	}

	const { verified, configured, orderId } = await verifySquarePayment(id);

	if (!configured) {
		// Square credentials are missing — we cannot verify any payment, so the
		// reservation must NOT be confirmed. Tell the caller setup is needed.
		return json({ ok: false, needsConfiguration: true });
	}

	if (!verified) {
		// Square has not (yet) reported a completed payment for this reservation.
		// Leave it pending and unpaid; the webhook (or a later retry) will
		// confirm it once the payment actually settles. Never confirm on faith.
		return json({ ok: false, pending: true });
	}

	try {
		await pocketbaseAdmin.updateRecord('reservations', id, {
			paid: true,
			captured: true,
			status: 'confirmed',
			...(orderId ? { squareOrderId: orderId } : {}),
		});
	} catch (err) {
		const status = (err as { status?: number } | null)?.status;
		if (status === 404) {
			return apiError(404, 'reservation not found');
		}
		logger.error('payment-complete: failed to mark reservation paid', String(err));
		throw err;
	}

	logger.info('payment-complete: reservation verified and marked paid', id);
	return json({ ok: true });
});
