import PocketBase from 'pocketbase';
import { json, withApi, apiError, readJsonBody } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';

type DriverRecord = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicle?: string;
  active?: boolean;
  onDuty?: boolean;
  lat?: number;
  lng?: number;
  heading?: number;
  speed?: number;
  lastLocationUpdate?: string;
  currentTripId?: string;
};

type ReservationRecord = {
  id: string;
  name?: string;
  phone?: string;
  pickup?: string;
  dropoff?: string;
  extraStop?: string;
  pickupAt?: string;
  status?: string;
  driver?: string;
  driverStatus?: string;
  driverNotes?: string;
  sourceName?: string;
  vehicle?: string;
  flight?: string;
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

function extractToken(request: Request): string {
  const auth = request.headers.get('Authorization') || request.headers.get('authorization') || '';
  if (auth) {
    const clean = auth.replace(/^Bearer\s+/i, '').trim();
    if (clean) return clean;
  }
  const cookie = request.headers.get('cookie') || request.headers.get('Cookie') || '';
  const match = cookie.match(/pb_auth=([^;]+)/);
  if (match) {
    try {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      if (parsed?.token) return parsed.token;
    } catch {}
  }
  return '';
}

/**
 * Validates the caller from the Authorization Bearer token or pb_auth cookie.
 */
async function verifyCaller(request: Request): Promise<{ id: string; isDriver: boolean; isOperator: boolean }> {
  const token = extractToken(request);
  if (!token) throw apiError(401, 'Authentication required.');

  const payload = decodePayload(token);
  const callerId = payload?.id;
  if (!callerId) throw apiError(401, 'Invalid session token.');

  // Check operators (users collection) first via PocketBase admin
  try {
    await pocketbaseAdmin.getRecord('users', callerId);
    return { id: callerId, isDriver: false, isOperator: true };
  } catch {
    // Check drivers
  }

  // Check drivers collection
  try {
    await pocketbaseAdmin.getRecord('drivers', callerId);
    return { id: callerId, isDriver: true, isOperator: false };
  } catch {
    throw apiError(401, 'Session expired or user not found.');
  }
}

/**
 * GET /api/driver-location — Returns all drivers with their latest GPS positions
 * and current active assigned reservations for the operator's Drive View / Live Fleet Map.
 */
export const loader = withApi(async ({ request }) => {
  await verifyCaller(request);

  let drivers: DriverRecord[] = [];
  try {
    const list = await pocketbaseAdmin.listRecords<DriverRecord>('drivers', {
      perPage: 100,
      sort: 'name',
    });
    drivers = list.items;
  } catch (err) {
    return json({ ok: false, drivers: [], error: 'Could not load drivers.' });
  }

  // Fetch active reservations to link with drivers
  let activeReservations: ReservationRecord[] = [];
  try {
    const resList = await pocketbaseAdmin.listRecords<ReservationRecord>('reservations', {
      perPage: 200,
      sort: 'pickupAt',
      filter: 'status != "cancelled" && status != "no_show"',
    });
    activeReservations = resList.items;
  } catch {
    // non-fatal
  }

  // Combine driver location with active trip details
  const enrichedDrivers = drivers.map((d) => {
    // Find active trip assigned to this driver
    const assigned = activeReservations.filter((r) => r.driver === d.id);
    // Prioritize in-progress or upcoming trip
    const activeTrip =
      assigned.find((r) => r.driverStatus === 'on_board' || r.driverStatus === 'arrived' || r.driverStatus === 'accepted') ||
      assigned.find((r) => r.status === 'confirmed' || r.status === 'pending') ||
      assigned[0] ||
      null;

    const hasLiveGps = typeof d.lat === 'number' && typeof d.lng === 'number' && Boolean(d.lastLocationUpdate);

    return {
      id: d.id,
      name: d.name || d.email || 'Chauffeur',
      email: d.email,
      phone: d.phone,
      vehicle: d.vehicle || 'sedan',
      active: d.active !== false,
      onDuty: d.onDuty !== false,
      lat: typeof d.lat === 'number' ? d.lat : null,
      lng: typeof d.lng === 'number' ? d.lng : null,
      defaultLat: 40.8501, // Teterboro Fleet Base
      defaultLng: -74.0608,
      hasLiveGps,
      heading: typeof d.heading === 'number' ? d.heading : 0,
      speed: typeof d.speed === 'number' ? d.speed : 0,
      lastLocationUpdate: d.lastLocationUpdate || null,
      activeTrip: activeTrip
        ? {
            id: activeTrip.id,
            passengerName: activeTrip.name || 'Guest',
            phone: activeTrip.phone || '',
            pickup: activeTrip.pickup || '',
            dropoff: activeTrip.dropoff || '',
            extraStop: activeTrip.extraStop || '',
            pickupAt: activeTrip.pickupAt || '',
            driverStatus: activeTrip.driverStatus || 'assigned',
            status: activeTrip.status || 'pending',
            sourceName: activeTrip.sourceName || '',
            flight: activeTrip.flight || '',
            vehicle: activeTrip.vehicle || '',
          }
        : null,
    };
  });

  return json({ ok: true, drivers: enrichedDrivers, timestamp: Date.now() });
});

/**
 * POST /api/driver-location — Called periodically by the driver portal to report
 * real-time GPS coordinates, speed, and heading.
 */
export const action = withApi(async ({ request }) => {
  const caller = await verifyCaller(request);
  const body = await readJsonBody<{
    lat?: number;
    lng?: number;
    heading?: number;
    speed?: number;
    tripId?: string;
    onDuty?: boolean;
    driverId?: string;
  }>(request);

  // If called by an operator with driverId, allows manual/simulator update
  const targetDriverId = caller.isOperator && body.driverId ? body.driverId : caller.id;

  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return apiError(422, 'Valid lat between -90 and 90 is required.');
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return apiError(422, 'Valid lng between -180 and 180 is required.');
  }

  const patch: Record<string, unknown> = {
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    lastLocationUpdate: new Date().toISOString(),
  };

  if (typeof body.heading === 'number') patch.heading = Math.round(body.heading);
  if (typeof body.speed === 'number') patch.speed = Math.max(0, Math.round(body.speed * 10) / 10);
  if (typeof body.onDuty === 'boolean') patch.onDuty = body.onDuty;
  if (body.tripId) patch.currentTripId = body.tripId;

  try {
    await pocketbaseAdmin.updateRecord('drivers', targetDriverId, patch);
  } catch (err) {
    // If fields don't exist yet, non-fatal
    return json({ ok: false, warning: 'Failed to write GPS fields to database.' });
  }

  return json({ ok: true, timestamp: Date.now() });
});
