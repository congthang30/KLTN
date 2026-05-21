import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useThemeLang } from '../contexts/ThemeLangContext';
import FaceCapture from '../components/FaceCapture';
import { authService } from '../services/authService';

export default function ForgotPasswordPage() {
  const { updateToken } = useAuth();
  const { theme, toggleTheme, lang, toggleLang } = useThemeLang();
  
  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFaceVerify = async (embedding) => {
    setLoading(true);
    setStatus(lang === 'vi' ? 'Đang quét khuôn mặt & tìm kiếm tài khoản Bác sĩ...' : 'Scanning face & finding Doctor account...');
    try {
      // 1. Verify Face against all doctors to identify and get temporary token
      const resInit = await authService.doctorRecoverInit(embedding);
      const { access_token, user } = resInit.data;
      
      // Save temporary token in context so subsequent API requests have Authorization header
      updateToken(access_token, user);
      
      setStatus(lang === 'vi' ? `Nhận diện thành công Bác sĩ: ${user.username}. Đang chuyển tiếp...` : `Identified Doctor: ${user.username}. Advancing...`);
      setStep(2);
      setStatus('');
    } catch (err) {
      setStatus('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setStatus(lang === 'vi' ? '❌ Vui lòng nhập mật khẩu mới' : '❌ Please enter new password');
      return;
    }
    if (newPassword.length < 6) {
      setStatus(lang === 'vi' ? '❌ Mật khẩu phải có ít nhất 6 ký tự' : '❌ Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus(lang === 'vi' ? '❌ Mật khẩu xác nhận không khớp' : '❌ Password confirmation does not match');
      return;
    }

    setLoading(true);
    setStatus(lang === 'vi' ? 'Đang cập nhật mật khẩu mới...' : 'Updating new password...');

    try {
      await authService.resetPassword(newPassword);
      setStatus(lang === 'vi' ? '✅ Cập nhật mật khẩu thành công!' : '✅ Password updated successfully!');
      setStep(3);
    } catch (err) {
      setStatus('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <header className="recovery-header">
        <a href="/login" className="recovery-logo">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          ZKP Identity System
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="recovery-nav-btn" onClick={toggleLang} title={lang === 'vi' ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}>
            <span className="material-symbols-outlined">language</span>
          </button>
          <button className="recovery-nav-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Chuyển sang Chế độ sáng' : 'Switch to Dark mode'}>
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="recovery-container">
        {/* Back Link */}
        <div style={{ marginBottom: 24 }}>
          <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            {lang === 'vi' ? 'Quay lại trang đăng nhập' : 'Back to login page'}
          </a>
        </div>

        {/* Title Block */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', justifycontent: 'center', gap: 10, marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
            {lang === 'vi' ? 'Quên Mật Khẩu Bác Sĩ (Doctor Recovery)' : 'Recover Doctor Password (Doctor Recovery)'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {lang === 'vi' 
              ? 'Đặt lại mật khẩu tài khoản Bác sĩ của bạn thông qua công nghệ nhận diện khuôn mặt và kiểm tra thực thể sống bảo mật.'
              : 'Reset your Doctor account password through biometric facial recognition and secure liveness check.'
            }
          </p>
        </div>

        {/* Progress indicators */}
        <div className="step-indicator-bar">
          {[1, 2, 3].map(num => (
            <div key={num} className={`step-indicator-segment ${step >= num ? 'active' : ''}`} />
          ))}
        </div>

        {/* Steps */}
        <div className="recovery-card">
          {step === 1 && (
            <>
              <div className="recovery-card-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {lang === 'vi' ? 'Bước 1: Xác thực khuôn mặt Bác sĩ' : 'Step 1: Doctor Face Verification'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6, lineHeight: 1.5 }}>
                  {lang === 'vi'
                    ? 'Nhìn thẳng và làm theo thử thách trên camera dưới đây để kiểm tra thực thể sống (Liveness Check). Hệ thống sẽ tự động tìm kiếm khuôn mặt của bạn trên cơ sở dữ liệu Bác sĩ để xác minh danh tính.'
                    : 'Look straight and follow the face movement instructions on screen for liveness verification. The system will automatically search and match your face with the Doctor database.'
                  }
                </p>
              </div>
              <div className="recovery-card-body" style={{ background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
                <FaceCapture onCapture={handleFaceVerify} autoStart={true} requireLiveness={true} />
                
                {status && (
                  <p style={{ 
                    marginTop: 20, 
                    color: status.includes('❌') ? 'var(--danger)' : 'var(--primary)', 
                    textAlign: 'center', 
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }}>
                    {status}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="recovery-card-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {lang === 'vi' ? 'Bước 2: Thiết lập mật khẩu mới' : 'Step 2: Setup New Password'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6, lineHeight: 1.5 }}>
                  {lang === 'vi'
                    ? 'Nhập mật khẩu mới bảo mật của bạn. Mật khẩu mới cần tối thiểu 6 ký tự.'
                    : 'Enter your new secure password. The new password must be at least 6 characters long.'
                  }
                </p>
              </div>
              <div className="recovery-card-body" style={{ padding: 32 }}>
                <form onSubmit={handleResetPassword}>
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                      {lang === 'vi' ? 'Mật khẩu mới' : 'New Password'}
                    </label>
                    <input 
                      className="form-input" 
                      type="password" 
                      placeholder={lang === 'vi' ? "Nhập mật khẩu mới (tối thiểu 6 ký tự)" : "Enter new password (min 6 chars)"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                      {lang === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}
                    </label>
                    <input 
                      className="form-input" 
                      type="password" 
                      placeholder={lang === 'vi' ? "Nhập lại mật khẩu mới" : "Confirm new password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {status && (
                    <div className={`alert ${status.includes('❌') ? 'alert-error' : 'alert-info'}`} style={{ marginTop: 20, padding: '12px 16px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500 }}>
                      {status}
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="btn btn-primary btn-lg btn-full" 
                    style={{ marginTop: 24, fontWeight: 700, height: 48, fontSize: '1rem' }}
                    disabled={loading}
                  >
                    {loading 
                      ? (lang === 'vi' ? 'Đang cập nhật...' : 'Updating...')
                      : (lang === 'vi' ? '💾 Lưu mật khẩu mới' : '💾 Save New Password')
                    }
                  </button>
                </form>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="recovery-card-body" style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 12, color: 'var(--success)' }}>
                {lang === 'vi' ? 'Đặt lại mật khẩu thành công!' : 'Password Reset Successfully!'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 32px' }}>
                {lang === 'vi'
                  ? 'Mật khẩu mới của bạn đã được cập nhật thành công. Hãy dùng mật khẩu này để đăng nhập vào tài khoản.'
                  : 'Your new password has been updated successfully. Please use this password to log into your account.'
                }
              </p>
              <a href="/login" className="btn btn-primary btn-lg" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 32px', fontWeight: 600 }}>
                {lang === 'vi' ? 'Quay lại trang Đăng nhập' : 'Return to Login page'}
              </a>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="recovery-footer">
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: 8 }}>
          ZKP Identity System
        </div>
        <div className="recovery-footer-links">
          <a href="#" className="recovery-footer-link">Security Policy</a>
          <a href="#" className="recovery-footer-link">Terms of Service</a>
          <a href="#" className="recovery-footer-link">Help Center</a>
        </div>
        <div style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          © 2026 Powered by ZKP + Blockchain
        </div>
      </footer>
    </div>
  );
}
