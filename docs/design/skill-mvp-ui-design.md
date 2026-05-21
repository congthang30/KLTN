# 🏥 ZKP Identity System — MVP Design System

> **Design Philosophy:** *Clean > fancy · UX > UI decoration · Consistency > creativity · Simplicity is premium*
> Inspired by: Linear, Vercel, Stripe, Notion

---

## 1. 🎨 Color System

### Primary Palette (SaaS Minimal)

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | `#4DA3FF` | `#3B82F6` | Buttons, links, active states |
| `--primary-subtle` | `#EFF6FF` | `#1E3A5F` | Background highlights |
| `--bg` | `#F9FAFB` | `#0B1120` | Page background |
| `--bg-surface` | `#FFFFFF` | `#111827` | Cards, modals, nav |
| `--bg-elevated` | `#F3F4F6` | `#1F2937` | Hover states, dropdowns |
| `--border` | `#E5E7EB` | `#1F2937` | Borders, dividers |
| `--border-hover` | `#D1D5DB` | `#374151` | Border hover states |
| `--text-primary` | `#111827` | `#F9FAFB` | Headings, primary text |
| `--text-secondary` | `#6B7280` | `#9CA3AF` | Body text, labels |
| `--text-muted` | `#9CA3AF` | `#6B7280` | Placeholders, disabled |
| `--text-inverse` | `#FFFFFF` | `#111827` | Text on colored bg |

### Semantic Colors

| Token | Color | Usage |
|-------|-------|-------|
| `--success` | `#10B981` | Verified, confirmed, complete |
| `--warning` | `#F59E0B` | Pending, caution, recovery |
| `--danger` | `#EF4444` | Errors, revoked, failed |
| `--info` | `#3B82F6` | Information, tips |

### ❌ Prohibited Patterns

- Neon gradients
- Multiple gradient overlays on backgrounds
- High-saturation backgrounds
- Text on low-contrast backgrounds
- Pure black (`#000`) or pure white (`#FFF`) as backgrounds

---

## 2. 📐 Spacing & Grid

### 8px Spacing System

| Token | Value | Example |
|-------|-------|---------|
| `--space-1` | `4px` | Micro gaps |
| `--space-2` | `8px` | Tight gaps |
| `--space-3` | `12px` | Element spacing |
| `--space-4` | `16px` | Standard padding |
| `--space-5` | `20px` | Card padding sm |
| `--space-6` | `24px` | Card padding lg |
| `--space-8` | `32px` | Section spacing |
| `--space-10` | `40px` | Page spacing |
| `--space-12` | `48px` | Large sections |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `6px` | Inputs, badges, small elements |
| `--radius-md` | `10px` | Buttons, cards, modals |
| `--radius-lg` | `14px` | Large containers, dialogs |
| `--radius-full` | `9999px` | Pills, avatars, tags |

### Shadows (SaaS Soft)

```css
/* Light Mode */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);

/* Dark Mode */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.4);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.4);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.4);
```

---

## 3. 🔤 Typography

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | `0.75rem` (12px) | 500 | 1.5 | Captions, badges |
| `--text-sm` | `0.875rem` (14px) | 400 | 1.5 | Body, descriptions |
| `--text-base` | `1rem` (16px) | 400 | 1.5 | Default text |
| `--text-lg` | `1.125rem` (18px) | 500 | 1.4 | Section titles |
| `--text-xl` | `1.25rem` (20px) | 600 | 1.3 | Card headers |
| `--text-2xl` | `1.5rem` (24px) | 700 | 1.2 | Page titles |
| `--text-3xl` | `1.875rem` (30px) | 700 | 1.2 | Hero headers |

### Monospace (for addresses, hashes)

```css
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

---

## 4. 🧩 Component System

### 4.1 Button

| Prop | Primary | Secondary | Ghost | Danger |
|------|---------|-----------|-------|--------|
| **Default** | `bg: primary` `text: white` | `bg: surface` `border: border` | `bg: transparent` | `bg: danger` `text: white` |
| **Hover** | `brightness(1.1)` | `bg: elevated` `border: primary` | `bg: rgba(x,0.05)` | `brightness(1.1)` |
| **Active** | `brightness(0.95)` | `brightness(0.98)` | `bg: rgba(x,0.08)` | `brightness(0.95)` |
| **Disabled** | `opacity: 0.5` | `opacity: 0.5` | `opacity: 0.4` | `opacity: 0.5` |
| **Loading** | Show spinner + text | Show spinner | Show spinner | Show spinner |

**Sizes:**
- `sm`: 32px height, 8px horizontal padding
- `md`: 40px height, 16px horizontal padding (default)
- `lg`: 48px height, 24px horizontal padding

### 4.2 Input / Textarea / Select

```
States: default → focus → hover → disabled → error

