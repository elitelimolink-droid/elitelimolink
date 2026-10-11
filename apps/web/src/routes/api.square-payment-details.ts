import PocketBase from 'pocketbase';
import { apiError, json, readJsonBody, withApi } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import logger from '@/lib/logger.server';

type ReservationRecord = {
	owner?: string | string[];
	centralOperator?: string | string[];
	paid?: boolean;
	captured?: boolean;
	squareOrderId?: string;
	status?: string;
	estimatedFare?: number;
	subtotal?: number;
	tollAmount?: number;
	tipAmount?: number;
	taxAmount?: number;
};

type SquarePaymentResponse = {
	payment?: {
		id?: string;
		status?: string;
		amount_money?: { amount?: number; currency?: string };
		card_details?: {
			status?: string;
			card?: { card_brand?: string; last_4?: string; card_type?: string };
		};
	};
	errors?: { code?: string; detail?: string }[];
};

const PB_URL = () => process.env.POCKETBASE_URL || 'http://localhost:8090';

/** Decodes the caller's user id from the JWT payload (signature verified below). */
function decodeCallerId(token: string): string {
	try {
		const parts = token.split('.');
		if (parts.length < 2) return '';
		const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { id?: string };
		return typeof payload.id === 'string' ? payload.id : '';
	} catch {
		return '';
	}
}

/**
 * Verifies the caller's PocketBase auth token server-side and returns the
 * authenticated user id. Only `users` (operator/admin) sessions may view
 * payment details. Throws a 401 response when the token is missing, expired,
 * or not an operator.
 */
async function verifyOperator(authHeader: string | null): Promise<string> {
	if (!authHeader) throw apiError(401, 'Sign in required.');
	const token = authHeader.replace(/^Bearer\s+/i, '').trim();
	if (!token) throw apiError(401, 'Sign in required.');
	const callerId = decodeCallerId(token);
	if (!callerId) throw apiError(401, 'Your session has expired. Please sign in again.');
	const client = new PocketBase(PB_URL());
	client.autoCancellation(false);
	client.authStore.save(token, null);
	try {
		const rec = await client.collection('users').getOne(callerId);
		if ((rec as { collectionName?: string }).collectionName !== 'users') {
			throw apiError(403, 'Only operators may view payment details.');
		}
		return callerId;
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		throw apiError(401, 'Your session has expired. Please sign in again.');
	}
}

/**
 * POST /api/square-payment-details — fetches safe, non-sensitive payment
 * details for a reservation from Square.
 *
 * Returns only what an operator needs to identify and reconcile a payment:
 * the Square payment id, the payment status (AUTHORIZED / COMPLETED / etc.),
 * the authorized amount, and — when Square provides them — the card brand
 * and last four digits. Raw card numbers, security codes, and tokens are
 * NEVER returned; Square does not expose them through this API and we do not
 * store them anywhere.
 *
 * Authorization: the caller must be a signed-in operator (`users`) who owns
 * the reservation, is the central operator for it, or manages the owning
 * business — the same access boundary as capture. An action (POST) so it is
 * never edge-cached and per-reservation payment data is never shared.
 *
 * When Square is not configured (`SQUARE_ACCESS_TOKEN` missing), the endpoint
 * reports `needsConfiguration: true` so the operator UI can show the payment
 * section and status while keeping charge actions safely unavailable.
 */
