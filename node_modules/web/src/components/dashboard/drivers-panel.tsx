import { useEffect, useState } from 'react';
import {
  Loader2,
  Phone,
  Power,
  Trash2,
  Users,
} from 'lucide-react';
import pb from '@/lib/pocketbase-client';
import { handlePbAuthError } from '@/lib/pb-auth-error';
import { vehicles } from '@/lib/reservation';

type Driver = {
  id: string;
  email: string;
  name: string;
  phone: string;
  vehicle: string;
  active: boolean;
  created: string;
};

function vehicleLabel(key: string) {
  return vehicles.find((v) => v.id === key)?.name ?? key ?? '—';
}

const STATUS_DOT = { active: '#239476', inactive: '#8a94a5' };

/**
 * Operator-side management of driver accounts. Lists every driver, lets the
 * operator toggle a driver active/inactive, reassign their preferred vehicle,
 * or remove the account. Operators never set or reset a driver's password —
 * drivers create and control their own passwords from the driver registration
 * flow. Deleting a driver does not delete their past assigned reservations
 * (the relation is non-cascading); it only removes the driver account and
 * unlinks future assignments.
 */
export function DriversPanel() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      // Sort by creation time (newest first) when the `created` autodate
      // field exists. On a published site whose PocketBase hasn't yet
      // applied the `created`/`updated` driver migration, `-created` fails
      // with HTTP 400 "invalid sort field". Fall back to `name` (always
      // present on the drivers collection) so registered drivers still
      // appear instead of the panel reporting 0 drivers.
      let records: Driver[];
      try {
        records = await pb.collection('drivers').getFullList<Driver>({
          sort: '-created',
          requestKey: null,
        });
      } catch {
        records = await pb.collection('drivers').getFullList<Driver>({
          sort: 'name',
          requestKey: null,
        });
      }
      setDrivers(records);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError('Couldn’t load drivers. Please sign in again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleActive(d: Driver) {
    setBusyId(d.id);
    try {
      const updated = await pb.collection('drivers').update<Driver>(d.id, { active: !d.active });
      setDrivers((prev) => prev.map((x) => (x.id === d.id ? updated : x)));
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError('Couldn’t update that driver. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function changeVehicle(d: Driver, vehicle: string) {
    setBusyId(d.id);
    try {
      const updated = await pb.collection('drivers').update<Driver>(d.id, { vehicle });
      setDrivers((prev) => prev.map((x) => (x.id === d.id ? updated : x)));
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setError('Couldn’t update that driver. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await pb.collection('drivers').delete(deleteTarget.id);
      setDrivers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      if (handlePbAuthError(err)) return;
      setDeleteError('Couldn’t delete that driver. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  const activeCount = drivers.filter((d) => d.active).length;

  return (
    <div className="dash-card drivers-panel">
      <div className="dash-card-head">
        <span className="dash-card-icon"><Users size={18} /></span>
        <div>
          <h2>Drivers</h2>
          <p>{drivers.length} driver{drivers.length === 1 ? '' : 's'} · {activeCount} active</p>
        </div>
      </div>

      <p className="maps-desc">
        Drivers create their own accounts and passwords from the driver sign-up page
        (<a className="dashboard-link" href="/driver/register" target="_blank" rel="noreferrer">/driver/register</a>).
        Once a driver exists, assign trips to them from any reservation’s editor. You can set a
        driver’s preferred vehicle, activate or deactivate them, or remove an account — but you
        never set or reset a driver’s password.
      </p>

      {loading ? (
        <div className="dash-loading"><Loader2 size={20} /> Loading drivers…</div>
      ) : error ? (
        <p className="form-error" role="alert">{error}</p>
      ) : drivers.length === 0 ? (
        <div className="reservations-empty">
          <Users size={26} />
          <p>No drivers yet. Share the driver sign-up link so drivers can create their own accounts.</p>
        </div>
      ) : (
        <div className="drivers-list">
          {drivers.map((d) => (
            <div key={d.id} className={`driver-row${d.active ? '' : ' inactive'}`}>
              <div className="driver-row-main">
                <strong>{d.name || 'Unnamed driver'}</strong>
                <span className="driver-row-email">{d.email}</span>
                <div className="driver-row-meta">
                  {d.phone && <span><Phone size={13} /> {d.phone}</span>}
                  <select
                    className="driver-vehicle-select"
                    value={d.vehicle ?? 'sedan'}
                    disabled={busyId === d.id}
                    onChange={(e) => void changeVehicle(d, e.target.value)}
                    aria-label={`Preferred vehicle for ${d.name || d.email}`}
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="driver-row-actions">
                <span className={`status-chip status-chip-sm ${d.active ? 'status-confirmed' : 'status-no-show'}`}>
                  <span className="status-dot" style={{ background: d.active ? STATUS_DOT.active : STATUS_DOT.inactive }} />
                  {d.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  className="manage-link"
                  disabled={busyId === d.id}
                  onClick={() => void toggleActive(d)}
                >
                  <Power size={14} /> {d.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  className="manage-link"
                  style={{ color: '#b5333b' }}
                  disabled={busyId === d.id}
                  onClick={() => { setDeleteTarget(d); setDeleteError(''); }}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="trip-scrim" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="trip-confirm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete driver">
            <div className="trip-confirm-icon"><Trash2 size={22} /></div>
            <h3>Remove {deleteTarget.name || deleteTarget.email}?</h3>
            <p>This deletes the driver account. Past reservations stay in your records; future trip assignments to this driver are cleared.</p>
            {deleteError && <p className="trip-form-error">{deleteError}</p>}
            <div className="confirm-delete-actions">
              <button type="button" className="ghost-button" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="danger-button" disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? 'Removing…' : 'Remove driver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
