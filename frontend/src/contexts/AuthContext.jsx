import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);

  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // Update axios headers when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.Authorization;
    }
  }, [token]);

  // ============================================================
  // DOCTOR: Traditional login with username/password
  // ============================================================
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      const { access_token, user: userData, firstLogin } = res.data;
      setToken(access_token);
      setUser({ ...userData, firstLogin });
      localStorage.setItem('token', access_token);
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
      const { access_token, user: userData } = res.data;
      setToken(access_token);
      setUser({ ...userData, firstLogin: false });
      localStorage.setItem('token', access_token);
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
      const { access_token, user: userData } = res.data;
      setToken(access_token);
      setUser({ ...userData, firstLogin: true });
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify({ ...userData, firstLogin: true }));
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Invalid invite token' };
    } finally {
      setLoading(false);
    }
  };

  const updateToken = (newToken, userData = null) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    if (userData) {
      setUser(prev => ({ ...prev, ...userData }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
    }
  };

  const logout = () => {
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
