import type { Route } from './+types/driver';
import { seo } from '@/lib/seo';
import { requireDriverAuth } from '@/lib/require-auth';
import { DriverBoard } from '@/components/driver/driver-board';

export const links: Route.LinksFunction = () => [
  { rel: 'apple-touch-icon', href: '/icons/driver-icon.jpg' },
];

export function meta({ matches, location }: Route.MetaArgs) {
  return [
    ...seo({ matches, location }, {
      title: 'Driver Area | BookNowLux',
      description: 'View your assigned trips and manage your driver profile.',
      noindex: true,
    }),
    { name: 'apple-mobile-web-app-title', content: 'BookNowLux Driver' },
  ];
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
