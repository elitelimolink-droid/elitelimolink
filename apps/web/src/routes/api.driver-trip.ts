import PocketBase from 'pocketbase';
import { json, withApi, apiError, readJsonBody } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';

type ReservationRecord = {
  id: string;
  name?: string;
  status?: string;
  driver?: string;
  driverStatus?: string;
  driverNotes?: string;
  notes?: string;
  owner?: string;
  pickup?: string;
  dropoff?: string;
};

type CallerInfo = {
  id: string;
  name: string;
  email: string;
  isDriver: boolean;
  isOperator: boolean;
};

const PB_URL = () => process.env.POCKETBASE_URL || 'http://localhost:8090';

function decodePayload(token: string): { id?: string; collectionId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Validates the caller's JWT token, allowing both drivers and operators to
 * invoke driver trip updates.
 */
async function verifyCaller(authHeader: string | null): Promise<CallerInfo> {
  if (!authHeader) throw apiError(401, 'Authentication required.');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw apiError(401, 'Authentication required.');

  const payload = decodePayload(token);
  const callerId = payload?.id;
  if (!callerId) throw apiError(401, 'Invalid session token.');

  const client = new PocketBase(PB_URL());
  client.autoCancellation(false);
  client.authStore.save(token, null);

  // First try the drivers collection
  try {
    const d = await client.collection('drivers').getOne<{ id: string; name?: string; email?: string }>(callerId);
    return {
      id: d.id,
      name: d.name || d.email || 'Driver',
      email: d.email || '',
      isDriver: true,
      isOperator: false,
    };
  } catch {
    // Then try operators (users)
  }

  try {
    const u = await client.collection('users').getOne<{ id: string; name?: string; email?: string }>(callerId);
    return {
      id: u.id,
      name: u.name || u.email || 'Operator',
      email: u.email || '',
      isDriver: false,
      isOperator: true,
    };
  } catch {
    throw apiError(401, 'Session expired or user not found.');
  }
}

export const action = withApi(async ({ request }) => {
  const caller = await verifyCaller(request.headers.get('Authorization'));
  const body = await readJsonBody<{
    tripId?: string;
    action?: 'accept' | 'arrive' | 'pickup' | 'dropoff' | 'note';
    note?: string;
  }>(request);

  const tripId = (body.tripId || '').trim();
  if (!tripId) return apiError(422, 'tripId is required.');

  let trip: ReservationRecord;
  try {
    trip = await pocketbaseAdmin.getRecord<ReservationRecord>('reservations', tripId);
  } catch {
    return apiError(404, 'Reservation not found.');
  }

  // If called by a driver, verify that this trip is assigned to them (or currently unassigned)
  if (caller.isDriver && trip.driver && trip.driver !== caller.id) {
    return apiError(403, 'This trip is not assigned to you.');
  }

  const patch: Record<string, unknown> = {};
  let activityLabel = '';

  const guestName = trip.name || 'Guest';

  switch (body.action) {
    case 'accept':
      patch.driverStatus = 'accepted';
      if (!trip.status || trip.status === 'pending') {
        patch.status = 'confirmed';
      }
      if (!trip.driver && caller.isDriver) {
        patch.driver = caller.id;
      }
      activityLabel = `Driver ${caller.name} accepted ride for ${guestName}`;
      break;

    case 'arrive':
      patch.driverStatus = 'arrived';
      activityLabel = `Driver ${caller.name} arrived at pickup location for ${guestName}`;
      break;

    case 'pickup':
      patch.driverStatus = 'on_board';
      activityLabel = `Driver ${caller.name} picked up passenger ${guestName}`;
      break;

    case 'dropoff':
      patch.driverStatus = 'dropped_off';
      patch.status = 'completed';
      activityLabel = `Driver ${caller.name} dropped off passenger ${guestName} (Trip Completed)`;
      break;

    case 'note':
      // Just saving notes
      break;

    default:
      if (!body.note) {
        return apiError(422, 'Valid action (accept, arrive, pickup, dropoff, note) is required.');
      }
  }

  if (typeof body.note === 'string') {
    const cleanNote = body.note.trim();
    patch.driverNotes = cleanNote;
    if (body.action === 'note' && cleanNote) {
      activityLabel = `Driver ${caller.name} added trip note: “${cleanNote.slice(0, 80)}”`;
    }
  }

  let updatedRecord: ReservationRecord;
  try {
    updatedRecord = await pocketbaseAdmin.updateRecord<ReservationRecord>('reservations', tripId, patch);
  } catch (err: unknown) {
    // In case driverStatus or driverNotes field isn't in DB yet, fallback gracefully
    const fallbackPatch: Record<string, unknown> = {};
    if (patch.status) fallbackPatch.status = patch.status;
    if (patch.driver) fallbackPatch.driver = patch.driver;
    if (patch.driverNotes || patch.driverStatus) {
      const stamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const statusNote = patch.driverStatus ? `[Status: ${patch.driverStatus} at ${stamp}]` : '';
      const contentNote = patch.driverNotes ? `[Driver Note: ${patch.driverNotes}]` : '';
      const existing = trip.notes || '';
      fallbackPatch.notes = `${existing}\n${statusNote} ${contentNote}`.trim();
    }
    updatedRecord = await pocketbaseAdmin.updateRecord<ReservationRecord>('reservations', tripId, fallbackPatch);
  }

  // Record to activity_events collection if available
  if (activityLabel) {
    try {
      await pocketbaseAdmin.createRecord('activity_events', {
        type: 'driver_update',
        label: activityLabel,
        target: tripId,
        page: '/driver',
        owner: trip.owner || '',
      });
    } catch {
      // non-fatal
    }
  }

  return json({ ok: true, trip: updatedRecord });
});