Default:   bg: surface, border: border
Focus:     border: primary, ring: 3px primary/0.15
Hover:     border: border-hover
Disabled:  opacity: 0.5, cursor: not-allowed
Error:     border: danger, ring: 3px danger/0.15
Success:   border: success, ring: 3px success/0.15
```

**Layout:**
- Label: `text-sm`, `text-secondary`, `mb-1.5` (6px)
- Helper text: `text-xs`, `text-muted`, `mt-1` (4px)
- Error text: `text-xs`, `text-danger`, `mt-1`

### 4.3 Card

```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}
```

**Variants:**
- `card-default` - Standard card
- `card-interactive` - Hover effects, clickable
- `card-bordered` - Emphasized border (for sections)
- `card-glass` - Subtle backdrop blur (for modals)

### 4.4 Modal / Dialog

```css
/* Backdrop */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

/* Modal content */
.modal-content {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
```

### 4.5 Table

```
Header:   text-xs, uppercase, text-secondary, font-semibold, tracking-wide
Row:      border-bottom: border, py-3, hover: bg-elevated
Cell:     text-sm, py-3, px-4
Empty:    py-12, text-center, text-muted
```

### 4.6 Sidebar / Navigation

```css
/* Nav item */
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.15s ease;
  cursor: pointer;
}
.nav-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}
.nav-item.active {
  background: var(--primary-subtle);
  color: var(--primary);
  font-weight: 600;
}
```

### 4.7 Badge / Tag

```css
.badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.75rem; font-weight: 500;
  line-height: 1.4;
}
```

**Color variants:**
- `badge-success`: `bg: rgba(16,185,129,0.1)` `text: #059669`
- `badge-warning`: `bg: rgba(245,158,11,0.1)` `text: #D97706`
- `badge-danger`: `bg: rgba(239,68,68,0.1)` `text: #DC2626`
- `badge-info`: `bg: rgba(59,130,246,0.1)` `text: #2563EB`

### 4.8 Toast / Alert

```
Position: bottom-right (desktop) or top (mobile)
Timeout: 4s default
Types: success / error / warning / info
Animation: slideInRight 0.3s, slideOutRight 0.3s
```

### 4.9 Skeleton Loader

```css
.skeleton {
  background: linear-gradient(90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 4.10 Spinner

```css
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

---

## 5. 🏗️ Layout Architecture

### SaaS Standard Layout

```
┌─────────────────────────────────────┐
│         Topbar (64px)               │
│  Logo    Nav Links    [User] [Theme]│
├──────┬──────────────────────────────┤
│      │                              │
│ Side │    Main Content              │
│ bar  │    (Page content)            │
│ 240px│                              │
│      │                              │
│      │                              │
├──────┴──────────────────────────────┤
│         Footer (optional)           │
└─────────────────────────────────────┘
```

### Layout Rules

- **Topbar**: Fixed, `z-index: 50`, height `64px`, background `rgba(bg-surface, 0.8)` with `backdrop-filter: blur(12px)`
- **Sidebar**: Collapsible (`240px` expanded / `60px` collapsed), sticky below topbar
- **Content**: Padding `32px`, max-width `1280px`, centered
- **Auth pages** (Login, Register, Auth): Centered card layout, no sidebar, no topbar

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| `sm` | 640px | Sidebar auto-collapses |
| `md` | 768px | Table → Card list |
| `lg` | 1024px | Full layout |
| `xl` | 1280px | Max content width |

---

## 6. 🌙 Dark Mode Strategy

### Implementation

```css
/* Applied via data-theme attribute on <html> */
[data-theme="light"] { /* light vars */ }
[data-theme="dark"] { /* dark vars */ }
/* No data-theme = prefers-color-scheme default */
```

### Rules

1. **Only colors change** — spacing, typography, layout remain identical
2. **No layout shifts** when toggling
3. **Contrast ratio** must be ≥ 4.5:1 for all text
4. **Surfaces**: Light mode uses white cards on gray bg; Dark mode uses dark cards on darker bg
5. **Borders**: Always 1px, subtle, separating surfaces without heavy lines

---

## 7. 🎬 Animation & Transitions

### Duration Tokens

```css
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
```

### Approved Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `fadeIn` | 200ms | `ease-out` | Page transitions |
| `slideUp` | 250ms | `ease-out` | Modal entrance |
| `slideRight` | 200ms | `ease-out` | Sidebar toggle |
| `scaleIn` | 200ms | `ease-out` | Dropdown menus |
| `shimmer` | 1.5s | `linear infinite` | Skeleton loading |

### ❌ Prohibited

- Bouncing animations
- Rotating loaders > 1s
- Staggered entrance animations (slows UX)
- Hover scale transforms on cards (feels jumpy)

---

## 8. 🧪 Micro-interactions

### Button Click Ripple (optional)

