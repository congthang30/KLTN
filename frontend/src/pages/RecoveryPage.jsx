import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import FaceCapture from '../components/FaceCapture';
import WalletConnect from '../components/WalletConnect';
import { zkpService } from '../services/zkpService';
import { authService } from '../services/authService';

export default function RecoveryPage() {
  const { recoverWallet, address } = useWallet();
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState('');
  const [recoveryData, setRecoveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFaceVerify = async (embedding) => {
    setLoading(true);
    setStatus('Verifying face and fetching recovery data...');
    try {
      // 1. Verify Face
      await authService.verifyFace(embedding);
      
      // 2. Fetch commitment & faceHash
      const res = await zkpService.getRecoveryData();
      if (!res.data.commitment) throw new Error('No ZKP identity found');
      
      setRecoveryData(res.data);
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
      // Simulate snarkjs proof generation (In real app, load WASM and ZKEY)
      // For this prototype with MockVerifier, we just send dummy data
      // const { proof, publicSignals } = await window.snarkjs.groth16.fullProve(
      //   { secret, faceHash: recoveryData.faceHash, commitment: recoveryData.commitment },
      //   "/circuits/identity.wasm",
      //   "/circuits/identity_final.zkey"
      // );
      
      // Dummy proof for MockVerifier
      return {
        pA: ["0", "0"],
        pB: [["0", "0"], ["0", "0"]],
        pC: ["0", "0"]
      };
    } catch (err) {
      throw new Error('Failed to generate ZKP proof. ' + err.message);
    }
  };

  const handleRecover = async () => {
    if (!address) {
      setStatus('❌ Please connect your NEW wallet first');
      return;
    }
    if (!secret) {
      setStatus('❌ Please enter your ZKP secret');
      return;
    }

    setLoading(true);
    setStatus('Generating Zero-Knowledge Proof locally...');

    try {
      // 1. Generate Proof
      const proof = await generateProof();

      setStatus('Submitting proof to blockchain...');
      // 2. Submit to smart contract
      await recoverWallet(
        proof.pA, proof.pB, proof.pC, 
        recoveryData.commitment, 
        address
      );

      setStatus('Updating database...');
      // 3. Update backend
      await zkpService.updateWallet(address);

      setStatus('✅ Wallet successfully recovered!');
      setStep(3);
    } catch (err) {
      setStatus('❌ Recovery failed: ' + (err.shortMessage || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in" style={{ padding: '40px 24px', maxWidth: 700 }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, color: 'var(--warning)' }}>
        🔑 Wallet Recovery
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        Lost your wallet? Prove your identity using your face and ZKP secret to assign a new wallet address.
      </p>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map(num => (
          <div key={num} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: step >= num ? 'var(--warning)' : 'rgba(255,255,255,0.1)'
          }} />
        ))}
      </div>

      {step === 1 && (
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>Bước 1: Xác thực khuôn mặt</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
            Hệ thống cần xác minh bạn là người thật và khớp khuôn mặt đã đăng ký trước khi cho phép khôi phục.
          </p>
          <FaceCapture onCapture={handleFaceVerify} autoStart={false} requireLiveness={true} />
          {status && <p style={{ marginTop: 16, color: status.includes('❌') ? 'var(--danger)' : 'var(--text-primary)', textAlign: 'center' }}>{status}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>Step 2: Provide Proof</h2>
          
          <div className="form-group">
            <label className="form-label">Connect NEW Wallet</label>
            <WalletConnect />
          </div>

          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label">ZKP Secret Key</label>
            <input 
              className="form-input" 
              type="text" 
              placeholder="Enter the secret you saved during registration"
              value={secret}
              onChange={e => setSecret(e.target.value)}
            />
          </div>

          {status && (
            <div className={`alert ${status.includes('❌') ? 'alert-error' : 'alert-info'}`} style={{ marginTop: 24 }}>
              {status}
            </div>
          )}

          <button 
            className="btn btn-warning btn-lg btn-full" 
            style={{ marginTop: 24, background: 'var(--warning)', color: '#000' }}
            onClick={handleRecover}
            disabled={loading}
          >
            {loading ? 'Recovering...' : '🛡️ Generate Proof & Recover Wallet'}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: 'var(--success)' }}>Recovery Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            Your identity has been successfully transferred to your new wallet address.
          </p>
          <a href="/dashboard" className="btn btn-primary btn-lg">Return to Dashboard</a>
        </div>
      )}
    </div>
  );
}
