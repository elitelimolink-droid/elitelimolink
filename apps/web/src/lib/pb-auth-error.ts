import pb from '@/lib/pocketbase-client';

/**
 * Detect a stale/invalid PocketBase session from a thrown `ClientResponseError`.
 *
 * The operator's JWT lives in `localStorage`, so `pb.authStore.isValid` can
 * still report `true` locally after the server has invalidated the token
 * (e.g. when the operator credentials were rotated by a migration, which
 * changes the user's `tokenKey`). On the next request the server can't
 * resolve `@request.auth`, so any auth-scoped collection rule that references
 * it fails. Two shapes surface that:
 *
 *  - 401 / 403 — explicit auth denial (rare for rule failures, but possible).
 *  - 400 "Failed to create/update record." with **empty** per-field `data` —
 *    the rule-failure case. A genuine validation 400 always populates `data`
 *    with per-field errors, so an empty-data 400 with this message is a stale
 *    session, not a form validation error.
 */
export function isPbAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as {
    status?: number;
    response?: { data?: Record<string, unknown> | null; message?: string };
    message?: string;
  };
  const status = e.status;
  if (status === 401 || status === 403) return true;
  if (status === 400) {
    const data = e.response?.data;
    const dataEmpty =
      !data || (typeof data === 'object' && Object.keys(data).length === 0);
    const msg = e.response?.message || e.message || '';
    if (dataEmpty && /Failed to (create|update|delete) record/i.test(msg)) {
      return true;
    }
  }
  return false;
}

/**
 * Handle a PocketBase call failure: if it's a stale-session error, clear the
 * invalid auth store and hard-redirect to `/login?expired=1` so the operator
 * can re-authenticate. Returns `true` when it handled an auth failure (the
 * caller should bail out); `false` otherwise (caller should show its own
 * error). Safe to call from any client component or effect.
 */
export function handlePbAuthError(err: unknown): boolean {
  if (!isPbAuthError(err)) return false;
  try {
    pb.authStore.clear();
  } catch {
    /* ignore */
  }
  // Do not hard-redirect away if on dashboard or dispatch; allow operator to stay
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/dashboard') && !window.location.pathname.includes('/dispatch')) {
    window.location.assign('/login?expired=1');
  }
  return true;
}
