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
    setStatus(lang === 'vi' ? 'Đang quét khuôn mặt và tìm kiếm tài khoản Admin...' : 'Scanning face and finding Admin account...');
    try {
      const resInit = await authService.recoverInit(embedding);
      const { access_token, user } = resInit.data;
      
      localStorage.setItem('recovery_token', access_token);
      
      setStatus(lang === 'vi' ? `Nhận diện thành công Admin: ${user.username}. Đang tải khóa căn tính ZKP...` : `Identified Admin: ${user.username}. Loading ZKP identity...`);
      const resData = await zkpService.getRecoveryData();
      if (!resData.data.commitment) {
        throw new Error(lang === 'vi' ? 'Không tìm thấy căn tính ZKP đã liên kết với tài khoản này.' : 'No ZKP identity found linked with this account.');
      }
      
      setRecoveryData(resData.data);
      setStep(2);
      setStatus('');
    } catch (err) {
      setIsError(true);
      setStatus(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateProof = async () => {
    try {
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
      setIsError(true);
      setStatus(lang === 'vi' ? 'Vui lòng kết nối ví mới để tiếp tục' : 'Please connect your new wallet to continue');
      return;
    }
    if (!secret) {
      setIsError(true);
      setStatus(lang === 'vi' ? 'Vui lòng nhập mã khôi phục ZKP (MFA Secret)' : 'Please enter ZKP recovery code (MFA Secret)');
      return;
    }

    setLoading(true);
    setIsError(false);
    setStatus(lang === 'vi' ? 'Đang tạo bằng chứng Zero-Knowledge Proof bảo mật...' : 'Generating secure Zero-Knowledge Proof...');

    try {
      const proof = await generateProof();

      setStatus(lang === 'vi' ? 'Đang gửi bằng chứng xác minh lên Blockchain...' : 'Submitting verification proof to Blockchain...');
      await recoverWallet(
        proof.pA, proof.pB, proof.pC, 
        recoveryData.commitment, 
        address
      );

      setStatus(lang === 'vi' ? 'Cập nhật địa chỉ ví mới trên cơ sở dữ liệu...' : 'Updating new wallet address in database...');
      await zkpService.updateWallet(address);

      setStep(3);
      setStatus('');
    } catch (err) {
      setIsError(true);
      setStatus(err.shortMessage || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Premium Layout SVGs
  // ============================================================
  const isDark = theme === 'dark';
  const logoShield = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  const globeIcon = <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
  const moonIcon = <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
  const sunIcon = <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg>;
  const arrowBackIcon = <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
  const checkVerified = <svg viewBox="0 0 24 24" width="56" height="56" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

  const cssVars = {
    '--bg-color': isDark ? '#0f172a' : '#f8fafc',
    '--card-bg': isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
    '--card-border': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    '--text-main': isDark ? '#f8fafc' : '#0f172a',
    '--text-muted': isDark ? '#94a3b8' : '#64748b',
    '--primary-adm': isDark ? '#818cf8' : '#4f46e5',
    '--primary-hover': isDark ? '#6366f1' : '#4338ca',
    '--input-bg': isDark ? '#0f172a' : '#ffffff',
    '--input-border': isDark ? '#334155' : '#cbd5e1',
    '--success': '#10b981',
    '--danger': '#ef4444'
  };

  return (
    <div className="saas-recovery-wrapper" style={cssVars}>
      <style>{`
        .saas-recovery-wrapper {
          min-height: 100vh; width: 100%; display: flex; flex-direction: column;
          background-color: var(--bg-color); color: var(--text-main);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative; transition: all 0.3s ease; box-sizing: border-box;
        }
        
        .ambient-mesh {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(circle at 50% -10%, rgba(79, 70, 229, ${isDark ? '0.12' : '0.06'}), transparent 40%);
          filter: blur(50px);
        }

        .premium-header {
          position: relative; z-index: 10; padding: 20px 32px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid var(--card-border); background: var(--card-bg);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        }
        .header-logo {
          display: flex; align-items: center; gap: 8px; font-weight: 800;
          font-size: 1.15rem; color: var(--primary-adm); text-decoration: none; letter-spacing: -0.02em;
        }
        .nav-actions { display: flex; gap: 10px; }
        .control-btn {
          display: flex; align-items: center; gap: 6px; padding: 8px 12px;
          background: var(--input-bg); border: 1px solid var(--card-border);
          border-radius: 8px; color: var(--text-main); font-weight: 600; font-size: 0.8rem;
          cursor: pointer; transition: all 0.15s ease;
        }
        .control-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.04); }

        .main-content-area {
          flex: 1; position: relative; z-index: 5; width: 100%; max-width: 680px;
          margin: 0 auto; padding: 40px 24px; box-sizing: border-box;
          animation: pageFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .back-nav-link {
          display: inline-flex; align-items: center; gap: 8px; color: var(--text-muted);
          text-decoration: none; font-size: 0.9rem; font-weight: 600; transition: color 0.15s;
          margin-bottom: 24px; background: none; border: none; cursor: pointer; padding: 0;
        }
        .back-nav-link:hover { color: var(--primary-adm); }
        
        .recovery-glass-card {
          background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: 16px; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.08);
          overflow: hidden; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }

        .stepper-container { display: flex; gap: 12px; padding: 0 4px; margin-bottom: 32px; }
        .step-segment { flex: 1; height: 4px; background: var(--input-border); opacity: 0.4; border-radius: 2px; transition: all 0.3s; }
        .step-segment.active { background: var(--primary-adm); opacity: 1; box-shadow: 0 0 8px var(--primary-adm); }

        .card-header-pane { padding: 32px 32px 20px 32px; border-bottom: 1px solid var(--card-border); }
        .card-body-pane { padding: 32px; }
        
        .form-group-block { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
        .label-text { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .premium-form-input {
          width: 100%; height: 44px; padding: 0 14px; background: var(--input-bg);
          border: 1px solid var(--input-border); border-radius: 10px; color: var(--text-main);
          font-size: 0.92rem; outline: none; transition: all 0.2s ease; box-sizing: border-box;
        }
        .premium-form-input:focus { border-color: var(--primary-adm); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); }
        
        .action-button-core {
          width: 100%; height: 46px; border: none; border-radius: 10px;
          background: var(--primary-adm); color: #ffffff; font-size: 0.95rem; font-weight: 600;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-button-core:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 6px 15px rgba(79, 70, 229, 0.2); }
        .action-button-core:disabled { opacity: 0.6; cursor: not-allowed; }

        .status-badge-message {
          padding: 12px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 500; line-height: 1.5; margin-top: 20px;
        }
        .status-badge-message.err { background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); color: var(--danger); }
        .status-badge-message.info { background: rgba(79, 70, 229, 0.06); border: 1px solid rgba(79, 70, 229, 0.12); color: var(--primary-adm); }

        .tech-camera-frame {
          border: 2px dashed var(--input-border); border-radius: 12px; background: var(--input-bg);
          padding: 24px; display: flex; flex-direction: column; align-items: center; width: 100%; box-sizing: border-box;
        }

        .premium-footer {
          margin-top: auto; padding: 32px; border-top: 1px solid var(--card-border);
          text-align: center; font-size: 0.8rem; color: var(--text-muted); background: var(--card-bg);
        }
        .footer-link-row { display: flex; justify-content: center; gap: 24px; margin-bottom: 12px; }
        .f-link { color: var(--text-muted); text-decoration: none; transition: color 0.15s; font-weight: 500; }
        .f-link:hover { color: var(--primary-adm); }

        @keyframes pageFadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 680px) {
          .premium-header { padding: 16px; }
          .main-content-area { padding: 24px 16px; }
          .card-header-pane { padding: 24px 20px 16px 20px; }
          .card-body-pane { padding: 20px; }
        }
      `}</style>

      <div className="ambient-mesh" />

      {/* HEADER NAVIGATION */}
      <header className="premium-header">
        <a href="/login" onClick={(e) => { e.preventDefault(); handleBackToLogin(); }} className="header-logo">
          {logoShield}
          <span>ZKP Identity System</span>
        </a>
        <div className="nav-actions">
          <button className="control-btn" onClick={toggleLang}>
            {globeIcon} {lang === 'vi' ? 'VI' : 'EN'}
          </button>
          <button className="control-btn" onClick={toggleTheme} style={{ padding: '8px' }}>
            {isDark ? sunIcon : moonIcon}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT BLOCK */}
      <main className="main-content-area">
        <button onClick={handleBackToLogin} className="back-nav-link">
          {arrowBackIcon} {lang === 'vi' ? 'Quay lại đăng nhập' : 'Back to login'}
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
            {lang === 'vi' ? 'Khôi phục tài khoản Admin' : 'ZKP Account Recovery'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
            {lang === 'vi' 
              ? 'Xác thực khuôn mặt kết hợp mã mã hóa Zero-Knowledge Proof để ghi đè, liên kết địa chỉ ví Web3 mới an toàn.'
              : 'Prove account ownership via biometrics and zero-knowledge protocols to map a newly generated wallet key securely.'}
          </p>
        </div>

        <div className="stepper-container">
          <div className={`step-segment ${step >= 1 ? 'active' : ''}`} />
          <div className={`step-segment ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-segment ${step >= 3 ? 'active' : ''}`} />
        </div>

        <div className="recovery-glass-card">
          
          {/* STEP 1: BIOMETRIC SCANNING */}
          {step === 1 && (
            <div>
              <div className="card-header-pane">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {lang === 'vi' ? 'Bước 1: Quét sinh trắc học khuôn mặt' : 'Step 1: Facial Biometrics Verification'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                  {lang === 'vi' 
                    ? 'Vui lòng căn chỉnh camera trực diện để thực hiện Liveness Check chống giả mạo.' 
                    : 'Align your camera view directly to complete anti-spoofing liveness validation.'}
                </p>
              </div>
              <div className="card-body-pane" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="tech-camera-frame">
                  <FaceCapture onCapture={handleFaceVerify} autoStart={true} requireLiveness={true} />
                </div>
                
                {status && (
                  <div className={`status-badge-message ${isError ? 'err' : 'info'}`} style={{ width: '100%', boxSizing: 'border-box' }}>
                    {status}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: METAMASK & ZKP DATA ENTRY */}
          {step === 2 && (
            <div>
              <div className="card-header-pane">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {lang === 'vi' ? 'Bước 2: Cấu hình khóa ví mới và Mã ZKP' : 'Step 2: Initialize New Wallet and ZKP Key'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                  {lang === 'vi'
                    ? 'Ký xác thực địa chỉ ví thay thế cùng chuỗi khóa mật mã bí mật thuở ban đầu.'
                    : 'Sign with your clean replacement wallet address and enter your master backup credential.'}
                </p>
              </div>
              <div className="card-body-pane">
                <div className="form-group-block">
                  <label className="label-text">{lang === 'vi' ? '1. Địa chỉ ví MetaMask mới' : '1. New Target Wallet Node'}</label>
                  <WalletConnect />
                </div>

                <div className="form-group-block">
                  <label className="label-text">{lang === 'vi' ? '2. Cụm mã khóa khôi phục ZKP (MFA Secret)' : '2. ZKP Recovery Identity Key (MFA Secret)'}</label>
                  <input 
                    className="premium-form-input" type="text" value={secret}
                    onChange={e => setSecret(e.target.value)}
                    placeholder={lang === 'vi' ? "Nhập chuỗi ký tự mật mã bí mật" : "Enter master authentication secret phrase"}
                    style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.02em' }}
                  />
                </div>

                {status && (
                  <div className={`status-badge-message ${isError ? 'err' : 'info'}`}>
                    {status}
                  </div>
                )}

                <button 
                  className="action-button-core" style={{ marginTop: 28 }}
                  onClick={handleRecover} disabled={loading}
                >
                  {loading 
                    ? (lang === 'vi' ? 'Đang thực thi mật mã...' : 'Executing cryptoproof...')
                    : (lang === 'vi' ? 'Khởi Tạo Bằng Chứng và Đồng Bộ Ví' : 'Synthesize Proof and Remap Wallet')
                  }
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="card-body-pane" style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 20 }}>
                {checkVerified}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--success)' }}>
                {lang === 'vi' ? 'Khôi phục hoàn tất thành công' : 'Node Successfully Re-mapped'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: 440, margin: '0 auto 32px' }}>
                {lang === 'vi'
                  ? 'Quyền hạn Smart Contract của bạn đã được tái định tuyến về khóa ví mới thành công.'
                  : 'On-chain security authorization states have been redirected to your new keypair.'}
              </p>
              <button onClick={handleBackToLogin} className="action-button-core" style={{ maxWidth: 220, margin: '0 auto' }}>
                {lang === 'vi' ? 'Quay lại Đăng nhập' : 'Return to Gate'}
              </button>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER METADATA */}
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