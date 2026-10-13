import { useEffect, useState } from 'react';
import type { Route } from './+types/payment.success';
import { seo } from '@/lib/seo';
import { loadBusinessNameByReservation } from '@/lib/business-pricing.server';
import { ArrowRight, Check, CreditCard } from 'lucide-react';
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
    title: `Payment Received | ${businessName}`,
    description: `Your ${businessName} reservation payment was processed successfully.`,
    noindex: true,
  });
}

type VerifyStatus = 'verifying' | 'confirmed' | 'unavailable' | 'pending' | 'error';

/**
 * Landing page after a successful hosted-checkout payment. Confirms the
 * reservation only after the server verifies with Square that the order was
 * actually paid — arrival here alone never confirms a booking. If Square
 * cannot verify (credentials missing) or the payment has not settled yet,
 * the reservation stays pending and the customer is told what is happening
 * rather than being shown a false confirmation.
 */
export default function PaymentSuccess({ loaderData }: Route.ComponentProps) {
  const { ref, businessName } = loaderData;
  const [status, setStatus] = useState<VerifyStatus>('verifying');

  useEffect(() => {
    if (!ref) return;
    let active = true;
    let timer: number | undefined;
    let attempt = 0;

    const verify = () => {
      attempt += 1;
      fetch('/api/payment-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref }),
      })
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(`payment-complete ${res.status}`))))
        .then((data: { ok?: boolean; needsConfiguration?: boolean; pending?: boolean }) => {
          if (!active) return;
          if (data?.ok) { setStatus('confirmed'); return; }
          if (data?.needsConfiguration) { setStatus('unavailable'); return; }
          // Payment not yet reported by Square — retry a few times in case it
          // is still settling, then surface a pending state (the webhook may
          // still confirm it). Never confirm without verification.
          if (attempt < 5) { timer = window.setTimeout(verify, 2000); }
          else { setStatus('pending'); }
        })
        .catch(() => {
          if (!active) return;
          if (attempt < 5) { timer = window.setTimeout(verify, 2000); }
          else { setStatus('error'); }
        });
    };

    verify();
    return () => { active = false; if (timer) window.clearTimeout(timer); };
  }, [ref]);

  const lineText =
    status === 'confirmed' ? 'Paid — reservation confirmed'
    : status === 'unavailable' ? 'Payment verification unavailable — please contact us with your reference'
    : status === 'pending' ? 'Payment is still being confirmed — we will reach out shortly'
    : status === 'error' ? 'We could not confirm your payment — please contact us with your reference'
    : 'Confirming your payment…';

  return (
    <main className="booking-page payment-status">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="page-brand"><span className="brand-mark">B<span>L</span></span><span className="brand-word">{businessName}<span className="brand-sub"> / RESERVATIONS</span></span></div>
      <div className="payment-card">
        <ThemeToggle className="theme-toggle card-theme" />
        <div className="done-check"><Check size={29} strokeWidth={2.5} /></div>
        <span className="eyebrow">{status === 'confirmed' ? 'PAYMENT RECEIVED' : 'PROCESSING'}</span>
        <h2>{status === 'confirmed' ? 'Your ride is booked.' : 'Confirming your booking.'}</h2>
        <p className="done-lead">
          {status === 'confirmed'
            ? 'Thanks for your payment. Your reservation is complete and a receipt is on its way to your email. We’ll reach out with any pickup details.'
            : 'We’re verifying your payment with Square before confirming your reservation. You won’t be charged twice.'}
        </p>
        {ref && (
          <div className="done-card">
            <div className="done-card-top"><span>RESERVATION REFERENCE</span><strong>RB-{ref.slice(-8).toUpperCase()}</strong></div>
            <div className="done-card-line"><CreditCard size={17} /><span>{lineText}</span></div>
          </div>
        )}
        <p className="done-footnote">Save your reference for your records.</p>
        <a href="/" className="primary-button">Back to booking <ArrowRight size={17} /></a>
      </div>
    </main>
  );
}
