import { useState } from 'react';

/**
 * Reusable Sidebar component.
 *
 * Props:
 *   items        — Array<{ id, icon, label }>  navigation items
 *   activeId     — string  currently active item id
 *   onSelect     — (id: string) => void
 *   title        — string  header title (e.g. "Quản lý Bệnh viện")
 *   titleIcon    — string  emoji/icon for the header (e.g. "🏥")
 *   badgeLabel   — string  optional bottom badge text (e.g. "Verified Admin")
 *   userEmail    — string  optional user email shown at the bottom
 *   defaultCollapsed — boolean (default false)
 */
export default function Sidebar({
  items = [],
  activeId,
  onSelect,
  title = 'Dashboard',
  titleIcon = '🏠',
  badgeLabel,
  userEmail,
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <aside
      style={{
        width: collapsed ? 68 : 240,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        transition: 'width 0.25s ease',
        position: 'sticky',
        top: 70,
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: collapsed ? '0 14px 24px' : '0 20px 24px',
          borderBottom: '1px solid var(--border)',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {!collapsed && (
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Hệ thống
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {titleIcon} {title}
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
            fontSize: '1rem',
            fontWeight: 700,
            transition: 'background 0.2s',
          }}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* ── Nav items ── */}
      <nav
        style={{
          flex: 1,
          padding: '0 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect?.(item.id)}
              title={collapsed ? item.label : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '12px 0' : '11px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.92rem',
                background: isActive
                  ? 'linear-gradient(135deg, var(--primary), var(--primary-light, #6366f1))'
                  : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                transform: isActive ? 'translateX(2px)' : 'none',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      {(badgeLabel || userEmail) && !collapsed && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            marginTop: 12,
          }}
        >
          {badgeLabel && (
            <div
              className="badge badge-success"
              style={{
                padding: '7px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ✓ {badgeLabel}
            </div>
          )}
          {userEmail && (
            <div
              style={{
                marginTop: 8,
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userEmail}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
