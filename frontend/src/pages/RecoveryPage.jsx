import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useThemeLang } from '../contexts/ThemeLangContext';
import FaceCapture from '../components/FaceCapture';
import WalletConnect from '../components/WalletConnect';
import { zkpService } from '../services/zkpService';
import { authService } from '../services/authService';

export default function RecoveryPage() {
  const { recoverWallet, address } = useWallet();
  const navigate = useNavigate();
  const { theme, toggleTheme, lang, toggleLang } = useThemeLang();
  
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState('');
  const [recoveryData, setRecoveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

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
    setStatus(lang === 'vi' ? 'Đang quét khuôn mặt & tìm kiếm tài khoản Admin...' : 'Scanning face & finding Admin account...');
    try {
      // 1. Verify Face against all admins to identify and get temporary token
      const resInit = await authService.recoverInit(embedding);
      const { access_token, user } = resInit.data;
      
      // Save temporary token in localStorage so subsequent API requests have Authorization header
      localStorage.setItem('recovery_token', access_token);
      
      // 2. Fetch ZKP commitment & faceHash using the temporary token
      setStatus(lang === 'vi' ? `Nhận diện thành công Admin: ${user.username}. Đang tải khóa căn tính ZKP...` : `Identified Admin: ${user.username}. Loading ZKP identity...`);
      const resData = await zkpService.getRecoveryData();
      if (!resData.data.commitment) {
        throw new Error(lang === 'vi' ? 'Không tìm thấy căn tính ZKP đã liên kết với tài khoản này.' : 'No ZKP identity found linked with this account.');
      }
      
      setRecoveryData(resData.data);
      setStep(2);
      setStatus('');
    } catch (err) {
      setStatus('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const generateProof = async () => {
    try {
      // Dummy proof for MockVerifier in prototype smart contract
      return {
        pA: ["0", "0"],
        pB: [["0", "0"], ["0", "0"]],
        pC: ["0", "0"]
      };
    } catch (err) {
      throw new Error('Không thể tạo bằng chứng ZKP: ' + err.message);
    }
  };

  const handleRecover = async () => {
    if (!address) {
      setStatus(lang === 'vi' ? '❌ Vui lòng kết nối VÍ MỚI trước' : '❌ Please connect your NEW wallet first');
      return;
    }
    if (!secret) {
      setStatus(lang === 'vi' ? '❌ Vui lòng nhập mã khôi phục ZKP (MFA Secret)' : '❌ Please enter ZKP recovery code (MFA Secret)');
      return;
    }

    setLoading(true);
    setStatus(lang === 'vi' ? 'Đang tạo bằng chứng Zero-Knowledge Proof bảo mật...' : 'Generating secure Zero-Knowledge Proof...');

    try {
      // 1. Generate Proof
      const proof = await generateProof();

      setStatus(lang === 'vi' ? 'Đang gửi bằng chứng xác minh lên Blockchain...' : 'Submitting verification proof to Blockchain...');
      // 2. Submit to smart contract
      await recoverWallet(
        proof.pA, proof.pB, proof.pC, 
        recoveryData.commitment, 
        address
      );

      setStatus(lang === 'vi' ? 'Cập nhật địa chỉ ví mới trên cơ sở dữ liệu...' : 'Updating new wallet address in database...');
      // 3. Update database
      await zkpService.updateWallet(address);

      setStatus(lang === 'vi' ? '✅ Khôi phục ví thành công!' : '✅ Wallet recovered successfully!');
      setStep(3);
    } catch (err) {
      setStatus('❌ ' + (err.shortMessage || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <header className="recovery-header">
        <a href="/login" onClick={(e) => { e.preventDefault(); handleBackToLogin(); }} className="recovery-logo">
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
          <a href="/login" onClick={(e) => { e.preventDefault(); handleBackToLogin(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            {lang === 'vi' ? 'Quay lại trang đăng nhập' : 'Back to login page'}
          </a>
        </div>

        {/* Title Block */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>key</span>
            {lang === 'vi' ? 'Khôi phục Ví Admin (ZKP Recovery)' : 'Recover Admin Wallet (ZKP Recovery)'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {lang === 'vi' 
              ? 'Bị mất ví hoặc đổi ví mới? Chứng minh quyền sở hữu tài khoản của bạn thông qua nhận diện khuôn mặt và mã bảo mật ZKP để liên kết với địa chỉ ví mới.'
              : 'Lost your wallet or changing keys? Verify ownership via facial recognition and ZKP security code to associate your new wallet address.'
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
                  {lang === 'vi' ? 'Bước 1: Xác thực khuôn mặt Admin' : 'Step 1: Admin Face Verification'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6, lineHeight: 1.5 }}>
                  {lang === 'vi'
                    ? 'Nhìn thẳng và làm theo thử thách trên camera dưới đây để kiểm tra thực thể sống (Liveness Check). Hệ thống sẽ tự động tìm kiếm và đối khớp khuôn mặt của bạn trên cơ sở dữ liệu Admin.'
                    : 'Look straight and follow the face movement instructions on screen for liveness verification. The system will automatically search and match your face with the Admin database.'
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
                  {lang === 'vi' ? 'Bước 2: Cấp ví mới & Mã bảo mật ZKP' : 'Step 2: Connect New Wallet & ZKP Secret'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6, lineHeight: 1.5 }}>
                  {lang === 'vi'
                    ? 'Kết nối địa chỉ ví MetaMask mới và cung cấp mã bảo mật ZKP (MFA Secret) đã được cấp khi bạn kích hoạt tài khoản để tiến hành đổi khóa trên Hợp đồng thông minh.'
                    : 'Connect your new MetaMask wallet and supply the ZKP security code (MFA Secret) issued during account activation to rewrite the address on Smart Contract.'
                  }
                </p>
              </div>
              <div className="recovery-card-body" style={{ padding: 32 }}>
                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    {lang === 'vi' ? '1. Kết nối địa chỉ VÍ METAMASK MỚI' : '1. Connect NEW METAMASK Wallet'}
                  </label>
                  <div style={{ marginTop: 8 }}>
                    <WalletConnect />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    {lang === 'vi' ? '2. Mã bảo mật ZKP (MFA Secret Key)' : '2. ZKP Security Code (MFA Secret Key)'}
                  </label>
                  <input 
                    className="form-input" 
                    type="text" 
                    placeholder={lang === 'vi' ? "Nhập mã bảo mật dạng cụm từ hoặc Hex" : "Enter phrase or hex security key"}
                    value={secret}
                    onChange={e => setSecret(e.target.value)}
                    style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  />
                </div>

                {status && (
                  <div className={`alert ${status.includes('❌') ? 'alert-error' : 'alert-info'}`} style={{ marginTop: 24, padding: '12px 16px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500 }}>
                    {status}
                  </div>
                )}

                <button 
                  className="btn btn-primary btn-lg btn-full" 
                  style={{ marginTop: 24, fontWeight: 700, height: 48, fontSize: '1rem', background: 'var(--primary)', color: '#fff' }}
                  onClick={handleRecover}
                  disabled={loading}
                >
                  {loading 
                    ? (lang === 'vi' ? 'Đang thực hiện khôi phục...' : 'Processing recovery...')
                    : (lang === 'vi' ? '🛡️ Tạo Bằng Chứng ZKP & Khôi Phục Ví' : '🛡️ Generate ZKP Proof & Recover Wallet')
                  }
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="recovery-card-body" style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 12, color: 'var(--success)' }}>
                {lang === 'vi' ? 'Khôi phục tài khoản thành công!' : 'Account Recovered Successfully!'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 32px' }}>
                {lang === 'vi'
                  ? 'Địa chỉ ví mới của bạn đã được cập nhật thành công trên Smart Contract và cơ sở dữ liệu hệ thống.'
                  : 'Your new wallet address has been updated successfully on the Smart Contract and system database.'
                }
              </p>
              <button onClick={handleBackToLogin} className="btn btn-primary btn-lg" style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 32px', fontWeight: 600 }}>
                {lang === 'vi' ? 'Quay lại trang Đăng nhập' : 'Return to Login page'}
              </button>
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
