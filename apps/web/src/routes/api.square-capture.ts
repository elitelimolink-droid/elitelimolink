import PocketBase from 'pocketbase';
import { apiError, json, readJsonBody, withApi } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import logger from '@/lib/logger.server';

type ReservationRecord = {
	id?: string;
	owner?: string | string[];
	centralOperator?: string | string[];
	paid?: boolean;
	captured?: boolean;
	squareOrderId?: string;
	status?: string;
};

type SquareCompleteResponse = {
	payment?: {
		id?: string;
		status?: string;
		card_details?: { status?: string };
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
 * authenticated user id. Only `users` (operator/admin) sessions may capture a
 * payment — a driver or anonymous caller is rejected. Throws a 401 response
 * (control flow) when the token is missing, expired, or not an operator.
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
		// Confirm this is a users (operator) record, not a driver sharing the store.
		if ((rec as { collectionName?: string }).collectionName !== 'users') {
			throw apiError(403, 'Only operators may capture payments.');
		}
		return callerId;
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		throw apiError(401, 'Your session has expired. Please sign in again.');
	}
}

/**
 * POST /api/square-capture — captures (charges) an authorized card payment
 * after the service is completed.
 *
 * The booking flow authorizes a hold on the customer's card at booking time
 * (`/api/square-pay` with `autocomplete: false`). The operator reviews the
 * completed service and captures the hold here. This calls Square's Complete
 * Payment API to collect the authorized funds, and only when Square reports
 * the payment `COMPLETED` does it mark the reservation `captured: true`.
 *
 * Authorization: the caller must be a signed-in operator (`users`) who owns
 * the reservation, is the central operator for it, or manages the owning
 * business. This preserves the existing access boundaries across the central
 * dashboard and business-specific booking systems — an operator can never
 * capture a payment for a reservation they cannot see.
 *
 * An action (POST) — never edge-cached. Never marks a reservation captured
 * without a verified Square capture.
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

	// Access boundary: the caller must own the reservation, be its central
	// operator, or manage the owning business. Mirrors the reservation
	// list/view rules so capture stays within the same access scope.
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
		return apiError(403, 'You can only capture payments for reservations you own or manage.');
	}

	const paymentId = (reservation.squareOrderId ?? '').trim();
	if (!paymentId) {
		return apiError(422, 'This reservation has no authorized payment to capture.');
	}
	if (!reservation.paid) {
		return apiError(422, 'This reservation has not been authorized for payment.');
	}
	if (reservation.captured) {
		// Idempotent — already captured. Re-verify with Square and report success.
		return json({ ok: true, alreadyCaptured: true });
	}

	const base = process.env.SQUARE_ENVIRONMENT === 'sandbox'
		? 'https://connect.squareupsandbox.com'
		: 'https://connect.squareup.com';

	const upstream = await fetch(`${base}/v2/payments/${paymentId}/complete`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Square-Version': '2024-12-18',
			'Content-Type': 'application/json',
		},
		signal: request.signal,
	});

	const data = (await upstream.json().catch(() => ({}))) as SquareCompleteResponse;

	if (!upstream.ok) {
		const first = data.errors?.[0];
		const code = first?.code ?? 'CAPTURE_FAILED';
		logger.error('square-capture: capture rejected', `${upstream.status} ${code}`);
		return json({ ok: false, declined: true, code, message: captureErrorMessage(code, first?.detail) });
	}

	const status = data.payment?.status;
	// Only a COMPLETED payment is a successful capture. Square returns COMPLETED
	// once the authorized hold is collected. Any other status leaves the
	// reservation authorized-but-not-captured — the operator can retry.
	if (status !== 'COMPLETED') {
		logger.error('square-capture: payment not completed after capture', `status=${status ?? 'unknown'}`);
		return json({
			ok: false,
			declined: true,
			code: 'NOT_COMPLETED',
			message: 'The payment could not be captured yet. Please try again shortly.',
		});
	}

	try {
		await pocketbaseAdmin.updateRecord('reservations', id, {
			captured: true,
			paid: true,
		});
	} catch (err) {
		logger.error('square-capture: failed to mark reservation captured', String(err));
		throw err;
	}

	logger.info('square-capture: reservation payment captured', id);
	return json({ ok: true, captured: true });
});

/** Maps Square capture error codes to operator-friendly text. */
function captureErrorMessage(code: string, detail?: string): string {
	switch (code) {
		case 'PAYMENT_NOT_AUTHORIZED':
			return 'The payment authorization has expired or was voided. The customer must rebook.';
		case 'REQUEST_TIMEOUT':
		case 'INTERNAL_SERVER_ERROR':
			return 'Square could not complete the capture right now. Please try again.';
		case 'NOT_FOUND':
			return 'The authorized payment could not be found in Square. It may have been voided.';
		default:
			return detail
				? 'The payment could not be captured. Please try again or contact Square support.'
				: 'The payment could not be captured. Please try again.';
	}
}
