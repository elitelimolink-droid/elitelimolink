import { useState } from 'react';
import type { Route } from './+types/login';
import { useNavigate } from 'react-router';
import { seo } from '@/lib/seo';
import { useAuth } from '@/hooks/use-auth';
import { ArrowRight, LockKeyhole, UserPlus } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { ForgotPassword } from '@/components/shared/forgot-password';

export function meta({ matches, location }: Route.MetaArgs) {
  return seo({ matches, location }, {
    title: 'Operator Sign In | ELITELIMOLINK',
    description: 'Sign in or create your operator dashboard to manage fares, vehicle categories, dispatch notifications, and mapping for your own business.',
    noindex: true,
  });
}

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [forgot, setForgot] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expired] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('expired'),
  );

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'signup') {
        if (password.length < 8) {
          setError('Choose a password of at least 8 characters.');
          setSubmitting(false);
          return;
        }
        // Email is lowercased because PocketBase stores auth emails
        // lowercased; the auth-with-password identity match is case-sensitive
        // on the submitted value, so a capitalised email never matches.
        await signup(email.trim().toLowerCase(), password, { name: name.trim() });
      } else {
        await login(email.trim().toLowerCase(), password);
      }
      navigate('/dashboard');
    } catch (err) {
      if (mode === 'signin') {
        setError('That email or password didn’t match. Please try again.');
      } else {
        // Surface PocketBase's per-field validation (email taken, weak
        // password) when present, otherwise a friendly generic message.
        const data = (err as { response?: { data?: Record<string, { message?: string }> } })?.response?.data;
        const emailMsg = data?.email?.message;
        const passwordMsg = data?.password?.message;
        setError(
          emailMsg ? `Email: ${emailMsg}` :
          passwordMsg ? `Password: ${passwordMsg}` :
          'Couldn’t create your dashboard. Please try again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <main className="auth-page">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <a href="/" className="page-brand" style={{ textDecoration: 'none' }}>
        <span className="brand-mark">B<span>L</span></span>
        <span className="brand-word">ELITELIMOLINK<span className="brand-sub"> / OPERATOR</span></span>
      </a>
      {forgot ? (
        <div className="auth-card">
          <ThemeToggle className="theme-toggle card-theme" />
          <ForgotPassword collection="users" onCancel={() => setForgot(false)} />
        </div>
      ) : (
        <form className="auth-card" onSubmit={handleSubmit}>
          <ThemeToggle className="theme-toggle card-theme" />
          <div className="auth-head">
            <span className="auth-icon">{isSignup ? <UserPlus size={20} /> : <LockKeyhole size={20} />}</span>
            <h1>{isSignup ? 'Create your dashboard' : 'Operator sign in'}</h1>
            <p>
              {isSignup
                ? 'Each business gets its own private dashboard — rates, vehicle categories, reservations, and dispatch are never shared between operators.'
                : 'Manage your fares, dispatch email, and mapping from one place.'}
            </p>
          </div>
          {isSignup && (
            <label className="input-label">Business / your name<span className="optional">optional</span>
              <input className="standard-input" type="text" autoComplete="organization" placeholder="e.g. Smith Chauffeur Services" value={name} onChange={e => setName(e.target.value)} />
            </label>
          )}
          <label className="input-label">Email address<span className="required">*</span>
            <input className="standard-input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="input-label">Password<span className="required">*</span>
            <input className="standard-input" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={isSignup ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {expired && !error && (
            <p className="form-error" role="alert" style={{ color: '#9a6a2b', background: '#fff7e8', border: '1px solid #f3e2c0', padding: '10px 12px', borderRadius: 9 }}>
              Your session expired. Please sign in again.
            </p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting || isLoading}>
            {submitting ? (isSignup ? 'Creating…' : 'Signing in…') : <>{isSignup ? 'Create dashboard' : 'Sign in'} <ArrowRight size={17} /></>}
          </button>
          {!isSignup && (
            <button type="button" className="auth-forgot" onClick={() => { setForgot(true); setError(''); }}>
              Forgot password?
            </button>
          )}
          <button type="button" className="auth-switch" onClick={() => switchMode(isSignup ? 'signin' : 'signup')}>
            {isSignup ? 'Already have a dashboard? Sign in' : 'New business? Create your own dashboard'}
          </button>
          <a
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: '#2563eb',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Dispatch Dashboard'a Giriş Yap (Direct Access) →
          </a>
          <p className="auth-footnote">Every operator sees only their own business data.</p>
        </form>
      )}
    </main>
  );
}
