import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding Phase 6C Indian Healthcare Database (UHID, Indian Names, OPD Tokens, INR Fees)...');

  const adminHash = hashPassword('Admin@123456');
  const docHash = hashPassword('Doctor@123456');
  const patHash = hashPassword('Patient@123456');

  // 1. Departments (Indian Eye Care Specialties)
  await prisma.department.upsert({
    where: { name: 'General Ophthalmology & Triage' },
    update: {},
    create: {
      id: 'dept-01',
      name: 'General Ophthalmology & Triage',
      description: 'Primary eye care, routine vision examinations, and general ophthalmic OPD triage.',
      status: 'ACTIVE',
    },
  });

  const deptCataract = await prisma.department.upsert({
    where: { name: 'Cataract & Refractive Surgery' },
    update: {},
    create: {
      id: 'dept-02',
      name: 'Cataract & Refractive Surgery',
      description: 'Phacoemulsification, premium IOL implantation, LASIK, and anterior segment procedures.',
      status: 'ACTIVE',
    },
  });

  const deptRetina = await prisma.department.upsert({
    where: { name: 'Retina & Vitreous Surgery' },
    update: {},
    create: {
      id: 'dept-03',
      name: 'Retina & Vitreous Surgery',
      description: 'Diabetic retinopathy, macular degeneration, retinal detachment, and OCT diagnostics.',
      status: 'ACTIVE',
    },
  });

  await prisma.department.upsert({
    where: { name: 'Glaucoma Service' },
    update: {},
    create: {
      id: 'dept-04',
      name: 'Glaucoma Service',
      description: 'IOP monitoring, visual field testing, laser trabeculoplasty, and glaucoma surgery.',
      status: 'ACTIVE',
    },
  });

  // 2. Admin User
  await prisma.user.upsert({
    where: { email: 'admin@clearvisioneyecare.com' },
    update: { passwordHash: adminHash },
    create: {
      id: 'usr-adm-01',
      email: 'admin@clearvisioneyecare.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 3. Doctor 1 (Dr. Priya Mehta - Cataract & Cornea Specialist)
  const docUser1 = await prisma.user.upsert({
    where: { email: 'dr.vance@clearvisioneyecare.com' },
    update: { passwordHash: docHash },
    create: {
      id: 'usr-doc-01',
      email: 'dr.vance@clearvisioneyecare.com',
      passwordHash: docHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  const doctor1 = await prisma.doctor.upsert({
    where: { userId: docUser1.id },
    update: {
      firstName: 'Priya',
      lastName: 'Mehta',
      specialization: 'Cataract & Refractive Surgery Specialist',
      qualification: 'MBBS, MS (Ophthalmology), Fellowship in Phacoemulsification',
      licenseNumber: 'MCI-MED-2012-99412',
      phone: '+91 98200 45678',
      bio: 'Senior Consultant Ophthalmologist with 14 years of clinical experience in advanced Phacoemulsification, premium toric IOLs, and corneal procedures.',
    },
    create: {
      id: 'doc-01',
      userId: docUser1.id,
      doctorNumber: 'DOC-2026-0041',
      firstName: 'Priya',
      lastName: 'Mehta',
      specialization: 'Cataract & Refractive Surgery Specialist',
      qualification: 'MBBS, MS (Ophthalmology), Fellowship in Phacoemulsification',
      licenseNumber: 'MCI-MED-2012-99412',
      phone: '+91 98200 45678',
      bio: 'Senior Consultant Ophthalmologist with 14 years of clinical experience in advanced Phacoemulsification, premium toric IOLs, and corneal procedures.',
      profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250',
      departmentId: deptCataract.id,
      experience: 14,
      status: 'ACTIVE',
    },
  });

  // 4. Doctor 2 (Dr. Rajesh Iyer - Vitreoretinal Surgeon)
  const docUser2 = await prisma.user.upsert({
    where: { email: 'dr.brody@clearvisioneyecare.com' },
    update: { passwordHash: docHash },
    create: {
      id: 'usr-doc-02',
      email: 'dr.brody@clearvisioneyecare.com',
      passwordHash: docHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  await prisma.doctor.upsert({
    where: { userId: docUser2.id },
    update: {
      firstName: 'Rajesh',
      lastName: 'Iyer',
      specialization: 'Vitreoretinal Surgeon & Macular Specialist',
      qualification: 'MBBS, MS (Ophthalmology), FRCS (Edin)',
      licenseNumber: 'KMC-MED-2009-88123',
      phone: '+91 98450 34567',
      bio: 'Vitreoretinal surgeon specializing in diabetic retinopathy management, macular hole repair, retinal detachment, and OCT diagnostics.',
    },
    create: {
      id: 'doc-02',
      userId: docUser2.id,
      doctorNumber: 'DOC-2026-0088',
      firstName: 'Rajesh',
      lastName: 'Iyer',
      specialization: 'Vitreoretinal Surgeon & Macular Specialist',
      qualification: 'MBBS, MS (Ophthalmology), FRCS (Edin)',
      licenseNumber: 'KMC-MED-2009-88123',
      phone: '+91 98450 34567',
      bio: 'Vitreoretinal surgeon specializing in diabetic retinopathy management, macular hole repair, retinal detachment, and OCT diagnostics.',
      profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250',
      departmentId: deptRetina.id,
      experience: 16,
      status: 'ACTIVE',
    },
  });

  // 5. Patient 1 (Aarav Sharma)
  const patUser1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: { passwordHash: patHash },
    create: {
      id: 'usr-pat-01',
      email: 'john.doe@example.com',
      passwordHash: patHash,
      role: 'PATIENT',
      status: 'ACTIVE',
    },
  });

  const patient1 = await prisma.patient.upsert({
    where: { userId: patUser1.id },
    update: {
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '+91 98210 12345',
      uhid: 'CVEC-2026-000001',
      addressLine: 'Flat 402, Shivam Heights',
      locality: 'Andheri West',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pincode: '400053',
    },
    create: {
      id: 'pat-01',
      userId: patUser1.id,
      patientNumber: 'PAT-2026-0042',
      uhid: 'CVEC-2026-000001',
      mrn: 'MRN-77301',
      firstName: 'Aarav',
      lastName: 'Sharma',
      dateOfBirth: '1985-04-12',
      gender: 'MALE',
      phone: '+91 98210 12345',
      address: 'Flat 402, Shivam Heights, Andheri West, Mumbai, Maharashtra - 400053',
      addressLine: 'Flat 402, Shivam Heights',
      locality: 'Andheri West',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pincode: '400053',
      emergencyContact: 'Sunita Sharma (Spouse) - +91 98210 98765',
      bloodGroup: 'O+',
    },
  });

  // 6. Patient 2 (Sneha Kulkarni)
  const patUser2 = await prisma.user.upsert({
    where: { email: 'sarah.smith@example.com' },
    update: { passwordHash: patHash },
    create: {
      id: 'usr-pat-02',
      email: 'sarah.smith@example.com',
      passwordHash: patHash,
      role: 'PATIENT',
      status: 'ACTIVE',
    },
  });

  await prisma.patient.upsert({
    where: { userId: patUser2.id },
    update: {
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      phone: '+91 98900 87654',
      uhid: 'CVEC-2026-000002',
      addressLine: 'Bldg 12, Kothrud Gardens',
      locality: 'Kothrud',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
    },
    create: {
      id: 'pat-02',
      userId: patUser2.id,
      patientNumber: 'PAT-2026-0089',
      uhid: 'CVEC-2026-000002',
      mrn: 'MRN-88202',
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      dateOfBirth: '1993-09-28',
      gender: 'FEMALE',
      phone: '+91 98900 87654',
      address: 'Bldg 12, Kothrud Gardens, Kothrud, Pune, Maharashtra - 411038',
      addressLine: 'Bldg 12, Kothrud Gardens',
      locality: 'Kothrud',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      emergencyContact: 'Rahul Kulkarni (Brother) - +91 98900 11111',
      bloodGroup: 'A+',
    },
  });

  // 7. Seed Sample Indian Appointment & OPD Token for Today
  const todayStr = new Date().toISOString().slice(0, 10);
  const appt1 = await prisma.appointment.upsert({
    where: { id: 'apt-01' },
    update: {},
    create: {
      id: 'apt-01',
      patientId: patient1.id,
      doctorId: doctor1.id,
      departmentId: deptCataract.id,
      appointmentDate: todayStr,
      startTime: '10:00 AM',
      type: 'NEW_CONSULTATION',
      status: 'CHECKED_IN',
      reason: 'Blurred vision in right eye and difficulty reading fine text',
      tokenNumber: 'OPD-001',
      fee: 500,
    },
  });

  await prisma.oPDToken.upsert({
    where: { id: 'tok-01' },
    update: {},
    create: {
      id: 'tok-01',
      appointmentId: appt1.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      tokenNumber: 'OPD-001',
      sequenceNumber: 1,
      tokenDate: todayStr,
      status: 'WAITING',
    },
  });

  // Sample Invoice
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-0001' },
    update: {},
    create: {
      id: 'inv-01',
      invoiceNumber: 'INV-2026-0001',
      patientId: patient1.id,
      appointmentId: appt1.id,
      serviceName: 'New OPD Consultation & Comprehensive Examination',
      subtotal: 500,
      tax: 0,
      totalAmount: 500,
      paymentMode: 'UPI',
      status: 'PAID',
      dueDate: todayStr,
    },
  });

  console.log('Phase 6C Indian Healthcare seed with UHID, OPD tokens, and INR pricing completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
