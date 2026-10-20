import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { GoogleSignIn } from './GoogleSignIn';
import { memberSignIn, memberSignUp, memberVerify, memberResendCode } from '@/lib/auth.functions';

type Mode = 'signin' | 'signup' | 'code';

/** Member sign-in and sign-up with email + password, confirmed by a 6-digit code sent by email. */
export function MemberAuth({ onDone, intro }: { onDone?: (() => void) | undefined; intro?: string | undefined }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const signIn = useServerFn(memberSignIn);
  const signUp = useServerFn(memberSignUp);
  const verify = useServerFn(memberVerify);
  const resend = useServerFn(memberResendCode);
  const qc = useQueryClient();

  async function finish() { await qc.invalidateQueries({ queryKey: ['identity'] }); onDone?.(); }
  async function run(task: () => Promise<{ ok: boolean; needsCode: boolean; error: string }>, codeMessage: string) {
    setBusy(true); setStatus('');
    try {
      const result = await task();
      if (result.ok && !result.needsCode) return await finish();
      if (result.needsCode) { setMode('code'); setStatus(result.error || codeMessage); return; }
      setStatus(result.error);
    } catch { setStatus('Please check your details and try again.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="member-auth">
      {intro && <p className="status">{intro}</p>}
      {mode !== 'code' && (
        <div className="auth-switch" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setStatus(''); }}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setStatus(''); }}>Create account</button>
        </div>
      )}
      {mode === 'code' ? (
        <form className="cms-form" onSubmit={e => { e.preventDefault(); const code = String(new FormData(e.currentTarget).get('code') ?? ''); void run(() => verify({ data: { email, code } }), ''); }}>
          <p>We sent a 6-digit code to <strong>{email}</strong>. Enter it below to confirm your account.</p>
          <label>Verification code<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required className="code-input" /></label>
          <Button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Confirm'}</Button>
          <div className="auth-row">
            <Button type="button" variant="link" disabled={busy} onClick={() => void run(() => resend({ data: { email } }), 'A new code is on its way.')}>Send a new code</Button>
            <Button type="button" variant="link" onClick={() => { setMode('signin'); setStatus(''); }}>Back</Button>
          </div>
        </form>
      ) : (
        <form className="cms-form" onSubmit={e => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const value = String(form.get('email') ?? '').trim().toLowerCase();
          const password = String(form.get('password') ?? '');
          setEmail(value);
          if (mode === 'signup') void run(() => signUp({ data: { name: String(form.get('name') ?? ''), email: value, password } }), 'Check your email for your code.');
          else void run(() => signIn({ data: { email: value, password } }), 'Please confirm your email with the code we just sent.');
        }}>
          {mode === 'signup' && <label>Full name<input name="name" required maxLength={80} autoComplete="name" /></label>}
          <label>Email<input name="email" type="email" required autoComplete="email" defaultValue={email} /></label>
          <label>Password<input name="password" type="password" required minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>
          {mode === 'signup' && <p className="status">At least 8 characters.</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</Button>
        </form>
      )}
      {status && <p role="status" className="auth-status">{status}</p>}
      {mode !== 'code' && <><div className="auth-or"><span>or</span></div><GoogleSignIn /></>}
    </div>
  );
}
