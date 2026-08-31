import { PlateMark } from '../../components/PlateMark';
import { useAuth } from '../../hooks/useAuth';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <PlateMark size={28} />
          <span className={styles.wordmark}>GYMTRACK</span>
        </div>
        <button type="button" className={styles.logout} onClick={() => logout()}>
          התנתקות
        </button>
      </header>

      <main className={styles.main}>
        <p className={styles.greeting}>
          שלום, <bdi>{user?.email}</bdi>
        </p>
        <p className={styles.note}>ניהול תרגילים ואימונים בדרך. בקרוב תוכל/י להתחיל אימון ולתעד סטים.</p>
      </main>
    </div>
  );
}