export const action = withApi(async ({ request }) => {
	const accessToken = process.env.SQUARE_ACCESS_TOKEN;

	if (!accessToken) {
		return json({ ok: false, needsConfiguration: true });
	}

	const callerId = await verifyOperator(request.headers.get('authorization'));
	const { ref } = await readJsonBody<{ ref?: string }>(request);
	const id = (ref ?? '').trim();

	if (!/^[a-z0-9]{15}$/.test(id)) {
		return apiError(422, 'a valid reservation reference is required');
	}

	let reservation: ReservationRecord;
	try {
		reservation = await pocketbaseAdmin.getRecord<ReservationRecord>('reservations', id);
	} catch {
		return apiError(404, 'reservation not found');
	}

	// Access boundary: owner, central operator, or manager of the owning business.
	const ownerRaw = reservation.owner;
	const ownerId = Array.isArray(ownerRaw) ? ownerRaw[0] || '' : ownerRaw ? String(ownerRaw) : '';
	const centralRaw = reservation.centralOperator;
	const centralId = Array.isArray(centralRaw) ? centralRaw[0] || '' : centralRaw ? String(centralRaw) : '';

	let authorized = ownerId === callerId || centralId === callerId;
	if (!authorized && ownerId) {
		try {
			const ownerRec = await pocketbaseAdmin.getRecord<{ managedBy?: string | string[] }>('users', ownerId);
			const mb = ownerRec.managedBy;
			const mbId = Array.isArray(mb) ? mb[0] || '' : mb ? String(mb) : '';
			if (mbId === callerId) authorized = true;
		} catch {
			// owner lookup failed — fall through to denial
		}
	}
	if (!authorized) {
		return apiError(403, 'You can only view payments for reservations you own or manage.');
	}

	const paymentId = (reservation.squareOrderId ?? '').trim();

	// No Square payment id on the reservation — there is nothing to look up.
	// Report the reservation's local payment state so the UI can render it.
	if (!paymentId) {
		return json({
			ok: true,
			paid: !!reservation.paid,
			captured: !!reservation.captured,
			paymentId: '',
			status: reservation.paid ? (reservation.captured ? 'COMPLETED' : 'AUTHORIZED') : 'NONE',
			amount: null,
			currency: null,
			cardBrand: null,
			last4: null,
		});
	}

	const base = process.env.SQUARE_ENVIRONMENT === 'sandbox'
		? 'https://connect.squareupsandbox.com'
		: 'https://connect.squareup.com';

	const upstream = await fetch(`${base}/v2/payments/${paymentId}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Square-Version': '2024-12-18',
		},
		signal: request.signal,
	});

	const data = (await upstream.json().catch(() => ({}))) as SquarePaymentResponse;

	if (!upstream.ok) {
		const first = data.errors?.[0];
		logger.error('square-payment-details: lookup failed', `${upstream.status} ${first?.code ?? 'unknown'}`);
		// Surface a safe, non-sensitive failure so the UI can show the local
		// state without exposing Square internals.
		return json({
			ok: false,
			lookupFailed: true,
			paid: !!reservation.paid,
			captured: !!reservation.captured,
			paymentId,
			status: reservation.paid ? (reservation.captured ? 'COMPLETED' : 'AUTHORIZED') : 'NONE',
			amount: null,
			currency: null,
			cardBrand: null,
			last4: null,
			message: 'Square could not return payment details right now. The local payment status is shown instead.',
		});
	}

	const payment = data.payment;
	const amount = payment?.amount_money?.amount ?? null;
	const currency = payment?.amount_money?.currency ?? null;
	const card = payment?.card_details?.card;
	const status = payment?.status ?? '';

	// Reconcile the reservation's captured flag with Square's authoritative
	// status so the operator always sees the true payment state. A COMPLETED
	// Square payment means the hold was captured.
	if (status === 'COMPLETED' && !reservation.captured) {
		try {
			await pocketbaseAdmin.updateRecord('reservations', id, { captured: true, paid: true });
		} catch (err) {
			logger.error('square-payment-details: failed to sync captured flag', String(err));
		}
	}

	return json({
		ok: true,
		paid: !!reservation.paid || status === 'AUTHORIZED' || status === 'APPROVED' || status === 'COMPLETED',
		captured: !!reservation.captured || status === 'COMPLETED',
		paymentId: payment?.id ?? paymentId,
		status,
		amount,
		currency,
		// Only the brand and last four — never the full PAN or CVV.
		cardBrand: card?.card_brand ?? null,
		last4: card?.last_4 ?? null,
	});
});
