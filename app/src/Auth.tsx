import { useEffect, useMemo, useState } from 'react';
import supabase from './supabaseClient';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

function Field({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)' }}
      />
    </div>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  // Detect password recovery redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setMode('reset');
    }
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      }
    });
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const redirectUrl = useMemo(() => {
    // Use the current origin+path so it works on GitHub Pages subpath too
    const url = new URL(window.location.href);
    return `${url.origin}${url.pathname}#type=recovery`;
  }, []);

  const doSignIn = async () => {
    setLoading(true);
    setMessage(undefined);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    setLoading(false);
  };

  const doSignUp = async () => {
    setLoading(true);
    setMessage(undefined);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage('Check your email to confirm your account.');
    setLoading(false);
  };

  const doForgot = async () => {
    setLoading(true);
    setMessage(undefined);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    if (error) setMessage(error.message);
    else setMessage('Password reset email sent. Check your inbox.');
    setLoading(false);
  };

  const doReset = async () => {
    if (!password || password !== password2) {
      setMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setMessage(undefined);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage(error.message);
    else {
      setMessage('Password updated. You can sign in now.');
      setMode('signin');
      setPassword('');
      setPassword2('');
      // clear recovery hash
      history.replaceState(null, '', window.location.pathname);
    }
    setLoading(false);
  };

  return (
    <div className="start-screen">
      <h1>Sign in</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {mode !== 'reset' && (
          <>
            <Field label="Email" value={email} onChange={setEmail} autoComplete="email" />
            <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </>
        )}
        {mode === 'reset' && (
          <>
            <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
            <Field label="Confirm password" type="password" value={password2} onChange={setPassword2} autoComplete="new-password" />
          </>
        )}

        {message && <div className="note info" role="status">{message}</div>}

        {mode === 'signin' && (
          <>
            <button className="primary big" disabled={loading} onClick={doSignIn}>Sign in</button>
            <button className="secondary" disabled={loading} onClick={() => setMode('signup')}>Create account</button>
            <button className="secondary" disabled={loading} onClick={() => setMode('forgot')}>Forgot password</button>
          </>
        )}
        {mode === 'signup' && (
          <>
            <button className="primary big" disabled={loading} onClick={doSignUp}>Sign up</button>
            <button className="secondary" disabled={loading} onClick={() => setMode('signin')}>Back to sign in</button>
          </>
        )}
        {mode === 'forgot' && (
          <>
            <button className="primary big" disabled={loading} onClick={doForgot}>Send reset email</button>
            <button className="secondary" disabled={loading} onClick={() => setMode('signin')}>Back to sign in</button>
          </>
        )}
        {mode === 'reset' && (
          <>
            <button className="primary big" disabled={loading} onClick={doReset}>Update password</button>
            <button className="secondary" disabled={loading} onClick={() => setMode('signin')}>Back to sign in</button>
          </>
        )}
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>Test account available; do not share credentials in code or commits.</p>
    </div>
  );
}

