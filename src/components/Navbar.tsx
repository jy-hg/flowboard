import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import logoIconUrl from '../assets/logo-icon.svg';
import styles from './Navbar.module.css';

export function Navbar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <header className={styles.navbar}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      <nav className={styles.left} aria-label="Main">
        <Link to="/boards" className={styles.brand}>
          <span className={styles.logo}>
            <img src={logoIconUrl} alt="" width={24} height={24} className={styles.logoIcon} />
          </span>
          <span className={styles.wordmark}>FlowBoard</span>
        </Link>
        <Link to="/boards" className={styles.navLink}>
          Boards
        </Link>
      </nav>
      <div className={styles.actions}>
        <span className={styles.avatar} aria-hidden="true">
          U
        </span>
        <button
          type="button"
          className={styles.signOut}
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
