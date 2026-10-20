import type { Route } from './+types/driver.register';
import { redirect } from 'react-router';
import { seo } from '@/lib/seo';
import { DriverSignUp } from '@/components/driver/driver-sign-up';
import pb from '@/lib/pocketbase-client';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, {
    title: 'Driver Registration | BookNowLux',
    description: 'Create your driver account and choose your own password to start receiving trip assignments.',
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

export default function DriverRegisterPage() {
  return <DriverSignUp />;
}
