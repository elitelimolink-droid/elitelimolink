import type { Route } from './+types/dispatch';
import { seo } from '@/lib/seo';
import { requireAuth } from '@/lib/require-auth';
import { DispatchCenter } from '@/components/dispatch/dispatch-center';
import { ThemeToggle } from '@/components/shared/theme-toggle';

export const links: Route.LinksFunction = () => [
  { rel: 'apple-touch-icon', href: '/icons/operator-icon.jpg' },
];

export function meta({ matches, location }: Route.MetaArgs) {
  return [
    ...seo({ matches, location }, {
      title: 'Dispatch Center | BookNowLux',
      description:
        'View, search, filter, and edit every reservation in real time. Manage booking statuses and update trip details from one dispatch board.',
      noindex: true,
    }),
    { name: 'apple-mobile-web-app-title', content: 'BookNowLux Dispatch' },
  ];
}

export function clientLoader() {
  return { user: requireAuth() };
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <div className="dashboard-loading" />;
}

export default function DispatchPage({ loaderData }: Route.ComponentProps) {
  return (
    <main className="dashboard-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="dashboard-header">
        <a href="/" className="page-brand" style={{ textDecoration: 'none' }}>
          <img src="/icons/operator-icon.jpg" alt="BookNowLux Dispatch" className="brand-logo-badge ops" />
          <span className="brand-word">BookNowLux<span className="brand-sub"> / DISPATCH</span></span>
        </a>
        <div className="dashboard-user">
          <span>{loaderData.user?.email}</span>
          <ThemeToggle className="theme-toggle compact" />
          <a href="/dashboard" className="dashboard-link">Settings</a>
          <a href="/" className="dashboard-link">View site</a>
        </div>
      </header>
      <div className="dashboard-shell">
        <div className="dashboard-intro">
          <span className="eyebrow">DISPATCH CENTER</span>
          <h1>Reservations, live</h1>
          <p>
            Every booking appears here the moment a customer requests it. Search and filter by
            status, open any reservation to update trip details, change its status, or remove it —
            changes sync back to the customer confirmation and your records instantly.
          </p>
        </div>
        <DispatchCenter />
      </div>
    </main>
  );
}
