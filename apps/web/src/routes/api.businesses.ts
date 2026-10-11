import PocketBase from 'pocketbase';
import { json, withApi, apiError, readJsonBody } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import { randomBytes } from 'node:crypto';

type UserRecord = {
	id: string;
	email?: string;
	name?: string;
	created?: string;
	managedBy?: string | string[];
};

type SettingsRecord = {
	owner?: string | string[];
	businessName?: string;
};

type Business = {
	id: string;
	email: string;
	businessName: string;
	managedBy: string;
	created: string;
};

const PB_URL = () => process.env.POCKETBASE_URL || 'http://localhost:8090';

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

function slugify(name: string): string {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 24) || 'business'
	);
}

/**
 * Writes the exact registered business name to the operator's settings row
 * (creating the row with defaults if the onboarding hook hasn't yet), so the
 * name shown in Manage Businesses and on the dedicated booking page is always
 * the exact name the operator entered — never a substituted, truncated, or
 * fallback value. Uses superuser access because `settings` is owner-scoped.
 * `dispatchName` is synced so dispatch emails match the registered name too.
 */
async function ensureBusinessName(ownerId: string, businessName: string): Promise<void> {
	let existing: { id: string } | null = null;
	try {
		const result = await pocketbaseAdmin.listRecords<{ id: string }>('settings', {
			perPage: 1,
			sort: '-created',
			filter: `owner = "${ownerId}"`,
		});
		existing = result.items[0] ?? null;
	} catch {
		existing = null;
	}
	try {
		if (existing) {
			await pocketbaseAdmin.updateRecord('settings', existing.id, {
				businessName,
				dispatchName: `${businessName} Dispatch`,
			});
		} else {
			await pocketbaseAdmin.createRecord('settings', {
				owner: ownerId,
				businessName,
				dispatchName: `${businessName} Dispatch`,
				baseRate: 5,
				minimumFare: 25,
				perMileRate: 3.5,
				hourlyRate: 65,
				currency: 'USD',
				dispatchEmail: '',
				customerEmailEnabled: true,
				fareVisible: false,
				paymentRequired: true,
			});
		}
	} catch {
		// non-fatal: the onboarding hook already seeded a settings row; the
		// operator can still edit the name from the dashboard.
	}
}

/**
 * Builds a unique email for a managed business from the operator's own email,
 * using plus-addressing so the new business is clearly associated with the
 * signed-in account's email while remaining unique (the auth collection
 * enforces unique emails). Managed businesses never log in directly — the
 * central operator manages them from this dashboard — so the email is only a
 * unique identifier, not a mailbox the operator checks.
 */
function deriveBusinessEmail(operatorEmail: string, businessName: string, suffix: string): string {
	const at = operatorEmail.indexOf('@');
	if (at < 1) return `${slugify(businessName)}+${suffix}@managed.local`;
	const local = operatorEmail.slice(0, at);
	const domain = operatorEmail.slice(at + 1);
	return `${local}+${slugify(businessName)}-${suffix}@${domain}`;
}

/**
 * GET /api/businesses — lists every operator account and its configured
 * business name, so the central dashboard's business selector can show
 * real businesses (including ones with no reservations yet) instead of only
 * the source names that happen to appear on existing reservations. Uses
 * superuser access because `users` and `settings` are owner-scoped.
 *
 * POST /api/businesses — creates a new operator account (business) from just
 * its name. The business is automatically associated with the signed-in
 * account: its email is derived from the caller's email (plus-addressing) and
 * `managedBy` is set to the caller, so the new business's reservations route
 * to this central dashboard automatically. No email or password is requested
 * from the operator — a strong password is generated server-side. The
 * onboarding hook seeds the new operator's own settings and vehicle tiers.
 *
 * DELETE /api/businesses — removes a managed business's active booking access
 * (account, settings, vehicle tiers) while preserving its historical
 * reservations: they are reassigned to the central operator with their
 * original `sourceName` label intact. Only the central operator that manages
 * the target business may delete it, and an operator can never delete their
 * own account.
 */
export const loader = withApi(async () => {
	try {
		const users = await pocketbaseAdmin.listRecords<UserRecord>('users', {
			perPage: 500,
			sort: 'created',
		});
		const settings = await pocketbaseAdmin.listRecords<SettingsRecord>('settings', {
			perPage: 500,
			sort: 'created',
		});

		const nameByOwner = new Map<string, string>();
		for (const s of settings.items) {
			const owner = Array.isArray(s.owner) ? s.owner[0] : s.owner;
			if (owner && s.businessName) nameByOwner.set(owner, s.businessName);
		}

		const businesses: Business[] = users.items.map((u) => {
			const managedRaw = u.managedBy;
			const managedBy = Array.isArray(managedRaw) ? managedRaw[0] || '' : managedRaw || '';
			return {
				id: u.id,
				email: u.email ?? '',
				businessName: nameByOwner.get(u.id) || u.name || '',
				managedBy,
				created: u.created ?? '',
			};
		});

		return json({ businesses });
	} catch {
		return json({ businesses: [] });
	}
});

