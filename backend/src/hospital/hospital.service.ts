import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class HospitalService {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  // ── READ ──────────────────────────────────────────────────────────────────

  async getDoctors() {
    return this.prisma.doctorProfile.findMany({
      include: {
        user: { select: { id: true, username: true, email: true, status: true } },
      },
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

  // ── CREATE DOCTOR ─────────────────────────────────────────────────────────

  /**
   * Admin creates a doctor account:
   * 1. Hash temp password
   * 2. Parse / store face embedding
   * 3. Compute SHA-256 metadata hash: SHA256(licenseId + position + faceHash + doctorId)
   * 4. Persist hash to BlockchainHistory (try real blockchain, fall back gracefully)
   * 5. Create User + DoctorProfile in DB
   */
  async createDoctor(dto: CreateDoctorDto, portraitBuffer: Buffer | null) {
    // ── guard: unique constraints ──────────────────────────────────────────
    const [existingUser, existingLicense, existingIdentity] = await Promise.all([
      this.prisma.user.findFirst({
        where: { OR: [{ username: dto.username }, { email: dto.email }] },
      }),
      this.prisma.doctorProfile.findUnique({ where: { licenseId: dto.licenseId } }),
      this.prisma.doctorProfile.findUnique({ where: { identityNumber: dto.identityNumber } }),
    ]);

    if (existingUser) throw new ConflictException('Username or email already exists');
    if (existingLicense) throw new ConflictException('License ID already registered');
    if (existingIdentity) throw new ConflictException('Identity number already registered');

    // ── 1. password ────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(dto.tempPassword, 10);

    // ── 2. portrait ────────────────────────────────────────────────────────
    const portraitBase64 = portraitBuffer
      ? portraitBuffer.toString('base64')
      : null;

    // ── 3. face embedding ──────────────────────────────────────────────────
    let embedding: number[] = [];
    if (dto.faceEmbedding) {
      try {
        embedding = JSON.parse(dto.faceEmbedding);
        if (!Array.isArray(embedding)) embedding = [];
      } catch {
        embedding = [];
      }
    }
    const faceEmbeddingStr = embedding.length > 0 ? JSON.stringify(embedding) : null;
    const faceHash = embedding.length > 0 ? this.hashEmbedding(embedding) : null;

    // ── 4. create User + DoctorProfile ────────────────────────────────────
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        role: 'DOCTOR',
        status: 'ACTIVE',
        firstLogin: true,
        registrationStep: 1,
        doctorProfile: {
          create: {
            doctorName: dto.doctorName,
            licenseId: dto.licenseId,
            identityNumber: dto.identityNumber,
            position: dto.position,
            specialties: dto.specialties,
            degree: dto.degree,
            facultyOfWork: dto.facultyOfWork,
            dateOfBirth: new Date(dto.dateOfBirth),
            workingStartDate: new Date(dto.workingStartDate),
            portraitImage: portraitBase64,
            faceEmbedding: faceEmbeddingStr,
            faceEmbeddingHash: faceHash,
            doctorStatus: 'ACTIVE',
          },
        },
      },
      include: { doctorProfile: true },
    });

    const profile = user.doctorProfile!;

    // ── 5. compute metadata hash ───────────────────────────────────────────
    //   SHA256( licenseId : position : faceHash : doctorProfileId )
    const metadataHash = this.computeMetadataHash(
      dto.licenseId,
      dto.position,
      faceHash ?? '',
      profile.id,
    );

    // ── 6. register hash on blockchain (best-effort) ───────────────────────
    let blockchainTxHash: string | null = null;
    let blockchainStatus = 'PENDING';

    try {
      const result = await this.registerDoctorHashOnChain(metadataHash);
      if (result.success) {
        blockchainTxHash = result.hash ?? null;
        blockchainStatus = 'SUCCESS';
      }
    } catch (err) {
      console.warn('[Hospital] Blockchain registration failed, continuing:', err?.message);
    }

    // ── 7. persist BlockchainHistory record ───────────────────────────────
    const bcHistory = await this.prisma.blockchainHistory.create({
      data: {
        transactionId: blockchainTxHash ?? `local-${profile.id}`,
        confirmTime: new Date(),
        blockchainStatus,
        errorReason: blockchainStatus !== 'SUCCESS' ? 'Blockchain unavailable' : null,
      },
    });

    // ── 8. link blockchain record + metadata hash to DoctorProfile ─────────
    await this.prisma.doctorProfile.update({
      where: { id: profile.id },
      data: {
        blockchainHistoryId: bcHistory.id,
        blockchainHash: metadataHash,
      },
    });

    return {
      message: 'Doctor account created successfully',
      doctor: {
        id: profile.id,
        username: user.username,
        email: user.email,
        doctorName: profile.doctorName,
        licenseId: profile.licenseId,
        position: profile.position,
        hasFaceEmbedding: !!faceEmbeddingStr,
        metadataHash,
        blockchainStatus,
        blockchainTxHash,
      },
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Convert SHA-256 hex hash → BigInt → call registerIdentity on IdentityRegistry
   * (reuses existing contract — treats the metadata hash as a ZKP commitment)
   */
  private async registerDoctorHashOnChain(metadataHashHex: string) {
    const commitment = (BigInt('0x' + metadataHashHex)).toString();
    // We use the superAdmin relayer approach: the backend signs on behalf
    return this.blockchainService.registerOnChain(commitment, '0x0000000000000000000000000000000000000001');
  }

  /**
   * SHA-256( licenseId : position : faceHash : doctorId )
   */
  private computeMetadataHash(
    licenseId: string,
    position: string,
    faceHash: string,
    doctorId: string,
  ): string {
    const raw = `${licenseId}:${position}:${faceHash}:${doctorId}`;
    return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  /**
   * Hash face embedding using the same method as FaceService
   * (quantize → SHA-256 → mod bn254 prime)
   */
  private hashEmbedding(embedding: number[]): string {
    const quantized = embedding.map((v) => Math.round(v * 10000));
    const buffer = Buffer.from(quantized.join(','));
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const bn254Prime = BigInt(
      '21888242871839275222246405745257275088548364400416034343698204186575808495617',
    );
    const hashBigInt = BigInt('0x' + hash) % bn254Prime;
    return hashBigInt.toString();
  }
}
