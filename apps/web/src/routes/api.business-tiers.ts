import PocketBase from 'pocketbase';
import { json, withApi, apiError, readJsonBody, readFormData } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import { DEFAULT_TIERS } from '@/lib/pricing';

type TierRecord = {
	id?: string;
	key?: string;
	name?: string;
	detail?: string;
	capacity?: number;
	minFare?: number;
	multiplier?: number;
	perMileRate?: number;
	active?: boolean;
	sort?: number;
	owner?: string;
	photo?: string;
};

type UserRecord = {
	id: string;
	managedBy?: string | string[];
};

const PB_URL = () => process.env.POCKETBASE_URL || 'http://localhost:8090';

// Browser-reachable PocketBase file path. vehicle_tiers is publicly readable,
// so photos load without an auth token.
const PB_PUBLIC_URL = '/hcgi/platform';
const tierPhotoUrl = (id?: string, photo?: string) =>
	id && photo ? `${PB_PUBLIC_URL}/api/files/vehicle_tiers/${id}/${photo}` : '';

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

async function loadTiers(bizId: string): Promise<TierRecord[]> {
	try {
		const result = await pocketbaseAdmin.listRecords<TierRecord>('vehicle_tiers', {
			sort: 'sort',
			perPage: 50,
			filter: `owner = "${bizId}"`,
		});
		return result.items;
	} catch {
		return [];
	}
}

function toTierResponse(t: TierRecord, index: number) {
	return {
		id: t.id ?? '',
		key: t.key ?? DEFAULT_TIERS[index]?.key ?? `tier${index}`,
		name: t.name ?? DEFAULT_TIERS[index]?.name ?? '',
		detail: t.detail ?? '',
		capacity: t.capacity ?? 3,
		minFare: t.minFare ?? 0,
		multiplier: t.multiplier ?? 1,
		perMileRate: t.perMileRate ?? 0,
		active: t.active !== false,
		sort: t.sort ?? index + 1,
		photo: tierPhotoUrl(t.id, t.photo),
	};
}

/**
 * POST /api/business-tiers — load or save a business's vehicle categories.
 *
 * Body:
 *   { op: 'load', biz }                       → returns the business's tiers
 *   { op: 'save', biz, tiers: [...] }         → upserts each tier (create if
 *                                               no id) for that business.
 *   multipart: op=upload-photo, biz, tierId, photo=<file>  → sets a tier's photo
 *   { op: 'remove-photo', biz, tierId }       → clears a tier's photo
 *
 * The caller is verified via their PocketBase auth token and must own or
 * manage the target business.
 */
export const action = withApi(async ({ request }) => {
	const callerId = await verifyCaller(request.headers.get('authorization'));
	const contentType = request.headers.get('content-type') ?? '';

	// Photo uploads arrive as multipart form data (the file can't be JSON).
	if (contentType.includes('multipart/form-data')) {
		const form = await readFormData(request);
		const op = (form.get('op') as string | null)?.toLowerCase() ?? '';
		const bizId = normalizeBizId(form.get('biz') as string | null);
		if (!bizId) return apiError(422, 'Business id is required.');
		await authorizeTarget(bizId, callerId);

		if (op === 'upload-photo') {
			const tierId = normalizeBizId(form.get('tierId') as string | null);
			if (!tierId) return apiError(422, 'Vehicle category id is required.');
			const file = form.get('photo');
			if (!(file instanceof File) || file.size === 0) {
				return apiError(422, 'A photo file is required.');
			}
			// Confirm the tier belongs to this business before writing.
			const existing = await loadTiers(bizId);
			if (!existing.some(t => t.id === tierId)) {
				return apiError(404, 'Vehicle category not found.');
			}
			const fd = new FormData();
			fd.append('photo', file, file.name);
			const updated = await pocketbaseAdmin.updateRecord<TierRecord>('vehicle_tiers', tierId, fd);
			return json({ photo: tierPhotoUrl(updated.id, updated.photo) });
		}

		return apiError(422, 'Unsupported multipart operation.');
	}

	const body = await readJsonBody<{
		op?: string;
		biz?: string;
		tiers?: Partial<TierRecord>[];
		tierId?: string;
	}>(request);

	const op = (body.op || 'load').toLowerCase();
	const bizId = normalizeBizId(body.biz);
	if (!bizId) return apiError(422, 'Business id is required.');
	await authorizeTarget(bizId, callerId);

	if (op === 'remove-photo') {
		const tierId = normalizeBizId(body.tierId);
		if (!tierId) return apiError(422, 'Vehicle category id is required.');
		const existing = await loadTiers(bizId);
		if (!existing.some(t => t.id === tierId)) {
			return apiError(404, 'Vehicle category not found.');
		}
		await pocketbaseAdmin.updateRecord<TierRecord>('vehicle_tiers', tierId, { photo: null });
		return json({ photo: '' });
	}

	if (op === 'save') {
		const incoming = Array.isArray(body.tiers) ? body.tiers : [];
		const existing = await loadTiers(bizId);
		const existingIds = new Set(existing.map(t => t.id).filter(Boolean));
		const saved: TierRecord[] = [];

		for (let i = 0; i < incoming.length; i += 1) {
			const t = incoming[i] ?? {};
			const payload = {
				key: (t.key || '').trim() || DEFAULT_TIERS[i]?.key || `tier${i + 1}`,
				name: (t.name || '').trim() || DEFAULT_TIERS[i]?.name || `Tier ${i + 1}`,
				detail: (t.detail || '').trim(),
				capacity: Number(t.capacity) || 3,
				minFare: Number(t.minFare) || 0,
				multiplier: Number(t.multiplier) || 1,
				perMileRate: Number(t.perMileRate) || 0,
				active: !!t.active,
				sort: i + 1,
				owner: bizId,
			};
			if (t.id && existingIds.has(t.id)) {
				saved.push(await pocketbaseAdmin.updateRecord<TierRecord>('vehicle_tiers', t.id, payload));
			} else {
				saved.push(await pocketbaseAdmin.createRecord<TierRecord>('vehicle_tiers', payload));
			}
		}

		return json({ tiers: saved.map((t, i) => toTierResponse(t, i)) });
	}

	// op === 'load'
	const rows = await loadTiers(bizId);
	const tiers = rows.length > 0 ? rows.map((t, i) => toTierResponse(t, i)) : DEFAULT_TIERS.map((t, i) => toTierResponse(t, i));
	return json({ tiers });
});
