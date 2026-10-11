import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, KeyRound, TriangleAlert } from 'lucide-react';

type Status = {
	paymentsLive?: boolean;
	squareConfigured?: boolean;
	needsConfiguration?: boolean;
};

/**
 * Dashboard card showing whether real card payments can be accepted at booking.
 *
 * The booking flow charges the customer through Square Online Checkout
 * (`/api/square-checkout`), so live card processing is decided by the Square
 * credentials configured in `apps/web/.env`. This reads `/api/payment-status`,
 * which verifies the Square access token and location server-side and returns
 * only booleans (no tokens or account ids ever reach the browser).
 *
 * "Live" means Square credentials are present AND the configured location is
 * reachable on the Square account. When Square is not yet configured, the card
 * clearly marks live processing as pending — it never claims real payments are
 * active.
 */
export function PaymentStatusCard() {
	const [status, setStatus] = useState<Status | null>(null);

	useEffect(() => {
		let active = true;
		fetch('/api/payment-status', { headers: { Accept: 'application/json' } })
			.then(res => res.json())
			.then((data: Status) => active && setStatus(data))
			.catch(() => active && setStatus({ paymentsLive: false, needsConfiguration: true }));
		return () => { active = false; };
	}, []);

	const live = !!status?.paymentsLive;
	const configured = !!status?.squareConfigured;

	return (
		<div className={`dash-card maps-card ${live ? 'ok' : 'setup'}`}>
			<div className="dash-card-head">
				<span className="dash-card-icon">{live ? <CheckCircle2 size={18} /> : <KeyRound size={18} />}</span>
				<div><h2>Card payments</h2><p>Live payment processing status</p></div>
			</div>

			{live ? (
				<div className="maps-state">
					<div className="maps-state-row"><CheckCircle2 size={16} /> <span>Live — Square connected, card authorization at booking</span></div>
					<ul className="maps-features">
						<li><CreditCard size={14} /> Card authorized (hold placed) through Square at booking</li>
						<li><span className="dot" /> Customer enters card in Square's secure form</li>
						<li><span className="dot" /> Operator captures the hold after the service is completed</li>
					</ul>
				</div>
			) : (
				<div className="maps-state">
					<div className="maps-state-row warn"><TriangleAlert size={16} /> <span>{configured ? 'Square credentials set — verify your account' : 'Not connected — request-only mode'}</span></div>
					<p className="maps-desc">
						{configured
							? 'Square credentials are present, but the configured location couldn’t be verified on your Square account. Reservations are submitted as requests and no card is authorized until the connection is confirmed.'
							: 'No live payment provider is connected. Reservations are submitted as requests and no card is authorized. Add your Square credentials to authorize a card hold at booking and capture it after the service.'}
					</p>
					<ol className="maps-steps">
						<li><strong>Open</strong> the Square Developer Dashboard and create an application.</li>
						<li><strong>Copy</strong> your Square Application ID, Access Token, and Location ID.</li>
						<li><strong>Add</strong> them to <code>apps/web/.env</code> as <code>SQUARE_APP_ID</code>, <code>SQUARE_ACCESS_TOKEN</code>, and <code>SQUARE_LOCATION_ID</code>.</li>
						<li><strong>(Optional)</strong> register <code>/api/square-webhook</code> and set <code>SQUARE_WEBHOOK_SIGNATURE_KEY</code>.</li>
						<li><strong>Reload</strong> the dashboard. This card will show “Live — Square connected” and bookings will authorize a hold on the customer’s card. You capture the hold from a reservation after the ride is completed.</li>
					</ol>
					<div className="maps-features">
						<span className="badge-off"><CreditCard size={13} /> {configured ? 'Square credentials set — verify account' : 'Square connection needed'}</span>
					</div>
				</div>
			)}
		</div>
	);
}
