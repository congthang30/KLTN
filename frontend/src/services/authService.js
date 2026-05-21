import api from './api';

export const authService = {
  // Doctor: traditional login
  login: (username, password) => api.post('/auth/login', { username, password }),

  // Admin: wallet-based login
  walletChallenge: (address) => api.get(`/auth/wallet-challenge/${address}`),
  walletLogin: (walletAddress, signature, message) =>
    api.post('/auth/wallet-login', { walletAddress, signature, message }),

  // Admin: first-time invite token login
  inviteLogin: (inviteToken) => api.post('/auth/invite-login', { inviteToken }),

  // Doctor only: password management
  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),

  // Shared: verification
  verifyWallet: (address, signature, message) =>
    api.post('/auth/verify-wallet', { address, signature, message }),

  verifyFace: (embedding) =>
    api.post('/auth/verify-face', { embedding }),

  recoverInit: (embedding) =>
    api.post('/auth/recover-init', { embedding }),

  doctorRecoverInit: (embedding) =>
    api.post('/auth/doctor-recover-init', { embedding }),

  resetPassword: (newPassword) =>
    api.post('/auth/reset-password', { newPassword }),

  // Admin: MFA secret for recovery
  generateMfaSecret: () => api.post('/auth/generate-secret'),

  getProfile: () => api.get('/users/me'),
};

export const adminService = {
  createUser: (username, email, role) =>
    api.post('/users/create', { username, email, role }),

  getAllUsers: () => api.get('/users/all'),
};
