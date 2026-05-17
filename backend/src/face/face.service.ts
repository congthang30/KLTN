import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class FaceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register face embedding for a user
   * @param userId - User ID
   * @param embedding - 128-dimensional face embedding array
   */
  async registerFace(userId: number, embedding: number[]) {
    // Hash embedding to a BigInt for ZKP circuit
    const faceHash = this.hashEmbedding(embedding);
    const faceEmbedding = JSON.stringify(embedding);

    await this.prisma.user.update({
      where: { id: userId },
      data: { faceEmbedding, faceHash, registrationStep: 3 },
    });

    return { message: 'Face registered successfully', faceHash };
  }

  /**
   * Verify face embedding against stored data
   * @returns similarity score and match result
   */
  async verifyFace(userId: number, embedding: number[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.faceEmbedding) {
      return { match: false, similarity: 0, message: 'No face registered' };
    }

    const stored: number[] = JSON.parse(user.faceEmbedding);
    const similarity = this.cosineSimilarity(embedding, stored);
    const match = similarity >= 0.85;

    return {
      match,
      similarity,
      faceHash: match ? user.faceHash : null,
      message: match ? 'Face verified' : 'Face does not match',
    };
  }

  /**
   * Hash a face embedding to a BigInt string for use in ZKP circuit
   * Quantizes floats to integers, then hashes with SHA-256, then takes modulo of BN254 field
   */
  private hashEmbedding(embedding: number[]): string {
    // Quantize: multiply by 10000 and round to get integers
    const quantized = embedding.map((v) => Math.round(v * 10000));
    const buffer = Buffer.from(quantized.join(','));
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Convert to BigInt and take modulo of BN254 scalar field
    const bn254Prime = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
    const hashBigInt = BigInt('0x' + hash) % bn254Prime;

    return hashBigInt.toString();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
