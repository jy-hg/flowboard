import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import logoIconUrl from '../assets/logo-icon.svg';
import styles from './LoginPage.module.css';

type Tab = 'password' | 'magic-link' | 'sign-up';

const TABS: { id: Tab; label: string }[] = [
  { id: 'password', label: 'Password' },
  { id: 'magic-link', label: 'Magic link' },
  { id: 'sign-up', label: 'Sign up' },
];

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { signInWithPassword, signInWithOtp, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ password: null, 'magic-link': null, 'sign-up': null });
  useDocumentTitle('FlowBoard – Simple Kanban Boards for Your Tasks', {
    description: 'FlowBoard is a simple drag-and-drop kanban app. Create boards, add cards, set priorities and move work from To Do to Done. Free to sign up.',
  });

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
    setInfo(null);
  }

  function handleTabKeyDown(event: KeyboardEvent, index: number) {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else return;
    event.preventDefault();
    const target = TABS[next].id;
    switchTab(target);
    tabRefs.current[target]?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    if (tab === 'password') {
      const { error: signInError } = await signInWithPassword(email, password);
      if (signInError) setError(signInError);
      else navigate('/boards');
    } else if (tab === 'magic-link') {
      const { error: otpError } = await signInWithOtp(email);
      if (otpError) setError(otpError);
      else setInfo('Check your email for a sign-in link.');
    } else {
      const { error: signUpError, needsConfirmation } = await signUp(email, password);
      if (signUpError) setError(signUpError);
      else if (needsConfirmation) setInfo('Check your email to confirm your account, then sign in.');
      else navigate('/boards');
    }

    setSubmitting(false);
  }

  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    const { error: resetError } = await resetPassword(email);
    if (resetError) setError(resetError);
    else setInfo('Check your email for a password reset link.');
  }

  return (
    <>
    <main className={styles.page}>
      <div className={styles.header}>
        <span className={styles.logo}>
          <img src={logoIconUrl} alt="" width={24} height={24} className={styles.logoIcon} />
        </span>
        <h1>FlowBoard</h1>
        <p className={styles.subtitle}>Sign in to manage your boards</p>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs} role="tablist" aria-label="Sign-in method">
          {TABS.map((option, index) => (
            <button
              key={option.id}
              ref={(element) => {
                tabRefs.current[option.id] = element;
              }}
              id={`login-tab-${option.id}`}
              type="button"
              role="tab"
              aria-selected={tab === option.id}
              aria-controls="login-panel"
              tabIndex={tab === option.id ? 0 : -1}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`${styles.tab} ${tab === option.id ? styles.active : ''}`}
              onClick={() => switchTab(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div id="login-panel" role="tabpanel" aria-labelledby={`login-tab-${tab}`}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          {tab !== 'magic-link' && (
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={tab === 'sign-up' ? 'new-password' : 'current-password'}
                required
                minLength={tab === 'sign-up' ? 8 : undefined}
              />
            </div>
          )}

          {tab === 'password' && (
            <div className={styles.forgotRow}>
              <button type="button" className={styles.forgotLink} onClick={handleForgotPassword}>
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className={styles.infoText} role="status">
              {info}
            </p>
          )}

          <button type="submit" className={styles.submitButton} disabled={submitting}>
            {tab === 'password' && (submitting ? 'Signing in…' : 'Sign in')}
            {tab === 'magic-link' && (submitting ? 'Sending…' : 'Send magic link')}
            {tab === 'sign-up' && (submitting ? 'Creating account…' : 'Create account')}
          </button>
        </form>
        </div>
      </div>
    </main>
    <footer className={styles.footer}>© {new Date().getFullYear()} FlowBoard</footer>
    </>
  );
}
