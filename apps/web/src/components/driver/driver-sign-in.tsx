import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useDriverAuth } from '@/hooks/use-driver-auth';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { ForgotPassword } from '@/components/shared/forgot-password';

export function DriverSignIn() {
  const { login } = useDriverAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/driver');
    } catch {
      setError('That email or password didn’t match. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <a href="/" className="page-brand" style={{ textDecoration: 'none' }}>
        <span className="brand-mark">B<span>L</span></span>
        <span className="brand-word">ELITELIMOLINK<span className="brand-sub"> / DRIVER</span></span>
      </a>
      {forgot ? (
        <div className="auth-card">
          <ThemeToggle className="theme-toggle card-theme" />
          <ForgotPassword collection="drivers" onCancel={() => setForgot(false)} />
        </div>
      ) : (
        <form className="auth-card" onSubmit={handleSubmit}>
          <ThemeToggle className="theme-toggle card-theme" />
          <div className="auth-head">
            <span className="auth-icon"><LockKeyhole size={20} /></span>
            <h1>Driver sign in</h1>
            <p>View your assigned trips and manage your profile.</p>
          </div>
          <label className="input-label">Email address<span className="required">*</span>
            <input className="standard-input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="input-label">Password<span className="required">*</span>
            <input className="standard-input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}
          </button>
          <button type="button" className="auth-forgot" onClick={() => { setForgot(true); setError(''); }}>
            Forgot password?
          </button>
          <a className="auth-switch" href="/driver/register">New driver? Create your account</a>
          <p className="auth-footnote">Driver access is separate from operator access.</p>
        </form>
      )}
    </main>
  );
}
