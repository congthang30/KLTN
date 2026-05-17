import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (!user) {
    console.log('❌ Admin user not found in Database!');
    return;
  }
  console.log('📊 Admin User DB Record Analysis:');
  console.log({
    id: user.id,
    username: user.username,
    email: user.email,
    firstLogin: user.firstLogin,
    faceEmbeddingLength: user.faceEmbedding ? JSON.parse(user.faceEmbedding).length : 0,
    faceHash: user.faceHash,
    walletAddress: user.walletAddress,
    zkpCommitment: user.zkpCommitment,
  });
}

main()
  .catch((e) => {
    console.error('Error running check script:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
