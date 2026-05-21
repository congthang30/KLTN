import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const api = axios.create({
    baseURL: API_URL,
  });

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        const userData = res.data.user;
        setUser(userData);
        setToken('cookie_present');
        localStorage.setItem('token', 'cookie_present');
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifySession();
    } else {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // DOCTOR: Traditional login with username/password
  // ============================================================
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      const { user: userData, firstLogin } = res.data;
      setToken('cookie_present');
      setUser({ ...userData, firstLogin });
      localStorage.setItem('token', 'cookie_present');
      localStorage.setItem('user', JSON.stringify({ ...userData, firstLogin }));
      return { success: true, firstLogin, user: userData };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ADMIN: Wallet login (no password)
  // ============================================================
  const loginWithWallet = async (walletAddress, signature, message) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/wallet-login`, {
        walletAddress,
        signature,
        message,
      });
      const { user: userData } = res.data;
      setToken('cookie_present');
      setUser({ ...userData, firstLogin: false });
      localStorage.setItem('token', 'cookie_present');
      localStorage.setItem('user', JSON.stringify({ ...userData, firstLogin: false }));
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Wallet login failed' };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ADMIN: First-time login with invite token (no password)
  // ============================================================
  const loginWithInvite = async (inviteToken) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/invite-login`, { inviteToken });
      const { user: userData } = res.data;
      setToken('cookie_present');
      setUser({ ...userData, firstLogin: true });
      localStorage.setItem('token', 'cookie_present');
      localStorage.setItem('user', JSON.stringify({ ...userData, firstLogin: true }));
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Invalid invite token' };
    } finally {
      setLoading(false);
    }
  };

  const updateToken = (newToken, userData = null) => {
    setToken('cookie_present');
    localStorage.setItem('token', 'cookie_present');
    if (userData) {
      setUser(prev => ({ ...prev, ...userData }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (err) {
      console.warn('Backend logout failed', err);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('recovery_token');
  };

  return (
    <AuthContext.Provider value={{
      token, user, loading,
      login, loginWithWallet, loginWithInvite,
      logout, updateToken, api
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
