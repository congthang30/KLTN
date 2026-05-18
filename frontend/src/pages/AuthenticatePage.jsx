import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import WalletConnect from '../components/WalletConnect';
import FaceCapture from '../components/FaceCapture';
import { authService } from '../services/authService';

export default function AuthenticatePage() {
  const { user, token, updateToken } = useAuth();
  const { address, connectMock, disconnect } = useWallet();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  // Admin: wallet already verified at login (Flow B), only need face scan
  // Doctor: need both wallet verify + face scan
  const [walletVerified, setWalletVerified] = useState(isAdmin ? true : false);
  const [verifiedWalletAddress, setVerifiedWalletAddress] = useState(
    isAdmin ? (user?.walletAddress || '') : ''
  );
  const [customWallet, setCustomWallet] = useState('');
  const [status, setStatus] = useState(
    isAdmin ? '✅ Ví đã được xác thực qua blockchain khi đăng nhập. Tiến hành quét khuôn mặt.' : ''
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.verified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // ============================================================
  // DOCTOR ONLY: Wallet verification (Admin skips this - already done at login)
  // ============================================================
  const handleWalletVerify = async (addr, isMockSelection = false) => {
    setLoading(true);
    setStatus('');
    try {
      if (isMockSelection) {
        connectMock(addr);
        setWalletVerified(true);
        setVerifiedWalletAddress(addr);
        setStatus('✅ Step 1 complete (Mock Wallet): Wallet verified! Proceed to Face scan.');
        return;
      }

      setStatus('Signing verification message...');
      const message = `ZKP Identity Verification\nTimestamp: ${Date.now()}\nAddress: ${addr}`;

      const provider = new (await import('ethers')).BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      setStatus('Verifying wallet...');
      const res = await authService.verifyWallet(addr, signature, message);

      if (res.data.verified) {
        setWalletVerified(true);
        setVerifiedWalletAddress(addr);
        setStatus('✅ Step 1 complete: Wallet verified! Please proceed to Face scan.');
      }
    } catch (err) {
      setStatus('❌ Wallet verification failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SHARED: Face verification (Layer 2 for both Admin and Doctor)
  // ============================================================
  const handleFaceVerify = async (embedding) => {
    setLoading(true);
    setStatus('Verifying face...');
    try {
      const res = await authService.verifyFace(embedding);
      if (res.data.verified) {
        setStatus(`✅ Xác thực thành công! (similarity: ${(res.data.similarity * 100).toFixed(1)}%)`);

        updateToken(res.data.access_token, { verified: true });

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      setStatus('❌ Face verification failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = () => {
    setWalletVerified(false);
    setVerifiedWalletAddress('');
    setCustomWallet('');
    disconnect();
    setStatus('');
  };

  return (
    <div className="container fade-in" style={{ padding: '40px 24px', maxWidth: 700 }}>
      <div className="card" style={{
        padding: 32,
        borderColor: 'var(--accent)',
        background: 'rgba(99, 102, 241, 0.02)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <h1 style={{ marginBottom: 12, color: 'var(--accent)', fontSize: '1.6rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          🔒 {isAdmin ? 'Admin Biometric Verification' : 'Dual-Factor Security Authentication'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 32, fontSize: '0.9rem' }}>
          {isAdmin
            ? 'Ví đã được xác thực on-chain. Quét khuôn mặt để hoàn tất đăng nhập.'
            : 'To unlock your secure dashboard, please complete both wallet and face verification.'
          }
        </p>

        {/* Stepper Progress */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          <div style={{
            flex: 1, padding: '12px 16px', borderRadius: 8,
            background: walletVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
            border: `1px solid ${walletVerified ? 'var(--success)' : 'var(--primary)'}`,
            color: walletVerified ? 'var(--success)' : 'var(--text-primary)',
            fontSize: '0.85rem'
          }}>
            <strong>1. Wallet Auth {walletVerified && '✓'}</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {walletVerified
                ? isAdmin
                  ? `On-chain verified: ${verifiedWalletAddress.slice(0, 6)}...${verifiedWalletAddress.slice(-4)}`
                  : `Address: ${verifiedWalletAddress.slice(0, 6)}...${verifiedWalletAddress.slice(-4)}`
                : 'Connect & Sign'
              }
            </div>
          </div>
          <div style={{
            flex: 1, padding: '12px 16px', borderRadius: 8,
            background: !walletVerified ? 'rgba(255,255,255,0.01)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${walletVerified ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
            opacity: walletVerified ? 1 : 0.5,
            color: 'var(--text-primary)',
            fontSize: '0.85rem'
          }}>
            <strong>2. Face Scan</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Biometric check
            </div>
          </div>
        </div>

        {/* Step 1: Wallet Connect (Doctor only; Admin already verified) */}
        {!walletVerified ? (
          <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 8, border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: 12, fontSize: '1rem' }}>🦊 Step 1: Verify Wallet Ownership</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
              Connect MetaMask and sign the verification request. The address must match your registered wallet.
            </p>
            <WalletConnect onConnect={(addr) => handleWalletVerify(addr, false)} />

            {/* Developer Testing Tools */}
            <div style={{
              marginTop: 24, padding: '20px 16px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.1)',
            }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                🛠️ Developer Testing Tools
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Bypass MetaMask and authenticate with any wallet address directly:
              </p>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Pre-funded Account</label>
                <select
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                  value={customWallet}
                  onChange={(e) => setCustomWallet(e.target.value)}
                >
                  <option value="">-- Choose a Hardhat Account --</option>
                  <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C8">Account #1: 0x7099...79C8</option>
                  <option value="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC">Account #2: 0x3C44...93BC</option>
                  <option value="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266">Account #0: 0xf39F...2266</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Or Enter Custom Wallet Address</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="0x..."
                  value={customWallet}
                  onChange={(e) => setCustomWallet(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <button
                className="btn btn-secondary btn-full"
                type="button"
                disabled={!customWallet || loading}
                onClick={() => handleWalletVerify(customWallet, true)}
                style={{ fontSize: '0.85rem', fontWeight: 600 }}
              >
                🎯 Confirm Selected Wallet
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Face Capture with Liveness Detection */
          <div className="fade-in" style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 8, border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: 12, fontSize: '1rem' }}>
              📷 {isAdmin ? 'Quét khuôn mặt để hoàn tất đăng nhập' : 'Bước 2: Xác thực sinh trắc học'}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
              Hệ thống sẽ yêu cầu bạn quay đầu để xác minh người thật, sau đó so khớp khuôn mặt đã đăng ký.
            </p>
            <FaceCapture onCapture={handleFaceVerify} requireLiveness={true} />

            {/* Doctor can rollback to wallet step; Admin cannot (wallet was verified at login) */}
            {!isAdmin && (
              <button
                className="btn btn-secondary btn-full"
                type="button"
                onClick={handleRollback}
                disabled={loading}
                style={{ marginTop: 16, border: '1px dashed var(--border)' }}
              >
                ← Quay lại bước 1 (Xác thực ví)
              </button>
            )}
          </div>
        )}

        {status && (
          <p style={{
            marginTop: 20, padding: '10px 14px', borderRadius: 6, fontSize: '0.9rem',
            background: 'rgba(0,0,0,0.2)',
            color: status.includes('✅') ? 'var(--success)' : status.includes('❌') ? 'var(--danger)' : 'var(--text-secondary)'
          }}>
            {status}
          </p>
        )}

        {/* Wallet Recovery link */}
        <div style={{
          marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'center'
        }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/recovery')}
            style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 600 }}
          >
            ⚠️ {isAdmin ? 'Mất ví? Khôi phục bằng MFA & Face' : 'Lost Wallet? Recover using ZKP & Face Biometric'} →
          </button>
        </div>
      </div>
    </div>
  );
}
