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
    <nav 
      className="premium-navbar"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255, 255, 255, 0.75)', // Làm nền trong suốt hơn một chút
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ── INTERACTIVE STYLE INJECTOR ── */}
      <style>{`
        .premium-navbar * { box-sizing: border-box; }
        
        /* Hiệu ứng Link điều hướng dạng Pill siêu mượt */
        .nav-link-pill {
          padding: 6px 14px; border-radius: 6px; font-size: 0.875rem; font-weight: 500;
          color: #475569; text-decoration: none; transition: all 0.15s ease;
        }
        .nav-link-pill:hover { background: #f1f5f9; color: #0f172a; }
        .nav-link-pill.active { background: #eff6ff; color: #2563eb; font-weight: 600; }

        /* Khối hiển thị Ví Web3 cao cấp giống RainbowKit */
        .wallet-badge {
          display: flex; align-items: center; gap: 8px; padding: 6px 12px;
          background: #ffffff; border: 1px solid #e2e8f0; border-radius: 9999px;
          font-size: 0.75rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: #334155; font-weight: 500; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .pulse-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        /* Khung chứa User tinh gọn */
        .user-profile-box {
          display: flex; align-items: center; gap: 8px; padding: 5px 10px;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
        }

        /* Nút đăng xuất tinh tế - Chỉ đổi đỏ khi hover để tránh bị rực giao diện */
        .logout-btn-clean {
          background: transparent; border: 1px solid #e2e8f0; color: #64748b;
          padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .logout-btn-clean:hover { background: #fef2f2; color: #ef4444; border-color: #fee2e2; }
      `}</style>

      {/* ── LEFT: LOGO BRANDING ── */}
      <Link to="/dashboard" style={{ display: 'flex', alignMates: 'center', gap: 10, textDecoration: 'none', marginRight: 32 }}>
        {/* Logo Shield lồng Hexagon hình khối công nghệ ZK */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <span style={{
          fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a',
          alignSelf: 'center'
        }}>
          ZKP Identity
        </span>
      </Link>

      {/* ── CENTER: NAV LINKS ── */}
      <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link-pill ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* ── RIGHT: WEB3 STATUS & USER PROFILE ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Wallet Pill Status */}
        {address && (
          <div className="wallet-badge" title="Connected Wallet">
            <span className="pulse-dot" />
            <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
          </div>
        )}

        {/* Profile Identity Card */}
        <div className="user-profile-box">
          {/* Avatar dạng Circle tinh tế */}
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: '#cbd5e1', color: '#475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase'
          }}>
            {user?.username ? user.username.charAt(0) : 'U'}
          </div>
          
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
            {user?.username}
          </span>
          
          {user?.role === 'ADMIN' && (
            <span style={{ 
              padding: '1px 5px', fontSize: '0.65rem', fontWeight: 700,
              background: '#eff6ff', color: '#2563eb', borderRadius: '4px',
              border: '1px solid #bfdbfe', letterSpacing: '0.3px'
            }}>
              ADMIN
            </span>
          )}
        </div>

        {/* Action Button */}
        <button className="logout-btn-clean" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}