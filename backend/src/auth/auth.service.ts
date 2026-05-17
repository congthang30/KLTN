import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ZkpService } from '../zkp/zkp.service';
import * as bcrypt from 'bcrypt';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private zkpService: ZkpService,
  ) {}

  async login(username: string, password: string) {
    // Tìm kiếm user bằng cả username hoặc email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account suspended');
    }

    // Issue partial JWT (Layer 1 only, not fully verified)
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      verified: false,
    };

    return {
      access_token: this.jwtService.sign(payload),
      firstLogin: user.firstLogin,
      requireVerification: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        status: user.status,
        hasWallet: !!user.walletAddress,
        hasFace: !!user.faceEmbedding,
        registrationStep: user.registrationStep,
      },
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) throw new BadRequestException('Old password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password changed successfully' };
  }

  async verifyWallet(userId: number, address: string, signature: string, message: string) {
    // Recover address from signature
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      throw new UnauthorizedException('Invalid wallet signature');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // If user has a registered wallet, check it matches
    if (user.walletAddress && user.walletAddress.toLowerCase() !== address.toLowerCase()) {
      throw new UnauthorizedException('Wallet address does not match registered address');
    }

    // Issue full-access JWT
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      verified: true,
      walletAddress: address,
    };

    return {
      access_token: this.jwtService.sign(payload),
      verified: true,
    };
  }

  async verifyFace(userId: number, embedding: number[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.faceEmbedding) {
      throw new UnauthorizedException('No face data registered');
    }

    const stored: number[] = JSON.parse(user.faceEmbedding);
    const similarity = this.cosineSimilarity(embedding, stored);

    if (similarity < 0.85) {
      throw new UnauthorizedException(`Face verification failed (similarity: ${similarity.toFixed(3)})`);
    }

    // Issue full-access JWT
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      verified: true,
    };

    return {
      access_token: this.jwtService.sign(payload),
      verified: true,
      similarity,
    };
  }

  /**
   * Generate a ZKP secret for the user on first login
   * This secret is shown ONCE to the admin and used for account recovery
   */
  async generateSecret(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // If user already has a secret, decrypt and return it (idempotent for first login)
    if (user.zkpSecret) {
      try {
        const existingSecret = this.zkpService.decryptSecret(user.zkpSecret);
        return { secret: existingSecret };
      } catch {
        // If decryption fails, generate a new one
      }
    }

    // Generate new secret
    const secret = this.zkpService.generateSecret();
    const encrypted = this.zkpService.encryptSecret(secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { zkpSecret: encrypted },
    });

    return { secret };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
