import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HospitalService {
  constructor(private prisma: PrismaService) {}

  async getDoctors() {
    return this.prisma.doctorProfile.findMany({
      include: { user: { select: { id: true, username: true, email: true, status: true } } },
    });
  }

  async getDiagnoses() {
    return this.prisma.aiDiagnosis.findMany({
      include: {
        doctor: true,
        aiModel: true,
        finalConclude: true,
      },
    });
  }

  async getBlockchainTransactions() {
    return this.prisma.blockchainHistory.findMany({
      orderBy: { confirmTime: 'desc' },
    });
  }

  async getAiModels() {
    return this.prisma.aiModelInfo.findMany();
  }
}
