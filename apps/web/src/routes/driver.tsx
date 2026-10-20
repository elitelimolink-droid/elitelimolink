import type { Route } from './+types/driver';
import { seo } from '@/lib/seo';
import { requireDriverAuth } from '@/lib/require-auth';
import { DriverBoard } from '@/components/driver/driver-board';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, {
    title: 'Driver Area | BookNowLux',
    description: 'View your assigned trips and manage your driver profile.',
    noindex: true,
  });
}

export function clientLoader() {
  return { driver: requireDriverAuth() };
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <div className="dashboard-loading" />;
}

export default function DriverPage({ loaderData }: Route.ComponentProps) {
  return (
    <DriverBoard
      driverId={loaderData.driver?.id ?? ''}
      driverEmail={loaderData.driver?.email ?? ''}
    />
  );
}
