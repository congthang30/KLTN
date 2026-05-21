import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({ 
  baseURL: API_URL,
  withCredentials: true
});

// Add token to all requests (checks primary token first, then recovery_token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('recovery_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
