import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeLang } from '../contexts/ThemeLangContext';
import SecretCodeModal from '../components/SecretCodeModal';
import api from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme, lang, toggleLang, t } = useThemeLang();

  // Secret code modal state
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [generatingSecret, setGeneratingSecret] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(username, password);
    if (result.success) {
      if (result.firstLogin) {
        // First login → generate secret code and show modal
        setGeneratingSecret(true);
        try {
          const res = await api.post('/auth/generate-secret');
          setSecretCode(res.data.secret);
          setShowSecretModal(true);
        } catch (err) {
          console.error('Failed to generate secret:', err);
          // Still navigate to register even if secret generation fails
          navigate('/register');
        } finally {
          setGeneratingSecret(false);
        }
      } else {
        navigate('/dashboard');
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
      position: 'relative'
    }}>
      {/* Top right controls */}
      <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 12 }}>
        <button onClick={toggleLang} className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>
          {lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
        </button>
        <button onClick={toggleTheme} className="btn btn-ghost btn-sm" style={{ fontSize: '1.2rem' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="fade-in" style={{
        width: '100%', maxWidth: 440,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: 800,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 12
          }}>
            {t('login.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('login.subtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: 32 }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
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
              disabled={loading || generatingSecret || !username || !password}
              style={{ marginTop: 8 }}
            >
              {loading || generatingSecret ? (
                <><div className="spinner" style={{ width: 18, height: 18 }} /> {generatingSecret ? 'Đang tạo mã bí mật...' : '...'}</>
              ) : (
                t('login.btn')
              )}
            </button>
          </form>

          {/* Quên mật khẩu */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => alert("Tính năng quên mật khẩu đang được phát triển.")}
              style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
            >
              {t('login.forgotPassword')}
            </button>
          </div>
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
