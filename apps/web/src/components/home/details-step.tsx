import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import type { ReservationDraft } from '@/lib/reservation';

type Props = { draft: ReservationDraft; update: (patch: Partial<ReservationDraft>) => void; onBack: () => void; onNext: () => void; error: string; setError: (value: string) => void };

export function DetailsStep({ draft, update, onBack, onNext, error, setError }: Props) {
  function change(patch: Partial<ReservationDraft>) { update(patch); setError(''); }
  return <>
    <div className="step-scroll">
      <div className="step-heading"><span className="eyebrow">ALMOST THERE</span><h2>Who’s traveling?</h2><p>We’ll use these details to keep you updated about your request.</p></div>
      <div className="details-fields">
        <label className="input-label">Full name <span className="required">*</span><input className="standard-input" type="text" autoComplete="name" placeholder="Your full name" value={draft.name} onChange={e => change({ name: e.target.value })} maxLength={150} /></label>
        <label className="input-label">Email address <span className="required">*</span><input className="standard-input" type="email" autoComplete="email" placeholder="you@example.com" value={draft.email} onChange={e => change({ email: e.target.value })} /></label>
        <label className="input-label">Phone number <span className="required">*</span><input className="standard-input" type="tel" autoComplete="tel" placeholder="(555) 000-0000" value={draft.phone} onChange={e => change({ phone: e.target.value })} maxLength={40} /></label>
        <label className="input-label">Flight number <span className="optional">Optional</span><input className="standard-input" type="text" placeholder="For airport pickups" value={draft.flight} onChange={e => change({ flight: e.target.value })} maxLength={60} /></label>
      </div>
      <div className="privacy-note"><LockKeyhole size={16} /><span>Your details are only used to arrange your ride. No account required.</span></div>
    </div>
    <div className="booking-bottom">{error && <p className="form-error" role="alert">{error}</p>}<div className="bottom-actions"><button type="button" className="back-button" onClick={onBack} aria-label="Go back"><ArrowLeft size={19} /></button><button type="button" className="primary-button" onClick={onNext}>Review request <ArrowRight size={17} /></button></div></div>
  </>;
}
