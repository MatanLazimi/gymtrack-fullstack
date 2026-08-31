import { Link } from 'react-router-dom';
import { PlateMark } from '../../components/PlateMark';
import { useAuth } from '../../hooks/useAuth';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout().catch(() => {
      // Network/API failure: user stays signed in, nothing else to do here.
    });
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <PlateMark size={28} />
          <span className={styles.wordmark}>GYMTRACK</span>
        </div>
        <button type="button" className={styles.logout} onClick={handleLogout}>
          התנתקות
        </button>
      </header>

      <main className={styles.main}>
        <p className={styles.greeting}>
          שלום, <bdi>{user?.email}</bdi>
        </p>
        <p className={styles.note}>ניהול אימונים בדרך. בינתיים אפשר לנהל את מאגר התרגילים.</p>
        <Link to="/exercises" className={styles.exercisesLink}>
          מאגר תרגילים
        </Link>
      </main>
    </div>
  );
}
