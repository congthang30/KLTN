export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const REGISTRY_ADDRESS = import.meta.env.VITE_IDENTITY_REGISTRY_ADDRESS || '';
export const NETWORK_RPC = import.meta.env.VITE_NETWORK_RPC_URL || 'http://127.0.0.1:8545';
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '31337');

export const REGISTRY_ABI = [
  'function registerIdentity(uint256 _commitment) external',
  'function recoverWallet(uint[2] _pA, uint[2][2] _pB, uint[2] _pC, uint256 _commitment, address _newAddress) external',
  'function isAuthorized(address _addr) external view returns (bool)',
  'function getIdentity(uint256 _commitment) external view returns (address, bool, uint256)',
  'function addressToCommitment(address) external view returns (uint256)',
];
