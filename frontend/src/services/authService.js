import api from './api';

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),

  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),

  verifyWallet: (address, signature, message) =>
    api.post('/auth/verify-wallet', { address, signature, message }),

  verifyFace: (embedding) =>
    api.post('/auth/verify-face', { embedding }),

  getProfile: () => api.get('/users/me'),
};

export const adminService = {
  createUser: (username, email, role) =>
    api.post('/users/create', { username, email, role }),

  getAllUsers: () => api.get('/users/all'),
};
