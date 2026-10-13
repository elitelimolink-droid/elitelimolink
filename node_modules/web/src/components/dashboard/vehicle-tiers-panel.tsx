import { useEffect, useRef, useState } from 'react';
import { CarFront, Check, ImageUp, Loader2, Save, Trash2 } from 'lucide-react';
import pb from '@/lib/pocketbase-client';
import { handlePbAuthError } from '@/lib/pb-auth-error';
import { DEFAULT_TIERS } from '@/lib/pricing';

type Tier = {
  id: string;
  key: string;
  name: string;
  detail: string;
  capacity: number;
  minFare: number;
  multiplier: number;
  perMileRate: number;
  active: boolean;
  sort: number;
  photo?: string;
};

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${pb.authStore.token}`,
  };
}

// Multipart uploads must NOT set Content-Type — the browser sets the boundary.
function authHeaderOnly() {
  return { Authorization: `Bearer ${pb.authStore.token}` };
}

/**
 * Operator editor for the vehicle categories of a single business. `businessId`
 * selects which operator's tiers are loaded and saved — the central operator
 * can edit any business they own or manage. Changes take effect on the next
 * booking via the public /api/pricing snapshot.
 */
export function VehicleTiersPanel({
  businessId,
  businessLabel,
}: {
  businessId: string;
  businessLabel?: string;
}) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [uploadingId, setUploadingId] = useState('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let active = true;
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    fetch('/api/business-tiers', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ op: 'load', biz: businessId }),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = new Error(data.error || 'Failed to load vehicle categories.') as Error & { status: number };
          err.status = res.status;
          throw err;
        }
        return data.tiers as Tier[];
      })
      .then(rows => {
        if (!active) return;
        setTiers(rows);
      })
      .catch((err) => {
        if (handlePbAuthError(err)) return;
        if (active) {
          setTiers([]);
          setLoadError(err instanceof Error ? err.message : 'Couldn’t load your vehicle categories — please sign in again and retry.');
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [businessId]);

  function update(id: string, patch: Partial<Tier>) {
    setTiers(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
    setSaved(false);
  }

  async function uploadPhoto(id: string, file: File) {
    if (!businessId || !id || uploadingId) return;
    setUploadingId(id);
    setError('');
    try {
      const fd = new FormData();
      fd.append('op', 'upload-photo');
      fd.append('biz', businessId);
      fd.append('tierId', id);
      fd.append('photo', file);
      const res = await fetch('/api/business-tiers', { method: 'POST', headers: authHeaderOnly(), body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || 'Couldn’t upload photo.') as Error & { status: number };
        err.status = res.status;
        throw err;
      }
      setTiers(prev => prev.map(t => (t.id === id ? { ...t, photo: data.photo } : t)));
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError(err instanceof Error ? err.message : 'Couldn’t upload photo. Please try again.');
    } finally {
      setUploadingId('');
    }
  }

  async function removePhoto(id: string) {
    if (!businessId || !id || uploadingId) return;
    setUploadingId(id);
    setError('');
    try {
      const res = await fetch('/api/business-tiers', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ op: 'remove-photo', biz: businessId, tierId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || 'Couldn’t remove photo.') as Error & { status: number };
        err.status = res.status;
        throw err;
      }
      setTiers(prev => prev.map(t => (t.id === id ? { ...t, photo: '' } : t)));
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError(err instanceof Error ? err.message : 'Couldn’t remove photo. Please try again.');
    } finally {
      setUploadingId('');
    }
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !businessId) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/business-tiers', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          op: 'save',
          biz: businessId,
          tiers: tiers.map((t, i) => ({
            id: t.id,
            key: t.key,
            name: t.name.trim() || t.key,
            detail: t.detail.trim(),
            capacity: Number(t.capacity) || 3,
            minFare: Number(t.minFare) || 0,
            multiplier: Number(t.multiplier) || 1,
            perMileRate: Number(t.perMileRate) || 0,
            active: !!t.active,
            sort: i + 1,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || 'Couldn’t save vehicle categories.') as Error & { status: number };
        err.status = res.status;
        throw err;
      }
      setTiers(data.tiers as Tier[]);
      setSaved(true);
      setLoadError('');
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError(err instanceof Error ? err.message : 'Couldn’t save vehicle categories. Please sign in again and retry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="dash-card vehicle-tiers-panel" onSubmit={save}>
      <div className="dash-card-head">
        <span className="dash-card-icon"><CarFront size={18} /></span>
        <div>
          <h2>Vehicle categories{businessLabel ? <span className="dash-card-business"> · {businessLabel}</span> : null}</h2>
          <p>Each vehicle category groups its details and applicable pricing together — edit the name, capacity, base rate, per-mile rate, and hourly multiplier per tier.</p>
        </div>
      </div>

      {loading ? (
        <div className="dash-loading"><Loader2 size={20} /> Loading vehicle categories…</div>
      ) : tiers.length === 0 ? (
        <div className="dash-loading">No vehicle categories found.</div>
      ) : (
        <>
          {loadError && (
            <p className="form-error" role="alert" style={{ background: '#fdeeee', border: '1px solid #f3d2d4', color: '#b5333b', padding: '10px 12px', borderRadius: 9, marginBottom: 16 }}>{loadError}</p>
          )}
          <div className="tiers-list">
            {tiers.map(t => (
              <div className="tier-row" key={t.id || t.key}>
                <div className="tier-head">
                  <span className="tier-key">{t.key === 'van' ? 'Suv' : t.key}</span>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      className="switch-input"
                      checked={t.active}
                      onChange={e => update(t.id, { active: e.target.checked })}
                    />
                    <span className="switch-track" aria-hidden="true" />
                    <span>{t.active ? 'Active on booking page' : 'Hidden from booking page'}</span>
                  </label>
                </div>
                <div className="tier-subgroup">
                  <span className="tier-subgroup-label">Category</span>
                  <div className="tier-category-grid">
                    <label className="rate-field">
                      <span>Display name</span>
                      <div className="rate-input">
                        <input type="text" value={t.name} onChange={e => update(t.id, { name: e.target.value })} />
                      </div>
                    </label>
                    <label className="rate-field">
                      <span>Capacity</span>
                      <div className="rate-input">
                        <input type="number" min={1} max={20} value={t.capacity} onChange={e => update(t.id, { capacity: Number(e.target.value) })} />
                        <em>pax</em>
                      </div>
                    </label>
                  </div>
                  <label className="rate-field tier-desc">
                    <span>Description</span>
                    <input className="standard-input" type="text" value={t.detail} onChange={e => update(t.id, { detail: e.target.value })} placeholder="Short description shown on the booking page" />
                  </label>
                </div>
                <div className="tier-subgroup tier-pricing">
                  <span className="tier-subgroup-label">Pricing</span>
                  <div className="tier-pricing-grid">
                    <label className="rate-field">
                      <span>Base rate</span>
                      <div className="rate-input">
                        <input type="number" step="0.01" min="0" value={t.minFare} onChange={e => update(t.id, { minFare: Number(e.target.value) })} />
                        <em>base</em>
                      </div>
                    </label>
                    <label className="rate-field">
                      <span>Per-mile rate</span>
                      <div className="rate-input">
                        <input type="number" step="0.01" min="0" value={t.perMileRate} onChange={e => update(t.id, { perMileRate: Number(e.target.value) })} />
                        <em>/ mi</em>
                      </div>
                    </label>
                    <label className="rate-field">
                      <span>Hourly multiplier</span>
                      <div className="rate-input">
                        <input type="number" step="0.05" min="0" value={t.multiplier} onChange={e => update(t.id, { multiplier: Number(e.target.value) })} />
                        <em>×</em>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="tier-subgroup tier-photo">
                  <span className="tier-subgroup-label">Vehicle photo</span>
                  <p className="tier-photo-hint">Shown to customers on the vehicle selection step so they can see the actual car. Upload a clear side or three-quarter view.</p>
                  <div className="tier-photo-row">
                    <div className="tier-photo-preview">
                      {t.photo ? (
                        <img src={t.photo} alt={t.name || t.key} />
                      ) : (
                        <span className="tier-photo-placeholder"><CarFront size={26} strokeWidth={1.5} /></span>
                      )}
                      {uploadingId === t.id && (
                        <span className="tier-photo-loading"><Loader2 size={18} /></span>
                      )}
                    </div>
                    <div className="tier-photo-actions">
                      <input
                        ref={el => { fileRefs.current[t.id] = el; }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="tier-photo-input"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) uploadPhoto(t.id, file);
                          e.target.value = '';
                        }}
                      />
                      <button type="button" className="tier-photo-button" onClick={() => fileRefs.current[t.id]?.click()} disabled={!!uploadingId}>
                        <ImageUp size={15} /> {t.photo ? 'Replace photo' : 'Upload photo'}
                      </button>
                      {t.photo && (
                        <button type="button" className="tier-photo-remove" onClick={() => removePhoto(t.id)} disabled={!!uploadingId}>
                          <Trash2 size={15} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dash-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving…' : <>{saved ? <Check size={17} /> : <Save size={17} />} {saved ? 'Saved' : 'Save vehicle categories'}</>}
            </button>
            {saved && <span className="saved-note">Saved — customers see these categories on their next booking.</span>}
          </div>
        </>
      )}
    </form>
  );
}
