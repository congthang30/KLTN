import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class HospitalService {
  async getDoctors() {
    return prisma.doctor.findMany();
  }

  async getDiagnoses() {
    return prisma.diagnosis.findMany({
      include: { doctor: true }
    });
  }

  async getBlockchainTransactions() {
    return prisma.blockchainTransaction.findMany();
  }

  async getAiModels() {
    return prisma.aiModel.findMany();
  }
}
