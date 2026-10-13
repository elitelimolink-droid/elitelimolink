import { useEffect, useRef } from 'react';

/**
 * Anonymous visitor-interaction tracking for the public booking site.
 *
 * Captures clicks, selected addresses, and booking actions and forwards them
 * to `/api/activity`, which stores them as `activity_events` records scoped to
 * the business the visitor is booking under. The operator then sees them in
 * the dashboard Live activity feed alongside reservation events.
 *
 * Privacy: this NEVER captures passwords, payment credentials, auth tokens, or
 * input values. Only element labels, visible address-suggestion text, and
 * action descriptions are recorded. Sensitive inputs (password fields) are
 * skipped entirely.
 */

export type ActivityType = 'click' | 'address' | 'action' | 'visit';

type ActivityInput = {
	type: ActivityType;
	label: string;
	target?: string;
	meta?: Record<string, unknown>;
};

type QueuedEvent = ActivityInput & { ts: number };

const QUEUE_LIMIT = 200;
const FLUSH_INTERVAL_MS = 5000;

let queue: QueuedEvent[] = [];
let currentBiz = '';
let flushTimer: number | undefined;
let flushing = false;

function sessionId(): string {
	try {
		const key = 'ab-session';
		let s = sessionStorage.getItem(key);
		if (!s) {
			s = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
			sessionStorage.setItem(key, s);
		}
		return s;
	} catch {
		return `s-${Date.now().toString(36)}`;
	}
}

function scheduleFlush() {
	if (flushTimer) return;
	flushTimer = window.setTimeout(() => {
		flushTimer = undefined;
		void flushActivity();
	}, FLUSH_INTERVAL_MS);
}

export function setActivityBiz(biz: string) {
	currentBiz = biz || '';
	if (currentBiz) scheduleFlush();
}

export function trackEvent(input: ActivityInput) {
	if (!input.label) return;
	queue.push({ ...input, ts: Date.now() });
	if (queue.length > QUEUE_LIMIT) queue = queue.slice(-QUEUE_LIMIT);
	scheduleFlush();
}

/**
 * Captures browsing context the server cannot see on its own: the referrer
 * (where the visitor came from), viewport size, screen size, and language.
 * Combined with the server-resolved IP location and User-Agent, this gives the
 * operator a full "who visited" picture in the Live activity feed. No form
 * values, passwords, or payment details are ever captured here.
 */
function browsingContext(): Record<string, unknown> {
	const ctx: Record<string, unknown> = {};
	try {
		if (document.referrer) ctx.referrer = document.referrer;
		ctx.viewport = `${window.innerWidth}x${window.innerHeight}`;
		ctx.screen = `${window.screen.width}x${window.screen.height}`;
		if (navigator.language) ctx.language = navigator.language;
		if (navigator.platform) ctx.platform = navigator.platform;
		const title = document.title;
		if (title) ctx.title = title;
	} catch {
		// ignore — context is best-effort
	}
	return ctx;
}

/**
 * Logs a single "visit" event for the current page load — the website-visit
 * record the operator asked for. Fired once per page (deduped by session +
 * path) so remounts or React strict-mode double-invoke don't create duplicates.
 * The server stamps the approximate location and device onto the same record.
 */
export function trackVisit() {
	if (!currentBiz) return;
	try {
		const key = `ab-visit-${sessionId()}-${window.location.pathname}`;
		if (sessionStorage.getItem(key)) return;
		sessionStorage.setItem(key, '1');
	} catch {
		// sessionStorage unavailable — fall through and send (at most once per mount)
	}
	trackEvent({
		type: 'visit',
		label: 'Visited booking page',
		target: 'visit',
		meta: browsingContext(),
	});
}

export async function flushActivity() {
	if (flushing) return;
	const biz = currentBiz;
	if (!biz || queue.length === 0) return;
	const batch = queue.slice(0, QUEUE_LIMIT);
	queue = queue.slice(batch.length);
	flushing = true;
	try {
		await fetch('/api/activity', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				biz,
				session: sessionId(),
				events: batch.map(({ type, label, target, meta }) => ({
					type,
					label,
					target,
					page: window.location.pathname + window.location.search,
					meta: { ...meta, step: currentStep() },
				})),
			}),
			keepalive: true,
		});
	} catch {
		// Network failure is non-fatal — re-queue the batch so it isn't lost.
		queue = [...batch, ...queue].slice(0, QUEUE_LIMIT);
	} finally {
		flushing = false;
	}
}

function currentStep(): string {
	try {
		const el = document.querySelector('.header-counter');
		if (el && el.textContent) return el.textContent.trim();
	} catch {
		// ignore
	}
	return '';
}

