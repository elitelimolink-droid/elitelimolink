import { useEffect, useState } from 'react';
import { CreditCard, HandCoins, Loader2, Lock, ShieldCheck } from 'lucide-react';
import pb from '@/lib/pocketbase-client';
import { handlePbAuthError } from '@/lib/pb-auth-error';

type PaymentDetails = {
	ok: boolean;
	needsConfiguration?: boolean;
	lookupFailed?: boolean;
	paid?: boolean;
	captured?: boolean;
	paymentId?: string;
	status?: string;
	amount?: number | null;
	currency?: string | null;
	cardBrand?: string | null;
	last4?: string | null;
	message?: string;
};

type CaptureResult = {
	ok?: boolean;
	needsConfiguration?: boolean;
	declined?: boolean;
	code?: string;
	message?: string;
	alreadyCaptured?: boolean;
	captured?: boolean;
};

const CARD_LABELS: Record<string, string> = {
	VISA: 'Visa',
	MASTERCARD: 'Mastercard',
	AMEX: 'American Express',
	AMERICAN_EXPRESS: 'American Express',
	DISCOVER: 'Discover',
	JCB: 'JCB',
	UNIONPAY: 'UnionPay',
	OTHER_BRAND: 'Card',
};

function brandLabel(brand?: string | null): string {
	if (!brand) return '';
	return CARD_LABELS[brand.toUpperCase()] ?? brand;
}

function statusLabel(status?: string): string {
	switch ((status || '').toUpperCase()) {
		case 'COMPLETED':
			return 'Captured';
		case 'AUTHORIZED':
		case 'APPROVED':
			return 'Authorized (hold placed)';
		case 'PENDING':
			return 'Pending';
		case 'CANCELED':
			return 'Canceled';
		case 'FAILED':
			return 'Failed';
		case 'NONE':
			return 'No payment on file';
		default:
			return status || 'Unknown';
	}
}

function statusTone(status?: string): 'captured' | 'authorized' | 'none' | 'failed' {
	switch ((status || '').toUpperCase()) {
		case 'COMPLETED':
			return 'captured';
		case 'AUTHORIZED':
		case 'APPROVED':
		case 'PENDING':
			return 'authorized';
		case 'FAILED':
		case 'CANCELED':
			return 'failed';
		default:
			return 'none';
	}
}

function moneyText(amount?: number | null, currency?: string | null): string {
	if (amount == null) return '';
	const cents = Number(amount);
	if (!Number.isFinite(cents)) return '';
	const value = cents / 100;
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency || 'USD',
		}).format(value);
	} catch {
		return `$${value.toFixed(2)}`;
	}
}

/**
 * Dedicated payment-management section for a reservation. Shows the safe,
 * non-sensitive payment details Square exposes (amount, status, card brand
 * and last four only), the authorization-vs-capture state, and an operator
 * action to capture the authorized hold after the service is completed.
 *
 * Full card numbers, security codes, and raw payment credentials are never
 * stored or displayed — Square tokenizes the card and only returns the brand
 * and last four through its API. When Square is not configured, the section
 * still renders the local payment status but keeps the charge action safely
 * unavailable and reports the setup that is still needed.
 */
