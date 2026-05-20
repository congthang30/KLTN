import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { address } = useWallet();
  const location = useLocation();

  const navItems = [];
  if (user?.verified) {
    navItems.push({ path: '/dashboard', label: 'Dashboard' });
  }
  navItems.push({ path: '/recovery', label: 'Recovery' });

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 var(--space-6)',
      height: 64, // design spec says 64px
      display: 'flex', alignItems: 'center',
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', marginRight: 40,
      }}>
        <span style={{
          fontSize: 'var(--text-lg)', fontWeight: 800,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-subtle))',
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
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-secondary)',
              background: location.pathname === item.path ? 'var(--primary-subtle)' : 'transparent',
              transition: 'all var(--transition-fast)',
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
            padding: 'var(--space-1) var(--space-3)',
            background: 'var(--primary-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'monospace',
            color: 'var(--primary)',
          }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-1) var(--space-3)',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{user?.username}</span>
          {user?.role === 'ADMIN' && (
            <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '10px' }}>
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
