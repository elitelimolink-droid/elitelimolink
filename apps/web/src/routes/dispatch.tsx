import type { Route } from './+types/dispatch';
import { seo } from '@/lib/seo';
import { requireAuth } from '@/lib/require-auth';
import { DispatchCenter } from '@/components/dispatch/dispatch-center';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, {
    title: 'Dispatch Center | ELITELIMOLINK',
    description:
      'View, search, filter, and edit every reservation in real time. Manage booking statuses and update trip details from one dispatch board.',
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

import { TripBoard } from '@/components/dashboard/trip-board';

export default function DispatchPage({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <TripBoard
        email={loaderData.user?.email}
        userId={loaderData.user?.id ?? ''}
      />
    </main>
  );
}
