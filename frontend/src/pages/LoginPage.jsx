import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeLang } from '../contexts/ThemeLangContext';
import { authService } from '../services/authService';
import SecretCodeModal from '../components/SecretCodeModal';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithWallet, loginWithInvite, loading } = useAuth();
  const { theme, toggleTheme, lang, toggleLang, t } = useThemeLang();

  // Role Tab: 'doctor' | 'admin' (User requested: username/pass is Doctor, Wallet is Admin)
  const [activeTab, setActiveTab] = useState('doctor');
  // Admin sub-mode: 'wallet' | 'invite'
  const [adminMode, setAdminMode] = useState('wallet');

  // Doctor state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Admin wallet state
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletSigning, setWalletSigning] = useState(false);

  // Admin invite state
  const [inviteToken, setInviteToken] = useState('');

  // Secret code modal
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [generatingSecret, setGeneratingSecret] = useState(false);

  const [error, setError] = useState('');

  // ============================================================
  // SVGs for Premium Interface
  // ============================================================
  const firstAidIcon = (
    <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );

  const walletIcon = (
    <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M23 11a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2z" />
      <circle cx="18" cy="12" r="1" />
    </svg>
  );

  const userIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const lockIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  const inviteIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="13" y2="13" />
    </svg>
  );

  const globeIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );

  const moonIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  const sunIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );

  const arrowRightIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );

  // ============================================================
  // ADMIN: Wallet Login (Flow B - Subsequent logins)
  // ============================================================
  const handleWalletLogin = async () => {
    setError('');
    if (!window.ethereum) {
      setError(t('login.noMetamask'));
      return;
    }

    try {
      setWalletConnecting(true);

      // Step 1: Connect MetaMask and get address
      const { BrowserProvider } = await import('ethers');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Step 2: Get challenge from backend (also checks on-chain authorization!)
      setWalletSigning(true);
      const challengeRes = await authService.walletChallenge(address);
      const { message } = challengeRes.data;

      // Step 3: Sign the challenge message
      const signature = await signer.signMessage(message);

      // Step 4: Submit signed message to backend
      const result = await loginWithWallet(address, signature, message);

      if (result.success) {
        // Admin wallet login → go to face verify (AuthenticatePage)
        navigate('/authenticate');
      } else {
        setError(result.error);
      }
    } catch (err) {
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setError(t('login.walletRejected'));
      } else {
        setError(err.response?.data?.message || err.message || t('login.walletFailed'));
      }
    } finally {
      setWalletConnecting(false);
      setWalletSigning(false);
    }
  };

  // ============================================================
  // ADMIN: Invite Token Login (Flow A - First-time setup)
  // ============================================================
  const handleInviteLogin = async (e) => {
    e.preventDefault();
    setError('');

    const result = await loginWithInvite(inviteToken.trim());
    if (result.success) {
      // Generate MFA secret for first-time Admin
      setGeneratingSecret(true);
      try {
        const res = await api.post('/auth/generate-secret', null, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSecretCode(res.data.secret);
        setShowSecretModal(true);
      } catch (err) {
        console.error('Failed to generate secret:', err);
        navigate('/register');
      } finally {
        setGeneratingSecret(false);
      }
    } else {
      setError(result.error);
    }
  };

  // ============================================================
  // DOCTOR: Traditional Login
  // ============================================================
  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(username, password);
    if (result.success) {
      if (result.firstLogin) {
        navigate('/register');
      } else {
        navigate('/authenticate');
      }
    } else {
      setError(result.error);
    }
  };

  const handleSecretConfirm = () => {
    setShowSecretModal(false);
    navigate('/register');
  };

  return (
    <div className="login-bg">
      {/* Background Concentric Rings (Matching screenshot) */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.85 }}>
          <circle cx="50%" cy="50%" r="220" stroke={theme === 'dark' ? 'rgba(59,130,246,0.06)' : 'rgba(99,102,241,0.04)'} fill="none" strokeWidth="1" />
          <circle cx="50%" cy="50%" r="380" stroke={theme === 'dark' ? 'rgba(59,130,246,0.04)' : 'rgba(99,102,241,0.025)'} fill="none" strokeWidth="1" />
          <circle cx="50%" cy="50%" r="560" stroke={theme === 'dark' ? 'rgba(59,130,246,0.02)' : 'rgba(99,102,241,0.015)'} fill="none" strokeWidth="1" />
        </svg>
      </div>

      {/* Header - ZKP Identity System (Top Left) */}
      <div style={{
        position: 'absolute',
        top: 28,
        left: 32,
        fontSize: '1.25rem',
        fontWeight: '800',
        color: theme === 'dark' ? '#818cf8' : '#4f46e5',
        zIndex: 20,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: '-0.02em',
      }}>
        ZKP Identity System
      </div>

      {/* Top right controls */}
      <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', gap: 12, zIndex: 20 }}>
        <button 
          onClick={toggleLang} 
          className="btn btn-ghost btn-sm" 
          style={{ 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            borderRadius: '8px',
            padding: '0 10px',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: 'var(--text-primary)'
          }}
        >
          {globeIcon}
          {lang === 'vi' ? 'VI' : 'EN'}
        </button>
        <button 
          onClick={toggleTheme} 
          className="btn btn-ghost btn-sm" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: 34, 
            height: 34, 
            padding: 0,
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`,
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: 'var(--text-primary)'
          }}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? sunIcon : moonIcon}
        </button>
      </div>

      {/* Center card wrapper */}
      <div className={`login-card-container ${activeTab === 'doctor' ? 'doctor-mode' : 'admin-mode'}`}>
        <div className="login-card">
          {/* Circular Badge Header */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: activeTab === 'doctor' 
                ? (theme === 'dark' ? 'rgba(13, 148, 136, 0.15)' : '#ccfbf1') 
                : (theme === 'dark' ? 'rgba(79, 70, 229, 0.15)' : '#e0e7ff'),
              color: activeTab === 'doctor'
                ? (theme === 'dark' ? '#2dd4bf' : '#0d9488')
                : (theme === 'dark' ? '#818cf8' : '#4f46e5'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.02)'
            }}>
              {activeTab === 'doctor' ? firstAidIcon : walletIcon}
            </div>
          </div>

          {/* Form Title */}
          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            textAlign: 'center',
            color: 'var(--text-primary)',
            marginBottom: 32,
            letterSpacing: '-0.01em',
          }}>
            {activeTab === 'doctor' 
              ? (lang === 'vi' ? 'Đăng nhập dành cho Bác sĩ' : 'Doctor Login')
              : (lang === 'vi' ? 'Đăng nhập dành cho Admin' : 'Admin Login')}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error" style={{ borderRadius: '8px', marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* =============== DOCTOR FORM =============== */}
          {activeTab === 'doctor' && (
            <form onSubmit={handleDoctorLogin}>
              {/* Username field */}
              <div style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {t('login.username')}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: 16, display: 'flex', alignItems: 'center', color: theme === 'dark' ? 'var(--text-secondary)' : '#64748b' }}>
                    {userIcon}
                  </div>
                  <input
                    id="login-username"
                    className="login-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder={lang === 'vi' ? 'Nhập mã nhân viên hoặc email' : 'Enter employee ID or email'}
                    autoFocus
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {t('login.password')}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: 16, display: 'flex', alignItems: 'center', color: theme === 'dark' ? 'var(--text-secondary)' : '#64748b' }}>
                    {lockIcon}
                  </div>
                  <input
                    id="login-password"
                    className="login-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit"
                className="login-btn"
                type="submit"
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderTopColor: '#ffffff' }} /> &nbsp; ...</>
                ) : (
                  <>
                    {lang === 'vi' ? 'ĐĂNG NHẬP' : 'LOGIN'}
                    {arrowRightIcon}
                  </>
                )}
              </button>

              {/* Forgot Password Link */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <button
                  type="button"
                  className="login-link"
                  onClick={() => alert(t('login.forgotPasswordMsg'))}
                  style={{ border: 'none', background: 'none', padding: 0 }}
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
            </form>
          )}

          {/* =============== ADMIN FORM =============== */}
          {activeTab === 'admin' && (
            <div>
              {/* Wallet Mode Login */}
              {adminMode === 'wallet' && (
                <div>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    marginBottom: 24,
                    lineHeight: 1.6,
                    textAlign: 'center',
                  }}>
                    {lang === 'vi' 
                      ? 'Sử dụng ví MetaMask để ký xác thực danh tính Admin. Hệ thống sẽ đối chiếu địa chỉ trên hợp đồng thông minh để cho phép truy cập.'
                      : 'Connect your MetaMask wallet to sign and verify Admin identity. The system cross-references the wallet with the smart contract.'}
                  </p>

                  <div style={{
                    padding: 16,
                    borderRadius: '8px',
                    background: theme === 'dark' ? 'rgba(79, 70, 229, 0.05)' : 'rgba(99, 102, 241, 0.04)',
                    border: `1px solid ${theme === 'dark' ? 'rgba(79, 70, 229, 0.15)' : 'rgba(99, 102, 241, 0.1)'}`,
                    marginBottom: 24,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>MetaMask Wallet</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {t('login.walletSteps')}
                    </div>
                  </div>

                  <button
                    id="admin-wallet-login"
                    className="login-btn"
                    onClick={handleWalletLogin}
                    disabled={loading || walletConnecting}
                  >
                    {walletConnecting ? (
                      <>
                        <div className="spinner" style={{ width: 18, height: 18, borderTopColor: '#ffffff' }} /> &nbsp;
                        {walletSigning ? t('login.signing') : t('login.connecting')}
                      </>
                    ) : (
                      <>
                        {lang === 'vi' ? 'KẾT NỐI VÍ & ĐĂNG NHẬP' : 'CONNECT WALLET & LOGIN'}
                        {arrowRightIcon}
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <button
                      type="button"
                      className="login-link"
                      onClick={() => { setAdminMode('invite'); setError(''); }}
                      style={{ border: 'none', background: 'none', padding: 0 }}
                    >
                      {lang === 'vi' ? 'Bạn chưa kích hoạt? Nhập mã mời' : 'Not registered? Enter invite code'}
                    </button>
                  </div>
                </div>
              )}

              {/* Invite Token Login */}
              {adminMode === 'invite' && (
                <form onSubmit={handleInviteLogin}>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    marginBottom: 20,
                    lineHeight: 1.6,
                  }}>
                    {t('login.inviteDesc')}
                  </p>

                  <div style={{ marginBottom: 24 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                      {t('login.inviteLabel')}
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: 16, display: 'flex', alignItems: 'center', color: theme === 'dark' ? 'var(--text-secondary)' : '#64748b' }}>
                        {inviteIcon}
                      </div>
                      <input
                        id="admin-invite-token"
                        className="login-input"
                        type="text"
                        value={inviteToken}
                        onChange={(e) => setInviteToken(e.target.value)}
                        placeholder="xxxxxx-xxxx-xxxx-xxxx"
                        required
                        autoFocus
                        style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                      />
                    </div>
                  </div>

                  <button
                    id="admin-invite-submit"
                    className="login-btn"
                    type="submit"
                    disabled={loading || generatingSecret || !inviteToken.trim()}
                  >
                    {loading || generatingSecret ? (
                      <>
                        <div className="spinner" style={{ width: 18, height: 18, borderTopColor: '#ffffff' }} /> &nbsp;
                        {generatingSecret ? t('login.generatingSecret') : '...'}
                      </>
                    ) : (
                      <>
                        {lang === 'vi' ? 'XÁC NHẬN MÃ MỜI' : 'VERIFY INVITE CODE'}
                        {arrowRightIcon}
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <button
                      type="button"
                      className="login-link"
                      onClick={() => { setAdminMode('wallet'); setError(''); }}
                      style={{ border: 'none', background: 'none', padding: 0 }}
                    >
                      {lang === 'vi' ? 'Đăng nhập bằng ví Web3' : 'Login using Web3 wallet'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Role Switch Link at the bottom of the card */}
          <div style={{ 
            marginTop: 24, 
            paddingTop: 24, 
            borderTop: `1px solid ${theme === 'dark' ? '#27272a' : '#f1f5f9'}`,
            display: 'flex',
            justifyContent: 'center'
          }}>
            {activeTab === 'doctor' ? (
              <button
                type="button"
                onClick={() => { setActiveTab('admin'); setError(''); }}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#818cf8' : '#4f46e5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {lang === 'vi' ? 'Đăng nhập dành cho Admin (Ví Web3)' : 'Login as Admin (Web3 Wallet)'}
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setActiveTab('doctor'); setError(''); }}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#2dd4bf' : '#0d9488',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {lang === 'vi' ? 'Đăng nhập dành cho Bác sĩ (Tài khoản)' : 'Login as Doctor (Credentials)'}
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

        </div>

        {/* Footer (Links & Copyright) */}
        <div style={{
          marginTop: 40,
          textAlign: 'center',
        }}>
          {/* Footer links */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginBottom: 16,
          }}>
            <a href="#security" className="login-link" style={{ fontSize: '0.8rem', color: theme === 'dark' ? '#9ca3af' : '#0d9488' }}>
              Security Policy
            </a>
            <a href="#terms" className="login-link" style={{ fontSize: '0.8rem', color: theme === 'dark' ? '#9ca3af' : '#0d9488' }}>
              Terms of Service
            </a>
            <a href="#help" className="login-link" style={{ fontSize: '0.8rem', color: theme === 'dark' ? '#9ca3af' : '#0d9488' }}>
              Help Center
            </a>
          </div>
          
          {/* Copyright */}
          <p style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            margin: 0
          }}>
            © 2024 Powered by ZKP + Blockchain
          </p>
        </div>
      </div>

      {/* Secret Code Modal */}
      {showSecretModal && secretCode && (
        <SecretCodeModal
          secret={secretCode}
          onConfirm={handleSecretConfirm}
        />
      )}
    </div>
  );
}
