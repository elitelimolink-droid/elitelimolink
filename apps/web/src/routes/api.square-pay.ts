import { apiError, json, readJsonBody, withApi } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import logger from '@/lib/logger.server';

type PayBody = {
	reservationId?: string;
	amount?: number;
	currency?: string;
	sourceId?: string;
};

type SquarePaymentResponse = {
	payment?: {
		id?: string;
		status?: string;
		card_details?: { status?: string; avs_status?: string; cvv_status?: string };
	};
	errors?: { code?: string; detail?: string; field?: string }[];
};

/**
 * POST /api/square-pay — charges a customer's card through Square's Web
 * Payments SDK and confirms the reservation only after Square reports the
 * payment COMPLETED.
 *
 * The customer enters their card into Square's secure iframe in the booking
 * flow; the SDK tokenizes it and sends only the token (`sourceId`) here. Raw
 * card numbers never touch this site or its server. This endpoint uses the
 * secret `SQUARE_ACCESS_TOKEN` to create a payment for the exact
 * server-calculated fare with `autocomplete: false` — Square AUTHORIZES a hold
 * on the card (funds reserved but not yet collected). The reservation is
 * marked `paid: true` + `confirmed` with `captured: false` only when Square
 * reports the payment AUTHORIZED. The operator later captures the authorized
 * payment from the dashboard/dispatch through `/api/square-capture` once the
 * service is completed; Square then moves the payment to COMPLETED and the
 * reservation is marked `captured: true`. A declined, incomplete, or failed
 * authorization never confirms a reservation.
 *
 * An action (POST) — never edge-cached — so per-reservation payments are
 * never shared between visitors. The reservation id is an unguessable
 * 15-character key, so only the customer who created it (or the operator)
 * can charge it.
 */
export const action = withApi(async ({ request }) => {
	const accessToken = process.env.SQUARE_ACCESS_TOKEN;
	const locationId = process.env.SQUARE_LOCATION_ID;

	// Square cannot process a payment without the secret access token and a
	// location. Tell the caller setup is still needed — never charge a card
	// with placeholder credentials.
	if (!accessToken || !locationId) {
		return json({ ok: false, needsConfiguration: true });
	}

	const body = await readJsonBody<PayBody>(request);
	const reservationId = (body.reservationId ?? '').trim();
	const sourceId = (body.sourceId ?? '').trim();
	const rawAmount = Number(body.amount);

	if (!/^[a-z0-9]{15}$/.test(reservationId)) {
		return apiError(422, 'a valid reservation reference is required');
	}
	if (!sourceId) {
		return apiError(422, 'a card token (sourceId) is required');
	}

	const amountCents = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) : 0;
	// Square requires a minimum charge of $1.00 (100 cents).
	if (amountCents < 100) {
		return apiError(422, 'the fare is below the minimum chargeable amount');
	}

	const currency = (body.currency || 'USD').toUpperCase();
	const base = process.env.SQUARE_ENVIRONMENT === 'sandbox'
		? 'https://connect.squareupsandbox.com'
		: 'https://connect.squareup.com';

	const upstream = await fetch(`${base}/v2/payments`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Square-Version': '2024-12-18',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			source_id: sourceId,
			idempotency_key: `${reservationId}-${Date.now()}`,
			amount_money: { amount: amountCents, currency },
			location_id: locationId,
			reference_id: reservationId,
			// Authorize a hold only — do not capture (charge) immediately. The
			// operator captures the authorized payment after the service is
			// completed via /api/square-capture.
			autocomplete: false,
			note: `reservation_id:${reservationId}`,
		}),
		signal: request.signal,
	});

	const data = (await upstream.json().catch(() => ({}))) as SquarePaymentResponse;

	// Square returns 4xx for declines / validation errors with an errors array.
	if (!upstream.ok) {
		const first = data.errors?.[0];
		const code = first?.code ?? 'CARD_DECLINED';
		// Map common Square decline codes to customer-friendly text. Never
		// expose the raw token or account details — only a readable reason.
		const detail = friendlyCardError(code, first?.detail);
		logger.error('square-pay: payment rejected', `${upstream.status} ${code}`);
		return json({ ok: false, declined: true, code, message: detail });
	}

	const status = data.payment?.status;
	const paymentId = data.payment?.id;

	// An AUTHORIZED payment is a successful hold — the card was verified and
	// the fare is reserved. The reservation is confirmed (booking accepted) and
	// marked `paid: true` with `captured: false`; the operator captures the
	// hold after the service is completed. A PENDING/APPROVED state is treated
	// as authorized for confirmation purposes (Square returns APPROVED then
	// AUTHORIZED for card holds). Any other status is a failure — the booking
	// is not accepted and the customer is not charged.
	const authorized = status === 'AUTHORIZED' || status === 'APPROVED';
	if (!authorized) {
		logger.error('square-pay: payment not authorized', `status=${status ?? 'unknown'}`);
		return json({
			ok: false,
			declined: true,
			code: 'NOT_AUTHORIZED',
			message: 'Your card could not be authorized. Please check your details or try a different card.',
		});
	}

	try {
		await pocketbaseAdmin.updateRecord('reservations', reservationId, {
			paid: true,
			captured: false,
			status: 'confirmed',
			...(paymentId ? { squareOrderId: paymentId } : {}),
		});
	} catch (err) {
		const status2 = (err as { status?: number } | null)?.status;
		if (status2 === 404) {
			return apiError(404, 'reservation not found');
		}
		logger.error('square-pay: failed to mark reservation paid', String(err));
		throw err;
	}

	logger.info('square-pay: reservation authorized (hold placed)', reservationId);
	return json({ ok: true, authorized: true });
});

/** Maps Square decline/error codes to customer-friendly, non-sensitive text. */
function friendlyCardError(code: string, detail?: string): string {
	switch (code) {
		case 'CARD_DECLINED':
		case 'CARD_DECLINED_CALL_ISSUER':
		case 'CARD_DECLINED_INSUFFICIENT_FUNDS':
		case 'CARD_DECLINED_INCORRECT_CVV':
		case 'CARD_DECLINED_EXPIRED':
		case 'CARD_DECLINED_INVALID_PIN':
			return 'Your card was declined. Please check your details or try a different card.';
		case 'INVALID_PIN':
		case 'INSUFFICIENT_FUNDS':
			return 'Your card was declined. Please try a different card.';
		case 'EXPIRED_CARD':
			return 'Your card has expired. Please try a different card.';
		case 'INVALID_POSTAL_CODE':
			return 'The postal code doesn\'t match. Please check your details and try again.';
		case 'CARD_TOKEN_ALREADY_USED':
		case 'IDEMPOTENCY_KEY_REUSED':
			return 'This payment was already processed. Please start a new booking.';
		case 'INVALID_CARD_DATA':
			return 'The card details couldn\'t be read. Please re-enter your card information.';
		default:
			return detail
				? 'We couldn\'t process your payment. Please try a different card.'
				: 'We couldn\'t process your payment. Please try again or use a different card.';
	}
}
