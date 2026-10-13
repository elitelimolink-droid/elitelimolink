import { apiError, json, readJsonBody, withApi } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import logger from '@/lib/logger.server';

/**
 * POST /api/payment-abandon — deletes an unpaid, pending reservation that was
 * created on the way to Square hosted checkout but never completed payment.
 *
 * Called from the booking flow when checkout could not start (Square not
 * configured or a transient failure) and from the payment cancel page when the
 * customer abandons checkout. This guarantees that no reservation is accepted
 * without a completed payment: an abandoned or failed required-payment booking
 * leaves no record behind.
 *
 * Never deletes an already-paid reservation (the customer may have paid then
 * landed here by mistake, or the webhook already confirmed). The reservation id
 * is an unguessable 15-character random key, so only someone who held that
 * reservation (or the operator) can abandon it. An action (POST) — never cached.
 */
export const action = withApi(async ({ request }) => {
	const { ref } = await readJsonBody<{ ref?: string }>(request);
	const id = (ref ?? '').trim();

	if (!/^[a-z0-9]{15}$/.test(id)) {
		return apiError(422, 'a valid reservation reference is required');
	}

	try {
		const reservation = await pocketbaseAdmin.getRecord<{ paid?: boolean; status?: string }>(
			'reservations',
			id,
		);

		// A paid reservation must never be deleted — it represents a real charge.
		if (reservation?.paid) {
			return json({ ok: true, alreadyPaid: true });
		}

		await pocketbaseAdmin.deleteRecord('reservations', id);
	} catch (err) {
		const status = (err as { status?: number } | null)?.status;
		if (status === 404) {
			// Already gone (e.g. a previous abandon call) — nothing to clean up.
			return json({ ok: true, notFound: true });
		}
		logger.error('payment-abandon: failed to delete pending reservation', String(err));
		throw err;
	}

	logger.info('payment-abandon: deleted unpaid pending reservation', id);
	return json({ ok: true });
});
