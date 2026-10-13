import { useEffect, useMemo, useState } from 'react';
import pb from '@/lib/pocketbase-client';

/**
 * A driver's auth record (from the separate `drivers` auth collection). This
 * is a distinct collection from the operator `users` collection, so drivers
 * and operators never share access — even though both sessions live in the
 * same `pb.authStore`.
 */
export type DriverRecord = {
	id: string;
	email: string;
	name: string;
	phone: string;
	vehicle: string;
	active: boolean;
	collectionName: string;
};

function isDriverRecord(record: unknown): record is DriverRecord {
	return (
		!!record &&
		(record as { collectionName?: string }).collectionName === 'drivers'
	);
}

/**
 * Session state for the signed-in driver: driver, isAuthed, isLoading, login,
 * signup, logout, refresh. No provider to mount — every caller reads the same
 * `pb.authStore`. The JWT lives in localStorage, so the session fills in after
 * hydration; render on `isLoading` to avoid a signed-out flash.
 */
export function useDriverAuth() {
	const [driver, setDriver] = useState<DriverRecord | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const record = pb.authStore.record;
		setDriver(isDriverRecord(record) ? record : null);
		setIsLoading(false);

		return pb.authStore.onChange((_token, record) => {
			setDriver(isDriverRecord(record) ? (record as DriverRecord) : null);
		});
	}, []);

	return useMemo(
		() => ({
			driver,
			isAuthed: Boolean(driver),
			isLoading,
			login: (email: string, password: string) =>
				pb.collection('drivers').authWithPassword(email, password),
			signup: async (
				email: string,
				password: string,
				extraFields: Record<string, unknown> = {},
			) => {
				await pb.collection('drivers').create({
					email,
					password,
					passwordConfirm: password,
					// Drivers are managed by operators from the dashboard
					// Drivers panel, which lists each driver's email so the
					// operator can contact them. Only operators (users) and
					// the driver themselves can list drivers (see the
					// `drivers` listRule), so exposing the email is safe.
					emailVisibility: true,
					...extraFields,
				});
				return pb.collection('drivers').authWithPassword(email, password);
			},
			logout: () => pb.authStore.clear(),
			refresh: async () => {
				if (!pb.authStore.record) return;
				const rec = await pb
					.collection('drivers')
					.getOne<DriverRecord>(pb.authStore.record.id);
				setDriver(rec);
			},
		}),
		[driver, isLoading],
	);
}

export default useDriverAuth;