```css
.btn:active {
  transform: scale(0.98);
}
```

### Card Hover

```css
.card-interactive {
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.card-interactive:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

### Link Hover

```css
a {
  color: var(--primary);
  transition: color 0.15s ease;
}
a:hover {
  color: color-mix(in srgb, var(--primary) 80%, white);
}
```

---

## 9. 📱 Responsive Rules

### Sidebar

```css
/* < md (768px) */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    left: -240px;
    transition: left 0.2s ease;
    z-index: 40;
  }
  .sidebar.open { left: 0; }
}
```

### Tables → Cards

```css
/* < md (768px) */
@media (max-width: 767px) {
  table, thead, tbody, tr, th, td {
    display: block;
  }
  thead { display: none; }
  tr {
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    margin-bottom: 12px;
  }
  td {
    padding: 4px 0;
    border: none;
  }
  td::before {
    content: attr(data-label);
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
```

### Font Scale

```css
/* < sm (640px) */
@media (max-width: 639px) {
  :root {
    --text-2xl: 1.25rem;
    --text-xl: 1.125rem;
    --text-lg: 1rem;
  }
}
```

---

## 10. 📦 MVP Component Checklist

### Core Components (Build First)

- [x] Button (primary / secondary / ghost / danger + sm/md/lg + loading)
- [ ] Button group
- [x] Input (text / password / email / date)
- [ ] Input group (label + input + helper)
- [x] Select
- [ ] Checkbox / Toggle
- [x] Card
- [x] Modal / Dialog
- [x] Badge / Tag
- [ ] Table (responsive)
- [ ] Spinner
- [ ] Skeleton
- [x] Toast / Alert
- [ ] Tooltip
- [ ] Dropdown menu
- [x] Avatar / User chip
- [x] Nav item / Sidebar item
- [x] Progress bar

### Layout Components

- [x] Topbar / Navbar
- [x] Sidebar
- [ ] Page header (title + subtitle + actions)
- [ ] Empty state
- [ ] Error state
- [ ] Loading state

### Feature Components

- [x] WalletConnect
- [x] FaceCapture
- [x] LivenessCheck
- [x] SecretCodeModal
- [x] CreateDoctorModal
- [x] Language toggle
- [x] Theme toggle

---

## 11. 🧠 Design Principles (Golden Rules)

1. **One job per component** — Each component does one thing and does it well
2. **80/20 spacing** — 80% of the visual quality comes from proper spacing
3. **3-color limit** — Any given UI section uses max 3 colors (bg, text, accent)
4. **No unnecessary borders** — Use background contrast over borders to separate sections
5. **Loading first** — Every data-driven view must have a skeleton/loading state
6. **Empty states** — Every list must show what the user should do when empty
7. **Error states** — Errors must be helpful, actionable, and visually calm
8. **Keyboard accessible** — All interactive elements must be reachable via keyboard
9. **Touch targets ≥ 44px** — All clickable areas must be at least 44x44px on mobile
10. **Reduce cognitive load** — Never show more than 7 items in a list without grouping

---

## 12. 🎯 Icons Strategy

### Recommendation: Replace Emoji with Lucide or Heroicons

```
Install: npm install lucide-react

Usage:
import { Shield, User, Wallet, Camera, Key, Hospital } from 'lucide-react';

<Shield size={18} className="icon" />
```

### Emoji-to-Icon Mapping (Core)

| Emoji | Lucide Icon | Context |
|-------|-------------|---------|
| 🛡️ | `Shield` | Security, ZKP |
| 👨‍⚕️ | `Stethoscope` | Doctor |
| 🦊 | `Wallet` / `DollarSign` | MetaMask |
| 🔗 | `Link` / `Blocks` | Blockchain |
| 📷 | `Camera` | Face capture |
| 🔑 | `Key` | Recovery |
| 🏥 | `Hospital` | Hospital |
| 🤖 | `Bot` | AI |
| ✅ | `CheckCircle` | Success |
| ⚠️ | `AlertTriangle` | Warning |
| ❌ | `XCircle` | Error |
| 💡 | `Lightbulb` | Info |

---

## 13. ✅ Tailwind Config (Reference)

If migrating to Tailwind CSS, use this config:

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE',
          300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6',
          600: '#2563EB', 700: '#1D4ED8', 800: '#1E3A5F',
          900: '#1E3A5F',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F9FAFB',
          elevated: '#F3F4F6',
          dark: '#111827',
          'dark-secondary': '#0B1120',
          'dark-elevated': '#1F2937',
        },
        zinc: { /* default Tailwind zinc is fine */ },
      },
      spacing: { '4.5': '18px' },
      borderRadius: {
        sm: '6px', md: '10px', lg: '14px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
    },
  },
};
```

---

> *Last updated: 2025 · Maintained by the Frontend Team*
