import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if an admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
    },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('anhduc9A@5', 10);
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'duc19092005d@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        firstLogin: true, // Bắt buộc đăng ký ban đầu
        registrationStep: 1, // Bắt đầu ở bước 1
      },
    });

    console.log('✅ Admin user created successfully:');
    console.log(`   Username: ${admin.username}`);
    console.log('   Password: anhduc9A@5');
    console.log(`   Email: ${admin.email}`);
  } else {
    // Nếu admin đã tồn tại, tự động reset trạng thái về firstLogin: true để người dùng trải nghiệm luồng đăng ký khuôn mặt và ví
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { 
        firstLogin: true, 
        registrationStep: 1, // Reset về bước 1
        faceEmbedding: null, 
        faceHash: null,
        walletAddress: null,
        zkpSecret: null,
        zkpCommitment: null
      }
    });
    console.log('🔄 Reset existing admin to firstLogin: true for face & wallet setup.');
  }

  // Seed Hospital Data
  console.log('🌱 Seeding hospital mock data...');

  // 1. Doctors
  const doctor1 = await prisma.doctor.create({
    data: { name: 'Dr. John Doe', specialty: 'Cardiology', phone: '123-456-7890' }
  });
  const doctor2 = await prisma.doctor.create({
    data: { name: 'Dr. Jane Smith', specialty: 'Neurology', phone: '098-765-4321' }
  });
  const doctor3 = await prisma.doctor.create({
    data: { name: 'Dr. Alan Turing', specialty: 'General Practice', phone: '555-123-4567' }
  });

  // 2. Diagnoses
  await prisma.diagnosis.createMany({
    data: [
      { patientName: 'Alice Nguyen', disease: 'Hypertension', treatment: 'Amlodipine 5mg daily', doctorId: doctor1.id, status: 'COMPLETED' },
      { patientName: 'Bob Tran', disease: 'Migraine', treatment: 'Rest and Sumatriptan', doctorId: doctor2.id, status: 'PENDING' },
      { patientName: 'Charlie Le', disease: 'Common Cold', treatment: 'Vitamin C, Paracetamol', doctorId: doctor3.id, status: 'COMPLETED' },
      { patientName: 'David Pham', disease: 'Arrhythmia', treatment: 'Amiodarone', doctorId: doctor1.id, status: 'PENDING' },
      { patientName: 'Eve Vu', disease: 'Epilepsy', treatment: 'Levetiracetam', doctorId: doctor2.id, status: 'IN_PROGRESS' },
    ]
  });

  // 3. Blockchain Transactions
  await prisma.blockchainTransaction.createMany({
    data: [
      { txHash: '0x123abc456def7890123abc456def7890123abc456def7890123abc456def7890', action: 'Update Patient Record', status: 'CONFIRMED' },
      { txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1', action: 'Verify ZKP Identity', status: 'CONFIRMED' },
      { txHash: '0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4', action: 'New Diagnosis Entry', status: 'PENDING' },
      { txHash: '0x987fed654cba987fed654cba987fed654cba987fed654cba987fed654cba987f', action: 'Revoke Access', status: 'CONFIRMED' },
    ]
  });

  // 4. AI Models
  await prisma.aiModel.createMany({
    data: [
      { name: 'X-Ray Pneumonia Detector', version: 'v2.1.4', accuracy: 96.5, status: 'ACTIVE' },
      { name: 'ECG Arrhythmia Classifier', version: 'v1.0.8', accuracy: 94.2, status: 'ACTIVE' },
      { name: 'MRI Brain Tumor SegNet', version: 'v3.0.0', accuracy: 98.1, status: 'MAINTENANCE' },
    ]
  });

  console.log('🌱 Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
