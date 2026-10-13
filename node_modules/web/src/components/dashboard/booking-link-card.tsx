import { useEffect, useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';

/**
 * Multi-business: each operator gets a private booking page at
 * `/?biz=<userId>`. Customers who open it book with that operator's rates and
 * vehicle categories, and the reservation lands only in that operator's
 * dashboard and dispatch center. This card shows the link with a one-tap
 * copy so the operator can share it.
 */
export function BookingLinkCard({ businessId }: { businessId: string }) {
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLink(businessId ? `${window.location.origin}/?biz=${businessId}` : '');
    setCopied(false);
  }, [businessId]);

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. non-secure context) — the input is
      // readonly and selects on focus, so the operator can copy manually.
    }
  }

  return (
    <div className="dash-card booking-link-card">
      <div className="dash-card-head">
        <span className="dash-card-icon"><Link2 size={18} /></span>
        <div><h2>Your booking page</h2><p>Share this link — requests come only to you</p></div>
      </div>
      <div className="booking-link-row">
        <input
          className="standard-input booking-link-input"
          readOnly
          value={link || 'Loading…'}
          onFocus={e => e.currentTarget.select()}
          aria-label="Your booking page link"
        />
        <button type="button" className="primary-button booking-link-copy" onClick={copy}>
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <p className="booking-link-hint">
        Customers who open this link book with your rates and vehicle categories, and their
        reservations appear only in your dashboard and dispatch center.
      </p>
    </div>
  );
}
