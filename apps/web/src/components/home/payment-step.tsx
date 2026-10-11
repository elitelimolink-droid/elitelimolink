import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CreditCard, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { formatFare, type FareQuote } from '@/lib/pricing';

// Minimal typing for Square's Web Payments SDK loaded via the script tag.
// The SDK is loaded from Square's CDN at runtime; card details are entered
// into Square's secure iframe and never touch this site's code or server.
type SquareTokenResult = {
	status: 'OK' | 'ERROR';
	token?: string;
	errors?: { code?: string; message?: string; field?: string }[];
};

interface SquareCard {
	attach(selector: string | HTMLElement): Promise<void>;
	destroy(): Promise<void>;
	tokenize(): Promise<SquareTokenResult>;
}

interface SquarePayments {
	card(): Promise<SquareCard>;
}

interface SquareGlobal {
	payments(appId: string, locationId: string): SquarePayments;
}

declare global {
	interface Window {
		Square?: SquareGlobal;
	}
}

type Props = {
	/** Pending reservation id (also the reference shown to the customer). */
	reservationId: string;
	/** Exact server-calculated fare to charge, in major currency units. */
	amount: number;
	currency: string;
	/** Authoritative quote used for this charge. Tax and gratuity are itemized
	 *  here only — never invented, and the total matches `amount`. */
	quote: FareQuote | null;
	businessName: string;
	/** PUBLIC Square application id for the Web Payments SDK. */
	squareAppId: string;
	/** PUBLIC Square location id. */
	squareLocationId: string;
	squareEnvironment: 'production' | 'sandbox';
	onPaid: () => void;
	/** Customer backed out — abandon the pending reservation and return to review. */
	onCancel: () => void;
};

type Phase = 'loading' | 'ready' | 'paying' | 'error';

function line(label: string, value: number | undefined, currency: string) {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
	return <div><span>{label}</span><strong>{formatFare(value, currency)}</strong></div>;
}

/** Itemizes only charges present on the quote used for this authorization. */
function PaymentBreakdown({ quote, amount, currency }: { quote: FareQuote | null; amount: number; currency: string }) {
	if (!quote?.ok) return null;
	const tip = quote.tipAmount ?? 0;
	const tax = quote.taxAmount ?? 0;
	const parts = [
		quote.subtotal ?? 0,
		quote.carSeatAmount ?? 0,
		quote.extraStopAmount ?? 0,
		quote.insidePickupAmount ?? 0,
		quote.tollAmount ?? 0,
		tip,
		tax,
	];
	const summed = Math.round(parts.reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0) * 100) / 100;
	const totalMatches = Math.abs(summed - amount) < 0.02;
	return (
		<div className="fare-breakdown pay-breakdown">
			<div className="fare-breakdown-head"><span>Price breakdown</span></div>
			{line('Base fare', quote.subtotal, currency)}
			{line('Car seat', quote.carSeatAmount, currency)}
			{line('Extra stop', quote.extraStopAmount, currency)}
			{line('Inside pickup', quote.insidePickupAmount, currency)}
			{line('Tolls', quote.tollAmount, currency)}
			{line('Gratuity', tip, currency)}
			{line('Tax', tax, currency)}
			<div className="fare-breakdown-total"><span>Total</span><strong>{formatFare(totalMatches ? summed : amount, currency)}</strong></div>
		</div>
	);
}

/**
 * Final payment step. Renders Square's secure card-entry iframe (Web Payments
 * SDK), tokenizes the card, and authorizes a hold on the exact
 * server-calculated fare through `/api/square-pay`. The reservation is
 * confirmed (booking accepted) once Square reports the payment AUTHORIZED —
 * the card is verified and the fare is reserved, but NOT charged yet. The
 * operator captures the authorized hold from the dashboard after the service
 * is completed. Card numbers, CVV, and postal code are entered directly into
 * Square's iframe — this site never sees, stores, or transmits raw card
 * details; only the single-use token does.
 */
