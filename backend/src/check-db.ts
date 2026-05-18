import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { username: 'admin' },
    include: { adminProfile: true },
  });
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
    registrationStep: user.registrationStep,
    // Admin fields are in AdminProfile
    walletAddress: user.adminProfile?.walletAddress,
    faceEmbeddingLength: user.adminProfile?.faceEmbedding
      ? JSON.parse(user.adminProfile.faceEmbedding).length
      : 0,
    faceHash: user.adminProfile?.faceHash,
    zkpCommitment: user.adminProfile?.zkpCommitment,
  });
}

main()
  .catch((e) => {
    console.error('Error running check script:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
