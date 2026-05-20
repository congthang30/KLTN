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

  // Tab: 'admin' | 'doctor'
  const [activeTab, setActiveTab] = useState('admin');
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
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      position: 'relative',
    }}>
      {/* Top right controls */}
      <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 12 }}>
        <button onClick={toggleLang} className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>
          {lang === 'vi' ? 'VI' : 'EN'}
        </button>
        <button onClick={toggleTheme} className="btn btn-ghost btn-sm" style={{ fontSize: '1.2rem' }}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>

      <div className="fade-in" style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: 800,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 12,
          }}>
            {t('login.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('login.subtitle')}
          </p>
        </div>

        {/* Role Tabs */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 24,
          borderRadius: 'var(--radius-sm)', overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <button
            onClick={() => { setActiveTab('admin'); setError(''); }}
            style={{
              flex: 1, padding: '14px 16px',
              background: activeTab === 'admin'
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))'
                : 'var(--bg-card)',
              border: 'none', cursor: 'pointer',
              color: activeTab === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'admin' ? 700 : 500,
              fontSize: '0.9rem',
              borderBottom: activeTab === 'admin' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            {t('login.adminTab')}
          </button>
          <button
            onClick={() => { setActiveTab('doctor'); setError(''); }}
            style={{
              flex: 1, padding: '14px 16px',
              background: activeTab === 'doctor'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))'
                : 'var(--bg-card)',
              border: 'none', cursor: 'pointer',
              color: activeTab === 'doctor' ? 'var(--success)' : 'var(--text-muted)',
              fontWeight: activeTab === 'doctor' ? 700 : 500,
              fontSize: '0.9rem',
              borderBottom: activeTab === 'doctor' ? '2px solid var(--success)' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            {t('login.doctorTab')}
          </button>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: 32 }}>
          {error && <div className="alert alert-error">{error}</div>}

          {/* =============== ADMIN TAB =============== */}
          {activeTab === 'admin' && (
            <div>
              {/* Admin sub-mode toggle */}
              <div style={{
                display: 'flex', gap: 8, marginBottom: 24,
              }}>
                <button
                  onClick={() => { setAdminMode('wallet'); setError(''); }}
                  className={`btn btn-sm ${adminMode === 'wallet' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                >
                  {t('login.connectWallet')}
                </button>
                <button
                  onClick={() => { setAdminMode('invite'); setError(''); }}
                  className={`btn btn-sm ${adminMode === 'invite' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                >
                  {t('login.inviteCode')}
                </button>
              </div>

              {/* Wallet Login */}
              {adminMode === 'wallet' && (
                <div>
                  <p style={{
                    color: 'var(--text-secondary)', fontSize: '0.85rem',
                    marginBottom: 20, lineHeight: 1.6,
                  }}>
                    {t('login.walletDesc')}
                  </p>

                  <div style={{
                    padding: 20, borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>MetaMask</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {t('login.walletSteps')}
                    </div>
                  </div>

                  <button
                    id="admin-wallet-login"
                    className="btn btn-primary btn-lg btn-full"
                    onClick={handleWalletLogin}
                    disabled={loading || walletConnecting}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      border: 'none',
                    }}
                  >
                    {walletConnecting ? (
                      <>
                        <div className="spinner" style={{ width: 18, height: 18 }} />
                        {walletSigning ? t('login.signing') : t('login.connecting')}
                      </>
                    ) : (
                      <>{t('login.connectWalletBtn')}</>
                    )}
                  </button>
                </div>
              )}

              {/* Invite Code Login */}
              {adminMode === 'invite' && (
                <div>
                  <p style={{
                    color: 'var(--text-secondary)', fontSize: '0.85rem',
                    marginBottom: 20, lineHeight: 1.6,
                  }}>
                    {t('login.inviteDesc')}
                  </p>

                  <form onSubmit={handleInviteLogin}>
                    <div className="form-group">
                      <label className="form-label">{t('login.inviteLabel')}</label>
                      <input
                        id="admin-invite-token"
                        className="form-input"
                        type="text"
                        value={inviteToken}
                        onChange={(e) => setInviteToken(e.target.value)}
                        placeholder="xxxxxx-xxxx-xxxx-xxxx"
                        required
                        autoFocus
                        style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                      />
                    </div>

                    <button
                      id="admin-invite-submit"
                      className="btn btn-primary btn-lg btn-full"
                      type="submit"
                      disabled={loading || generatingSecret || !inviteToken.trim()}
                      style={{ marginTop: 8 }}
                    >
                      {loading || generatingSecret ? (
                        <>
                          <div className="spinner" style={{ width: 18, height: 18 }} />
                          {generatingSecret ? t('login.generatingSecret') : '...'}
                        </>
                      ) : (
                        <>{t('login.inviteBtn')}</>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* =============== DOCTOR TAB =============== */}
          {activeTab === 'doctor' && (
            <form onSubmit={handleDoctorLogin}>
              <div className="form-group">
                <label className="form-label">{t('login.username')}</label>
                <input
                  id="login-username"
                  className="form-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('login.password')}</label>
                <input
                  id="login-password"
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                id="login-submit"
                className="btn btn-primary btn-lg btn-full"
                type="submit"
                disabled={loading || !username || !password}
                style={{
                  marginTop: 8,
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  border: 'none',
                }}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18 }} /> ...</>
                ) : (
                  t('login.btn')
                )}
              </button>

              {/* Quên mật khẩu */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => alert(t('login.forgotPasswordMsg'))}
                  style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security badge */}
        <div style={{
          textAlign: 'center', marginTop: 24,
          fontSize: '0.75rem', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {t('login.securityBadge')}
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
