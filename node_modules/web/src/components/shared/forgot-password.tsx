import { useState } from 'react';
import { ArrowLeft, MailCheck } from 'lucide-react';
import pb from '@/lib/pocketbase-client';

/**
 * A self-contained "Forgot password?" flow for a PocketBase auth collection.
 *
 * Uses PocketBase's built-in password-reset mechanism: `requestPasswordReset`
 * emails the user a link to the platform's hosted reset page, where they set a
 * new password themselves. No password is ever handled here.
 *
 * The success message is identical whether or not the email has an account, so
 * the option never reveals whether an address is registered.
 */
export function ForgotPassword({
  collection,
  onCancel,
}: {
  collection: 'users' | 'drivers';
  onCancel: () => void;
}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await pb.collection(collection).requestPasswordReset(email.trim().toLowerCase());
    } catch {
      // Swallow errors: showing the same "check your email" message regardless
      // of outcome avoids revealing whether the email has an account.
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="forgot-success">
        <span className="auth-icon"><MailCheck size={20} /></span>
        <h1>Check your email</h1>
        <p>
          If an account exists for <strong>{email.trim().toLowerCase()}</strong>, we've sent a link to reset your password.
          The link expires after a short time. Check your spam folder if you don't see it.
        </p>
        <button type="button" className="primary-button" onClick={onCancel}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form className="forgot-form" onSubmit={handleSubmit}>
      <button type="button" className="forgot-back" onClick={onCancel}>
        <ArrowLeft size={16} /> Back to sign in
      </button>
      <div className="auth-head">
        <span className="auth-icon"><MailCheck size={20} /></span>
        <h1>Reset your password</h1>
        <p>
          Enter your email and we'll send a link to set a new password. The reset
          applies only to your {collection === 'drivers' ? 'driver' : 'operator'} account.
        </p>
      </div>
      <label className="input-label">Email address<span className="required">*</span>
        <input
          className="standard-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? 'Sending link…' : 'Send reset link'}
      </button>
    </form>
  );
}
