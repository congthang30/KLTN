import { useWallet } from '../contexts/WalletContext';

export default function WalletConnect({ onConnect, compact = false }) {
  const { address, connecting, error, connect, disconnect } = useWallet();

  const handleConnect = async () => {
    await connect();
  };

  // ============================================================
  // Premium Geometric Web3 SVGs
  // ============================================================
  const metamaskSvg = (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" style={{ marginRight: 8 }}>
      <path d="M30.05 15.3l-2.43-8.19-5.18 4.25 7.61 3.94z" fill="#E2761B"/>
      <path d="M1.95 15.3l2.43-8.19 5.18 4.25-7.61 3.94z" fill="#E2761B"/>
      <path d="M26.24 23.01l-3.32-5.46-6.92.51-6.92-.51-3.32 5.46 10.24 4.54 10.24-4.54z" fill="#E2761B"/>
      <path d="M22.44 11.36l5.18-4.25-11.62-2.31v6.05l6.44.51z" fill="#E2761B"/>
      <path d="M9.56 11.36l-5.18-4.25 11.62-2.31v6.05l-6.44.51z" fill="#E2761B"/>
      <path d="M16 4.8l6.44 6.56-6.44-.51-6.44.51L16 4.8z" fill="#D7C1B3"/>
    </svg>
  );

  const disconnectSvg = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>
    </svg>
  );

  if (address) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12, width: '100%', boxSizing: 'border-box',
        padding: compact ? '12px 16px' : '16px 20px',
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: '10px',
        animation: 'widgetFadeIn 0.3s ease forwards'
      }}>
        <style>{`
          @keyframes widgetFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
          .wallet-address-string { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.88rem; font-weight: 600; color: var(--text-main, #0f172a); }
          .disconnect-icon-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid rgba(239, 68, 68, 0.15); background: transparent; border-radius: 6px; color: #ef4444; cursor: pointer; transition: all 0.15s; }
          .disconnect-icon-btn:hover { background: rgba(239, 68, 68, 0.08); transform: translateY(-1px); }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Active Node Pulse Indicator */}
          <div style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
            <span style={{ position: 'absolute', display: 'inline-flex', width: '100%', height: '100%', borderRadius: '50%', background: '#10b981', opacity: 0.75, animation: 'pingPulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', width: 8, height: 8, background: '#10b981' }} />
          </div>
          <style>{`@keyframes pingPulse { 75%, 100% { transform: scale(2.5); opacity: 0; } }`}</style>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Wallet Authorized
            </div>
            <div className="wallet-address-string">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          </div>

          <button 
            type="button" 
            className="disconnect-icon-btn" 
            onClick={disconnect}
            title="Disconnect node"
          >
            {disconnectSvg}
          </button>
        </div>
        
        <button 
          type="button"
          className="action-button-core" 
          onClick={() => onConnect?.(address)}
          style={{ width: '100%', height: '36px', borderRadius: '8px', fontSize: '0.88rem' }}
        >
          Confirm Wallet Destination
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <button
        type="button"
        className="action-button-core"
        onClick={handleConnect}
        disabled={connecting}
        style={{
          width: '100%',
          background: connecting
            ? 'var(--input-border, #cbd5e1)'
            : 'linear-gradient(135deg, #e2761b, #c45e08)',
          boxShadow: connecting ? 'none' : '0 4px 12px rgba(226, 118, 27, 0.2)',
          transition: 'all 0.2s ease'
        }}
      >
        {connecting ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="btn-processing-spinner" />
            <span>Establishing link...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {metamaskSvg}
            <span>Connect MetaMask</span>
          </div>
        )}
      </button>

      <style>{`
        .btn-processing-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          border-top-color: #ffffff;
          animation: btnSpin 0.6s linear infinite;
        }
        @keyframes btnSpin { to { transform: rotate(360deg); } }
      `}</style>

      {error && (
        <div style={{ color: 'var(--danger, #ef4444)', fontSize: '0.8rem', fontWeight: 600, marginTop: 8, paddingLeft: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}