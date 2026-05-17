import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { REGISTRY_ADDRESS, REGISTRY_ABI } from '../utils/constants';
import api from '../services/api';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isMock, setIsMock] = useState(false);

  // useRef để giữ giá trị isMock mới nhất bên trong event listener mà không gây re-run useEffect
  const isMockRef = useRef(false);
  useEffect(() => { isMockRef.current = isMock; }, [isMock]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        if (!isMockRef.current) {
          try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const walletSigner = await browserProvider.getSigner();
            setAddress(accounts[0]);
            setProvider(browserProvider);
            setSigner(walletSigner);
            if (REGISTRY_ADDRESS && REGISTRY_ADDRESS !== '0x_deployed_contract_address_here') {
              const registryContract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, walletSigner);
              setContract(registryContract);
            }
          } catch (err) {
            console.warn('[WalletContext] accountsChanged sync failed:', err);
          }
        }
      } else {
        setAddress(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
        setIsMock(false);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []); // Chỉ chạy 1 lần khi mount — isMockRef.current luôn cập nhật do useRef

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed!');
      return null;
    }

    setConnecting(true);
    setError(null);
    setIsMock(false);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const walletSigner = await browserProvider.getSigner();
      const walletAddress = accounts[0];

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAddress(walletAddress);

      // Connect to IdentityRegistry contract
      if (REGISTRY_ADDRESS && REGISTRY_ADDRESS !== '0x_deployed_contract_address_here') {
        const registryContract = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, walletSigner);
        setContract(registryContract);
      }

      return walletAddress;
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const connectMock = useCallback((mockAddress) => {
    setAddress(mockAddress);
    setIsMock(true);
    setProvider(null);
    setSigner(null);
    setContract(null);
    return mockAddress;
  }, []);

  const signMessage = useCallback(async (message) => {
    if (isMock) {
      // Return a simulated signature
      return `0x_mock_signature_for_${address}_with_msg_${message}`;
    }
    if (!signer) throw new Error('Wallet not connected');
    return await signer.signMessage(message);
  }, [isMock, signer, address]);

  const registerIdentity = useCallback(async (commitment) => {
    if (isMock) {
      // Backend automatically registers on-chain if known Hardhat private keys, otherwise mocked fallback
      try {
        await api.post('/zkp/register-onchain', { commitment, address });
      } catch (err) {
        console.log('Failed to register on-chain via backend, proceeding with mock success:', err);
      }
      return { hash: '0x_mock_tx_hash_for_testing' };
    }
    if (!contract) throw new Error('Contract not connected');
    const tx = await contract.registerIdentity(commitment);
    await tx.wait();
    return tx;
  }, [isMock, contract, address]);

  const recoverWallet = useCallback(async (pA, pB, pC, commitment, newAddress) => {
    if (isMock) {
      // Update wallet in DB directly via backend
      await api.post('/zkp/update-wallet', { newAddress });
      return { hash: '0x_mock_recovery_hash' };
    }
    if (!contract) throw new Error('Contract not connected');
    const tx = await contract.recoverWallet(pA, pB, pC, commitment, newAddress);
    await tx.wait();
    return tx;
  }, [isMock, contract]);

  const isAuthorized = useCallback(async (addr) => {
    if (isMock) return true;
    if (!contract) return false;
    return await contract.isAuthorized(addr);
  }, [isMock, contract]);

  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setIsMock(false);
  };

  return (
    <WalletContext.Provider value={{
      address, provider, signer, contract, connecting, error, isMock,
      connect, connectMock, disconnect, signMessage,
      registerIdentity, recoverWallet, isAuthorized,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
