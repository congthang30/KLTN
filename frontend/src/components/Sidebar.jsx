import { useState } from 'react';

/**
 * Modern SaaS Sidebar Component (No Header)
 */
export default function Sidebar({
  items = [],
  activeId,
  onSelect,
  badgeLabel,
  userEmail = 'admin@hospital.com',
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // Icon mặc định xịn xò hơn (dạng Grid) thay vì dấu chấm tròn lơ lửng
  const DefaultIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );

  return (
    <aside
      className={`modern-sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{
        width: collapsed ? 80 : 260,
        flexShrink: 0,
        background: '#ffffff', // Nền trắng muốt
        borderRight: '1px solid #e2e8f0', // Viền xám siêu nhạt
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        position: 'sticky',
        top: 64,
        height: 'calc(100vh - 64px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 40,
      }}
    >
      <style>{`
        .modern-sidebar * { box-sizing: border-box; }
        
        .nav-item {
          display: flex; align-items: center; gap: 12px;
          width: 100%; height: 42px; 
          padding: 0 12px; margin-bottom: 4px;
          border: none; border-radius: 8px; cursor: pointer;
          background: transparent; color: #64748b; 
          font-weight: 500; font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        
        .nav-item:hover { background: #f1f5f9; color: #0f172a; }
        
        /* Trạng thái Active: Bỏ vạch kẻ viền, dùng full nền xanh nhạt + chữ xanh đậm */
        .nav-item.active { 
          background: #eff6ff; 
          color: #2563eb; 
          font-weight: 600; 
        }
        
        /* Icon container để ép kích thước cố định, chống lệch */
        .icon-box {
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; flex-shrink: 0;
        }

        .toggle-btn {
          position: absolute; right: -14px; top: 24px; 
          width: 28px; height: 28px; border-radius: 50%; 
          background: #ffffff; border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center; 
          cursor: pointer; color: #64748b; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
          transition: all 0.2s; z-index: 50;
        }
        .toggle-btn:hover { background: #f8fafc; color: #0f172a; transform: scale(1.05); }
        
        .fade-text { animation: fadeIn 0.25s ease forwards; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Tùy chỉnh thanh cuộn siêu mỏng */
        .scroll-area::-webkit-scrollbar { width: 4px; }
        .scroll-area::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
        .modern-sidebar:hover .scroll-area::-webkit-scrollbar-thumb { background: #cbd5e1; }
      `}</style>

      {/* ── NÚT TOGGLE ── */}
      <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
        <svg style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      {/* ── NAV ITEMS ── */}
      {/* Đã thêm padding-top: 24px để tạo khoảng cách thở khi không còn Header */}
      <nav className="scroll-area" style={{ flex: 1, padding: '24px 16px 0 16px', overflowY: 'auto', overflowX: 'hidden' }}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect?.(item.id)}
              title={collapsed ? item.label : ''}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0' : '0 12px' }}
            >
              <div className="icon-box">
                {item.icon ? item.icon : <DefaultIcon />}
              </div>
              
              {!collapsed && (
                <span className="fade-text">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── FOOTER ── */}
      {(badgeLabel || userEmail) && (
        <div style={{ padding: '20px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#f1f5f9', color: '#475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: '0.85rem', flexShrink: 0,
            border: '1px solid #e2e8f0'
          }}>
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>

          {!collapsed && (
            <div className="fade-text" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                {userEmail.split('@')[0]}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Admin
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}