export function PaymentStep({
	reservationId, amount, currency, businessName, quote,
	squareAppId, squareLocationId, squareEnvironment, onPaid, onCancel,
}: Props) {
	const cardHostRef = useRef<HTMLDivElement | null>(null);
	const cardRef = useRef<SquareCard | null>(null);
	const [phase, setPhase] = useState<Phase>('loading');
	const [error, setError] = useState('');
	const [sdkError, setSdkError] = useState(false);

	const sdkUrl = squareEnvironment === 'sandbox'
		? 'https://sandbox.web.squarecdn.com/v1/square.js'
		: 'https://web.squarecdn.com/v1/square.js';

	// Load the Square Web Payments SDK and mount the secure card form.
	useEffect(() => {
		if (!squareAppId || !squareLocationId) {
			setSdkError(true);
			setPhase('error');
			return;
		}
		let cancelled = false;

		const mountCard = async () => {
			const payments = window.Square!.payments(squareAppId, squareLocationId);
			const card = await payments.card();
			if (cancelled) { try { await card.destroy(); } catch {} return; }
			cardRef.current = card;
			if (cardHostRef.current) await card.attach(cardHostRef.current);
			if (!cancelled) setPhase('ready');
		};

		const existing = document.querySelector<HTMLScriptElement>(`script[data-square-sdk="${sdkUrl}"]`);
		if (window.Square) {
			mountCard().catch(() => { if (!cancelled) { setSdkError(true); setPhase('error'); } });
		} else if (existing) {
			existing.addEventListener('load', () => mountCard().catch(() => { if (!cancelled) { setSdkError(true); setPhase('error'); } }));
			existing.addEventListener('error', () => { if (!cancelled) { setSdkError(true); setPhase('error'); } });
		} else {
			const script = document.createElement('script');
			script.src = sdkUrl;
			script.dataset.squareSdk = sdkUrl;
			script.async = true;
			script.onload = () => mountCard().catch(() => { if (!cancelled) { setSdkError(true); setPhase('error'); } });
			script.onerror = () => { if (!cancelled) { setSdkError(true); setPhase('error'); } };
			document.head.appendChild(script);
		}

		return () => {
			cancelled = true;
			const card = cardRef.current;
			cardRef.current = null;
			if (card) { try { void card.destroy(); } catch {} }
		};
	}, [squareAppId, squareLocationId, sdkUrl]);

	async function pay() {
		if (phase === 'paying') return;
		const card = cardRef.current;
		if (!card) return;
		setPhase('paying');
		setError('');
		try {
			const result = await card.tokenize();
			if (result.status !== 'OK' || !result.token) {
				const msg = result.errors?.[0]?.message || 'Please check your card details and try again.';
				setError(msg);
				setPhase('ready');
				return;
			}
			const res = await fetch('/api/square-pay', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reservationId, amount, currency, sourceId: result.token,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok && data?.ok) {
				onPaid();
				return;
			}
			if (data?.needsConfiguration) {
				setError('Online payment is not fully configured yet. Please contact us to complete your reservation.');
			} else {
				setError(data?.message || 'Your card could not be authorized. Please try a different card.');
			}
			setPhase('ready');
		} catch {
			setError('We couldn\'t reach the payment service. Please try again.');
			setPhase('ready');
		}
	}

	const amountText = formatFare(amount, currency);

	return (
		<div className="step-scroll">
			<div className="step-heading">
				<span className="eyebrow">PAYMENT</span>
				<h2>Authorize your card to confirm your ride.</h2>
				<p>Enter your card securely to authorize the fare with {businessName}. Your card is authorized (a hold is placed) for the exact amount shown — it is charged only after your ride is completed.</p>
			</div>

			<div className="pay-amount">
				<span className="pay-amount-label"><CreditCard size={15} /> Authorization amount</span>
				<strong>{amountText}</strong>
			</div>

			<PaymentBreakdown quote={quote} amount={amount} currency={currency} />

			{sdkError ? (
				<div className="pay-setup-needed">
					<TriangleAlert size={18} />
					<span>Secure card payment isn't available right now. Please go back and try again, or contact us to complete your reservation.</span>
				</div>
			) : (
				<div className="pay-card-frame">
					<div ref={cardHostRef} id="square-card-host" className="pay-card-host" />
					{phase === 'loading' && (
						<div className="pay-card-loading">
							<span className="route-map-spinner" />
							<span>Loading secure card form…</span>
						</div>
					)}
				</div>
			)}

			{error && <p className="form-error" role="alert">{error}</p>}

			<div className="pay-security">
				<Lock size={14} />
				<span>Card details are entered directly into Square's secure payment form. We never see or store your card number.</span>
			</div>

			<div className="review-disclaimer">
				<ShieldCheck size={17} />
				<p>Your card is authorized (held) for the fare to confirm your reservation — it is not charged until your ride is completed. If authorization is declined or canceled, nothing is held and your ride is not booked.</p>
			</div>

			<div className="booking-bottom">
				<div className="bottom-actions">
					<button type="button" className="back-button" onClick={onCancel} disabled={phase === 'paying'} aria-label="Go back">
						<ArrowLeft size={19} />
					</button>
					<button type="button" className="primary-button" onClick={pay} disabled={phase !== 'ready'}>
						{phase === 'paying' ? 'Authorizing card…' : phase === 'loading' ? 'Loading…' : `Authorize ${amountText}`}
						{phase !== 'paying' && phase !== 'loading' && <CreditCard size={16} />}
					</button>
				</div>
			</div>
		</div>
	);
}
