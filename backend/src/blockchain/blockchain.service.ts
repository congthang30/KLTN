import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private contractAddress: string;

  // IdentityRegistry ABI (only the functions we need)
  private readonly abi = [
    'function registerIdentity(uint256 _commitment) external',
    'function recoverWallet(uint[2] _pA, uint[2][2] _pB, uint[2] _pC, uint256 _commitment, address _newAddress) external',
    'function isAuthorized(address _addr) external view returns (bool)',
    'function getIdentity(uint256 _commitment) external view returns (address, bool, uint256)',
    'function addressToCommitment(address) external view returns (uint256)',
    'event IdentityRegistered(uint256 indexed commitment, address indexed walletAddress)',
    'event WalletRecovered(uint256 indexed commitment, address indexed oldAddress, address indexed newAddress)',
  ];

  async onModuleInit() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    this.contractAddress = process.env.IDENTITY_REGISTRY_ADDRESS || '';

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (this.contractAddress) {
      this.contract = new ethers.Contract(this.contractAddress, this.abi, this.provider);
      console.log(`✅ Connected to IdentityRegistry at ${this.contractAddress}`);
    } else {
      console.warn('⚠️ IDENTITY_REGISTRY_ADDRESS not set. Blockchain features disabled.');
    }
  }

  async isAuthorized(address: string): Promise<boolean> {
    if (!this.contract) return false;
    try {
      return await this.contract.isAuthorized(address);
    } catch {
      return false;
    }
  }

  async getIdentity(commitment: string) {
    if (!this.contract) return null;
    try {
      const [walletAddress, isActive, registeredAt] = await this.contract.getIdentity(commitment);
      return { walletAddress, isActive, registeredAt: registeredAt.toString() };
    } catch {
      return null;
    }
  }

  async getCommitmentByAddress(address: string): Promise<string | null> {
    if (!this.contract) return null;
    try {
      const commitment = await this.contract.addressToCommitment(address);
      return commitment.toString();
    } catch {
      return null;
    }
  }

  /**
   * Automatically sign and register commitment on-chain using known Hardhat private keys if available
   */
  async registerOnChain(commitment: string, walletAddress: string) {
    if (!this.contractAddress) return { success: false, error: 'Blockchain not initialized' };

    const lowerAddress = walletAddress.toLowerCase();
    const hardhatKeys: Record<string, string> = {
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': '0x5de4111afa73f9876e5228e37186140b6e9b40ba9c195609ee7def409a5ae9cd',
    };

    const privateKey = hardhatKeys[lowerAddress];
    if (!privateKey) {
      console.warn(`[Blockchain] Custom address ${walletAddress} cannot be signed on backend (no private key). Proceeding with mock fallback.`);
      return { success: true, mocked: true, message: 'Mocked registration on-chain' };
    }

    try {
      const signer = new ethers.Wallet(privateKey, this.provider);
      const userContract = new ethers.Contract(this.contractAddress, this.abi, signer);
      const tx = await userContract.registerIdentity(commitment);
      await tx.wait();
      console.log(`[Blockchain] Successfully registered commitment ${commitment} on-chain for ${walletAddress} via backend signer!`);
      return { success: true, hash: tx.hash };
    } catch (err: any) {
      console.error(`[Blockchain] Failed to register on-chain via backend:`, err);
      throw err;
    }
  }

  getContractAddress(): string {
    return this.contractAddress;
  }

  getAbi() {
    return this.abi;
  }
}
