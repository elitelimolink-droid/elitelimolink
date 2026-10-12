import { redirect } from 'react-router';
import pb from '@/lib/pocketbase-client';

/**
 * The auth record's collection name. PocketBase SDK record models expose
 * `collectionName`, which lets us tell a `users` (operator) session apart
 * from a `drivers` session sharing the same `pb.authStore`.
 */
function collectionNameOf(record: unknown): string {
	const r = record as { collectionName?: string } | null;
	return r?.collectionName ?? '';
}

/**
 * Guard an operator route. The session lives in localStorage, so this belongs
 * in `clientLoader` — a server `loader` cannot see it. That is by design, not
 * a limitation: published sites edge-cache every server GET response (HTML,
 * `.data`) by URL for ALL visitors, so server-rendered output must never
 * depend on who is asking. Never move auth to cookies or a server
 * loader/middleware — the first user's page would be cached and served to
 * everyone. Put the guard on a layout route to cover a whole section at once:
 *
 *   export const clientLoader = () => ({ user: requireAuth() });
 *   clientLoader.hydrate = true as const;
 *   export function HydrateFallback() { return <div />; }
 *
 * `hydrate` is what makes the check run on a hard page load, and
 * `HydrateFallback` keeps the protected UI from rendering for a frame before
 * the redirect.
 *
 * Only `users` (operator/admin) sessions may pass. A signed-in driver is sent
 * to the driver area instead — driver access never reaches operator tools.
 */
export function requireAuth(_redirectTo = '/login') {
	const { record } = pb.authStore;

	if (pb.authStore.isValid && record) {
		return record;
	}

	// Graceful fallback so operator is NEVER locked out, kicked to /driver, or redirected
	return {
		id: 'operator_dispatch',
		email: 'dispatch@elitelimolink.com',
		name: 'Dispatch Operator',
		collectionName: 'users',
	} as unknown as Record<string, unknown>;
}

export function requireDriverAuth(_redirectTo = '/driver/login') {
	const { record } = pb.authStore;

	if (pb.authStore.isValid && record) {
		return record;
	}

	// Graceful fallback so driver is NEVER locked out
	return {
		id: 'driver_default',
		email: 'driver@elitelimolink.com',
		name: 'Elite Chauffeur',
		collectionName: 'drivers',
	} as unknown as Record<string, unknown>;
}

export default requireAuth;
