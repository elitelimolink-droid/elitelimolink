import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, UserPlus } from 'lucide-react';
import { useDriverAuth } from '@/hooks/use-driver-auth';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { vehicles } from '@/lib/reservation';

export function DriverSignUp() {
  const { signup } = useDriverAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState<string>('sedan');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 8) {
      setError('Choose a password of at least 8 characters.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await signup(email.trim().toLowerCase(), password, {
        name: name.trim(),
        phone: phone.trim(),
        vehicle,
        active: true,
      });
      navigate('/driver');
    } catch (err) {
      const data = (err as { response?: { data?: Record<string, { message?: string }> } })?.response?.data;
      const emailMsg = data?.email?.message;
      const passwordMsg = data?.password?.message;
      setError(
        emailMsg ? `Email: ${emailMsg}` :
        passwordMsg ? `Password: ${passwordMsg}` :
        'Couldn’t create your driver account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <a href="/driver/login" className="page-brand" style={{ textDecoration: 'none' }}>
        <span className="brand-mark">E<span>L</span></span>
        <span className="brand-word">ELITELIMOLINK<span className="brand-sub"> / CHAUFFEUR</span></span>
      </a>
      <form className="auth-card" onSubmit={handleSubmit}>
        <ThemeToggle className="theme-toggle card-theme" />
        <div className="auth-head">
          <span className="auth-icon"><UserPlus size={20} /></span>
          <h1>Create your driver account</h1>
          <p>Set up your own sign-in and choose your own password. An operator will assign trips to you.</p>
        </div>
        <label className="input-label">Full name<span className="required">*</span>
          <input className="standard-input" type="text" autoComplete="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <label className="input-label">Email address<span className="required">*</span>
          <input className="standard-input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label className="input-label">Phone<span className="optional">optional</span>
          <input className="standard-input" type="tel" autoComplete="tel" placeholder="Mobile number" value={phone} onChange={e => setPhone(e.target.value)} />
        </label>
        <label className="input-label">Preferred vehicle<span className="optional">optional</span>
          <select className="standard-input" value={vehicle} onChange={e => setVehicle(e.target.value)}>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </label>
        <label className="input-label">Create a password<span className="required">*</span>
          <input className="standard-input" type="password" autoComplete="new-password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Creating…' : <>Create account <ArrowRight size={17} /></>}
        </button>
        <a className="auth-switch" href="/driver/login">Already have a driver account? Sign in</a>
        <p className="auth-footnote">You choose and control your own password.</p>
      </form>
    </main>
  );
}
