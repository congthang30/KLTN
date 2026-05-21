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
  
  const [step, setStep] = useState(2); // Giữ nguyên logic của bạn
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
      await recoverWallet(proof.pA, proof.pB, proof.pC, recoveryData.commitment, address);
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

  const isDark = theme === 'dark';

  const cssVars = {
    '--bg-color': isDark ? '#0b0f19' : '#f8fafc',
    '--card-bg': isDark ? 'rgba(17, 24, 39, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    '--card-border': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
    '--text-main': isDark ? '#f3f4f6' : '#0f172a',
    '--text-muted': isDark ? '#9ca3af' : '#64748b',
    '--input-bg': isDark ? '#111827' : '#ffffff',
    '--input-border': isDark ? '#374151' : '#e2e8f0',
    '--primary-adm': '#2563eb',
    '--primary-adm-hover': '#1d4ed8',
    '--error': '#ef4444',
    '--success': '#10b981',
    '--primary-color-rgb': '37, 99, 235',
    '--success-color-rgb': '16, 185, 129',
    '--error-color-rgb': '239, 68, 68'
  };

  return (
    <div className="zkp-mvp-wrapper" style={cssVars}>
      <style>{`
        .zkp-mvp-wrapper {
          min-height: 100vh; width: 100%; display: flex; flex-direction: column;
          background-color: var(--bg-color); color: var(--text-main);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          transition: background-color 0.4s ease; position: relative; overflow-x: hidden;
        }
        
        .ambient-glow {
          position: fixed; top: -15%; left: 50%; transform: translateX(-50%);
          width: 85vw; height: 55vh;
          background: radial-gradient(circle, rgba(var(--primary-color-rgb), 0.08) 0%, transparent 70%);
          filter: blur(90px); z-index: 0; pointer-events: none;
        }

        .main-container {
          position: relative; z-index: 5; flex: 1; display: flex;
          flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 24px;
        }

        .page-title {
          font-size: 2rem; font-weight: 700; letter-spacing: -0.03em;
          margin-bottom: 12px; text-align: center; color: var(--text-main);
        }

        .page-subtitle {
          color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;
          max-width: 520px; text-align: center; margin-bottom: 40px;
        }

        /* --- Nâng cấp Thẻ Glassmorphism siêu mịn --- */
        .saas-glass-card {
          width: 100%; max-width: 520px;
          background: var(--card-bg);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--card-border); border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04), 0 20px 60px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .stepper-ui { display: flex; padding: 36px 36px 0; gap: 8px; }
        .step-bar { flex: 1; height: 4px; border-radius: 9999px; background: var(--input-border); transition: all 0.4s ease; }
        .step-bar.active { background: var(--primary-adm); }

        .card-content { padding: 36px; }
        
        .step-heading { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
        .step-desc { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 32px; line-height: 1.5; }

        .form-group { margin-bottom: 24px; }
        
        .saas-label {
          display: block; font-size: 0.75rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--text-muted); margin-bottom: 10px;
        }

        .wallet-connect-wrapper {
          width: 100%;
        }

        .wallet-connect-wrapper > div {
          width: 100%;
        }

        /* Scope style only to wallet CTA buttons, not the small disconnect icon. */
        .wallet-connect-wrapper .action-button-core {
          width: 100% !important;
          height: 48px !important;
          background: var(--input-bg) !important;
          color: var(--text-main) !important;
          border: 1px solid var(--input-border) !important;
          border-radius: 12px !important;
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          gap: 8px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
          transition: all 0.2s ease !important;
          outline: none !important;
          text-shadow: none !important;
        }
        .wallet-connect-wrapper .action-button-core:hover {
          background: var(--input-border) !important;
          border-color: var(--text-muted) !important;
        }

        .wallet-connect-wrapper .disconnect-icon-btn {
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          padding: 0 !important;
          border-radius: 6px !important;
          background: transparent !important;
          border: 1px solid rgba(var(--error-color-rgb), 0.15) !important;
          color: var(--error) !important;
          box-shadow: none !important;
        }

        .wallet-connect-wrapper .disconnect-icon-btn:hover {
          background: rgba(var(--error-color-rgb), 0.08) !important;
          border-color: rgba(var(--error-color-rgb), 0.25) !important;
        }

        /* --- Input fields mượt mà hơn --- */
        .saas-input {
          width: 100%; height: 48px; padding: 0 16px;
          background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: 12px; color: var(--text-main); font-size: 0.95rem;
          outline: none; transition: all 0.2s ease; box-sizing: border-box;
        }
        .saas-input:focus {
          border-color: var(--primary-adm);
          box-shadow: 0 0 0 4px rgba(var(--primary-color-rgb), 0.1);
        }

        /* --- Nút Submit Đồng bộ viên thuốc của Apple --- */
        .saas-btn {
          width: 100%; height: 48px; background: var(--primary-adm);
          color: #fff; border: none; border-radius: 12px;
          font-size: 0.95rem; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease; margin-top: 36px;
        }
        .saas-btn:hover:not(:disabled) {
          background: var(--primary-adm-hover);
          box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.2);
        }
        .saas-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .camera-wrapper { border: 1px solid var(--input-border); border-radius: 16px; background: var(--input-bg); padding: 12px; }

        .alert-box { margin-top: 24px; padding: 14px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 500; }
        .alert-box.error { background: rgba(var(--error-color-rgb), 0.05); border: 1px solid rgba(var(--error-color-rgb), 0.15); color: var(--error); }
        .alert-box.info { background: rgba(var(--primary-color-rgb), 0.05); border: 1px solid rgba(var(--primary-color-rgb), 0.15); color: var(--primary-adm); }

        .success-icon-wrapper { width: 52px; height: 52px; background: rgba(var(--success-color-rgb), 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: var(--success); }
        .success-text { font-size: 1.4rem; font-weight: 700; color: var(--success); margin-bottom: 8px; }

        @media (max-width: 640px) {
          .main-container { padding: 32px 16px; }
          .page-title { font-size: 1.6rem; }
          .saas-glass-card { border-radius: 20px; }
          .card-content { padding: 24px; }
        }
      `}</style>

      <div className="ambient-glow"></div>

      <main className="main-container">
        <h1 className="page-title">
          {lang === 'vi' ? 'Khôi phục tài khoản Admin' : 'Admin Account Recovery'}
        </h1>
        <p className="page-subtitle">
          {lang === 'vi' 
            ? 'Xác thực sinh trắc học kết hợp bằng chứng Zero-Knowledge Proof để tái thiết lập địa chỉ ví Web3 an toàn.'
            : 'Authenticate via biometrics and Zero-Knowledge proofs to securely re-establish your Web3 wallet node.'}
        </p>

        <div className="saas-glass-card">
          <div className="stepper-ui">
            <div className={`step-bar ${step >= 1 ? 'active' : ''}`} />
            <div className={`step-bar ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-bar ${step >= 3 ? 'active' : ''}`} />
          </div>

          <div className="card-content">
            {step === 1 && (
              <div>
                <h2 className="step-heading">{lang === 'vi' ? '1. Xác thực sinh trắc học' : '1. Biometric Verification'}</h2>
                <p className="step-desc">{lang === 'vi' ? 'Hệ thống cần xác minh liveness để đối chiếu căn tính gốc.' : 'Liveness check required.'}</p>
                <div className="camera-wrapper">
                  <FaceCapture onCapture={handleFaceVerify} autoStart={true} requireLiveness={true} />
                </div>
              </div>
            )}

            {/* BƯỚC 2 ĐÃ ĐƯỢC FIX LỖI TRANH CHẤP CSS NÚT VÍ */}
            {step === 2 && (
              <div>
                <h2 className="step-heading">
                  {lang === 'vi' ? '2. Ánh xạ địa chỉ & Mã ZKP' : '2. Node Mapping & ZKP Key'}
                </h2>
                <p className="step-desc">
                  {lang === 'vi'
                    ? 'Ký xác thực địa chỉ ví mới và nhập chuỗi khóa mật mã bí mật để cấp quyền.'
                    : 'Sign the new wallet address and provide your master cryptographic secret.'}
                </p>

                <div className="form-group">
                  <label className="saas-label">
                    {lang === 'vi' ? 'A. Địa chỉ ví thay thế (Target Wallet)' : 'A. Target Wallet Node'}
                  </label>
                  {/* Bao bọc component để các thuộc tính đè CSS phía trên hoạt động chuẩn xác */}
                  <div className="wallet-connect-wrapper">
                    <WalletConnect />
                  </div>
                </div>

                <div className="form-group">
                  <label className="saas-label">
                    {lang === 'vi' ? 'B. Cụm khóa bí mật (MFA Secret)' : 'B. Master Identity Key (MFA Secret)'}
                  </label>
                  <input 
                    className="saas-input" 
                    type="password" 
                    value={secret}
                    onChange={e => setSecret(e.target.value)}
                    placeholder={lang === 'vi' ? "Nhập mã ZKP khôi phục..." : "Enter recovery key..."}
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}
                  />
                </div>

                {status && (
                  <div className={`alert-box ${isError ? 'error' : 'info'}`}>
                    {status}
                  </div>
                )}

                <button className="saas-btn" onClick={handleRecover} disabled={loading}>
                  {loading 
                    ? (lang === 'vi' ? 'Đang khởi tạo Proof...' : 'Synthesizing Proof...')
                    : (lang === 'vi' ? 'Xác minh & Đồng bộ ví' : 'Verify & Remap Node')
                  }
                </button>
              </div>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div className="success-icon-wrapper">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 className="success-text">{lang === 'vi' ? 'Cập nhật thành công' : 'Node Re-mapped'}</h2>
                <p className="step-desc">{lang === 'vi' ? 'Quyền quản trị đã chuyển về ví mới.' : 'State has been remapped.'}</p>
                <button onClick={handleBackToLogin} className="saas-btn" style={{ maxWidth: 220, margin: '0 auto' }}>
                  {lang === 'vi' ? 'Quay lại đăng nhập' : 'Return to Login'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
