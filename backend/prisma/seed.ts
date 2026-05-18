import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================================
  // Admin: NO seed data. Super Admin creates Admin accounts
  // via the API with invite tokens. This is intentional security.
  // ============================================================
  console.log('ℹ️  Admin accounts: Not seeded. Super Admin creates via API with invite tokens.');

  // ============================================================
  // Seed sample Doctor accounts (with temp password for first login)
  // ============================================================
  console.log('🌱 Seeding sample Doctor accounts...');

  const tempPassword = await bcrypt.hash('doctor123', 10);

  const doctor1User = await prisma.user.upsert({
    where: { username: 'dr.john.doe' },
    update: {},
    create: {
      username: 'dr.john.doe',
      email: 'john.doe@hospital.vn',
      password: tempPassword,
      role: 'DOCTOR',
      status: 'PENDING',
      firstLogin: true,
      registrationStep: 1,
    },
  });

  const doctor2User = await prisma.user.upsert({
    where: { username: 'dr.jane.smith' },
    update: {},
    create: {
      username: 'dr.jane.smith',
      email: 'jane.smith@hospital.vn',
      password: tempPassword,
      role: 'DOCTOR',
      status: 'PENDING',
      firstLogin: true,
      registrationStep: 1,
    },
  });

  const doctor3User = await prisma.user.upsert({
    where: { username: 'dr.alan.turing' },
    update: {},
    create: {
      username: 'dr.alan.turing',
      email: 'alan.turing@hospital.vn',
      password: tempPassword,
      role: 'DOCTOR',
      status: 'PENDING',
      firstLogin: true,
      registrationStep: 1,
    },
  });

  // Create DoctorProfiles
  const doc1Profile = await prisma.doctorProfile.upsert({
    where: { userId: doctor1User.id },
    update: {},
    create: {
      userId: doctor1User.id,
      doctorName: 'Dr. John Doe',
      licenseId: 'LIC-CARD-001',
      dateOfBirth: new Date('1980-05-15'),
      identityNumber: 'ID-001-VN',
      specialties: 'Cardiology',
      degree: 'MD, PhD',
      facultyOfWork: 'Heart Center',
      position: 'Senior Cardiologist',
      workingStartDate: new Date('2010-09-01'),
    },
  });

  const doc2Profile = await prisma.doctorProfile.upsert({
    where: { userId: doctor2User.id },
    update: {},
    create: {
      userId: doctor2User.id,
      doctorName: 'Dr. Jane Smith',
      licenseId: 'LIC-NEUR-002',
      dateOfBirth: new Date('1985-08-22'),
      identityNumber: 'ID-002-VN',
      specialties: 'Neurology',
      degree: 'MD',
      facultyOfWork: 'Neuroscience Department',
      position: 'Neurologist',
      workingStartDate: new Date('2015-03-01'),
    },
  });

  const doc3Profile = await prisma.doctorProfile.upsert({
    where: { userId: doctor3User.id },
    update: {},
    create: {
      userId: doctor3User.id,
      doctorName: 'Dr. Alan Turing',
      licenseId: 'LIC-GEN-003',
      dateOfBirth: new Date('1990-06-23'),
      identityNumber: 'ID-003-VN',
      specialties: 'General Practice',
      degree: 'MD',
      facultyOfWork: 'General Medicine',
      position: 'General Practitioner',
      workingStartDate: new Date('2018-07-01'),
    },
  });

  console.log(`  ✅ Created 3 Doctor accounts (temp password: doctor123)`);

  // ============================================================
  // Seed AI Models
  // ============================================================
  console.log('🌱 Seeding AI Models...');

  await prisma.aiModelInfo.upsert({
    where: { id: 'ai-xray-pneumonia' },
    update: {},
    create: {
      id: 'ai-xray-pneumonia',
      modelName: 'X-Ray Pneumonia Detector',
      version: 'v2.1.4',
    },
  });

  await prisma.aiModelInfo.upsert({
    where: { id: 'ai-ecg-arrhythmia' },
    update: {},
    create: {
      id: 'ai-ecg-arrhythmia',
      modelName: 'ECG Arrhythmia Classifier',
      version: 'v1.0.8',
    },
  });

  await prisma.aiModelInfo.upsert({
    where: { id: 'ai-mri-brain' },
    update: {},
    create: {
      id: 'ai-mri-brain',
      modelName: 'MRI Brain Tumor SegNet',
      version: 'v3.0.0',
    },
  });

  console.log('  ✅ Created 3 AI Models');

  // ============================================================
  // Seed sample AiDiagnosis records
  // ============================================================
  console.log('🌱 Seeding sample Diagnoses...');

  await prisma.aiDiagnosis.create({
    data: {
      doctorId: doc1Profile.id,
      aiModelId: 'ai-xray-pneumonia',
      inputImageHash: crypto.randomBytes(32).toString('hex'),
      aiDiagnoseConfidentResults: JSON.stringify({ pneumonia: 0.92, normal: 0.08 }),
      aiDiagnoseSegmentImageHash: crypto.randomBytes(32).toString('hex'),
      diagnoseStatus: 'COMPLETED',
    },
  });

  await prisma.aiDiagnosis.create({
    data: {
      doctorId: doc2Profile.id,
      aiModelId: 'ai-ecg-arrhythmia',
      inputImageHash: crypto.randomBytes(32).toString('hex'),
      aiDiagnoseConfidentResults: JSON.stringify({ arrhythmia: 0.85, normal: 0.15 }),
      aiDiagnoseSegmentImageHash: crypto.randomBytes(32).toString('hex'),
      diagnoseStatus: 'PENDING',
    },
  });

  console.log('  ✅ Created 2 sample Diagnoses');

  console.log('\n🌱 Seeding finished successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Summary:');
  console.log('   - Admins: None (create via Super Admin API)');
  console.log('   - Doctors: 3 (password: doctor123)');
  console.log('   - AI Models: 3');
  console.log('   - Diagnoses: 2');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
