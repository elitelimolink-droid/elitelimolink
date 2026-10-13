import { useEffect, useState } from 'react';
import type { Route } from './+types/payment.cancel';
import { seo } from '@/lib/seo';
import { loadBusinessNameByReservation } from '@/lib/business-pricing.server';
import { ArrowRight, XCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';

const DEFAULT_BUSINESS_NAME = 'ELITELIMOLINK';

export async function loader({ url }: Route.LoaderArgs) {
  const ref = url.searchParams.get('ref') ?? '';
  let businessName = DEFAULT_BUSINESS_NAME;
  try {
    const name = await loadBusinessNameByReservation(ref);
    if (name) businessName = name;
  } catch {
    // fall back to the default brand
  }
  return { ref, businessName };
}

export function meta({ matches, location, loaderData }: Route.MetaArgs) {
  const businessName = loaderData?.businessName || DEFAULT_BUSINESS_NAME;
  return seo({ matches, location }, {
    title: `Payment Cancelled | ${businessName}`,
    description: 'No charge was made — the booking was not completed.',
    noindex: true,
  });
}

/**
 * Landing page after an abandoned hosted checkout. Nothing was charged and the
 * booking is NOT complete: the pending reservation created on the way to
 * checkout is abandoned (deleted) so no reservation is accepted without a
 * completed payment. The customer can return to the booking page to try
 * again, which starts a fresh reservation.
 */
export default function PaymentCancel({ loaderData }: Route.ComponentProps) {
  const { ref, businessName } = loaderData;
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (!ref) return;
    let active = true;
    fetch('/api/payment-abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref }),
    })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`payment-abandon ${res.status}`))))
      .then(() => { if (active) setCleared(true); })
      .catch(() => {});
    return () => { active = false; };
  }, [ref]);

  return (
    <main className="booking-page payment-status payment-cancel">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="page-brand"><span className="brand-mark">B<span>L</span></span><span className="brand-word">{businessName}<span className="brand-sub"> / RESERVATIONS</span></span></div>
      <div className="payment-card">
        <ThemeToggle className="theme-toggle card-theme" />
        <div className="done-check"><XCircle size={29} strokeWidth={2.5} /></div>
        <span className="eyebrow">PAYMENT NOT COMPLETED</span>
        <h2>No charge — no problem.</h2>
        <p className="done-lead">Your card was not charged and your ride is not booked. {cleared ? 'Your pending request was cleared so you can start fresh.' : 'Your trip details are being cleared.'} Return to the booking page to try again — the fare is recalculated from the exact mileage before you pay.</p>
        {ref && (
          <div className="done-card">
            <div className="done-card-top"><span>REFERENCE</span><strong>RB-{ref.slice(-8).toUpperCase()}</strong></div>
          </div>
        )}
        <p className="done-footnote">No reservation is kept when payment is not completed.</p>
        <a href="/" className="primary-button">Back to booking <ArrowRight size={17} /></a>
      </div>
    </main>
  );
}