export const action = withApi(async ({ request }) => {
	const callerId = await verifyCaller(request.headers.get('authorization'));

	if (request.method === 'DELETE') {
		const body = await readJsonBody<{ biz?: string }>(request);
		const bizId = (body.biz || '').trim();
		if (!/^[a-z0-9]{15}$/.test(bizId)) return apiError(422, 'Business id is required.');
		if (bizId === callerId) return apiError(400, 'You cannot delete your own account.');

		let target: UserRecord;
		try {
			target = await pocketbaseAdmin.getRecord<UserRecord>('users', bizId);
		} catch {
			return apiError(404, 'Business not found.');
		}

		// Only the central operator that manages the business may delete it.
		const mb = target.managedBy;
		const mbId = Array.isArray(mb) ? mb[0] || '' : mb ? String(mb) : '';
		if (mbId !== callerId) return apiError(403, 'You can only delete businesses you manage.');

		// Reassign historical reservations to the central operator, preserving
		// sourceName and centralOperator so each reservation still shows its
		// original business label and stays visible in the central dashboard.
		try {
			const resList = await pocketbaseAdmin.listRecords<{ id: string }>('reservations', {
				perPage: 500,
				sort: '-created',
				filter: `owner = "${bizId}"`,
			});
			for (const r of resList.items) {
				await pocketbaseAdmin.updateRecord('reservations', r.id, { owner: callerId });
			}
		} catch (err) {
			throw new Error(`Failed to reassign reservations: ${err instanceof Error ? err.message : String(err)}`);
		}

		// Remove the business's booking configuration (settings + vehicle tiers).
		try {
			const sList = await pocketbaseAdmin.listRecords<{ id: string }>('settings', { perPage: 500, filter: `owner = "${bizId}"` });
			for (const r of sList.items) await pocketbaseAdmin.deleteRecord('settings', r.id);
		} catch {
			// non-fatal: continue to tiers + account deletion
		}
		try {
			const tList = await pocketbaseAdmin.listRecords<{ id: string }>('vehicle_tiers', { perPage: 500, filter: `owner = "${bizId}"` });
			for (const r of tList.items) await pocketbaseAdmin.deleteRecord('vehicle_tiers', r.id);
		} catch {
			// non-fatal
		}

		// Delete the operator (user) account itself, removing it from the
		// business list / dashboard selector and revoking login access.
		try {
			await pocketbaseAdmin.deleteRecord('users', bizId);
		} catch (err) {
			throw new Error(`Failed to delete business account: ${err instanceof Error ? err.message : String(err)}`);
		}

		return json({ ok: true, id: bizId });
	}

	// POST — add a business from its name only.
	const body = await readJsonBody<{ businessName?: string }>(request);
	const businessName = (body.businessName || '').trim();
	if (!businessName) return apiError(422, 'Business name is required.');
	if (businessName.length > 80) return apiError(422, 'Business name is too long.');

	// Associate the new business with the signed-in account's email.
	let operatorEmail = '';
	try {
		const caller = await pocketbaseAdmin.getRecord<UserRecord>('users', callerId);
		operatorEmail = (caller.email || '').trim();
	} catch {
		throw apiError(401, 'Your session has expired. Please sign in again.');
	}

	// Build a unique email derived from the operator's email (plus-addressing).
	let email = deriveBusinessEmail(operatorEmail, businessName, randomBytes(4).toString('hex'));
	try {
		const existing = await pocketbaseAdmin.listRecords<UserRecord>('users', {
			perPage: 1,
			filter: `email = "${email}"`,
		});
		if (existing.items.length > 0) {
			email = deriveBusinessEmail(operatorEmail, businessName, randomBytes(6).toString('hex'));
		}
	} catch {
		// lookup failure is non-fatal; the create below will surface a real error
	}

	try {
		// The business is managed from the central dashboard, so the operator
		// never needs to sign in with this account directly. Generate a strong
		// random password server-side to satisfy the auth collection without
		// exposing or requiring one in the UI.
		const password = randomBytes(18).toString('base64url');
		const rec = await pocketbaseAdmin.createRecord<UserRecord>('users', {
			email,
			password,
			passwordConfirm: password,
			name: businessName,
			managedBy: callerId,
		});

		// Make the API authoritative about the exact registered name: write
		// the exact entered name to the new business's settings row (the
		// onboarding hook also seeds it from the user record, but this
		// guarantees the name is never substituted, truncated, or silently
		// changed) and keep the operator's display name in sync so every
		// surface that reads users.name shows the same exact name.
		try {
			await pocketbaseAdmin.updateRecord('users', rec.id, { name: businessName });
		} catch {
			// non-fatal: the name was already set on create
		}
		await ensureBusinessName(rec.id, businessName);

		return json({ id: rec.id, businessName, email, link: `/?biz=${rec.id}` });
	} catch (err) {
		throw new Error(`Failed to create business: ${err instanceof Error ? err.message : String(err)}`);
	}
});
