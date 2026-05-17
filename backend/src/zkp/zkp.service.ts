import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class ZkpService {
  private readonly encryptionKey: string;

  constructor(private prisma: PrismaService) {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default_encryption_key_32bytes!!';
  }

  /**
   * Generate a random secret for ZKP identity commitment
   * The secret is a random BigInt within the BN254 scalar field
   */
  generateSecret(): string {
    const bn254Prime = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
    const randomBytes = crypto.randomBytes(32);
    const secret = BigInt('0x' + randomBytes.toString('hex')) % bn254Prime;
    return secret.toString();
  }

  /**
   * Compute Poseidon commitment: Poseidon(secret, faceHash)
   * For prototype, we use SHA-256 based simulation
   * In production, use circomlibjs Poseidon
   */
  async computeCommitment(secret: string, faceHash: string): Promise<string> {
    try {
      // Try using circomlibjs Poseidon (production)
      const { buildPoseidon } = await import('circomlibjs');
      const poseidon = await buildPoseidon();
      const hash = poseidon([BigInt(secret), BigInt(faceHash)]);
      return poseidon.F.toString(hash);
    } catch (err) {
      // Fallback: SHA-256 based hash (development)
      console.warn('circomlibjs not available, using SHA-256 fallback for commitment');
      const bn254Prime = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
      const combined = `${secret}:${faceHash}`;
      const hash = crypto.createHash('sha256').update(combined).digest('hex');
      return (BigInt('0x' + hash) % bn254Prime).toString();
    }
  }

  /**
   * Encrypt secret with AES-256 for secure storage
   */
  encryptSecret(secret: string): string {
    return CryptoJS.AES.encrypt(secret, this.encryptionKey).toString();
  }

  /**
   * Decrypt stored secret
   */
  decryptSecret(encryptedSecret: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedSecret, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Full registration flow: reuse or generate secret → compute commitment → store
   * Secret is now generated at first login (via AuthService.generateSecret)
   * and reused here. It is NOT returned again.
   */
  async registerIdentity(userId: number, faceHash: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    let secret: string;
    if (user?.zkpSecret) {
      // Reuse secret that was generated during first login
      try {
        secret = this.decryptSecret(user.zkpSecret);
      } catch {
        // If decryption fails, generate a new one as fallback
        secret = this.generateSecret();
        const encrypted = this.encryptSecret(secret);
        await this.prisma.user.update({
          where: { id: userId },
          data: { zkpSecret: encrypted },
        });
      }
    } else {
      // Fallback: generate new secret if none exists (edge case)
      secret = this.generateSecret();
      const encryptedSecret = this.encryptSecret(secret);
      await this.prisma.user.update({
        where: { id: userId },
        data: { zkpSecret: encryptedSecret },
      });
    }

    const commitment = await this.computeCommitment(secret, faceHash);

    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        zkpCommitment: commitment,
      },
    });

    return {
      // Secret is NOT returned here - it was already shown at first login
      commitment,
      message: 'ZKP identity registered successfully',
    };
  }

  /**
   * Finalize registration step: set firstLogin to false and registrationStep to 5
   */
  async completeRegistration(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstLogin: false,
        registrationStep: 5,
      },
    });
  }

  /**
   * Get commitment and faceHash for recovery proof generation
   */
  async getRecoveryData(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.zkpCommitment || !user.faceHash) {
      return null;
    }

    return {
      commitment: user.zkpCommitment,
      faceHash: user.faceHash,
    };
  }
}
