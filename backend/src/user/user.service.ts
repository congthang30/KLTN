import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Admin creates a new user with a temporary password
   */
  async createUser(username: string, email: string, role: string = 'USER') {
    // Check if username or email already exists
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) throw new ConflictException('Username or email already exists');

    // Generate temporary password (always use anhduc9A@5 for easy local testing)
    const tempPassword = 'anhduc9A@5';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        status: 'PENDING',
        firstLogin: true,
      },
    });

    return {
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      tempPassword, // Send this via email
    };
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async updateWalletAddress(userId: number, walletAddress: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { walletAddress, status: 'ACTIVE', registrationStep: 4 },
    });
  }

  async updateFaceData(userId: number, faceEmbedding: string, faceHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { faceEmbedding, faceHash },
    });
  }

  async updateZkpData(userId: number, zkpSecret: string, zkpCommitment: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { zkpSecret, zkpCommitment },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        walletAddress: true,
        status: true,
        firstLogin: true,
        createdAt: true,
      },
    });
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        walletAddress: true,
        status: true,
        firstLogin: true,
        registrationStep: true,
        zkpCommitment: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Add computed fields
    const fullUser = await this.prisma.user.findUnique({ where: { id: userId } });
    return {
      ...user,
      hasFace: !!fullUser.faceEmbedding,
      hasWallet: !!fullUser.walletAddress,
      hasZkp: !!fullUser.zkpCommitment,
    };
  }

  async rollbackStep(userId: number, currentStep: number) {
    if (currentStep === 4) {
      // Rollback to Step 3: Clear wallet address, set registrationStep to 3
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          walletAddress: null,
          status: 'PENDING',
          registrationStep: 3,
        },
      });
    } else if (currentStep === 3) {
      // Rollback to Step 2: Clear face data, set registrationStep to 2
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          faceEmbedding: null,
          faceHash: null,
          registrationStep: 2,
        },
      });
    } else if (currentStep === 2) {
      // Rollback to Step 1: Set registrationStep to 1
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          registrationStep: 1,
        },
      });
    }
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
