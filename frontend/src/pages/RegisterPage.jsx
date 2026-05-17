import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import FaceCapture from '../components/FaceCapture';
import WalletConnect from '../components/WalletConnect';
import { authService } from '../services/authService';
import { faceApiService } from '../services/zkpService';
import { zkpService } from '../services/zkpService';
import api from '../services/api';

export default function RegisterPage() {
  const { user, token, updateToken } = useAuth();
  const { address, registerIdentity, connectMock, disconnect } = useWallet();
  const navigate = useNavigate();

  const [step, setStep] = useState(user?.registrationStep || 1); // 1:password, 2:face, 3:wallet, 4:zkp, 5:done
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [zkpSecret, setZkpSecret] = useState('');
  const [customWallet, setCustomWallet] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = [
    { num: 1, label: 'Change Password', icon: '🔑' },
    { num: 2, label: 'Face Scan', icon: '📷' },
    { num: 3, label: 'Connect Wallet', icon: '🦊' },
    { num: 4, label: 'ZKP Identity', icon: '🛡️' },
    { num: 5, label: 'Complete', icon: '✅' },
  ];

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.changePassword(passwords.old, passwords.new);
      updateToken(token, { registrationStep: 2 });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = async (embedding) => {
    setLoading(true);
    setError('');
    try {
      await faceApiService.registerFace(embedding);
      setFaceEmbedding(embedding);
      updateToken(token, { registrationStep: 3 });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register face');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnected = async (addr, isMockSelection = false) => {
    setLoading(true);
    setError('');
    try {
      if (isMockSelection) {
        connectMock(addr);
      }
      // Update wallet address in backend via ZKP module
      try {
        await api.post('/zkp/update-wallet', { newAddress: addr });
      } catch (walletErr) {
        console.warn('Failed to update wallet in backend, continuing:', walletErr.message);
      }
      updateToken(token, { registrationStep: 4 });
      setStep(4);
    } catch (err) {
      setError('Failed to save wallet address');
    } finally {
      setLoading(false);
    }
  };

  const handleZkpRegister = async () => {
    setLoading(true);
    setError('');
    try {
      // Step 1: Generate ZKP identity (secret + commitment) from backend
      const res = await zkpService.registerIdentity();
      if (!res || !res.data) {
        throw new Error('Backend returned empty response for ZKP registration');
      }
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      const { secret, commitment } = res.data;
      if (!commitment) {
        throw new Error('No commitment returned from backend. Please ensure face registration (Step 2) was completed.');
      }
      setZkpSecret(secret);

      // Step 2: Bắt buộc ghi nhận danh tính lên Blockchain (Không được bỏ qua!)
      if (!address) {
        throw new Error('Please connect your MetaMask wallet in Step 3 first');
      }
      
      await registerIdentity(commitment);

      // Step 3: Gọi API hoàn tất đăng ký phía Backend (Chỉ khi Blockchain thành công!)
      await zkpService.completeRegistration();

      // Step 4: Cập nhật trạng thái trong AuthContext & LocalStorage
      updateToken(token, { firstLogin: false, registrationStep: 5 });

      setStep(5);
    } catch (err) {
      console.error('[ZKP Register Error]', err);
      setError(err.response?.data?.message || err.message || 'Failed to register ZKP identity');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/users/rollback', { currentStep: step });
      const nextStep = res.data.registrationStep;
      
      // Update our token context
      updateToken(token, { registrationStep: nextStep });
      
      if (step === 3) {
        setCustomWallet('');
        disconnect();
      }
      
      setStep(nextStep);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rollback step');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in" style={{ maxWidth: 700, padding: '40px 24px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
        🛡️ Identity Registration
      </h1>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 32 }}>
        Complete all steps to activate your multi-layer security
      </p>

      {/* Step Indicator */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40,
        flexWrap: 'wrap',
      }}>
        {steps.map(s => (
          <div key={s.num} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            background: step === s.num ? 'rgba(99, 102, 241, 0.15)' : step > s.num ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
            border: `1px solid ${step === s.num ? 'var(--primary)' : step > s.num ? 'var(--success)' : 'var(--border)'}`,
            fontSize: '0.8rem', fontWeight: 500,
            color: step >= s.num ? 'var(--text-primary)' : 'var(--text-muted)',
          }}>
            {s.icon} {s.label}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Step 1: Change Password */}
      {step === 1 && (
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>🔑 Change Your Temporary Password</h2>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current (Temporary) Password</label>
              <input className="form-input" type="password" value={passwords.old}
                onChange={e => setPasswords({ ...passwords, old: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={passwords.new}
                onChange={e => setPasswords({ ...passwords, new: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={passwords.confirm}
                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} required />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password & Continue →'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Face Scan with Liveness Detection */}
      {step === 2 && (
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>📷 Xác thực khuôn mặt người thật</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
            Hệ thống sẽ yêu cầu bạn quay đầu theo các hướng để xác minh bạn là người thật.
            Face embedding sẽ được dùng cho xác thực sinh trắc học và ZKP identity.
          </p>
          <FaceCapture onCapture={handleFaceCapture} onError={msg => setError(msg)} requireLiveness={true} />
          <button 
            className="btn btn-secondary btn-full" 
            type="button" 
            onClick={handleRollback} 
            disabled={loading}
            style={{ marginTop: 16, border: '1px dashed var(--border)' }}
          >
            ← Quay lại bước 1 (Đổi mật khẩu)
          </button>
        </div>
      )}

      {/* Step 3: Wallet */}
      {step === 3 && (
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>🦊 Connect MetaMask Wallet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
            Your wallet address will be linked to your ZKP identity on the blockchain.
          </p>
          <WalletConnect onConnect={handleWalletConnected} />

          {/* Dev/Admin Testing Tools Section */}
          <div style={{
            marginTop: 24, padding: '20px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
          }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              🛠️ Admin & Developer Testing Tools
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Skip MetaMask connection or select a pre-funded Hardhat account directly:
            </p>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Pre-funded Account</label>
              <select 
                className="form-input" 
                style={{ fontSize: '0.85rem' }}
                value={customWallet}
                onChange={(e) => setCustomWallet(e.target.value)}
              >
                <option value="">-- Choose a Hardhat Funded Account --</option>
                <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C8">Account #1 (10,000 ETH): 0x7099...79C8</option>
                <option value="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC">Account #2 (10,000 ETH): 0x3C44...93BC</option>
                <option value="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266">Account #0 (10,000 ETH): 0xf39F...2266</option>
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
              onClick={() => handleWalletConnected(customWallet, true)}
              style={{ fontSize: '0.85rem', fontWeight: 600 }}
            >
              🎯 Confirm Selected Wallet Address
            </button>
          </div>

          <button 
            className="btn btn-secondary btn-full" 
            type="button" 
            onClick={handleRollback} 
            disabled={loading}
            style={{ marginTop: 16, border: '1px dashed var(--border)' }}
          >
            ← Quay lại bước 2 (Quét khuôn mặt)
          </button>
        </div>
      )}

      {/* Step 4: ZKP */}
      {step === 4 && (
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>🛡️ Generate ZKP Identity</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
            A cryptographic commitment will be created from your secret and face data, then stored on the blockchain.
          </p>

          {/* Cảnh báo ví đang ký */}
          <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.1)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              Ví xác nhận giao dịch (Transaction Signer):
            </div>
            <div style={{ fontFamily: 'monospace', color: 'var(--success)', fontSize: '0.95rem', fontWeight: 600 }}>
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Chưa có ví nào đang kết nối'}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: 12, color: 'var(--warning)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span>⚠️</span>
              <span>Nếu MetaMask bật lên yêu cầu ký với một ví khác, hãy <b>từ chối (Reject)</b> và chọn đúng ví này trong bảng điều khiển của Extension MetaMask trước khi thử lại! Hoặc ấn nút Quay lại Bước 3 bên dưới để chọn lại ví.</span>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={handleZkpRegister} disabled={loading || !address}>
            {loading ? 'Generating...' : '🔐 Generate ZKP Identity'}
          </button>
          <button 
            className="btn btn-secondary btn-full" 
            type="button" 
            onClick={handleRollback} 
            disabled={loading}
            style={{ marginTop: 16, border: '1px dashed var(--border)' }}
          >
            ← Quay lại bước 3 (Kết nối ví)
          </button>
        </div>
      )}

      {/* Step 5: Done */}
      {step === 5 && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 16 }}>Đăng ký hoàn tất!</h2>

          <div className="alert alert-info" style={{ textAlign: 'left' }}>
            <strong>✅ Danh tính ZKP đã được đăng ký trên blockchain.</strong>
            <p style={{ fontSize: '0.85rem', marginTop: 8, color: 'var(--text-secondary)' }}>
              Mã bí mật đã được cung cấp khi bạn đăng nhập lần đầu. 
              Hãy đảm bảo bạn đã lưu mã đó để khôi phục tài khoản khi cần.
            </p>
          </div>

          <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
            Vào Dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