function clip(s: string, max: number): string {
	const t = s.trim().replace(/\s+/g, ' ');
	return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * Derives a sanitized, meaningful event from a click target. Returns null to
 * skip the click entirely (e.g. on password fields). Never reads input values.
 */
function describeClick(target: EventTarget | null): ActivityInput | null {
	if (!(target instanceof Element)) return null;

	// Never track password or payment-card inputs, and never capture values.
	const pw = target.closest('input[type="password"], input[autocomplete*="cc-"], input[name*="card"], input[inputmode="numeric"][name*="cvc"]');
	if (pw) return null;

	// Address autocomplete suggestion — capture the visible address text.
	const item = target.closest('.autocomplete-item');
	if (item) {
		const strong = item.querySelector('.autocomplete-copy strong');
		const small = item.querySelector('.autocomplete-copy small');
		const addr = strong?.textContent ?? item.textContent ?? '';
		return {
			type: 'address',
			label: clip(`Selected address: ${addr}`, 200),
			target: 'autocomplete-item',
			meta: small?.textContent ? { area: clip(small.textContent, 80) } : undefined,
		};
	}

	// Booking actions with semantic labels.
	const actionEl = target.closest(
		'.service-tab, .vehicle-option, .primary-button, .back-button, .header-back, .row-button, .return-row, .add-on-row, .tip-option, .time-grid button, .wheel-item, .monthday-select, .stepper button, .passenger-stepper button, .fare-toggle, .theme-toggle, .modal-save, .icon-button',
	);
	if (actionEl) {
		let label = '';
		if (actionEl.classList.contains('vehicle-option')) {
			const name = actionEl.querySelector('.vehicle-copy strong');
			label = name?.textContent ?? actionEl.textContent ?? '';
			label = `Vehicle: ${clip(label, 60)}`;
		} else if (actionEl.classList.contains('service-tab')) {
			label = `Service: ${clip(actionEl.textContent ?? '', 40)}`;
		} else if (actionEl.classList.contains('back-button') || actionEl.classList.contains('header-back')) {
			label = 'Back';
		} else if (actionEl.classList.contains('return-row')) {
			label = clip(actionEl.textContent ?? 'Toggled option', 60);
		} else if (actionEl.classList.contains('add-on-row')) {
			const copy = actionEl.querySelector('.add-on-copy');
			label = clip(copy?.textContent ?? 'Toggled add-on', 60);
		} else if (actionEl.classList.contains('tip-option')) {
			label = `Tip: ${clip(actionEl.textContent ?? '', 30)}`;
		} else if (actionEl.classList.contains('wheel-item')) {
			label = `Time wheel: ${clip(actionEl.textContent ?? '', 20)}`;
		} else if (actionEl.classList.contains('monthday-select')) {
			label = 'Date/time select';
		} else {
			label = clip(actionEl.getAttribute('aria-label') ?? actionEl.textContent ?? actionEl.tagName.toLowerCase(), 80);
		}
		return { type: 'action', label, target: actionEl.className.split(' ')[0] || actionEl.tagName.toLowerCase() };
	}

	// Form inputs: log the field, never the value.
	const input = target.closest('input, textarea, select');
	if (input) {
		const name = input.getAttribute('aria-label') || input.getAttribute('placeholder') || input.getAttribute('name') || 'field';
		return { type: 'click', label: `Edited: ${clip(name, 60)}`, target: input.tagName.toLowerCase() };
	}

	// Generic click: a visible label or the element tag.
	const label = target.getAttribute('aria-label') || target.textContent || target.tagName.toLowerCase();
	const text = clip(label, 100);
	if (!text) return null;
	return { type: 'click', label: text, target: target.tagName.toLowerCase() };
}

/**
 * Installs a global click listener on the booking site and flushes the queue
 * periodically and on page hide. Pass the business id once pricing has loaded
 * so events are attributed to the correct operator.
 */
export function useActivityTracker(bizId: string) {
	const bizRef = useRef(bizId);
	bizRef.current = bizId;

	useEffect(() => {
		setActivityBiz(bizId);
		// Log one "visit" event per page load as soon as we know which business
		// the visitor is booking under. trackVisit dedupes by session + path so
		// remounts don't create duplicates. The server attaches the visitor's
		// approximate location and device to this same record.
		if (bizId) trackVisit();
	}, [bizId]);

	useEffect(() => {
		function onClick(e: MouseEvent) {
			// Only track interactions inside the booking surface so dashboard /
			// operator clicks are never logged.
			const root = document.querySelector('.booking-page, .booking-frame');
			if (!root || !root.contains(e.target as Node)) return;
			const event = describeClick(e.target);
			if (event) trackEvent(event);
		}

		function onVisibility() {
			if (document.visibilityState === 'hidden') void flushActivity();
		}

		document.addEventListener('click', onClick, true);
		document.addEventListener('visibilitychange', onVisibility);
		window.addEventListener('pagehide', () => void flushActivity());

		const interval = window.setInterval(() => {
			if (document.visibilityState === 'visible') void flushActivity();
		}, FLUSH_INTERVAL_MS);

		return () => {
			document.removeEventListener('click', onClick, true);
			document.removeEventListener('visibilitychange', onVisibility);
			window.clearInterval(interval);
			void flushActivity();
		};
	}, []);
}
