import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PlateMark } from '../../components/PlateMark';
import { useAuth } from '../../hooks/useAuth';
import { toUserMessage } from '../../utils/errorMessages';
import styles from './AuthPage.module.css';

type Mode = 'login' | 'register';

interface LocationState {
  from?: { pathname: string };
}

export function AuthPage() {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    const state = location.state as LocationState | null;
    const redirectTo = state?.from?.pathname ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password });
      }
    } catch (submitError) {
      setError(toUserMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel =
    mode === 'login' ? (isSubmitting ? 'מתחבר…' : 'התחברות') : isSubmitting ? 'יוצר חשבון…' : 'יצירת חשבון';

  return (
    <div className={styles.screen}>
      <div className={styles.brand}>
        <PlateMark />
        <h1 className={styles.wordmark}>GYMTRACK</h1>
        <p className={styles.tagline}>תעד את המשקל. תשבור אותו בפעם הבאה.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setMode('login')}
          >
            התחברות
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setMode('register')}
          >
            הרשמה
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              אימייל
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              סיסמה
            </label>
            <div className={styles.passwordRow}>
              <input
                id="password"
                className={styles.input}
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="לפחות 8 תווים"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className={styles.toggleVisibility}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={isPasswordVisible ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {isPasswordVisible ? 'הסתר' : 'הצג'}
              </button>
            </div>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={isSubmitting}>
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
