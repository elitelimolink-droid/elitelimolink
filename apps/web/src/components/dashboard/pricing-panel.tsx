import { useEffect, useState } from 'react';
import { Check, CircleDollarSign, Clock3, Eye, Loader2, Mail, Percent, Save, Settings2 } from 'lucide-react';
import pb from '@/lib/pocketbase-client';
import { handlePbAuthError } from '@/lib/pb-auth-error';
import { DEFAULT_PRICING, type PricingSettings } from '@/lib/pricing';

type SettingsRecord = PricingSettings & {
  id: string;
  businessName: string;
  dispatchEmail: string;
  dispatchName: string;
  customerEmailEnabled: boolean;
};

const emptyForm: PricingSettings & { businessName: string; dispatchEmail: string; dispatchName: string; customerEmailEnabled: boolean } = {
  ...DEFAULT_PRICING,
  businessName: '',
  dispatchEmail: '',
  dispatchName: 'Dispatch',
  customerEmailEnabled: true,
};

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${pb.authStore.token}`,
  };
}

/**
 * Fare pricing editor for a single business. `businessId` selects which
 * operator's settings are loaded and saved — the central operator can edit
 * any business they own or manage (the server authorizes each call). The
 * business name field is part of this panel, so renaming a business and
 * saving propagates the new name to the dashboard selector, booking page,
 * and confirmation emails. `onSaved` fires after a successful save so the
 * dashboard can refresh its business list.
 */
export function PricingPanel({
  businessId,
  businessLabel,
  onSaved,
}: {
  businessId: string;
  businessLabel?: string;
  onSaved?: (businessName: string) => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  function applyRecord(first: SettingsRecord) {
    setForm({
      baseRate: first.baseRate,
      minimumFare: first.minimumFare,
      perMileRate: first.perMileRate,
      hourlyRate: first.hourlyRate,
      currency: first.currency,
      tipEnabled: !!first.tipEnabled,
      tipPercent: first.tipPercent ?? DEFAULT_PRICING.tipPercent,
      taxEnabled: !!first.taxEnabled,
      taxPercent: first.taxPercent ?? DEFAULT_PRICING.taxPercent,
      tollsEnabled: !!first.tollsEnabled,
      fareVisible: !!first.fareVisible,
      paymentRequired: first.paymentRequired !== false,
      carSeatPrice: first.carSeatPrice ?? DEFAULT_PRICING.carSeatPrice,
      extraStopPrice: first.extraStopPrice ?? DEFAULT_PRICING.extraStopPrice,
      insidePickupPrice: first.insidePickupPrice ?? DEFAULT_PRICING.insidePickupPrice,
      minAdvanceHours: first.minAdvanceHours ?? DEFAULT_PRICING.minAdvanceHours,
      businessName: first.businessName ?? '',
      dispatchEmail: first.dispatchEmail ?? '',
      dispatchName: first.dispatchName ?? 'Dispatch',
      customerEmailEnabled: !!first.customerEmailEnabled,
    });
  }

  useEffect(() => {
    let active = true;
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    fetch('/api/business-settings', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ op: 'load', biz: businessId }),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = new Error(data.error || 'Failed to load settings.') as Error & { status: number };
          err.status = res.status;
          throw err;
        }
        return data.settings;
      })
      .then((s: SettingsRecord) => {
        if (!active) return;
        applyRecord(s);
      })
      .catch((err) => {
        if (handlePbAuthError(err)) return;
        if (active) setLoadError(err instanceof Error ? err.message : 'Couldn’t load your saved rates — showing defaults below.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [businessId]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !businessId) return;
    setSaving(true);
    setError('');
    setSaved(false);
    const payload = {
      baseRate: Number(form.baseRate) || 0,
      minimumFare: Number(form.minimumFare) || 0,
      perMileRate: Number(form.perMileRate) || 0,
      hourlyRate: Number(form.hourlyRate) || 0,
      currency: form.currency.trim().toUpperCase() || 'USD',
      tipEnabled: !!form.tipEnabled,
      tipPercent: Number(form.tipPercent) || 0,
      taxEnabled: !!form.taxEnabled,
      taxPercent: Number(form.taxPercent) || 0,
      tollsEnabled: !!form.tollsEnabled,
      fareVisible: !!form.fareVisible,
      paymentRequired: form.paymentRequired !== false,
      carSeatPrice: Number(form.carSeatPrice) || 0,
      extraStopPrice: Number(form.extraStopPrice) || 0,
      insidePickupPrice: Number(form.insidePickupPrice) || 0,
      minAdvanceHours: Math.min(24, Math.max(1, Math.round(Number(form.minAdvanceHours) || DEFAULT_PRICING.minAdvanceHours))),
      businessName: form.businessName.trim(),
      dispatchEmail: form.dispatchEmail.trim(),
      dispatchName: form.dispatchName.trim(),
      customerEmailEnabled: !!form.customerEmailEnabled,
    };
    try {
      const res = await fetch('/api/business-settings', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ op: 'save', biz: businessId, settings: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || 'Couldn’t save settings.') as Error & { status: number };
        err.status = res.status;
        throw err;
      }
      applyRecord(data.settings as SettingsRecord);
      setSaved(true);
      setLoadError('');
      onSaved?.(data.settings.businessName ?? payload.businessName);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError(err instanceof Error ? err.message : 'Couldn’t save settings. Please sign in again and retry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="dash-card pricing-panel" onSubmit={save}>
      <div className="dash-card-head">
        <span className="dash-card-icon"><Settings2 size={18} /></span>
        <div>
          <h2>Business settings{businessLabel ? <span className="dash-card-business"> · {businessLabel}</span> : null}</h2>
          <p>Set tips, taxes, tolls, booking options, and notifications. Vehicle rates stay in Vehicle categories.</p>
        </div>
      </div>

      {loading ? (
        <div className="dash-loading"><Loader2 size={20} /> Loading settings…</div>
      ) : (
        <>
          {loadError && (
            <p className="form-error" role="alert" style={{ background: '#fdeeee', border: '1px solid #f3d2d4', color: '#b5333b', padding: '10px 12px', borderRadius: 9, marginBottom: 16 }}>{loadError}</p>
          )}
          <div className="dispatch-section compact pricing-panel-first">
            <h3><Eye size={15} /> Booking options</h3>
            <label className="toggle-row">
              <input type="checkbox" checked={form.fareVisible} onChange={e => set('fareVisible', e.target.checked)} className="switch-input" />
              <span className="switch-track" aria-hidden="true" />
              <span>Show estimated prices to customers</span>
            </label>
            <label className="toggle-row">
              <input type="checkbox" checked={form.paymentRequired} onChange={e => set('paymentRequired', e.target.checked)} className="switch-input" />
              <span className="switch-track" aria-hidden="true" />
              <span>Require online payment to book</span>
            </label>
            <p className="dispatch-hint">{form.paymentRequired ? 'Customers pay through Square checkout before confirmation.' : 'Checkout is skipped — customers confirm on the booking page with no charge.'}</p>
            <div className="advance-notice-row">
              <label className="advance-notice-label" htmlFor="advance-hours"><Clock3 size={14} /> Minimum advance notice</label>
              <div className="advance-notice-control">
                <select id="advance-hours" className="advance-notice-select" value={form.minAdvanceHours} onChange={e => set('minAdvanceHours', Number(e.target.value))}>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h} hour{h === 1 ? '' : 's'}</option>)}
                </select>
                <span className="advance-notice-hint">before pickup</span>
              </div>
            </div>
          </div>

          <div className="dispatch-section compact">
            <h3><Percent size={15} /> Tips, taxes &amp; tolls</h3>
            <label className="toggle-row toggle-row-inline">
              <input type="checkbox" checked={form.tipEnabled} onChange={e => set('tipEnabled', e.target.checked)} className="switch-input" />
              <span className="switch-track" aria-hidden="true" />
              <span>Add a gratuity (tip)</span>
              {form.tipEnabled && (
                <span className="inline-percent">
                  <input type="number" step="0.1" min="0" max="100" value={form.tipPercent} onChange={e => set('tipPercent', Number(e.target.value))} aria-label="Tip percentage" />
                  <em>% of fare</em>
                </span>
              )}
            </label>
            <label className="toggle-row toggle-row-inline">
              <input type="checkbox" checked={form.taxEnabled} onChange={e => set('taxEnabled', e.target.checked)} className="switch-input" />
              <span className="switch-track" aria-hidden="true" />
              <span>Add tax</span>
              {form.taxEnabled && (
                <span className="inline-percent">
                  <input type="number" step="0.01" min="0" max="100" value={form.taxPercent} onChange={e => set('taxPercent', Number(e.target.value))} aria-label="Tax percentage" />
                  <em>% of fare + tolls</em>
                </span>
              )}
            </label>
            <label className="toggle-row">
              <input type="checkbox" checked={form.tollsEnabled} onChange={e => set('tollsEnabled', e.target.checked)} className="switch-input" />
              <span className="switch-track" aria-hidden="true" />
              <span>Include estimated tolls in the total</span>
            </label>
            {form.tollsEnabled && <p className="dispatch-hint">Estimated from the driving route when a maps key is set.</p>}
          </div>

          <div className="dispatch-section compact">
            <h3><CircleDollarSign size={15} /> Optional add-on prices</h3>
            <p className="dispatch-hint">Set a flat price for each optional add-on. Customers see the cost when they select it, and it is added to their total.</p>
            <div className="addon-price-grid">
              <label className="rate-field">
                <span>Car seat</span>
                <div className="rate-input">
                  <input type="number" step="0.01" min="0" value={form.carSeatPrice} onChange={e => set('carSeatPrice', Number(e.target.value))} />
                  <em>flat</em>
                </div>
              </label>
              <label className="rate-field">
                <span>Extra stop</span>
                <div className="rate-input">
                  <input type="number" step="0.01" min="0" value={form.extraStopPrice} onChange={e => set('extraStopPrice', Number(e.target.value))} />
                  <em>flat</em>
                </div>
              </label>
              <label className="rate-field">
                <span>Inside pickup</span>
                <div className="rate-input">
                  <input type="number" step="0.01" min="0" value={form.insidePickupPrice} onChange={e => set('insidePickupPrice', Number(e.target.value))} />
                  <em>flat</em>
                </div>
              </label>
            </div>
          </div>

          <div className="dispatch-section compact">
            <h3><Mail size={15} /> Reservation notifications</h3>
            <div className="editor-grid-two">
              <label className="input-label">Dispatch / driver email
                <input className="standard-input" type="email" placeholder="dispatch@yourcompany.com" value={form.dispatchEmail} onChange={e => set('dispatchEmail', e.target.value)} />
              </label>
              <label className="input-label">Sender display name
                <input className="standard-input" type="text" placeholder="Your business dispatch" value={form.dispatchName} onChange={e => set('dispatchName', e.target.value)} />
              </label>
            </div>
            <label className="toggle-row">
              <input type="checkbox" checked={form.customerEmailEnabled} onChange={e => set('customerEmailEnabled', e.target.checked)} className="switch-input" />
              <span className="switch-track" aria-hidden="true" />
              <span>Also email a confirmation to the customer</span>
            </label>
            {!form.dispatchEmail && <p className="dispatch-hint">No dispatch email set — reservation emails won’t be sent until you add one above.</p>}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dash-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving…' : <>{saved ? <Check size={17} /> : <Save size={17} />} {saved ? 'Saved' : 'Save changes'}</>}
            </button>
            {saved && <span className="saved-note">Saved — customers see these rates on their next booking.</span>}
          </div>
        </>
      )}
    </form>
  );
}
