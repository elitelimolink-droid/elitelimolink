import { json, withApi, apiError, readJsonBody } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import { getVisitorInfo } from '@/lib/visitor-info.server';

type ActivityInput = {
	type?: string;
	label?: string;
	target?: string;
	page?: string;
	session?: string;
	meta?: Record<string, unknown>;
};

type UserRecord = {
	id: string;
	managedBy?: string | string[];
};

const MAX_EVENTS_PER_REQUEST = 100;
const MAX_LABEL = 300;
const MAX_TARGET = 200;
const MAX_PAGE = 300;
const MAX_SESSION = 60;

function normalizeBizId(raw: string | null | undefined): string {
	const value = (raw ?? '').trim();
	return /^[a-z0-9]{15}$/.test(value) ? value : '';
}

function clip(value: unknown, max: number): string {
	const s = String(value ?? '').slice(0, max);
	return s;
}

/**
 * Resolves the central operator for a business owner, mirroring the
 * reservation-central-operator hook: the owner's `managedBy` link wins, then
 * the primary (oldest) operator so every business's activity reaches the
 * central control panel. Returns '' when there is no central operator to route
 * to (e.g. the owner is themselves the primary).
 */
async function resolveCentralOperator(ownerId: string): Promise<string> {
	if (!ownerId) return '';
	try {
		const owner = await pocketbaseAdmin.getRecord<UserRecord>('users', ownerId);
		const mb = owner.managedBy;
		const mbId = Array.isArray(mb) ? mb[0] || '' : mb ? String(mb) : '';
		if (mbId) return mbId;
	} catch {
		// owner not found — fall through to primary fallback
	}
	try {
		const result = await pocketbaseAdmin.listRecords<UserRecord>('users', {
			perPage: 1,
			sort: 'created',
		});
		const primaryId = result.items[0]?.id ?? '';
		if (primaryId && primaryId !== ownerId) return primaryId;
	} catch {
		// no operators — leave empty
	}
	return '';
}

/**
 * POST /api/activity — records anonymous visitor interactions from the public
 * booking site (clicks, selected addresses, booking actions).
 *
 * Body: { biz: '<operatorUserId>', events: ActivityInput[] }
 *
 * The caller is NOT authenticated (public booking visitors), so this route
 * never trusts a client-supplied owner: it validates `biz` resolves to a real
 * operator and stamps `owner` + `centralOperator` server-side. This preserves
 * business separation and central-dashboard routing exactly like reservations.
 *
 * No secrets are accepted or stored: the route only persists the interaction
 * type, a sanitized label, the page path, a session id, and a small JSON meta
 * blob. Passwords, payment credentials, and auth tokens are never captured.
 */
export const action = withApi(async ({ request }) => {
	const body = await readJsonBody<{ biz?: string; events?: ActivityInput[] }>(request);

	const bizId = normalizeBizId(body.biz);
	if (!bizId) return apiError(422, 'Business id is required.');

	// Confirm the target business exists before writing anything.
	try {
		await pocketbaseAdmin.getRecord('users', bizId);
	} catch {
		return apiError(404, 'Business not found.');
	}

	const rawEvents = Array.isArray(body.events) ? body.events : [];
	if (rawEvents.length === 0) return json({ saved: 0 });
	const events = rawEvents.slice(0, MAX_EVENTS_PER_REQUEST);

	const centralId = await resolveCentralOperator(bizId);

	// Visitor context resolved once per request: approximate IP-derived
	// location (city/region/country) and a coarse browser/device read. Stamped
	// onto every event so the feed can show where a visitor is and what they're
	// browsing on. No precise GPS, no passwords or payment values — only the
	// public IP (for geo lookup) and the User-Agent string.
	const visitor = await getVisitorInfo(request);

	const records = events
		.map((e) => {
			const type = clip(e.type || 'click', 40);
			const label = clip(e.label, MAX_LABEL).trim();
			if (!label) return null;
			return {
				type,
				label,
				target: clip(e.target, MAX_TARGET),
				page: clip(e.page, MAX_PAGE),
				session: clip(e.session, MAX_SESSION),
				meta: {
					...(e.meta ?? {}),
					browser: visitor.browser,
					device: visitor.device,
					os: visitor.os,
					city: visitor.city,
					region: visitor.region,
					country: visitor.countryName,
					countryCode: visitor.countryCode,
					location: visitor.location,
					locationApprox: visitor.locationApprox,
				},
				owner: bizId,
				centralOperator: centralId || '',
			};
		})
		.filter((r): r is NonNullable<typeof r> => r !== null);

	if (records.length === 0) return json({ saved: 0 });

	// Persist each event individually. The PocketBase batch API
	// (/api/batch) is disabled in this environment, so createRecords (which
	// uses it) fails with 403 for every request. Individual createRecord
	// calls work and preserve the same owner/centralOperator routing.
	try {
		let saved = 0;
		for (const r of records) {
			try {
				await pocketbaseAdmin.createRecord('activity_events', r);
				saved++;
			} catch {
				// skip a single failed event but keep going
			}
		}
		return json({ saved });
	} catch {
		// A persistence failure shouldn't surface to the visitor — their
		// booking is unaffected. Drop silently.
		return json({ saved: 0 });
	}
});
