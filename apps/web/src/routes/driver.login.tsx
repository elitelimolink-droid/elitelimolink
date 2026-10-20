import type { Route } from './+types/driver.login';
import { redirect } from 'react-router';
import { seo } from '@/lib/seo';
import { DriverSignIn } from '@/components/driver/driver-sign-in';
import pb from '@/lib/pocketbase-client';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, {
    title: 'Driver Sign In | BookNowLux',
    description: 'Drivers sign in to view assigned trips and manage their profile.',
    noindex: true,
  });
}

// Already-signed-in drivers go straight to the driver area.
export function clientLoader() {
  const record = pb.authStore.record as { collectionName?: string } | null;
  if (pb.authStore.isValid && record?.collectionName === 'drivers') {
    throw redirect('/driver');
  }
  return null;
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return null;
}

export default function DriverLoginPage() {
  return <DriverSignIn />;
}
