import { useState, useEffect, useRef } from 'react';

export default function SecretCodeModal({ secret, onConfirm }) {
  const [countdown, setCountdown] = useState(10);
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = secret;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const canProceed = countdown === 0 && checked;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} className="fade-in">
        {/* Animated warning icon */}
        <div style={styles.iconContainer}>
          <span style={styles.icon}>⚠️</span>
        </div>

        <h1 style={styles.title}>CRITICAL SECURITY NOTICE</h1>
        <h2 style={styles.subtitle}>LƯU MÃ BÍ MẬT CỦA BẠN NGAY!</h2>

        <p style={styles.desc}>
          Đây là mã bí mật <strong>duy nhất</strong> để khôi phục tài khoản khi mất quyền truy cập.
          Mã này sẽ <strong>KHÔNG BAO GIỜ</strong> được hiển thị lại!
        </p>

        {/* Secret code display */}
        <div style={styles.secretBox}>
          <div style={styles.secretLabel}>🔐 Mã Bí Mật ZKP</div>
          <div style={styles.secretCode}>{secret}</div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              ...styles.copyBtn,
              background: copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)',
              borderColor: copied ? '#10b981' : 'rgba(255,255,255,0.2)',
            }}
          >
            {copied ? '✅ Đã sao chép!' : '📋 Sao chép vào clipboard'}
          </button>
        </div>

        {/* Warning tips */}
        <div style={styles.tipsBox}>
          <div style={styles.tipItem}>📝 Ghi ra giấy và cất ở nơi an toàn</div>
          <div style={styles.tipItem}>🔒 Lưu vào trình quản lý mật khẩu</div>
          <div style={styles.tipItem}>🚫 KHÔNG chia sẻ cho bất kỳ ai</div>
          <div style={styles.tipItem}>💾 KHÔNG chỉ lưu trên 1 thiết bị duy nhất</div>
        </div>

        {/* Countdown / Checkbox */}
        <div style={styles.confirmSection}>
          {countdown > 0 ? (
            <div style={styles.countdown}>
              <div style={styles.countdownCircle}>
                <span style={styles.countdownNumber}>{countdown}</span>
              </div>
              <span style={styles.countdownText}>
                Vui lòng đọc kỹ thông tin trên ({countdown}s)
              </span>
            </div>
          ) : (
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>
                Tôi đã lưu mã bí mật này ở nơi an toàn và hiểu rằng nó sẽ không được hiển thị lại
              </span>
            </label>
          )}
        </div>

        {/* Continue button */}
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canProceed}
          style={{
            ...styles.continueBtn,
            opacity: canProceed ? 1 : 0.4,
            cursor: canProceed ? 'pointer' : 'not-allowed',
            transform: canProceed ? 'scale(1)' : 'scale(0.98)',
          }}
        >
          {canProceed ? 'Tiếp tục đăng ký →' : 'Vui lòng xác nhận đã lưu mã bí mật'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '95vh',
    overflowY: 'auto',
    borderRadius: 16,
    padding: '36px 32px',
    background: 'linear-gradient(145deg, #1a0000 0%, #2d0a0a 50%, #1a0505 100%)',
    border: '2px solid #dc2626',
    boxShadow: '0 0 60px rgba(220, 38, 38, 0.3), 0 0 120px rgba(220, 38, 38, 0.1)',
  },
  iconContainer: {
    textAlign: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 64,
    display: 'inline-block',
    animation: 'pulse 2s ease-in-out infinite',
  },
  title: {
    textAlign: 'center',
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#fca5a5',
    marginBottom: 4,
    letterSpacing: '0.05em',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#ef4444',
    marginBottom: 20,
  },
  desc: {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#fecaca',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  secretBox: {
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(220, 38, 38, 0.4)',
    borderRadius: 12,
    padding: '20px 16px',
    marginBottom: 20,
    textAlign: 'center',
  },
  secretLabel: {
    fontSize: '0.8rem',
    color: '#f87171',
    fontWeight: 600,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  secretCode: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '0.78rem',
    color: '#fde68a',
    background: 'rgba(0, 0, 0, 0.6)',
    padding: '14px 12px',
    borderRadius: 8,
    wordBreak: 'break-all',
    lineHeight: 1.6,
    marginBottom: 14,
    border: '1px dashed rgba(253, 232, 138, 0.2)',
    userSelect: 'all',
  },
  copyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 20px',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tipsBox: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 24,
  },
  tipItem: {
    fontSize: '0.78rem',
    color: '#fca5a5',
    padding: '8px 10px',
    background: 'rgba(220, 38, 38, 0.08)',
    borderRadius: 6,
    border: '1px solid rgba(220, 38, 38, 0.15)',
  },
  confirmSection: {
    marginBottom: 20,
    minHeight: 48,
    display: 'flex',
    justifyContent: 'center',
  },
  countdown: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  countdownCircle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid #ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  countdownNumber: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#ef4444',
  },
  countdownText: {
    fontSize: '0.85rem',
    color: '#fca5a5',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    cursor: 'pointer',
    padding: '12px 16px',
    background: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    border: '1px solid rgba(220, 38, 38, 0.3)',
    transition: 'background 0.2s',
  },
  checkbox: {
    width: 20,
    height: 20,
    marginTop: 2,
    flexShrink: 0,
    accentColor: '#ef4444',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '0.85rem',
    color: '#fecaca',
    lineHeight: 1.5,
  },
  continueBtn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
    transition: 'all 0.3s ease',
    letterSpacing: '0.02em',
  },
};
