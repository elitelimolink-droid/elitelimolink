import crypto from 'node:crypto';
import { json, withApi } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import { siteOrigin } from '@/lib/site-origin.server';
import logger from '@/lib/logger.server';

type SquareEvent = {
	type?: string;
	data?: {
		object?: {
			reference_id?: string;
			metadata?: { reservation_id?: string };
			id?: string;
			state?: string;
			status?: string;
		};
	};
};

/**
 * POST /api/square-webhook — receives Square webhook events and marks the
 * matching reservation `paid` once a Square order is paid/fulfilled.
 *
 * Verifies the `x-square-h1sha256-signature` header against
 * `SQUARE_WEBHOOK_SIGNATURE_KEY` using Square's signing scheme
 * (base64 HMAC-SHA256 of `notificationUrl + rawBody`). When the signature key
 * is not configured, the endpoint responds gracefully so it can be registered
 * in Square ahead of time and activates once credentials are added to
 * `apps/web/.env`.
 *
 * Register this URL in your Square Developer Dashboard → Webhooks. This is a
 * backup to the success-page completion; the primary mark-paid happens when
 * the customer returns to `/payment/success`.
 */
export const action = withApi(async ({ request }) => {
	const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

	if (!signatureKey) {
		return json({ received: false, message: 'Square webhook not configured' });
	}

	const signature = request.headers.get('x-square-h1sha256-signature') ?? '';
	const rawBody = await request.text();
	const notificationUrl = `${siteOrigin(request)}/api/square-webhook`;

	const expected = crypto
		.createHmac('sha256', signatureKey)
		.update(notificationUrl + rawBody)
		.digest('base64');

	if (expected !== signature) {
		return json({ error: 'signature mismatch' }, { status: 400 });
	}

	let event: SquareEvent;
	try {
		event = JSON.parse(rawBody) as SquareEvent;
	} catch {
		return json({ error: 'invalid payload' }, { status: 400 });
	}

	// Square fires `payment.updated` events throughout the payment lifecycle.
	// With the authorize-and-capture flow, a payment moves AUTHORIZED (hold
	// placed at booking) → COMPLETED (captured by the operator after service).
	// We sync the reservation's payment state to Square's authoritative status:
	//   AUTHORIZED/APPROVED → paid, not captured (hold placed, booking confirmed)
	//   COMPLETED          → paid and captured (funds collected after service)
	// Order events (order.paid / order.fulfilled) from hosted checkout also map
	// to a completed/captured payment. The reservation is never marked captured
	// unless Square reports COMPLETED.
	const obj = event.data?.object;
	const reservationId = obj?.reference_id || obj?.metadata?.reservation_id;
	const paymentStatus = obj?.status || obj?.state;

	if (reservationId && /^[a-z0-9]{15}$/.test(reservationId)) {
		try {
			const isCompleted = paymentStatus === 'COMPLETED' || event.type === 'order.paid' || event.type === 'order.fulfilled';
			const isAuthorized = paymentStatus === 'AUTHORIZED' || paymentStatus === 'APPROVED';
			if (isCompleted) {
				await pocketbaseAdmin.updateRecord('reservations', reservationId, {
					paid: true,
					captured: true,
					status: 'confirmed',
					...(obj?.id ? { squareOrderId: obj.id } : {}),
				});
			} else if (isAuthorized) {
				await pocketbaseAdmin.updateRecord('reservations', reservationId, {
					paid: true,
					captured: false,
					status: 'confirmed',
					...(obj?.id ? { squareOrderId: obj.id } : {}),
				});
			}
		} catch (err) {
			logger.error('square webhook: failed to sync reservation payment state', String(err));
		}
	}

	return json({ received: true });
});
