import PocketBase from 'pocketbase';
import { json, withApi, apiError, readJsonBody } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import { DEFAULT_PRICING } from '@/lib/pricing';

/** Clamps the advance-notice setting to the supported 1–24 hour range. */
function clampAdvanceHours(value: unknown): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return DEFAULT_PRICING.minAdvanceHours;
	return Math.min(24, Math.max(1, Math.round(n)));
}

type SettingsRecord = {
	id?: string;
	owner?: string;
	businessName?: string;
	baseRate?: number;
	minimumFare?: number;
	perMileRate?: number;
	hourlyRate?: number;
	currency?: string;
	tipEnabled?: boolean;
	tipPercent?: number;
	taxEnabled?: boolean;
	taxPercent?: number;
	tollsEnabled?: boolean;
	fareVisible?: boolean;
	paymentRequired?: boolean;
	dispatchEmail?: string;
	dispatchName?: string;
	customerEmailEnabled?: boolean;
	carSeatPrice?: number;
	extraStopPrice?: number;
	insidePickupPrice?: number;
	minAdvanceHours?: number;
};

type UserRecord = {
	id: string;
	managedBy?: string | string[];
};

const PB_URL = () => process.env.POCKETBASE_URL || 'http://localhost:8090';

/**
 * Decodes the caller's user id from the JWT payload (without verifying the
 * signature — the signature is checked by the authenticated `getOne` below).
 */
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
 * authenticated user id. The JWT lives in the browser (localStorage), so the
 * server cannot identify the caller from cookies; the client sends it as a
 * Bearer token and we validate it by making an authenticated request to
 * PocketBase (which checks the signature and expiry). Throws a 401 response
 * (control flow) when the token is missing or expired.
 */
async function verifyCaller(authHeader: string | null): Promise<string> {
	if (!authHeader) throw apiError(401, 'Sign in required.');
	const token = authHeader.replace(/^Bearer\s+/i, '').trim();
	if (!token) throw apiError(401, 'Sign in required.');
	const callerId = decodeCallerId(token);
	if (!callerId) throw apiError(401, 'Your session has expired. Please sign in again.');
	const client = new PocketBase(PB_URL());
	client.autoCancellation(false);
	client.authStore.save(token, null);
	try {
		await client.collection('users').getOne(callerId);
		return callerId;
	} catch {
		throw apiError(401, 'Your session has expired. Please sign in again.');
	}
}

function normalizeBizId(raw: string | null | undefined): string {
	const value = (raw ?? '').trim();
	return /^[a-z0-9]{15}$/.test(value) ? value : '';
}

/**
 * Authorizes the caller to manage the target business: they must be the
 * business's own operator OR the central operator that business is linked to
 * via `managedBy`. Preserves access boundaries — a caller can never edit a
 * business they do not own or manage. Throws 403/404 responses otherwise.
 */
async function authorizeTarget(bizId: string, callerId: string): Promise<void> {
	let target: UserRecord;
	try {
		target = await pocketbaseAdmin.getRecord<UserRecord>('users', bizId);
	} catch {
		throw apiError(404, 'Business not found.');
	}
	if (target.id === callerId) return;
	const mb = target.managedBy;
	const mbId = Array.isArray(mb) ? mb[0] || '' : mb ? String(mb) : '';
	if (mbId === callerId) return;
	throw apiError(403, 'You can only edit businesses you own or manage.');
}

/** Loads the target business's settings row (newest by created), or null. */
async function loadSettingsRow(bizId: string): Promise<SettingsRecord | null> {
	try {
		const result = await pocketbaseAdmin.listRecords<SettingsRecord>('settings', {
			perPage: 1,
			sort: '-updated,-created',
			filter: `owner = "${bizId}"`,
		});
		return result.items[0] ?? null;
	} catch {
		return null;
	}
}

