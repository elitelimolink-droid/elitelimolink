import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Baby,
  CarFront,
  Check,
  DoorOpen,
  Loader2,
  LogOut,
  MapPin,
  Plane,
  RefreshCw,
  Save,
  Users,
} from 'lucide-react';
import pb from '@/lib/pocketbase-client';
import { useDriverAuth, type DriverRecord } from '@/hooks/use-driver-auth';
import {
  compareByPickup,
  normalizeStatus,
  vehicles,
  type Vehicle,
} from '@/lib/reservation';
import { StatusBadge } from '@/components/dispatch/status-badge';
import { ThemeToggle } from '@/components/shared/theme-toggle';

type AssignedTrip = {
  id: string;
  service: string;
  pickup: string;
  dropoff: string;
  extraStop: string;
  pickupAt: string;
  returnAt: string;
  hours: number;
  vehicle: string;
  passengers: number;
  name: string;
  email: string;
  phone: string;
  flight: string;
  notes: string;
  carSeat: boolean;
  insidePickup: boolean;
  status: string;
  estimatedFareText: string;
  pickupLocal: string;
  sourceName: string;
};

function clock(iso: string) {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function dayLabel(iso: string) {
  if (!iso) return 'Date to confirm';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date to confirm';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function DriverBoard({
  driverId,
  driverEmail,
}: {
  driverId: string;
  driverEmail: string;
}) {
  const { logout, refresh } = useDriverAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<AssignedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile editing state.
  const [profile, setProfile] = useState({ name: '', phone: '', vehicle: 'sedan' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password change state.
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  async function loadTrips() {
    setError('');
    try {
      const records = await pb.collection('reservations').getFullList<AssignedTrip>({
        sort: 'pickupAt',
        requestKey: null,
      });
      setTrips(records);
    } catch {
      setError('Couldn’t load your trips. Please sign in again.');
    }
  }

  async function loadProfile() {
    if (!driverId) return;
    try {
      const rec = await pb.collection('drivers').getOne<DriverRecord>(driverId);
      setProfile({
        name: rec.name ?? '',
        phone: rec.phone ?? '',
        vehicle: rec.vehicle ?? 'sedan',
      });
    } catch {
      // non-fatal — profile fields stay editable
    }
  }

  useEffect(() => {
    setLoading(true);
    void loadTrips().finally(() => setLoading(false));
    void loadProfile();
  }, [driverId]);

  // Realtime: keep the trip list live so new assignments appear instantly.
  useEffect(() => {
    void pb
      .collection('reservations')
      .subscribe('*', (e) => {
        setTrips((prev) => {
          if (e.action === 'delete') return prev.filter((r) => r.id !== e.record.id);
          const next = e.record as unknown as AssignedTrip;
          return prev.some((r) => r.id === next.id)
            ? prev.map((r) => (r.id === next.id ? next : r))
            : [next, ...prev];
        });
      })
      .catch(() => {});
    return () => {
      void pb.collection('reservations').unsubscribe('*').catch(() => {});
    };
  }, []);

  const sorted = useMemo(() => [...trips].sort(compareByPickup), [trips]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; rows: AssignedTrip[] }>();
    for (const t of sorted) {
      const key = t.pickupAt || 'unscheduled';
      const bucket = map.get(key) ?? { label: dayLabel(t.pickupAt), rows: [] };
      bucket.rows.push(t);
      map.set(key, bucket);
    }
    return [...map.values()];
  }, [sorted]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingProfile || !driverId) return;
    setSavingProfile(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      await pb.collection('drivers').update(driverId, {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        vehicle: profile.vehicle,
      });
      await refresh();
      setProfileSaved(true);
    } catch {
      setProfileError('Couldn’t save your profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingPw || !driverId) return;
    if (pw.password.length < 8) {
      setPwError('Choose a password of at least 8 characters.');
      return;
    }
    if (pw.password !== pw.confirm) {
      setPwError('The passwords don’t match.');
      return;
    }
    setSavingPw(true);
    setPwError('');
    setPwSaved(false);
    try {
      await pb.collection('drivers').update(driverId, {
        password: pw.password,
        passwordConfirm: pw.confirm,
      });
      setPw({ password: '', confirm: '' });
      setPwSaved(true);
    } catch {
      setPwError('Couldn’t change your password. Please try again.');
    } finally {
      setSavingPw(false);
    }
  }

  function signOut() {
    logout();
    navigate('/driver/login');
  }

  return (
    <main className="dashboard-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="dashboard-header">
        <a href="/" className="page-brand" style={{ textDecoration: 'none' }}>
          <span className="brand-mark">B<span>L</span></span>
          <span className="brand-word">ELITELIMOLINK<span className="brand-sub"> / DRIVER</span></span>
        </a>
        <div className="dashboard-user">
          <span>{driverEmail}</span>
          <ThemeToggle className="theme-toggle compact" />
          <button type="button" className="dashboard-link" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <div className="dashboard-shell">
        <div className="dashboard-intro">
          <span className="eyebrow">DRIVER AREA</span>
          <h1>Your assigned trips</h1>
          <p>
            Trips an operator assigns to you appear here in real time. You can read every detail —
            pickup, dropoff, passenger contact, and notes — and manage your own profile and password.
          </p>
        </div>

        <div className="dashboard-grid">
          <div className="dash-card">
            <div className="dash-card-head">
              <span className="dash-card-icon"><MapPin size={18} /></span>
              <div>
                <h2>Assigned trips</h2>
                <p>{trips.length} trip{trips.length === 1 ? '' : 's'} assigned to you</p>
              </div>
            </div>

            {loading ? (
              <div className="dash-loading"><Loader2 size={20} /> Loading your trips…</div>
            ) : error ? (
              <p className="form-error" role="alert">{error}</p>
            ) : trips.length === 0 ? (
              <div className="reservations-empty">
                <RefreshCw size={26} />
                <p>No trips assigned to you yet. New assignments appear here automatically.</p>
              </div>
            ) : (
              <div className="reservations-list">
                {groups.map((group) => (
                  <div key={group.label} className="reservation-card">
                    <div className="reservation-card-top">
                      <div className="reservation-card-id">
                        <strong>{group.label}</strong>
                        <span className="reservation-ref">{group.rows.length} trip{group.rows.length === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                    {group.rows.map((t) => {
                      const st = normalizeStatus(t.status);
                      const round = Boolean(t.returnAt);
                      return (
                        <div key={t.id} className="driver-trip">
                          <div className="driver-trip-head">
                            <strong>{t.name || 'Unnamed guest'}</strong>
                            <StatusBadge value={st} />
                          </div>
                          {t.sourceName && <p className="driver-trip-source">{t.sourceName}</p>}
                          <div className="driver-trip-when">
                            <strong>{clock(t.pickupAt)}</strong>
                            <small>{t.pickupLocal || 'Time to confirm'}</small>
                          </div>
                          <div className="reservation-card-route">
                            {t.pickup && (
                              <span><span className="pickup-marker" /> {t.pickup}</span>
                            )}
                            {t.extraStop && (
                              <span><span className="stop-marker" /> {t.extraStop}</span>
                            )}
                            {t.dropoff && (
                              <span><span className="dropoff-marker mini" /> {t.dropoff}</span>
                            )}
                          </div>
                          <div className="reservation-card-meta">
                            {t.vehicle && <span><CarFront size={14} /> {vehicles.find(v => v.id === t.vehicle)?.name ?? t.vehicle}</span>}
                            {t.passengers > 0 && <span><Users size={14} /> {t.passengers}</span>}
                            {round && <span><RefreshCw size={14} /> Round trip</span>}
                            {t.flight && <span><Plane size={14} /> {t.flight}</span>}
                            {t.carSeat && <span><Baby size={14} /> Car seat</span>}
                            {t.insidePickup && <span><DoorOpen size={14} /> Inside pickup</span>}
                            {t.phone && <a href={`tel:${t.phone.replace(/[^\d+]/g, '')}`}>Call {t.phone}</a>}
                          </div>
                          {t.notes && <p className="driver-trip-notes">{t.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-side">
            <form className="dash-card" onSubmit={saveProfile}>
              <div className="dash-card-head">
                <span className="dash-card-icon"><Users size={18} /></span>
                <div>
                  <h2>Your profile</h2>
                  <p>Visible to operators who assign trips.</p>
                </div>
              </div>
              <label className="input-label">Full name
                <input className="standard-input" type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              </label>
              <label className="input-label" style={{ marginTop: 13 }}>Phone
                <input className="standard-input" type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              </label>
              <label className="input-label" style={{ marginTop: 13 }}>Preferred vehicle
                <select className="standard-input" value={profile.vehicle} onChange={e => setProfile(p => ({ ...p, vehicle: e.target.value as Vehicle }))}>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </label>
              {profileError && <p className="form-error" role="alert" style={{ marginTop: 13 }}>{profileError}</p>}
              <div className="dash-actions">
                <button type="submit" className="primary-button" disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : <>{profileSaved ? <Check size={17} /> : <Save size={17} />} {profileSaved ? 'Saved' : 'Save profile'}</>}
                </button>
              </div>
            </form>

            <form className="dash-card" onSubmit={savePassword}>
              <div className="dash-card-head">
                <span className="dash-card-icon"><LogOut size={18} /></span>
                <div>
                  <h2>Change password</h2>
                  <p>Choose and control your own password.</p>
                </div>
              </div>
              <label className="input-label">New password
                <input className="standard-input" type="password" autoComplete="new-password" minLength={8} value={pw.password} onChange={e => setPw(p => ({ ...p, password: e.target.value }))} />
              </label>
              <label className="input-label" style={{ marginTop: 13 }}>Confirm new password
                <input className="standard-input" type="password" autoComplete="new-password" minLength={8} value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
              </label>
              {pwError && <p className="form-error" role="alert" style={{ marginTop: 13 }}>{pwError}</p>}
              <div className="dash-actions">
                <button type="submit" className="primary-button" disabled={savingPw}>
                  {savingPw ? 'Updating…' : <>{pwSaved ? <Check size={17} /> : <Save size={17} />} {pwSaved ? 'Updated' : 'Update password'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
