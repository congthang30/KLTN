import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { address } = useWallet();
  const location = useLocation();

  const navItems = [];
  if (user?.verified) {
    navItems.push({ path: '/dashboard', label: '📊 Dashboard' });
  }
  navItems.push({ path: '/recovery', label: '🔑 Recovery' });

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(15, 15, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 72,
      display: 'flex', alignItems: 'center',
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', marginRight: 40,
      }}>
        <span style={{ fontSize: 28 }}>🛡️</span>
        <span style={{
          fontSize: '1.1rem', fontWeight: 800,
          background: 'linear-gradient(135deg, var(--primary-light), var(--accent))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          ZKP Identity
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: location.pathname === item.path ? 'var(--primary-light)' : 'var(--text-secondary)',
              background: location.pathname === item.path ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {address && (
          <div style={{
            padding: '6px 12px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: 'var(--success)',
          }}>
            🦊 {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '0.8rem' }}>👤</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{user?.username}</span>
          {user?.role === 'ADMIN' && (
            <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
              ADMIN
            </span>
          )}
        </div>

        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