export function PaymentManagement({
	reservationId,
	squareOrderId,
	paid,
	captured,
	fareText,
	onCaptured,
}: {
	reservationId: string;
	squareOrderId: string;
	paid: boolean;
	captured: boolean;
	fareText: string;
	onCaptured: () => void;
}) {
	const [details, setDetails] = useState<PaymentDetails | null>(null);
	const [loading, setLoading] = useState(false);
	const [capturing, setCapturing] = useState(false);
	const [captureError, setCaptureError] = useState('');
	const [captureDone, setCaptureDone] = useState(false);

	// Load safe payment details from Square whenever a different reservation
	// is opened. Only fetched when there is a payment on file (paid or a
	// Square payment id) so unpaid reservations don't make a needless call.
	useEffect(() => {
		let cancelled = false;
		if (!paid && !squareOrderId) {
			setDetails(null);
			return;
		}
		setLoading(true);
		setCaptureError('');
		setCaptureDone(false);
		fetch('/api/square-payment-details', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${pb.authStore.token}`,
			},
			body: JSON.stringify({ ref: reservationId }),
		})
			.then((res) => res.json().catch(() => ({})))
			.then((data: PaymentDetails) => {
				if (!cancelled) setDetails(data);
			})
			.catch(() => {
				if (!cancelled) setDetails(null);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [reservationId, paid, squareOrderId]);

	async function capturePayment() {
		if (capturing) return;
		setCapturing(true);
		setCaptureError('');
		setCaptureDone(false);
		try {
			const res = await fetch('/api/square-capture', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${pb.authStore.token}`,
				},
				body: JSON.stringify({ ref: reservationId }),
			});
			const data = (await res.json().catch(() => ({}))) as CaptureResult;
			if (res.ok && data?.ok) {
				setCaptureDone(true);
				onCaptured();
			} else if (data?.needsConfiguration) {
				setCaptureError(
					'Square is not configured to capture payments. Add your Square access token to enable capture.',
				);
			} else {
				setCaptureError(data?.message || 'The payment could not be captured. Please try again.');
			}
		} catch (err) {
			if (handlePbAuthError(err)) return;
			setCaptureError("We couldn't reach the capture service. Please try again.");
		} finally {
			setCapturing(false);
		}
	}

	const needsConfig = !!details?.needsConfiguration;
	const effectiveCaptured = captured || !!details?.captured || (details?.status || '').toUpperCase() === 'COMPLETED';
	const effectivePaid = paid || !!details?.paid;
	const status = details?.status ?? (effectivePaid ? (effectiveCaptured ? 'COMPLETED' : 'AUTHORIZED') : 'NONE');
	const tone = statusTone(status);
	const amountText = moneyText(details?.amount, details?.currency);
	const hasCard = !!details?.cardBrand || !!details?.last4;

	return (
		<div className="payment-mgmt">
			<div className="payment-mgmt-head">
				<span className="payment-mgmt-title">
					<CreditCard size={15} /> Payment management
				</span>
				<span className={`payment-mgmt-status tone-${tone}`}>{statusLabel(status)}</span>
			</div>

			{loading ? (
				<div className="payment-mgmt-loading">
					<Loader2 size={15} className="spin" /> Loading payment details…
				</div>
			) : (
				<>
					{!effectivePaid && !squareOrderId ? (
						<p className="payment-mgmt-empty">
							No payment has been authorized for this reservation. The customer did not pay at booking, or
							payment was not required.
						</p>
					) : needsConfig ? (
						<div className="payment-mgmt-setup">
							<ShieldCheck size={15} />
							<span>
								Square is not fully configured. Payment status is shown from the reservation record, but
								charging is unavailable until <strong>SQUARE_APP_ID</strong> and{' '}
								<strong>SQUARE_ACCESS_TOKEN</strong> are added in secure configuration.
							</span>
						</div>
					) : null}

					{(effectivePaid || squareOrderId) && (
						<dl className="payment-mgmt-grid">
							{amountText && (
								<div>
									<dt>Authorized amount</dt>
									<dd>{amountText}</dd>
								</div>
							)}
							{!amountText && fareText && (
								<div>
									<dt>Fare on file</dt>
									<dd>{fareText}</dd>
								</div>
							)}
							{hasCard && (
								<div>
									<dt>Card</dt>
									<dd>
										{brandLabel(details?.cardBrand)}
										{details?.last4 ? ` •••• ${details.last4}` : ''}
									</dd>
								</div>
							)}
							{details?.paymentId && (
								<div>
									<dt>Payment ID</dt>
									<dd className="payment-mgmt-mono">{details.paymentId}</dd>
								</div>
							)}
							<div>
								<dt>Capture state</dt>
								<dd>
									{effectiveCaptured
										? 'Captured — funds collected after service'
										: 'Authorized — hold placed, not yet charged'}
								</dd>
							</div>
						</dl>
					)}

					{details?.lookupFailed && details.message && (
						<p className="payment-mgmt-note">{details.message}</p>
					)}

					{effectivePaid && squareOrderId && !effectiveCaptured && (
						<div className="payment-mgmt-action">
							<button
								type="button"
								className="primary-button payment-mgmt-capture"
								disabled={capturing || needsConfig}
								onClick={() => void capturePayment()}
							>
								{capturing ? (
									<Loader2 size={16} className="spin" />
								) : (
									<HandCoins size={16} />
								)}{' '}
								{capturing ? 'Capturing…' : 'Capture authorized charge'}
							</button>
							{captureError && (
								<p className="form-error" role="alert">
									{captureError}
								</p>
							)}
							{captureDone && (
								<span className="saved-note">Payment captured — funds collected.</span>
							)}
							{needsConfig && (
								<p className="payment-mgmt-note">
									Charging is unavailable until Square credentials are configured.
								</p>
							)}
						</div>
					)}

					{effectiveCaptured && (
						<p className="payment-mgmt-captured-note">
							<ShieldCheck size={14} /> This payment was captured. The authorized hold has been collected
							as the fare.
						</p>
					)}

					<p className="payment-mgmt-safe">
						<Lock size={12} /> Card details are tokenized by Square. Full card numbers and security codes are
						never stored on this site.
					</p>
				</>
			)}
		</div>
	);
}
