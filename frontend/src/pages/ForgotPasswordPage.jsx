import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeLang } from '../contexts/ThemeLangContext';
import FaceCapture from '../components/FaceCapture';
import { authService } from '../services/authService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme, lang, toggleLang } = useThemeLang();
  
  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);

  const handleBackToLogin = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout failed', e);
    }
    localStorage.removeItem('recovery_token');
    navigate('/login');
  };

  const handleFaceVerify = async (embedding) => {
    setLoading(true);
    setIsError(false);
    setStatus(lang === 'vi' ? 'Đang quét khuôn mặt và tìm kiếm tài khoản Bác sĩ...' : 'Scanning face and finding Doctor account...');
    try {
      const resInit = await authService.doctorRecoverInit(embedding);
      const { access_token, user } = resInit.data;
      
      localStorage.setItem('recovery_token', access_token);
      
      setStatus(lang === 'vi' ? `Nhận diện thành công Bác sĩ: ${user.username}. Đang chuyển tiếp...` : `Identified Doctor: ${user.username}. Advancing...`);
      setStep(2);
      setStatus('');
    } catch (err) {
      setIsError(true);
      setStatus(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setIsError(true);
      setStatus(lang === 'vi' ? 'Vui lòng nhập mật khẩu mới' : 'Please enter new password');
      return;
    }
    if (newPassword.length < 6) {
      setIsError(true);
      setStatus(lang === 'vi' ? 'Mật khẩu phải có ít nhất 6 ký tự' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setIsError(true);
      setStatus(lang === 'vi' ? 'Mật khẩu xác nhận không khớp' : 'Password confirmation does not match');
      return;
    }

    setLoading(true);
    setIsError(false);
    setStatus(lang === 'vi' ? 'Đang cập nhật mật khẩu mới...' : 'Updating new password...');

    try {
      await authService.resetPassword(newPassword);
      setStep(3);
      setStatus('');
    } catch (err) {
      setIsError(true);
      setStatus(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const logoShield = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  const globeIcon = <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /></svg>;
  const moonIcon = <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
  const sunIcon = <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /></svg>;
  const arrowBackIcon = <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
  const checkVerified = <svg viewBox="0 0 24 24" width="48" height="48" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

  const cssVars = {
    '--bg-color': isDark ? '#0b0f19' : '#f8fafc',
    '--card-bg': isDark ? 'rgba(17, 24, 39, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    '--card-border': isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
    '--text-main': isDark ? '#f3f4f6' : '#0f172a',
    '--text-muted': isDark ? '#9ca3af' : '#64748b',
    '--primary-doc': isDark ? '#2dd4bf' : '#0d9488', 
    '--primary-hover': isDark ? '#14b8a6' : '#0f766e',
    '--input-bg': isDark ? '#111827' : '#ffffff',
    '--input-border': isDark ? '#374151' : '#e2e8f0',
    '--success': '#10b981',
    '--danger': '#ef4444',
    '--doc-rgb': isDark ? '45, 212, 191' : '13, 148, 136'
  };

  return (
    <div className="saas-recovery-wrapper" style={cssVars}>
      <style>{`
        .saas-recovery-wrapper {
          min-height: 100vh; width: 100%; display: flex; flex-direction: column;
          background-color: var(--bg-color); color: var(--text-main);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative; transition: background-color 0.4s ease; box-sizing: border-box;
        }
        
        .ambient-mesh {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(circle at 50% -15%, rgba(var(--doc-rgb), 0.1), transparent 45%);
          filter: blur(60px);
        }

        .premium-header {
          position: relative; z-index: 10; padding: 16px 32px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid var(--card-border); background: var(--card-bg);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }
        .header-logo {
          display: flex; align-items: center; gap: 8px; font-weight: 700;
          font-size: 1.05rem; color: var(--primary-doc); text-decoration: none; letter-spacing: -0.02em;
        }
        .nav-actions { display: flex; gap: 8px; }
        .control-btn {
          display: flex; align-items: center; gap: 6px; padding: 6px 12px;
          background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: 9999px; color: var(--text-main); font-weight: 600; font-size: 0.75rem;
          cursor: pointer; transition: all 0.2s ease;
        }
        .control-btn:hover { border-color: var(--primary-doc); background: rgba(var(--doc-rgb), 0.05); }

        .main-content-area {
          flex: 1; position: relative; z-index: 5; width: 100%; max-width: 520px;
          margin: 0 auto; padding: 50px 24px; box-sizing: border-box;
          display: flex; flex-direction: column; justify-content: center;
        }
        
        .back-nav-link {
          display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted);
          text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: color 0.2s;
          margin-bottom: 20px; background: none; border: none; cursor: pointer; padding: 0; width: fit-content;
        }
        .back-nav-link:hover { color: var(--primary-doc); }
        
        /* --- Premium Glassmorphism Card --- */
        .recovery-glass-card {
          background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: 24px; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1);
          overflow: hidden; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        }

        .stepper-container { display: flex; gap: 6px; padding: 28px 28px 0; }
        .step-segment { flex: 1; height: 4px; background: var(--input-border); border-radius: 9999px; transition: all 0.4s ease; }
        .step-segment.active { background: var(--primary-doc); box-shadow: 0 0 10px rgba(var(--doc-rgb), 0.3); }

        .card-header-pane { padding: 28px 28px 16px; }
        .card-body-pane { padding: 0 28px 28px; }
        
        .form-group-block { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .label-text { font-size: 0.725rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .premium-form-input {
          width: 100%; height: 46px; padding: 0 16px; background: var(--input-bg);
          border: 1px solid var(--input-border); border-radius: 12px; color: var(--text-main);
          font-size: 0.95rem; outline: none; transition: all 0.2s ease; box-sizing: border-box;
        }
        .premium-form-input:focus { border-color: var(--primary-doc); box-shadow: 0 0 0 4px rgba(var(--doc-rgb), 0.1); }
        
        .action-button-core {
          width: 100%; height: 46px; border: none; border-radius: 12px;
          background: var(--primary-doc); color: #ffffff; font-size: 0.95rem; font-weight: 600;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-button-core:hover:not(:disabled) { background: var(--primary-hover); box-shadow: 0 6px 15px rgba(var(--doc-rgb), 0.2); }
        .action-button-core:disabled { opacity: 0.5; cursor: not-allowed; }

        .status-badge-message {
          padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 500; line-height: 1.45; margin-top: 20px;
        }
        .status-badge-message.err { background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.15); color: var(--danger); }
        .status-badge-message.info { background: rgba(var(--doc-rgb), 0.06); border: 1px solid rgba(var(--doc-rgb), 0.15); color: var(--primary-doc); }

        .tech-camera-frame {
          border: 1px solid var(--input-border); border-radius: 16px; background: rgba(0,0,0,0.02);
          padding: 12px; display: flex; flex-direction: column; align-items: center; width: 100%; box-sizing: border-box;
        }

        .premium-footer {
          margin-top: auto; padding: 24px; border-top: 1px solid var(--card-border);
          text-align: center; font-size: 0.75rem; color: var(--text-muted); background: var(--card-bg);
        }
        .footer-link-row { display: flex; justify-content: center; gap: 20px; margin-bottom: 8px; }
        .f-link { color: var(--text-muted); text-decoration: none; transition: color 0.15s; font-weight: 500; }
        .f-link:hover { color: var(--primary-doc); }

        @media (max-width: 640px) {
          .premium-header { padding: 14px 20px; }
          .main-content-area { padding: 32px 16px; }
          .card-header-pane { padding: 20px 20px 12px; }
          .card-body-pane { padding: 0 20px 20px; }
        }
      `}</style>

      <div className="ambient-mesh" />

      <header className="premium-header">
        <a href="/login" onClick={(e) => { e.preventDefault(); handleBackToLogin(); }} className="header-logo">
          {logoShield}
          <span>ZKP Identity System</span>
        </a>
        <div className="nav-actions">
          <button className="control-btn" onClick={toggleLang}>
            {globeIcon} {lang === 'vi' ? 'VI' : 'EN'}
          </button>
          <button className="control-btn" onClick={toggleTheme} style={{ padding: '6px 10px' }}>
            {isDark ? sunIcon : moonIcon}
          </button>
        </div>
      </header>

      <main className="main-content-area">
        <button onClick={handleBackToLogin} className="back-nav-link">
          {arrowBackIcon} {lang === 'vi' ? 'Quay lại đăng nhập' : 'Back to login'}
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0 0 10px 0', letterSpacing: '-0.03em' }}>
            {lang === 'vi' ? 'Quên mật khẩu Bác sĩ' : 'Doctor Password Recovery'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            {lang === 'vi' 
              ? 'Đặt lại mật khẩu bảo mật thông qua công nghệ nhận diện khuôn mặt sinh học và kiểm tra liveness.'
              : 'Reset your secure credential via remote biometric face authentication and dynamic liveness tracking.'}
          </p>
        </div>

        <div className="recovery-glass-card">
          <div className="stepper-container">
            <div className={`step-segment ${step >= 1 ? 'active' : ''}`} />
            <div className={`step-segment ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-segment ${step >= 3 ? 'active' : ''}`} />
          </div>
          
          {/* STEP 1: BIOMETRIC SCANNING */}
          {step === 1 && (
            <div>
              <div className="card-header-pane">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                  {lang === 'vi' ? '1. Xác thực khuôn mặt Bác sĩ' : '1. Doctor Face Verification'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                  {lang === 'vi' 
                    ? 'Nhìn thẳng camera. Hệ thống tự động đối khớp dữ liệu thực thể mã hóa của Bác sĩ trên hệ thống.' 
                    : 'Look straight at the module. The system will auto-match your cryptographic biometric profile.'}
                </p>
              </div>
              <div className="card-body-pane">
                <div className="tech-camera-frame">
                  <FaceCapture onCapture={handleFaceVerify} autoStart={true} requireLiveness={true} />
                </div>
                {status && (
                  <div className={`status-badge-message ${isError ? 'err' : 'info'}`}>
                    {status}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PASSWORD CONFIGURATION */}
          {step === 2 && (
            <div>
              <div className="card-header-pane">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                  {lang === 'vi' ? '2. Thiết lập mật khẩu mới' : '2. Establish New Credentials'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                  {lang === 'vi'
                    ? 'Nhập chuỗi ký tự mật mã thay thế mới cho tài khoản. Yêu cầu độ dài tối thiểu 6 ký tự.'
                    : 'Enter your substitute alphanumeric string. A minimum threshold of 6 characters is required.'}
                </p>
              </div>
              <div className="card-body-pane">
                <form onSubmit={handleResetPassword}>
                  <div className="form-group-block">
                    <label className="label-text">{lang === 'vi' ? 'Mật khẩu mới' : 'New Password'}</label>
                    <input 
                      className="premium-form-input" 
                      type="password" 
                      placeholder={lang === 'vi' ? "Tối thiểu 6 ký tự" : "Minimum 6 characters"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <div className="form-group-block">
                    <label className="label-text">{lang === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}</label>
                    <input 
                      className="premium-form-input" 
                      type="password" 
                      placeholder={lang === 'vi' ? "Nhập lại mật khẩu phía trên" : "Re-enter your new password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {status && (
                    <div className={`status-badge-message ${isError ? 'err' : 'info'}`}>
                      {status}
                    </div>
                  )}

                  <button type="submit" className="action-button-core" style={{ marginTop: 12 }} disabled={loading}>
                    {loading 
                      ? (lang === 'vi' ? 'Đang cập nhật...' : 'Updating credential...')
                      : (lang === 'vi' ? 'Lưu mật khẩu mới' : 'Save New Password')
                    }
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS OVERLAY */}
          {step === 3 && (
            <div className="card-body-pane" style={{ padding: '40px 24px 24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 16 }}>
                {checkVerified}
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--success)', letterSpacing: '-0.02em' }}>
                {lang === 'vi' ? 'Đặt lại mật khẩu thành công' : 'Password Reset Complete'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, maxWidth: 400, margin: '0 auto 28px' }}>
                {lang === 'vi'
                  ? 'Thông tin xác thực tài khoản Bác sĩ đã được ghi nhận cấu trúc mới trên cơ sở dữ liệu.'
                  : 'Your core health provider login keys have been overwritten successfully on storage.'}
              </p>
              <button onClick={handleBackToLogin} className="action-button-core" style={{ maxWidth: 220, margin: '0 auto' }}>
                {lang === 'vi' ? 'Quay lại Đăng nhập' : 'Return to Gate'}
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="premium-footer">
        <div className="footer-link-row">
          <a href="#policy" className="f-link">Security Policy</a>
          <a href="#terms" className="f-link">Terms of Service</a>
          <a href="#help" className="f-link">Help Desk</a>
        </div>
        <div>
          © 2026 Powered by Zero-Knowledge Proofs and Distributed Ledger Tech.
        </div>
      </footer>
    </div>
  );
}