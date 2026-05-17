import { useWallet } from '../contexts/WalletContext';

export default function WalletConnect({ onConnect, compact = false }) {
  const { address, connecting, error, connect, disconnect } = useWallet();

  const handleConnect = async () => {
    await connect();
    // Không tự động gọi onConnect nữa để user có thể kiểm tra ví và đổi nếu cần
  };

  if (address) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: compact ? '8px 16px' : '16px 24px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--success)',
            boxShadow: '0 0 8px var(--success)',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
              Connected
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: '0.85rem',
              color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={disconnect}>
            Disconnect
          </button>
        </div>
        
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => onConnect?.(address)}
          style={{ width: '100%', fontWeight: 600 }}
        >
          ✅ Xác nhận dùng ví này
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={handleConnect}
        disabled={connecting}
        style={{
          background: connecting
            ? 'var(--bg-card)'
            : 'linear-gradient(135deg, #f6851b, #e2761b)',
          boxShadow: connecting ? 'none' : '0 4px 12px rgba(246, 133, 27, 0.3)',
        }}
      >
        {connecting ? (
          <><div className="spinner" style={{ width: 16, height: 16 }} /> Connecting...</>
        ) : (
          <>🦊 Connect MetaMask</>
        )}
      </button>
      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}
