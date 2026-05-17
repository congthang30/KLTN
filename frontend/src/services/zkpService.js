import api from './api';

export const zkpService = {
  registerIdentity: () => api.post('/zkp/register'),

  completeRegistration: () => api.post('/zkp/complete'),

  getRecoveryData: () => api.get('/zkp/recovery-data'),

  updateWallet: (newAddress) => api.post('/zkp/update-wallet', { newAddress }),
};

export const faceApiService = {
  registerFace: (embedding) => api.post('/face/register', { embedding }),

  verifyFace: (embedding) => api.post('/face/verify', { embedding }),
};
