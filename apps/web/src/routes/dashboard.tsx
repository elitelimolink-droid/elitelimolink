import type { Route } from './+types/dashboard';
import { seo } from '@/lib/seo';
import { requireAuth } from '@/lib/require-auth';
import { TripBoard } from '@/components/dashboard/trip-board';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, {
    title: 'Dashboard | BookNowLux',
    description: 'Upcoming reservations grouped by trip date, with status, search, and operator settings.',
    noindex: true,
  });
}

export function clientLoader() {
  return { user: requireAuth() };
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <div className="dashboard-loading" />;
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <TripBoard
        email={loaderData.user?.email}
        userId={loaderData.user?.id ?? ''}
      />
    </main>
  );
}
