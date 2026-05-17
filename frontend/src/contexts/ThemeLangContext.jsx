import { createContext, useState, useContext, useEffect } from 'react';

const ThemeLangContext = createContext();

export const useThemeLang = () => useContext(ThemeLangContext);

export const ThemeLangProvider = ({ children }) => {
  // Theme: 'dark' or 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  // Language: 'vi' or 'en'
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'vi');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLang = () => setLang(prev => prev === 'vi' ? 'en' : 'vi');

  const value = {
    theme,
    toggleTheme,
    lang,
    toggleLang,
    // Basic translations
    t: (key) => translations[lang][key] || key
  };

  return (
    <ThemeLangContext.Provider value={value}>
      {children}
    </ThemeLangContext.Provider>
  );
};

const translations = {
  vi: {
    'login.title': 'Hệ thống quản lý bệnh viện',
    'login.subtitle': 'Đăng nhập bảo mật đa lớp với Zero-Knowledge Proof',
    'login.username': 'Tên đăng nhập',
    'login.password': 'Mật khẩu',
    'login.btn': 'Đăng nhập',
    'login.forgotPassword': 'Quên mật khẩu?',
    'auth.layer2': 'Xác thực Lớp 2',
    'auth.layer2.subtitle': 'Bảo vệ quyền truy cập',
    'auth.recoverWallet': 'Khôi phục địa chỉ ví',
    'auth.wallet': 'Xác thực bằng Ví',
    'auth.face': 'Xác thực bằng Khuôn mặt',
    'dashboard.title': 'Hệ thống Quản lý Bệnh viện',
    'dashboard.tab.doctor': '👨‍⚕️ Quản lý bác sĩ',
    'dashboard.tab.diagnosis': '📋 Quản lý chuẩn đoán',
    'dashboard.tab.blockchain': '🔗 Giao dịch Blockchain',
    'dashboard.tab.ai': '🤖 Quản lý AI Model',
    'dashboard.action.recovery': '🔑 Khôi phục Ví',
    'navbar.dashboard': '📊 Bảng điều khiển',
    'navbar.recovery': '🔑 Khôi phục',
    'navbar.logout': 'Đăng xuất',
  },
  en: {
    'login.title': 'Hospital Management System',
    'login.subtitle': 'Multi-layer secure login with Zero-Knowledge Proof',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.btn': 'Login',
    'login.forgotPassword': 'Forgot password?',
    'auth.layer2': 'Layer 2 Authentication',
    'auth.layer2.subtitle': 'Protecting system access',
    'auth.recoverWallet': 'Recover Wallet Address',
    'auth.wallet': 'Verify with Wallet',
    'auth.face': 'Verify with Face',
    'dashboard.title': 'Hospital Management System',
    'dashboard.tab.doctor': '👨‍⚕️ Doctor Management',
    'dashboard.tab.diagnosis': '📋 Diagnosis Management',
    'dashboard.tab.blockchain': '🔗 Blockchain Transactions',
    'dashboard.tab.ai': '🤖 AI Model Management',
    'dashboard.action.recovery': '🔑 Wallet Recovery',
    'navbar.dashboard': '📊 Dashboard',
    'navbar.recovery': '🔑 Recovery',
    'navbar.logout': 'Logout',
  }
};