function toSettingsPayload(s: Partial<SettingsRecord>) {
	return {
		baseRate: Number(s.baseRate) || 0,
		minimumFare: Number(s.minimumFare) || 0,
		perMileRate: Number(s.perMileRate) || 0,
		hourlyRate: Number(s.hourlyRate) || 0,
		currency: (s.currency || '').trim().toUpperCase() || 'USD',
		tipEnabled: !!s.tipEnabled,
		tipPercent: Number(s.tipPercent) || 0,
		taxEnabled: !!s.taxEnabled,
		taxPercent: Number(s.taxPercent) || 0,
		tollsEnabled: !!s.tollsEnabled,
		fareVisible: !!s.fareVisible,
		paymentRequired: s.paymentRequired !== false,
		businessName: (s.businessName || '').trim(),
		dispatchEmail: (s.dispatchEmail || '').trim(),
		dispatchName: (s.dispatchName || '').trim(),
		customerEmailEnabled: !!s.customerEmailEnabled,
		carSeatPrice: Number(s.carSeatPrice) || 0,
		extraStopPrice: Number(s.extraStopPrice) || 0,
		insidePickupPrice: Number(s.insidePickupPrice) || 0,
		minAdvanceHours: clampAdvanceHours(s.minAdvanceHours),
	};
}

function toSettingsResponse(s: SettingsRecord | null) {
	return {
		id: s?.id ?? '',
		businessName: s?.businessName ?? '',
		baseRate: s?.baseRate ?? DEFAULT_PRICING.baseRate,
		minimumFare: s?.minimumFare ?? DEFAULT_PRICING.minimumFare,
		perMileRate: s?.perMileRate ?? DEFAULT_PRICING.perMileRate,
		hourlyRate: s?.hourlyRate ?? DEFAULT_PRICING.hourlyRate,
		currency: s?.currency ?? DEFAULT_PRICING.currency,
		tipEnabled: !!s?.tipEnabled,
		tipPercent: s?.tipPercent ?? DEFAULT_PRICING.tipPercent,
		taxEnabled: !!s?.taxEnabled,
		taxPercent: s?.taxPercent ?? DEFAULT_PRICING.taxPercent,
		tollsEnabled: !!s?.tollsEnabled,
		fareVisible: !!s?.fareVisible,
		paymentRequired: s?.paymentRequired !== false,
		dispatchEmail: s?.dispatchEmail ?? '',
		dispatchName: s?.dispatchName ?? 'Dispatch',
		customerEmailEnabled: s?.customerEmailEnabled !== false,
		carSeatPrice: s?.carSeatPrice ?? DEFAULT_PRICING.carSeatPrice,
		extraStopPrice: s?.extraStopPrice ?? DEFAULT_PRICING.extraStopPrice,
		insidePickupPrice: s?.insidePickupPrice ?? DEFAULT_PRICING.insidePickupPrice,
		minAdvanceHours: clampAdvanceHours(s?.minAdvanceHours),
		hasSettings: Boolean(s),
	};
}

/**
 * POST /api/business-settings — load or save a business's pricing settings.
 *
 * Body:
 *   { op: 'load', biz }                       → returns the business's settings
 *   { op: 'save', biz, settings: {...} }     → updates (or creates) the
 *                                               settings row and syncs the
 *                                               operator's display name so the
 *                                               new business name appears
 *                                               consistently across the
 *                                               dashboard, booking page, and
 *                                               confirmation emails.
 *
 * The caller is verified via their PocketBase auth token and must own or
 * manage the target business. Booking links (/?biz=<id>) are never changed —
 * only the human-readable business name is edited.
 */
export const action = withApi(async ({ request }) => {
	const callerId = await verifyCaller(request.headers.get('authorization'));
	const body = await readJsonBody<{
		op?: string;
		biz?: string;
		settings?: Partial<SettingsRecord>;
	}>(request);

	const op = (body.op || 'load').toLowerCase();
	const bizId = normalizeBizId(body.biz);
	if (!bizId) return apiError(422, 'Business id is required.');
	await authorizeTarget(bizId, callerId);

	if (op === 'save') {
		const payload = toSettingsPayload(body.settings ?? {});
		const existing = await loadSettingsRow(bizId);
		let saved: SettingsRecord;
		if (existing?.id) {
			saved = await pocketbaseAdmin.updateRecord<SettingsRecord>('settings', existing.id, payload);
		} else {
			saved = await pocketbaseAdmin.createRecord<SettingsRecord>('settings', { ...payload, owner: bizId });
		}

		// Keep the operator's display name in sync with the business name so
		// every surface that reads users.name (e.g. the /api/businesses
		// fallback) shows the current name without a separate edit.
		try {
			await pocketbaseAdmin.updateRecord('users', bizId, { name: payload.businessName });
		} catch {
			// non-fatal: settings are already saved
		}

		return json({ settings: toSettingsResponse(saved) });
	}

	// op === 'load'
	const row = await loadSettingsRow(bizId);
	return json({ settings: toSettingsResponse(row) });
});
