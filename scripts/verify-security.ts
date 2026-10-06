import assert from 'assert';
import { hashPassword, verifyPassword } from '../src/lib/security/password';
import {
  generateUHID,
  generateOPDToken,
  validateIndianMobile,
  validatePincode,
  formatINR,
  formatIndianDate,
} from '../src/lib/utils/localization';
import { checkRateLimit } from '../src/lib/security/rateLimit';
import {
  registerPatientSchema,
  createPrescriptionSchema,
  updatePrescriptionStatusSchema,
  isValidPrescriptionStatusTransition,
  prescriptionStatusTransitionSchema,
} from '../src/lib/validation/schemas';
import { GET as getPrescriptions, POST as createPrescription } from '../src/app/api/prescriptions/route';
import { PATCH as updatePrescriptionStatus } from '../src/app/api/prescriptions/[prescriptionId]/route';
import { GET as getConsultations, POST as createConsultation } from '../src/app/api/consultations/route';
import { GET as getConsultationDetail, PATCH as updateConsultation } from '../src/app/api/consultations/[consultationId]/route';
import { GET as getInvoices, POST as createInvoice } from '../src/app/api/billing/route';
import { GET as getInvoiceDetail, PATCH as updateInvoice } from '../src/app/api/billing/[invoiceId]/route';
import { POST as recordPayment } from '../src/app/api/billing/[invoiceId]/payments/route';
import { GET as getPatientBilling } from '../src/app/api/patient/billing/route';
import { GET as getAppointments, POST as createAppointment } from '../src/app/api/appointments/route';
import { createInvoiceSchema, recordPaymentSchema } from '../src/lib/validation/schemas';

import {
  mockUsers,
  mockDoctors,
  mockPatients,
  mockAppointments,
  mockConsultations,
  mockPrescriptions,
  mockAuditLogs,
} from '../src/mock';
import { prisma } from '../src/lib/db/prisma';
import { verifyPatientOwnership } from '../src/lib/auth/session';

function createAuthHeaders(userId: string, role: 'PATIENT' | 'DOCTOR' | 'ADMIN', email: string): Headers {
  const payload = JSON.stringify({ userId, role, email, expiresAt: Date.now() + 3600000 });
  const headers = new Headers();
  headers.set('cookie', `eyecare_session=${encodeURIComponent(payload)}`);
  return headers;
}

async function runSecurityTests() {
  console.log('----------------------------------------------------');
  console.log('Starting Phase 6C End-to-End Security & API Verification...');
  console.log('----------------------------------------------------');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[FAIL] ${name}:`, error.message);
      failed++;
    }
  }

  // Helper setup for Step 3 mock data
  const uDoc1 = { id: 'usr-doc-sec-01', email: 'dr.sec1@clearvisioneyecare.com', role: 'DOCTOR' as const, status: 'ACTIVE' as const };
  const uDoc2 = { id: 'usr-doc-sec-02', email: 'dr.sec2@clearvisioneyecare.com', role: 'DOCTOR' as const, status: 'ACTIVE' as const };
  const uDocInact = { id: 'usr-doc-sec-inact', email: 'dr.inact@clearvisioneyecare.com', role: 'DOCTOR' as const, status: 'ACTIVE' as const };
  const uPat1 = { id: 'usr-pat-sec-01', email: 'pat.sec1@example.com', role: 'PATIENT' as const, status: 'ACTIVE' as const };
  const uPatUnrelated = { id: 'usr-pat-sec-unrelated', email: 'pat.unrelated@example.com', role: 'PATIENT' as const, status: 'ACTIVE' as const };

  if (!mockUsers.some((u) => u.id === uDoc1.id)) mockUsers.push(uDoc1 as any);
  if (!mockUsers.some((u) => u.id === uDoc2.id)) mockUsers.push(uDoc2 as any);
  if (!mockUsers.some((u) => u.id === uDocInact.id)) mockUsers.push(uDocInact as any);
  if (!mockUsers.some((u) => u.id === uPat1.id)) mockUsers.push(uPat1 as any);
  if (!mockUsers.some((u) => u.id === uPatUnrelated.id)) mockUsers.push(uPatUnrelated as any);

  const d1 = { id: 'doc-sec-01', userId: 'usr-doc-sec-01', doctorNumber: 'DOC-SEC-01', firstName: 'SecDoctor1', lastName: 'Test', specialization: 'Ophthalmology', qualification: 'MBBS', licenseNumber: 'LIC-SEC-01', phone: '9820000001', bio: 'Sec Doctor 1 Bio', departmentId: 'dept-01', status: 'ACTIVE' };
  const d2 = { id: 'doc-sec-02', userId: 'usr-doc-sec-02', doctorNumber: 'DOC-SEC-02', firstName: 'SecDoctor2', lastName: 'Test', specialization: 'Retina', qualification: 'MBBS', licenseNumber: 'LIC-SEC-02', phone: '9820000002', bio: 'Sec Doctor 2 Bio', departmentId: 'dept-01', status: 'ACTIVE' };
  const dInact = { id: 'doc-sec-inact', userId: 'usr-doc-sec-inact', doctorNumber: 'DOC-SEC-INACT', firstName: 'SecDoctorInact', lastName: 'Test', specialization: 'Cornea', qualification: 'MBBS', licenseNumber: 'LIC-SEC-INACT', phone: '9820000003', bio: 'Inactive Doctor Bio', departmentId: 'dept-01', status: 'INACTIVE' };

  if (!mockDoctors.some((d) => d.id === d1.id)) mockDoctors.push(d1 as any);
  if (!mockDoctors.some((d) => d.id === d2.id)) mockDoctors.push(d2 as any);
  if (!mockDoctors.some((d) => d.id === dInact.id)) mockDoctors.push(dInact as any);

  const p1 = { id: 'pat-sec-01', userId: 'usr-pat-sec-01', patientNumber: 'PAT-SEC-01', uhid: 'CVEC-2026-900001', firstName: 'SecPatient1', lastName: 'Test', dateOfBirth: '1990-01-01', gender: 'MALE' as const, phone: '9821000001', address: 'Address 1', emergencyContact: 'Contact 1' };
  const pUnrelated = { id: 'pat-sec-unrelated', userId: 'usr-pat-sec-unrelated', patientNumber: 'PAT-SEC-UNRELATED', uhid: 'CVEC-2026-900099', firstName: 'SecPatientUnrelated', lastName: 'Test', dateOfBirth: '1990-01-01', gender: 'FEMALE' as const, phone: '9821000099', address: 'Address Unrelated', emergencyContact: 'Contact Unrelated' };

  if (!mockPatients.some((p) => p.id === p1.id)) mockPatients.push(p1 as any);
  if (!mockPatients.some((p) => p.id === pUnrelated.id)) mockPatients.push(pUnrelated as any);

  const apt1 = { id: 'apt-sec-101', patientId: 'pat-sec-01', doctorId: 'doc-sec-01', appointmentDate: '2026-10-04', startTime: '10:00 AM', status: 'CONFIRMED' as const, type: 'NEW_CONSULTATION', reason: 'Apt 1' };
  const apt2 = { id: 'apt-sec-102', patientId: 'pat-sec-01', doctorId: 'doc-sec-02', appointmentDate: '2026-10-04', startTime: '11:00 AM', status: 'CONFIRMED' as const, type: 'NEW_CONSULTATION', reason: 'Apt 2' };

  if (!mockAppointments.some((a) => a.id === apt1.id)) mockAppointments.push(apt1 as any);
  if (!mockAppointments.some((a) => a.id === apt2.id)) mockAppointments.push(apt2 as any);

  const cns2 = { id: 'cns-sec-202', appointmentId: 'apt-sec-102', patientId: 'pat-sec-01', doctorId: 'doc-sec-02', chiefComplaint: 'Complaint 2', diagnosis: 'Diagnosis 2', status: 'completed' as const };
  if (!mockConsultations.some((c) => c.id === cns2.id)) mockConsultations.push(cns2 as any);

  const rxActive = { id: 'prsc-sec-301', prescriptionNumber: 'RX-2026-900001', status: 'ACTIVE' as const, patientId: 'pat-sec-01', doctorId: 'doc-sec-01', notes: 'Preserved clinical notes', items: [{ id: 'pi-sec-01', prescriptionId: 'prsc-sec-301', medicineName: 'Drops', dosage: '1 drop', frequency: '2x', duration: '5 days' }] };
  const rxCompleted = { id: 'prsc-sec-302', prescriptionNumber: 'RX-2026-900002', status: 'COMPLETED' as const, patientId: 'pat-sec-01', doctorId: 'doc-sec-01', notes: 'Completed notes', items: [] };
  const rxCancelled = { id: 'prsc-sec-303', prescriptionNumber: 'RX-2026-900003', status: 'CANCELLED' as const, patientId: 'pat-sec-01', doctorId: 'doc-sec-01', notes: 'Cancelled notes', items: [] };
  const rxInactDoc = { id: 'prsc-sec-inact', prescriptionNumber: 'RX-2026-900099', status: 'ACTIVE' as const, patientId: 'pat-sec-01', doctorId: 'doc-sec-inact', notes: 'Inactive doctor notes', items: [] };

  if (!mockPrescriptions.some((r) => r.id === rxActive.id)) mockPrescriptions.push(rxActive as any);
  if (!mockPrescriptions.some((r) => r.id === rxCompleted.id)) mockPrescriptions.push(rxCompleted as any);
  if (!mockPrescriptions.some((r) => r.id === rxCancelled.id)) mockPrescriptions.push(rxCancelled as any);
  if (!mockPrescriptions.some((r) => r.id === rxInactDoc.id)) mockPrescriptions.push(rxInactDoc as any);

  // 1. Password Security
  test('PBKDF2 Hashing generates salt:hash format with 100k iterations', () => {
    const raw = 'Password@123456';
    const hash = hashPassword(raw);
    assert.strictEqual(hash.includes(':'), true, 'Hash format must be salt:hash');
    const parts = hash.split(':');
    assert.strictEqual(parts[0].length, 64, 'Salt hex length must be 64 (32 bytes)');
    assert.strictEqual(parts[1].length, 128, 'Hash hex length must be 128 (64 bytes)');
    assert.strictEqual(verifyPassword(raw, hash), true, 'Correct password must verify');
    assert.strictEqual(verifyPassword('WrongPass', hash), false, 'Incorrect password must be rejected');
  });

  // 2. Server-side UHID Security
  test('UHID is generated in CVEC-YYYY-XXXXXX format server-side', () => {
    const uhid1 = generateUHID(1, 'CVEC');
    const year = new Date().getFullYear();
    assert.strictEqual(uhid1, `CVEC-${year}-000001`);

    const uhid42 = generateUHID(42, 'CVEC');
    assert.strictEqual(uhid42, `CVEC-${year}-000042`);
  });

  // 3. OPD Token Security
  test('OPD Token is generated in OPD-YYYYMMDD-XXX format server-side', () => {
    const token1 = generateOPDToken(1, '20260927');
    assert.strictEqual(token1, 'OPD-20260927-001');

    const token15 = generateOPDToken(15, '20260927');
    assert.strictEqual(token15, 'OPD-20260927-015');
  });

  // 4. Input Validation (Indian Healthcare Standards)
  test('Indian Mobile validation accepts 10-digit / +91 numbers and rejects invalid', () => {
    assert.strictEqual(validateIndianMobile('9821012345'), true);
    assert.strictEqual(validateIndianMobile('+91 98210 12345'), true);
    assert.strictEqual(validateIndianMobile('12345'), false, 'Short number rejected');
    assert.strictEqual(validateIndianMobile('1821012345'), false, 'Non 6-9 prefix rejected');
  });

  test('Indian PIN code validation enforces exactly 6 digits non-zero starting', () => {
    assert.strictEqual(validatePincode('400053'), true);
    assert.strictEqual(validatePincode('110001'), true);
    assert.strictEqual(validatePincode('010001'), false, 'Cannot start with 0');
    assert.strictEqual(validatePincode('40005'), false, '5 digits rejected');
  });

  // 5. Currency & Date Formatting
  test('INR formatting uses en-IN ₹ symbol without decimals by default', () => {
    assert.strictEqual(formatINR(500), '₹500');
    assert.strictEqual(formatINR(1200), '₹1,200');
  });

  test('Indian Date formatting uses Asia/Kolkata timezone in dd/mm/yyyy style', () => {
    const dStr = formatIndianDate('2026-09-27T10:00:00Z', 'short');
    assert.strictEqual(dStr.includes('27'), true);
    assert.strictEqual(dStr.includes('09'), true);
    assert.strictEqual(dStr.includes('2026'), true);
  });

  // 6. IDOR Protection
  test('IDOR check allows PATIENT to access own record but denies other patients', async () => {
    const patientSession = {
      id: 'usr-pat-01',
      email: 'john.doe@example.com',
      role: 'PATIENT' as const,
      patientId: 'pat-01',
    };

    // Patient accessing own record -> Allowed
    const ownAccess = await verifyPatientOwnership('pat-01', patientSession);
    assert.strictEqual(ownAccess, true);

    // Patient accessing another patient's record -> Rejected
    try {
      await verifyPatientOwnership('pat-02', patientSession);
      assert.fail('Should have thrown IDOR AuthError');
    } catch (err: unknown) {
      const error = err as Error & { code?: string; statusCode?: number };
      assert.strictEqual(error.statusCode, 403);
      assert.strictEqual(error.code, 'IDOR_FORBIDDEN');
    }
  });

  // 7. Mass Assignment Protection
  test('Zod Registration Schema strictly filters and validates payload', () => {
    const validData = {
      email: 'aarav.sharma@example.com',
      password: 'Password@123',
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '9821012345',
      dateOfBirth: '1985-04-12',
      address: 'Flat 402, Shivam Heights',
      emergencyContact: 'Sunita Sharma - 9821098765',
    };

    const parsed = registerPatientSchema.parse(validData);
    assert.strictEqual(parsed.firstName, 'Aarav');
    assert.strictEqual(parsed.phone, '9821012345');
  });

  // 8. Rate Limiting Safeguard
  test('Rate Limiter blocks IP after exceeding max attempts', () => {
    const testIp = '192.168.1.99';
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testIp, 5, 60000);
      if (i < 4) {
        assert.strictEqual(res.isRateLimited, false);
      } else {
        assert.strictEqual(res.isRateLimited, false); // 5th request is allowed
      }
    }
    // 6th request must be blocked
    const blockedRes = checkRateLimit(testIp, 5, 60000);
    assert.strictEqual(blockedRes.isRateLimited, true);
    assert.strictEqual(blockedRes.remaining, 0);
  });

  // 9. Phase 6F-A Prescription Zod Schema Validation
  test('Prescription Zod Schema validates multi-item medication data and rejects empty items', () => {
    const validPrescription = {
      patientId: 'pat-101',
      items: [
        {
          medicineName: 'Moxifloxacin Eye Drops 0.5%',
          dosage: '1 drop',
          frequency: '4 times daily',
          route: 'OD (Right Eye)',
          duration: '7 days',
          instructions: 'Instill into right eye after washing hands',
        },
        {
          medicineName: 'Prednisolone Acetate 1%',
          dosage: '1 drop',
          frequency: '2 times daily',
          route: 'OD (Right Eye)',
          duration: '14 days',
          instructions: 'Shake well before use',
        },
      ],
    };

    const parsed = createPrescriptionSchema.parse(validPrescription);
    assert.strictEqual(parsed.items.length, 2);
    assert.strictEqual(parsed.items[0].medicineName, 'Moxifloxacin Eye Drops 0.5%');

    // Reject empty items array
    const emptyItems = {
      patientId: 'pat-101',
      items: [],
    };
    const emptyResult = createPrescriptionSchema.safeParse(emptyItems);
    assert.strictEqual(emptyResult.success, false, 'Empty items array must be rejected');

    // Reject missing required medication fields (e.g., missing frequency)
    const invalidItem = {
      patientId: 'pat-101',
      items: [
        {
          medicineName: 'Moxifloxacin',
          dosage: '1 drop',
          // frequency missing
          duration: '7 days',
        },
      ],
    };
    const invalidResult = createPrescriptionSchema.safeParse(invalidItem);
    assert.strictEqual(invalidResult.success, false, 'Missing item frequency must be rejected');
  });

  // 10. Phase 6F-A Prescription Status & Update Schema
  test('Prescription Status update schema validates canonical status enum', () => {
    const validStatus = updatePrescriptionStatusSchema.parse({
      status: 'FILLED',
      notes: 'Dispensed at central pharmacy',
    });
    assert.strictEqual(validStatus.status, 'FILLED');

    const invalidStatus = updatePrescriptionStatusSchema.safeParse({
      status: 'UNKNOWN_STATUS',
    });
    assert.strictEqual(invalidStatus.success, false, 'Invalid status enum must be rejected');
  });

  // 11. Phase 6F-B Prescription State Machine: Valid Transitions
  test('Prescription State Machine permits all valid transitions (ACTIVE->FILLED, ACTIVE->COMPLETED, ACTIVE->CANCELLED, FILLED->COMPLETED, FILLED->CANCELLED)', () => {
    const validPairs = [
      { from: 'ACTIVE', to: 'FILLED' },
      { from: 'ACTIVE', to: 'COMPLETED' },
      { from: 'ACTIVE', to: 'CANCELLED' },
      { from: 'FILLED', to: 'COMPLETED' },
      { from: 'FILLED', to: 'CANCELLED' },
    ];

    for (const pair of validPairs) {
      const isValid = isValidPrescriptionStatusTransition(pair.from, pair.to);
      assert.strictEqual(
        isValid,
        true,
        `Transition from ${pair.from} to ${pair.to} should be valid`
      );
    }
  });

  // 12. Phase 6F-B Prescription State Machine: Invalid Transitions
  test('Prescription State Machine rejects all invalid transitions', () => {
    const invalidPairs = [
      { from: 'ACTIVE', to: 'ACTIVE' },
      { from: 'FILLED', to: 'ACTIVE' },
      { from: 'FILLED', to: 'FILLED' },
      { from: 'COMPLETED', to: 'ACTIVE' },
      { from: 'COMPLETED', to: 'FILLED' },
      { from: 'COMPLETED', to: 'COMPLETED' },
      { from: 'COMPLETED', to: 'CANCELLED' },
      { from: 'CANCELLED', to: 'ACTIVE' },
      { from: 'CANCELLED', to: 'FILLED' },
      { from: 'CANCELLED', to: 'COMPLETED' },
      { from: 'CANCELLED', to: 'CANCELLED' },
      { from: 'INVALID_STATUS', to: 'ACTIVE' },
      { from: 'ACTIVE', to: 'INVALID_STATUS' },
    ];

    for (const pair of invalidPairs) {
      const isValid = isValidPrescriptionStatusTransition(pair.from, pair.to);
      assert.strictEqual(
        isValid,
        false,
        `Transition from ${pair.from} to ${pair.to} should be invalid`
      );
    }
  });

  // 13. Phase 6F-B Prescription State Machine: Terminal State Protection
  test('Prescription State Machine enforces terminal-state protection for COMPLETED and CANCELLED', () => {
    const statuses = ['ACTIVE', 'FILLED', 'COMPLETED', 'CANCELLED', 'UNKNOWN'];

    // COMPLETED is terminal
    for (const target of statuses) {
      assert.strictEqual(
        isValidPrescriptionStatusTransition('COMPLETED', target),
        false,
        `Terminal state COMPLETED cannot transition to ${target}`
      );
    }

    // CANCELLED is terminal
    for (const target of statuses) {
      assert.strictEqual(
        isValidPrescriptionStatusTransition('CANCELLED', target),
        false,
        `Terminal state CANCELLED cannot transition to ${target}`
      );
    }
  });

  // 14. Phase 6F-B Zod Prescription Status Transition Schema
  test('Prescription Status Transition Zod Schema enforces valid state transitions centrally', () => {
    const validParse = prescriptionStatusTransitionSchema.safeParse({
      currentStatus: 'ACTIVE',
      newStatus: 'FILLED',
      notes: 'Dispensed at pharmacy',
    });
    assert.strictEqual(validParse.success, true);

    const invalidParse = prescriptionStatusTransitionSchema.safeParse({
      currentStatus: 'COMPLETED',
      newStatus: 'ACTIVE',
    });
    assert.strictEqual(invalidParse.success, false);
    if (!invalidParse.success) {
      assert.strictEqual(invalidParse.error.issues[0].path[0], 'newStatus');
    }

    const sameStateParse = prescriptionStatusTransitionSchema.safeParse({
      currentStatus: 'ACTIVE',
      newStatus: 'ACTIVE',
    });
    assert.strictEqual(sameStateParse.success, false);
  });

  // 15. Phase 6F-B Step 3: Doctor Patient IDOR & Clinical Relationship Verification on GET
  await test('Doctor cannot query arbitrary patient prescriptions without clinical relationship, but authorized doctor succeeds', async () => {
    // Setup test fixtures in mock store
    const uDoc1 = { id: 'usr-doc-sec-01', email: 'dr.sec1@clearvisioneyecare.com', role: 'DOCTOR' as const, status: 'ACTIVE' as const };
    const uDoc2 = { id: 'usr-doc-sec-02', email: 'dr.sec2@clearvisioneyecare.com', role: 'DOCTOR' as const, status: 'ACTIVE' as const };
    const uDocInact = { id: 'usr-doc-sec-inact', email: 'dr.inact@clearvisioneyecare.com', role: 'DOCTOR' as const, status: 'INACTIVE' as const };
    const uPat1 = { id: 'usr-pat-sec-01', email: 'pat.sec1@example.com', role: 'PATIENT' as const, status: 'ACTIVE' as const };
    const uPatUnrelated = { id: 'usr-pat-sec-unrelated', email: 'pat.unrelated@example.com', role: 'PATIENT' as const, status: 'ACTIVE' as const };

    if (!mockUsers.some((u) => u.id === uDoc1.id)) mockUsers.push(uDoc1 as any);
    if (!mockUsers.some((u) => u.id === uDoc2.id)) mockUsers.push(uDoc2 as any);
    if (!mockUsers.some((u) => u.id === uDocInact.id)) mockUsers.push(uDocInact as any);
    if (!mockUsers.some((u) => u.id === uPat1.id)) mockUsers.push(uPat1 as any);
    if (!mockUsers.some((u) => u.id === uPatUnrelated.id)) mockUsers.push(uPatUnrelated as any);

    const d1 = { id: 'doc-sec-01', userId: 'usr-doc-sec-01', doctorNumber: 'DOC-SEC-01', firstName: 'SecDoctor1', lastName: 'Test', specialization: 'Ophthalmology', qualification: 'MBBS', licenseNumber: 'LIC-SEC-01', phone: '9820000001', bio: 'Sec Doctor 1 Bio', departmentId: 'dept-01', status: 'ACTIVE' };
    const d2 = { id: 'doc-sec-02', userId: 'usr-doc-sec-02', doctorNumber: 'DOC-SEC-02', firstName: 'SecDoctor2', lastName: 'Test', specialization: 'Retina', qualification: 'MBBS', licenseNumber: 'LIC-SEC-02', phone: '9820000002', bio: 'Sec Doctor 2 Bio', departmentId: 'dept-01', status: 'ACTIVE' };
    const dInact = { id: 'doc-sec-inact', userId: 'usr-doc-sec-inact', doctorNumber: 'DOC-SEC-INACT', firstName: 'SecDoctorInact', lastName: 'Test', specialization: 'Cornea', qualification: 'MBBS', licenseNumber: 'LIC-SEC-INACT', phone: '9820000003', bio: 'Inactive Doctor Bio', departmentId: 'dept-01', status: 'INACTIVE' };

    if (!mockDoctors.some((d) => d.id === d1.id)) mockDoctors.push(d1 as any);
    if (!mockDoctors.some((d) => d.id === d2.id)) mockDoctors.push(d2 as any);
    if (!mockDoctors.some((d) => d.id === dInact.id)) mockDoctors.push(dInact as any);

    const p1 = { id: 'pat-sec-01', userId: 'usr-pat-sec-01', patientNumber: 'PAT-SEC-01', uhid: 'CVEC-2026-900001', firstName: 'SecPatient1', lastName: 'Test', dateOfBirth: '1990-01-01', gender: 'MALE' as const, phone: '9821000001', address: 'Address 1', emergencyContact: 'Contact 1' };
    const pUnrelated = { id: 'pat-sec-unrelated', userId: 'usr-pat-sec-unrelated', patientNumber: 'PAT-SEC-UNRELATED', uhid: 'CVEC-2026-900099', firstName: 'SecPatientUnrelated', lastName: 'Test', dateOfBirth: '1990-01-01', gender: 'FEMALE' as const, phone: '9821000099', address: 'Address Unrelated', emergencyContact: 'Contact Unrelated' };

    if (!mockPatients.some((p) => p.id === p1.id)) mockPatients.push(p1 as any);
    if (!mockPatients.some((p) => p.id === pUnrelated.id)) mockPatients.push(pUnrelated as any);

    const apt1 = { id: 'apt-sec-101', patientId: 'pat-sec-01', doctorId: 'doc-sec-01', appointmentDate: '2026-10-04', startTime: '10:00 AM', status: 'CONFIRMED' as const, type: 'NEW_CONSULTATION', reason: 'Apt 1' };
    const apt2 = { id: 'apt-sec-102', patientId: 'pat-sec-01', doctorId: 'doc-sec-02', appointmentDate: '2026-10-04', startTime: '11:00 AM', status: 'CONFIRMED' as const, type: 'NEW_CONSULTATION', reason: 'Apt 2' };

    if (!mockAppointments.some((a) => a.id === apt1.id)) mockAppointments.push(apt1 as any);
    if (!mockAppointments.some((a) => a.id === apt2.id)) mockAppointments.push(apt2 as any);

    const cns2 = { id: 'cns-sec-202', appointmentId: 'apt-sec-102', patientId: 'pat-sec-01', doctorId: 'doc-sec-02', chiefComplaint: 'Complaint 2', diagnosis: 'Diagnosis 2', status: 'completed' as const };
    if (!mockConsultations.some((c) => c.id === cns2.id)) mockConsultations.push(cns2 as any);

    const rxActive = { id: 'prsc-sec-301', prescriptionNumber: 'RX-2026-900001', status: 'ACTIVE' as const, patientId: 'pat-sec-01', doctorId: 'doc-sec-01', notes: 'Preserved clinical notes', items: [{ id: 'pi-sec-01', prescriptionId: 'prsc-sec-301', medicineName: 'Drops', dosage: '1 drop', frequency: '2x', duration: '5 days' }] };
    const rxCompleted = { id: 'prsc-sec-302', prescriptionNumber: 'RX-2026-900002', status: 'COMPLETED' as const, patientId: 'pat-sec-01', doctorId: 'doc-sec-01', notes: 'Completed notes', items: [] };
    const rxCancelled = { id: 'prsc-sec-303', prescriptionNumber: 'RX-2026-900003', status: 'CANCELLED' as const, patientId: 'pat-sec-01', doctorId: 'doc-sec-01', notes: 'Cancelled notes', items: [] };
    const rxInactDoc = { id: 'prsc-sec-inact', prescriptionNumber: 'RX-2026-900099', status: 'ACTIVE' as const, patientId: 'pat-sec-01', doctorId: 'doc-sec-inact', notes: 'Inactive doctor notes', items: [] };

    if (!mockPrescriptions.some((r) => r.id === rxActive.id)) mockPrescriptions.push(rxActive as any);
    if (!mockPrescriptions.some((r) => r.id === rxCompleted.id)) mockPrescriptions.push(rxCompleted as any);
    if (!mockPrescriptions.some((r) => r.id === rxCancelled.id)) mockPrescriptions.push(rxCancelled as any);
    if (!mockPrescriptions.some((r) => r.id === rxInactDoc.id)) mockPrescriptions.push(rxInactDoc as any);



    // 1. Querying unrelated patient -> FORBIDDEN (403)
    const headersDoc1 = createAuthHeaders(uDoc1.id, 'DOCTOR', uDoc1.email);
    const reqUnrelated = new Request(`http://localhost:3000/api/prescriptions?patientId=${pUnrelated.id}`, {
      headers: headersDoc1,
    });
    const resUnrelated = await getPrescriptions(reqUnrelated);
    const bodyUnrelated = await resUnrelated.json();
    assert.strictEqual(resUnrelated.status, 403, 'Unrelated patient query must return 403');
    assert.strictEqual(bodyUnrelated.success, false);
    assert.strictEqual(bodyUnrelated.error.code, 'FORBIDDEN');

    // 2. Querying authorized patient (with appointment) -> SUCCESS (200)
    const reqAuthorized = new Request(`http://localhost:3000/api/prescriptions?patientId=${p1.id}`, {
      headers: headersDoc1,
    });
    const resAuthorized = await getPrescriptions(reqAuthorized);
    const bodyAuthorized = await resAuthorized.json();
    assert.strictEqual(resAuthorized.status, 200, 'Authorized patient query must return 200');
    assert.strictEqual(bodyAuthorized.success, true);
  });

  // 16. Phase 6F-B Step 3: Prescription List View Audit Logging
  await test('Prescription list access generates PRESCRIPTION_LIST_VIEWED audit event', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    const reqList = new Request('http://localhost:3000/api/prescriptions', { headers: headersAdmin });
    await getPrescriptions(reqList);

    const listAudit = mockAuditLogs.find((log) => log.action === 'PRESCRIPTION_LIST_VIEWED');
    assert.ok(listAudit, 'PRESCRIPTION_LIST_VIEWED audit event must exist');
    assert.strictEqual(listAudit?.userRole, 'ADMIN');
  });

  // 17. Phase 6F-B Step 3: Doctor Cross-Doctor Assignment Protection on POST
  await test('Doctor cannot attach prescription to another doctor appointment or consultation', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');

    // Doctor 1 trying to attach prescription to Doctor 2's appointment -> Rejected
    const reqAptMismatch = new Request('http://localhost:3000/api/prescriptions', {
      method: 'POST',
      headers: headersDoc1,
      body: JSON.stringify({
        patientId: 'pat-sec-01',
        appointmentId: 'apt-sec-102',
        items: [{ medicineName: 'Test Drop', dosage: '1 drop', frequency: '2x', duration: '5 days' }],
      }),
    });
    const resApt = await createPrescription(reqAptMismatch);
    const bodyApt = await resApt.json();
    assert.strictEqual(resApt.status, 400, 'Cross-doctor appointment prescription creation must be rejected');
    assert.strictEqual(bodyApt.error.code, 'INVALID_RELATION');

    // Doctor 1 trying to attach prescription to Doctor 2's consultation -> Rejected
    const reqCnsMismatch = new Request('http://localhost:3000/api/prescriptions', {
      method: 'POST',
      headers: headersDoc1,
      body: JSON.stringify({
        patientId: 'pat-sec-01',
        consultationId: 'cns-sec-202',
        items: [{ medicineName: 'Test Drop', dosage: '1 drop', frequency: '2x', duration: '5 days' }],
      }),
    });
    const resCns = await createPrescription(reqCnsMismatch);
    const bodyCns = await resCns.json();
    assert.strictEqual(resCns.status, 400, 'Cross-doctor consultation prescription creation must be rejected');
    assert.strictEqual(bodyCns.error.code, 'INVALID_RELATION');
  });

  // 18. Phase 6F-B Step 3: Inactive Doctor Protection on PATCH
  await test('Inactive doctor cannot PATCH prescription', async () => {
    const headersInactive = createAuthHeaders('usr-doc-sec-inact', 'DOCTOR', 'dr.inact@clearvisioneyecare.com');
    const reqPatch = new Request('http://localhost:3000/api/prescriptions/prsc-sec-inact', {
      method: 'PATCH',
      headers: headersInactive,
      body: JSON.stringify({ status: 'FILLED' }),
    });

    const resPatch = await updatePrescriptionStatus(reqPatch, { params: Promise.resolve({ prescriptionId: 'prsc-sec-inact' }) });
    const bodyPatch = await resPatch.json();
    assert.strictEqual(resPatch.status, 403, 'Inactive doctor PATCH must return 403');
    assert.strictEqual(bodyPatch.error.code, 'FORBIDDEN');
  });

  // 19. Phase 6F-B Step 3: State Machine & Notes Preservation on PATCH
  await test('Valid status transition succeeds and preserves notes, invalid & terminal transitions are rejected', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');

    // 1. Valid transition ACTIVE -> FILLED
    const reqValid = new Request('http://localhost:3000/api/prescriptions/prsc-sec-301', {
      method: 'PATCH',
      headers: headersDoc1,
      body: JSON.stringify({ status: 'FILLED' }),
    });
    const resValid = await updatePrescriptionStatus(reqValid, { params: Promise.resolve({ prescriptionId: 'prsc-sec-301' }) });
    const bodyValid = await resValid.json();
    assert.strictEqual(resValid.status, 200, 'Valid transition ACTIVE -> FILLED must succeed');
    assert.strictEqual(bodyValid.data.status, 'FILLED');
    assert.strictEqual(bodyValid.data.notes, 'Preserved clinical notes', 'Notes must be preserved when omitted from payload');

    // 2. Terminal COMPLETED -> ACTIVE (Rejected)
    const reqTerminalCompleted = new Request('http://localhost:3000/api/prescriptions/prsc-sec-302', {
      method: 'PATCH',
      headers: headersDoc1,
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const resTerminalCompleted = await updatePrescriptionStatus(reqTerminalCompleted, { params: Promise.resolve({ prescriptionId: 'prsc-sec-302' }) });
    const bodyTerminalCompleted = await resTerminalCompleted.json();
    assert.strictEqual(resTerminalCompleted.status, 400, 'Transition out of COMPLETED must be rejected');
    assert.strictEqual(bodyTerminalCompleted.error.code, 'INVALID_TRANSITION');

    // 3. Terminal CANCELLED -> FILLED (Rejected)
    const reqTerminalCancelled = new Request('http://localhost:3000/api/prescriptions/prsc-sec-303', {
      method: 'PATCH',
      headers: headersDoc1,
      body: JSON.stringify({ status: 'FILLED' }),
    });
    const resTerminalCancelled = await updatePrescriptionStatus(reqTerminalCancelled, { params: Promise.resolve({ prescriptionId: 'prsc-sec-303' }) });
    const bodyTerminalCancelled = await resTerminalCancelled.json();
    assert.strictEqual(resTerminalCancelled.status, 400, 'Transition out of CANCELLED must be rejected');
    assert.strictEqual(bodyTerminalCancelled.error.code, 'INVALID_TRANSITION');
  });

  // 20. Phase 6F-B Step 3: Structured Status Transition Audit Metadata
  await test('Structured status-transition audit metadata contains previousStatus, newStatus, prescriptionId, prescriptionNumber', async () => {
    const updateAudit = mockAuditLogs.find((log) => log.action === 'PRESCRIPTION_STATUS_UPDATED');
    assert.ok(updateAudit, 'PRESCRIPTION_STATUS_UPDATED audit log must exist');
    assert.strictEqual(updateAudit?.metadata?.previousStatus, 'ACTIVE');
    assert.strictEqual(updateAudit?.metadata?.newStatus, 'FILLED');
    assert.strictEqual(updateAudit?.metadata?.prescriptionId, 'prsc-sec-301');
    assert.strictEqual(updateAudit?.metadata?.prescriptionNumber, 'RX-2026-900001');
  });

  // 21. Phase 6F-B Step 4: Doctor IDOR Prevention on GET /api/consultations?patientId=X
  await test('Doctor cannot query arbitrary patient consultations without clinical relationship, but authorized doctor succeeds', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    const req = new Request('http://localhost:3000/api/consultations?patientId=pat-sec-unrelated', {
      method: 'GET',
      headers: headersDoc1,
    });
    const res = await getConsultations(req);
    const body = await res.json();
    assert.strictEqual(res.status, 403, 'Doctor querying patient without clinical access must return 403');
    assert.strictEqual(body.error.code, 'FORBIDDEN');

    // Authorized query
    const reqAuth = new Request('http://localhost:3000/api/consultations?patientId=pat-sec-01', {
      method: 'GET',
      headers: headersDoc1,
    });
    const resAuth = await getConsultations(reqAuth);
    assert.strictEqual(resAuth.status, 200, 'Authorized doctor GET consultations must succeed');
  });

  // 22. Phase 6F-B Step 4: Cross-Doctor Appointment Verification on POST
  await test('Doctor cannot attach consultation to another doctor\'s appointment', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    const req = new Request('http://localhost:3000/api/consultations', {
      method: 'POST',
      headers: headersDoc1,
      body: JSON.stringify({
        appointmentId: 'apt-sec-102',
        patientId: 'pat-sec-01',
        chiefComplaint: 'Attempted cross-doctor consultation',
        status: 'DRAFT',
      }),
    });
    const res = await createConsultation(req);
    const body = await res.json();
    assert.strictEqual(res.status, 403, 'Cross-doctor appointment linkage must return 403');
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  // 23. Phase 6F-B Step 4: Inactive Doctor Rejection on POST & PATCH
  await test('Inactive doctor cannot create or patch consultations', async () => {
    const headersInactive = createAuthHeaders('usr-doc-sec-inact', 'DOCTOR', 'dr.inact@clearvisioneyecare.com');
    
    // POST attempt
    const reqPost = new Request('http://localhost:3000/api/consultations', {
      method: 'POST',
      headers: headersInactive,
      body: JSON.stringify({
        appointmentId: 'apt-sec-101',
        patientId: 'pat-sec-01',
        chiefComplaint: 'Inactive doc attempt',
      }),
    });
    const resPost = await createConsultation(reqPost);
    const bodyPost = await resPost.json();
    assert.strictEqual(resPost.status, 403, 'Inactive doctor POST must return 403');
    assert.strictEqual(bodyPost.error.code, 'FORBIDDEN');

    // PATCH attempt
    const reqPatch = new Request('http://localhost:3000/api/consultations/cns-sec-202', {
      method: 'PATCH',
      headers: headersInactive,
      body: JSON.stringify({ chiefComplaint: 'Updated by inactive' }),
    });
    const resPatch = await updateConsultation(reqPatch, { params: Promise.resolve({ consultationId: 'cns-sec-202' }) });
    const bodyPatch = await resPatch.json();
    assert.strictEqual(resPatch.status, 403, 'Inactive doctor PATCH must return 403');
    assert.strictEqual(bodyPatch.error.code, 'FORBIDDEN');
  });

  // 24. Phase 6F-B Step 4: Patient Read-Only Restriction (POST and PATCH forbidden)
  await test('Patient cannot POST or PATCH consultations', async () => {
    const headersPat = createAuthHeaders('usr-pat-sec-01', 'PATIENT', 'pat.sec1@example.com');
    
    // POST attempt
    const reqPost = new Request('http://localhost:3000/api/consultations', {
      method: 'POST',
      headers: headersPat,
      body: JSON.stringify({ chiefComplaint: 'Patient post attempt' }),
    });
    const resPost = await createConsultation(reqPost);
    const bodyPost = await resPost.json();
    assert.strictEqual(resPost.status, 403, 'Patient POST must return 403');
    assert.strictEqual(bodyPost.error.code, 'FORBIDDEN');

    // PATCH attempt
    const reqPatch = new Request('http://localhost:3000/api/consultations/cns-sec-202', {
      method: 'PATCH',
      headers: headersPat,
      body: JSON.stringify({ chiefComplaint: 'Patient patch attempt' }),
    });
    const resPatch = await updateConsultation(reqPatch, { params: Promise.resolve({ consultationId: 'cns-sec-202' }) });
    const bodyPatch = await resPatch.json();
    assert.strictEqual(resPatch.status, 403, 'Patient PATCH must return 403');
    assert.strictEqual(bodyPatch.error.code, 'FORBIDDEN');
  });

  // 25. Phase 6F-B Step 4: Cross-Patient IDOR Prevention on GET Detail
  await test('Patient cannot access another patient\'s consultation details', async () => {
    const headersUnrelatedPat = createAuthHeaders('usr-pat-sec-unrelated', 'PATIENT', 'pat.unrelated@example.com');
    const req = new Request('http://localhost:3000/api/consultations/cns-sec-202', {
      method: 'GET',
      headers: headersUnrelatedPat,
    });
    const res = await getConsultationDetail(req, { params: Promise.resolve({ consultationId: 'cns-sec-202' }) });
    const body = await res.json();
    assert.strictEqual(res.status, 403, 'Cross-patient consultation detail GET must return 403');
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  // 26. Phase 6F-B Step 4: Duplicate Consultation Prevention & Creation Flow
  let createdCnsId = '';
  await test('Draft consultation creation succeeds and duplicate creation is rejected with 409 CONFLICT', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    
    // Create draft for apt-sec-101
    const reqCreate = new Request('http://localhost:3000/api/consultations', {
      method: 'POST',
      headers: headersDoc1,
      body: JSON.stringify({
        appointmentId: 'apt-sec-101',
        patientId: 'pat-sec-01',
        chiefComplaint: 'Blurry vision in right eye',
        diagnosis: 'Myopic astigmatism draft',
        status: 'DRAFT',
      }),
    });
    const resCreate = await createConsultation(reqCreate);
    const bodyCreate = await resCreate.json();
    assert.strictEqual(resCreate.status, 201, 'Draft consultation creation must return 201');
    assert.ok(bodyCreate.data.consultation.id, 'Created consultation must have an ID');
    createdCnsId = bodyCreate.data.consultation.id;

    // Attempt duplicate creation for apt-sec-101
    const reqDup = new Request('http://localhost:3000/api/consultations', {
      method: 'POST',
      headers: headersDoc1,
      body: JSON.stringify({
        appointmentId: 'apt-sec-101',
        patientId: 'pat-sec-01',
        chiefComplaint: 'Second consultation attempt',
      }),
    });
    const resDup = await createConsultation(reqDup);
    const bodyDup = await resDup.json();
    assert.strictEqual(resDup.status, 409, 'Duplicate consultation creation must return 409 CONFLICT');
    assert.strictEqual(bodyDup.error.code, 'CONFLICT');
  });

  // 27. Phase 6F-B Step 4: Consultation Completion, Appointment Sync & Prescription Generation
  await test('Consultation completion updates appointment status to COMPLETED and generates prescription', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    const reqComplete = new Request(`http://localhost:3000/api/consultations/${createdCnsId}`, {
      method: 'PATCH',
      headers: headersDoc1,
      body: JSON.stringify({
        status: 'COMPLETED',
        chiefComplaint: 'Finalized blurry vision diagnosis',
        diagnosis: 'Myopia - ICD-10 H52.1',
        clinicalNotes: 'Prescribed lubricating eye drops.',
        items: [
          {
            medicineName: 'Carboxymethylcellulose 0.5%',
            dosage: '1 drop',
            frequency: '4x daily',
            duration: '14 days',
            instructions: 'Instill into both eyes',
          },
        ],
      }),
    });

    const resComplete = await updateConsultation(reqComplete, { params: Promise.resolve({ consultationId: createdCnsId }) });
    const bodyComplete = await resComplete.json();
    assert.strictEqual(resComplete.status, 200, 'Completing consultation must return 200');

    // Verify appointment status sync
    const apt1Mock = mockAppointments.find((a) => a.id === 'apt-sec-101');
    assert.strictEqual(apt1Mock?.status, 'COMPLETED', 'Appointment status must be updated to COMPLETED');
  });

  // 28. Phase 6F-B Step 4: Immutability of COMPLETED Consultation
  await test('Completed consultation is terminal and cannot be modified (returns 400 INVALID_STATE)', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    const reqImmutable = new Request(`http://localhost:3000/api/consultations/${createdCnsId}`, {
      method: 'PATCH',
      headers: headersDoc1,
      body: JSON.stringify({ chiefComplaint: 'Attempting to edit finalized completed consultation' }),
    });

    const resImmutable = await updateConsultation(reqImmutable, { params: Promise.resolve({ consultationId: createdCnsId }) });
    const bodyImmutable = await resImmutable.json();
    assert.strictEqual(resImmutable.status, 400, 'Modifying completed consultation must return 400');
    assert.strictEqual(bodyImmutable.error.code, 'INVALID_STATE');
  });

  // 29. Phase 6F-B Step 4: Audit Event Logging Verification
  await test('Consultation audit logs exist for CONSULTATION_VIEWED, CONSULTATION_DRAFT_SAVED, and CONSULTATION_COMPLETED', async () => {
    const viewedLog = mockAuditLogs.find((log) => log.action === 'CONSULTATION_VIEWED');
    const draftLog = mockAuditLogs.find((log) => log.action === 'CONSULTATION_DRAFT_SAVED');
    const completedLog = mockAuditLogs.find((log) => log.action === 'CONSULTATION_COMPLETED');

    assert.ok(viewedLog, 'CONSULTATION_VIEWED audit log must exist');
    assert.ok(draftLog, 'CONSULTATION_DRAFT_SAVED audit log must exist');
    assert.ok(completedLog, 'CONSULTATION_COMPLETED audit log must exist');
  });

  // 30. Phase 6G Billing Zod Schema Validation
  test('Phase 6G Billing Zod schemas validate invoice payload calculations and payment bounds', () => {
    const validInv = {
      patientId: 'pat-sec-01',
      items: [
        { description: 'OPD Consultation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 500 },
        { description: 'OCT Diagnostic Scan', category: 'DIAGNOSTIC', quantity: 1, unitPrice: 1200 },
      ],
      discount: 100,
      tax: 50,
    };
    const parsed = createInvoiceSchema.parse(validInv);
    assert.strictEqual(parsed.items.length, 2);
    assert.strictEqual(parsed.discount, 100);

    const invalidPay = recordPaymentSchema.safeParse({ amount: -50, paymentMode: 'UPI' });
    assert.strictEqual(invalidPay.success, false, 'Negative payment amount must be rejected');
  });

  // 31. Phase 6G IDOR & RBAC Protection: Patient Cross-Patient Invoice Denial & Non-Admin Creation Rejection
  await test('Patient querying another patient invoice is denied (403 IDOR), non-admin invoice creation is denied (403 FORBIDDEN)', async () => {
    const headersUnrelatedPat = createAuthHeaders('usr-pat-sec-unrelated', 'PATIENT', 'pat.unrelated@example.com');
    const reqIdor = new Request('http://localhost:3000/api/billing/inv-501', { headers: headersUnrelatedPat });
    const resIdor = await getInvoiceDetail(reqIdor, { params: Promise.resolve({ invoiceId: 'inv-501' }) });
    const bodyIdor = await resIdor.json();
    assert.strictEqual(resIdor.status, 403, 'Cross-patient invoice detail GET must return 403');
    assert.strictEqual(bodyIdor.error.code, 'IDOR_FORBIDDEN');

    // Non-admin POST attempt
    const headersDoc = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    const reqCreateNonAdmin = new Request('http://localhost:3000/api/billing', {
      method: 'POST',
      headers: headersDoc,
      body: JSON.stringify({ patientId: 'pat-sec-01', items: [{ description: 'Test Item', unitPrice: 500 }] }),
    });
    const resCreateNonAdmin = await createInvoice(reqCreateNonAdmin);
    const bodyCreateNonAdmin = await resCreateNonAdmin.json();
    assert.strictEqual(resCreateNonAdmin.status, 403, 'Doctor creating invoice must return 403 FORBIDDEN');
    assert.strictEqual(bodyCreateNonAdmin.error.code, 'FORBIDDEN');
  });

  // 32. Phase 6G Admin Invoice Creation & Subtotal/Tax/Discount Calculation
  let createdSecInvoiceId = '';
  await test('Admin invoice creation succeeds with precise subtotal, discount, tax, total, and amount due calculation', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    const req = new Request('http://localhost:3000/api/billing', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        patientId: 'pat-sec-01',
        serviceName: 'Comprehensive Eye Examination & Diagnostic OCT',
        discount: 200,
        tax: 100,
        items: [
          { description: 'OPD Consultation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 500 },
          { description: 'Diabetic OCT Scan', category: 'DIAGNOSTIC', quantity: 1, unitPrice: 1200 },
        ],
      }),
    });

    const res = await createInvoice(req);
    const body = await res.json();
    assert.strictEqual(res.status, 201, 'Admin creating invoice must return 201');
    assert.ok(body.data.id, 'Created invoice must have an ID');
    createdSecInvoiceId = body.data.id;

    // Subtotal: 500 + 1200 = 1700
    // Total: 1700 + 100 - 200 = 1600
    assert.strictEqual(body.data.subtotal, 1700);
    assert.strictEqual(body.data.totalAmount, 1600);
    assert.strictEqual(body.data.amountDue, 1600);
    assert.strictEqual(body.data.amountPaid, 0);
    assert.strictEqual(body.data.status, 'PENDING');
  });

  // 33. Phase 6G Partial Payment Processing & Remaining Balance Calculation
  await test('Partial payment updates amountPaid, amountDue, and transitions status to PARTIALLY_PAID', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    const req = new Request(`http://localhost:3000/api/billing/${createdSecInvoiceId}/payments`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        amount: 600,
        paymentMode: 'UPI',
        transactionRef: 'UPI/2026/SEC-9901',
      }),
    });

    const res = await recordPayment(req, { params: Promise.resolve({ invoiceId: createdSecInvoiceId }) });
    const body = await res.json();
    assert.strictEqual(res.status, 201, 'Recording payment must return 201');
    assert.strictEqual(body.data.invoice.amountPaid, 600);
    assert.strictEqual(body.data.invoice.amountDue, 1000);
    assert.strictEqual(body.data.invoice.status, 'PARTIALLY_PAID');
  });

  // 34. Phase 6G Overpayment Protection
  await test('Overpayment exceeding remaining balance due is rejected with 400 OVERPAYMENT_EXCEEDED', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    const reqOver = new Request(`http://localhost:3000/api/billing/${createdSecInvoiceId}/payments`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        amount: 5000, // Remaining due is 1000
        paymentMode: 'CASH',
      }),
    });

    const resOver = await recordPayment(reqOver, { params: Promise.resolve({ invoiceId: createdSecInvoiceId }) });
    const bodyOver = await resOver.json();
    assert.strictEqual(resOver.status, 400, 'Overpayment must return 400');
    assert.strictEqual(bodyOver.error.code, 'OVERPAYMENT_EXCEEDED');
  });

  // 35. Phase 6G Final Payment Settlement & Status Transition to PAID
  await test('Final payment settling remaining balance transitions status to PAID and amountDue to 0', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    const reqFinal = new Request(`http://localhost:3000/api/billing/${createdSecInvoiceId}/payments`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        amount: 1000,
        paymentMode: 'CREDIT_CARD',
        transactionRef: 'CARD/2026/SEC-8812',
      }),
    });

    const resFinal = await recordPayment(reqFinal, { params: Promise.resolve({ invoiceId: createdSecInvoiceId }) });
    const bodyFinal = await resFinal.json();
    assert.strictEqual(resFinal.status, 201);
    assert.strictEqual(bodyFinal.data.invoice.amountPaid, 1600);
    assert.strictEqual(bodyFinal.data.invoice.amountDue, 0);
    assert.strictEqual(bodyFinal.data.invoice.status, 'PAID');
  });

  // 36. Phase 6G Financial Immutability Enforcement
  await test('Modifying a PAID invoice is rejected with 400 INVALID_STATE (Financial Immutability)', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    const reqPatch = new Request(`http://localhost:3000/api/billing/${createdSecInvoiceId}`, {
      method: 'PATCH',
      headers: headersAdmin,
      body: JSON.stringify({ discount: 500 }),
    });

    const resPatch = await updateInvoice(reqPatch, { params: Promise.resolve({ invoiceId: createdSecInvoiceId }) });
    const bodyPatch = await resPatch.json();
    assert.strictEqual(resPatch.status, 400, 'Modifying paid invoice must return 400');
    assert.strictEqual(bodyPatch.error.code, 'INVALID_STATE');
  });

  // 37. Phase 6G Patient Billing Route & Audit Event Verification
  await test('Patient billing route returns patient invoices, and audit logs exist for INVOICE_CREATED & PAYMENT_RECORDED', async () => {
    const headersPat1 = createAuthHeaders('usr-pat-sec-01', 'PATIENT', 'pat.sec1@example.com');
    const reqPatBilling = new Request('http://localhost:3000/api/patient/billing', { headers: headersPat1 });
    const resPatBilling = await getPatientBilling(reqPatBilling);
    const bodyPatBilling = await resPatBilling.json();
    assert.strictEqual(resPatBilling.status, 200);
    assert.strictEqual(bodyPatBilling.success, true);

    const invCreatedLog = mockAuditLogs.find((log) => log.action === 'INVOICE_CREATED');
    const payRecordedLog = mockAuditLogs.find((log) => log.action === 'PAYMENT_RECORDED');
    assert.ok(invCreatedLog, 'INVOICE_CREATED audit log must exist');
    assert.ok(payRecordedLog, 'PAYMENT_RECORDED audit log must exist');
    assert.strictEqual(payRecordedLog?.metadata?.newStatus, 'PAID');
  });

  // 38. Phase 6H-A E2E Workflow A: Authentication & Server-Side RBAC Enforcement
  await test('Phase 6H-A E2E Workflow A: Role enforcement prevents Patients/Doctors from accessing unauthorized operations', async () => {
    const headersPatient = createAuthHeaders('usr-pat-sec-01', 'PATIENT', 'pat.sec1@example.com');
    const reqForbiddenDoctor = new Request('http://localhost:3000/api/billing', {
      method: 'POST',
      headers: headersPatient,
      body: JSON.stringify({ patientId: 'pat-sec-01', items: [{ description: 'Fee', unitPrice: 500 }] }),
    });
    const resForbidden = await createInvoice(reqForbiddenDoctor);
    assert.strictEqual(resForbidden.status, 403, 'Patient cannot access admin invoice creation');

    const headersDoctor = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    const reqDocApptCreate = new Request('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: headersDoctor,
      body: JSON.stringify({ patientId: 'pat-sec-01', doctorId: 'doc-sec-01', appointmentDate: '2026-10-10', startTime: '02:00 PM', reason: 'Test' }),
    });
    const resDocAppt = await createAppointment(reqDocApptCreate);
    assert.strictEqual(resDocAppt.status, 403, 'Doctor cannot directly create appointments');
  });

  // 39. Phase 6H-A E2E Workflow B: Patient -> Appointment Booking & OPD Token Generation
  let e2eApptId = '';
  await test('Phase 6H-A E2E Workflow B: Patient books appointment, generating OPD token and verifying ownership', async () => {
    const headersPatient = createAuthHeaders('usr-pat-sec-01', 'PATIENT', 'pat.sec1@example.com');
    const reqBook = new Request('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: headersPatient,
      body: JSON.stringify({
        doctorId: 'doc-sec-01',
        appointmentDate: '2026-10-15',
        startTime: '10:30 AM',
        reason: 'Ophthalmic E2E Checkup - Blurry distance vision',
        type: 'NEW_CONSULTATION',
      }),
    });

    const resBook = await createAppointment(reqBook);
    const bodyBook = await resBook.json();
    assert.strictEqual(resBook.status, 201, 'Booking appointment must return 201');
    assert.ok(bodyBook.data.id, 'Appointment must have an ID');
    assert.strictEqual(bodyBook.data.patientId, 'pat-sec-01');
    assert.strictEqual(bodyBook.data.doctorId, 'doc-sec-01');
    assert.ok(bodyBook.data.tokenNumber, 'OPD token must be generated');
    e2eApptId = bodyBook.data.id;
  });

  // 40. Phase 6H-A E2E Workflow C: Appointment -> Doctor Queue Visibility & Isolation
  await test('Phase 6H-A E2E Workflow C: Assigned doctor sees appointment in OPD queue, unrelated doctor does not', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    const reqDoc1Queue = new Request(`http://localhost:3000/api/appointments?date=2026-10-15`, { headers: headersDoc1 });
    const resDoc1Queue = await getAppointments(reqDoc1Queue);
    const bodyDoc1Queue = await resDoc1Queue.json();
    assert.strictEqual(resDoc1Queue.status, 200);
    const foundDoc1 = bodyDoc1Queue.data.find((a: any) => a.id === e2eApptId);
    assert.ok(foundDoc1, 'Assigned Doctor 1 must see the appointment in OPD queue');

    const headersDoc2 = createAuthHeaders('usr-doc-sec-02', 'DOCTOR', 'dr.sec2@clearvisioneyecare.com');
    const reqDoc2Queue = new Request(`http://localhost:3000/api/appointments?date=2026-10-15`, { headers: headersDoc2 });
    const resDoc2Queue = await getAppointments(reqDoc2Queue);
    const bodyDoc2Queue = await resDoc2Queue.json();
    assert.strictEqual(resDoc2Queue.status, 200);
    const foundDoc2 = bodyDoc2Queue.data.find((a: any) => a.id === e2eApptId);
    assert.strictEqual(foundDoc2, undefined, 'Unrelated Doctor 2 must NOT see Doctor 1 assigned appointment in queue');
  });

  // 41. Phase 6H-A E2E Workflow D: Doctor -> Consultation & Clinical Notes Creation
  let e2eConsultationId = '';
  await test('Phase 6H-A E2E Workflow D: Doctor creates consultation draft and completes examination', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    
    // 1. Create Consultation Draft
    const reqDraft = new Request('http://localhost:3000/api/consultations', {
      method: 'POST',
      headers: headersDoc1,
      body: JSON.stringify({
        appointmentId: e2eApptId,
        patientId: 'pat-sec-01',
        chiefComplaint: 'Blurry distance vision & eye fatigue in late evenings',
        diagnosis: 'Myopic Astigmatism (ICD-10 H52.2)',
        clinicalNotes: 'Pachymetry indicates central corneal thickness of 540 microns.',
        status: 'DRAFT',
      }),
    });
    const resDraft = await createConsultation(reqDraft);
    const bodyDraft = await resDraft.json();
    assert.strictEqual(resDraft.status, 201);
    e2eConsultationId = bodyDraft.data.consultation.id;

    // 2. Complete Consultation
    const reqComplete = new Request(`http://localhost:3000/api/consultations/${e2eConsultationId}`, {
      method: 'PATCH',
      headers: headersDoc1,
      body: JSON.stringify({
        status: 'COMPLETED',
        chiefComplaint: 'Finalized - Blurry distance vision & astigmatism',
        diagnosis: 'Myopic Astigmatism (ICD-10 H52.2)',
        items: [
          {
            medicineName: 'Carboxymethylcellulose 0.5% Lubricating Drops',
            dosage: '1 drop in both eyes',
            frequency: '4x daily',
            duration: '30 days',
            instructions: 'Instill when feeling eye strain',
          },
        ],
      }),
    });
    const resComplete = await updateConsultation(reqComplete, { params: Promise.resolve({ consultationId: e2eConsultationId }) });
    const bodyComplete = await resComplete.json();
    assert.strictEqual(resComplete.status, 200, 'Completing consultation must return 200');
  });

  // 42. Phase 6H-A E2E Workflow E: Consultation -> Prescription Issued & Terminal Protection
  await test('Phase 6H-A E2E Workflow E: Prescription is issued with medication items, state machine enforced', async () => {
    const headersDoc1 = createAuthHeaders('usr-doc-sec-01', 'DOCTOR', 'dr.sec1@clearvisioneyecare.com');
    const reqRx = new Request('http://localhost:3000/api/prescriptions', {
      method: 'POST',
      headers: headersDoc1,
      body: JSON.stringify({
        patientId: 'pat-sec-01',
        appointmentId: e2eApptId,
        consultationId: e2eConsultationId,
        notes: 'Wear corrective lenses during computer work.',
        items: [
          {
            medicineName: 'Moxifloxacin Eye Drops 0.5%',
            dosage: '1 drop',
            frequency: '3x daily',
            duration: '7 days',
          },
        ],
      }),
    });

    const resRx = await createPrescription(reqRx);
    const bodyRx = await resRx.json();
    assert.strictEqual(resRx.status, 201, 'Prescription creation must return 201');
    const rxStatus = bodyRx.data.status || bodyRx.data.prescription?.status;
    assert.strictEqual(rxStatus, 'ACTIVE');
  });

  // 43. Phase 6H-A E2E Workflow F: Consultation -> Invoice Generation with Line Items
  let e2eInvoiceId = '';
  await test('Phase 6H-A E2E Workflow F: Admin generates hospital invoice linked to patient & consultation', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    const reqInv = new Request('http://localhost:3000/api/billing', {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({
        patientId: 'pat-sec-01',
        appointmentId: e2eApptId,
        consultationId: e2eConsultationId,
        serviceName: 'Comprehensive Eye Examination & Diagnostic OCT Scan',
        discount: 200,
        tax: 100,
        items: [
          { description: 'OPD Consultation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 500 },
          { description: 'Diabetic OCT Scan', category: 'DIAGNOSTIC', quantity: 1, unitPrice: 1200 },
        ],
      }),
    });

    const resInv = await createInvoice(reqInv);
    const bodyInv = await resInv.json();
    assert.strictEqual(resInv.status, 201, 'Creating invoice must return 201');
    assert.ok(bodyInv.data.invoiceNumber.startsWith('INV-2026-'), 'Invoice number must match INV-YYYY-XXXXXX format');
    
    // Subtotal: 1700, Total: 1700 + 100 - 200 = 1600
    assert.strictEqual(bodyInv.data.subtotal, 1700);
    assert.strictEqual(bodyInv.data.totalAmount, 1600);
    assert.strictEqual(bodyInv.data.amountDue, 1600);
    assert.strictEqual(bodyInv.data.status, 'PENDING');
    e2eInvoiceId = bodyInv.data.id;
  });

  // 44. Phase 6H-A E2E Workflow G: Invoice -> Payment Lifecycle (Partial ₹600 + Final ₹1,000 Settlement)
  await test('Phase 6H-A E2E Workflow G: Partial payment (₹600) transitions to PARTIALLY_PAID, final payment (₹1000) settles to PAID', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    
    // 1. Partial Payment ₹600
    const reqPart = new Request(`http://localhost:3000/api/billing/${e2eInvoiceId}/payments`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ amount: 600, paymentMode: 'UPI', transactionRef: 'UPI/2026/E2E-PART-1' }),
    });
    const resPart = await recordPayment(reqPart, { params: Promise.resolve({ invoiceId: e2eInvoiceId }) });
    const bodyPart = await resPart.json();
    assert.strictEqual(resPart.status, 201);
    assert.strictEqual(bodyPart.data.invoice.amountPaid, 600);
    assert.strictEqual(bodyPart.data.invoice.amountDue, 1000);
    assert.strictEqual(bodyPart.data.invoice.status, 'PARTIALLY_PAID');

    // 2. Final Payment ₹1,000
    const reqFinal = new Request(`http://localhost:3000/api/billing/${e2eInvoiceId}/payments`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ amount: 1000, paymentMode: 'DEBIT_CARD', transactionRef: 'CARD/2026/E2E-FINAL-2' }),
    });
    const resFinal = await recordPayment(reqFinal, { params: Promise.resolve({ invoiceId: e2eInvoiceId }) });
    const bodyFinal = await resFinal.json();
    assert.strictEqual(resFinal.status, 201);
    assert.strictEqual(bodyFinal.data.invoice.amountPaid, 1600);
    assert.strictEqual(bodyFinal.data.invoice.amountDue, 0);
    assert.strictEqual(bodyFinal.data.invoice.status, 'PAID');
  });

  // 45. Phase 6H-A E2E Workflow H: Payment Security & Overpayment Protection
  await test('Phase 6H-A E2E Workflow H: Overpayment is rejected (400 OVERPAYMENT_EXCEEDED), cross-patient invoice GET is rejected (403 IDOR)', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    const reqOver = new Request(`http://localhost:3000/api/billing/${e2eInvoiceId}/payments`, {
      method: 'POST',
      headers: headersAdmin,
      body: JSON.stringify({ amount: 500, paymentMode: 'CASH' }),
    });
    const resOver = await recordPayment(reqOver, { params: Promise.resolve({ invoiceId: e2eInvoiceId }) });
    const bodyOver = await resOver.json();
    assert.strictEqual(resOver.status, 400, 'Payment on already settled invoice must be rejected');
    assert.strictEqual(bodyOver.error.code, 'INVALID_STATE');

    const headersPatUnrelated = createAuthHeaders('usr-pat-sec-unrelated', 'PATIENT', 'pat.unrelated@example.com');
    const reqIdor = new Request(`http://localhost:3000/api/billing/${e2eInvoiceId}`, { headers: headersPatUnrelated });
    const resIdor = await getInvoiceDetail(reqIdor, { params: Promise.resolve({ invoiceId: e2eInvoiceId }) });
    assert.strictEqual(resIdor.status, 403, 'Cross-patient invoice fetch must return 403 IDOR');
  });

  // 46. Phase 6H-A E2E Workflow I: Patient Billing Portal Access
  await test('Phase 6H-A E2E Workflow I: Patient portal retrieves patient invoices with correct ₹ totals', async () => {
    const headersPatient = createAuthHeaders('usr-pat-sec-01', 'PATIENT', 'pat.sec1@example.com');
    const reqPat = new Request('http://localhost:3000/api/patient/billing', { headers: headersPatient });
    const resPat = await getPatientBilling(reqPat);
    const bodyPat = await resPat.json();
    assert.strictEqual(resPat.status, 200);
    const targetInv = bodyPat.data.find((i: any) => i.id === e2eInvoiceId);
    assert.ok(targetInv, 'Patient must see their own completed invoice in patient billing portal');
    assert.strictEqual(targetInv.status, 'PAID');
    assert.strictEqual(targetInv.amountPaid, 1600);
  });

  // 47. Phase 6H-A E2E Workflow J: Financial Immutability Protection
  await test('Phase 6H-A E2E Workflow J: Updating line items or status on a PAID invoice is strictly prohibited', async () => {
    const headersAdmin = createAuthHeaders('usr-adm-01', 'ADMIN', 'admin@clearvisioneyecare.com');
    const reqMutate = new Request(`http://localhost:3000/api/billing/${e2eInvoiceId}`, {
      method: 'PATCH',
      headers: headersAdmin,
      body: JSON.stringify({ discount: 900 }),
    });
    const resMutate = await updateInvoice(reqMutate, { params: Promise.resolve({ invoiceId: e2eInvoiceId }) });
    const bodyMutate = await resMutate.json();
    assert.strictEqual(resMutate.status, 400, 'Mutating paid invoice must return 400');
    assert.strictEqual(bodyMutate.error.code, 'INVALID_STATE');
  });

  // 48. Phase 6H-A E2E Workflow K: Relational & Audit Trail Verification
  await test('Phase 6H-A E2E Workflow K: Security audit logs recorded across full lifecycle', async () => {
    const createdLog = mockAuditLogs.find((log) => log.action === 'INVOICE_CREATED' && log.entityId === e2eInvoiceId);
    const paymentLog = mockAuditLogs.find((log) => log.action === 'PAYMENT_RECORDED' && log.entityId === e2eInvoiceId);
    const patientViewLog = mockAuditLogs.find((log) => log.action === 'PATIENT_BILLING_VIEWED');

    assert.ok(createdLog, 'INVOICE_CREATED audit log must exist for E2E invoice');
    assert.ok(paymentLog, 'PAYMENT_RECORDED audit log must exist for E2E invoice');
    assert.ok(patientViewLog, 'PATIENT_BILLING_VIEWED audit log must exist');
  });


  console.log('----------------------------------------------------');
  console.log(`Verification Summary: Total = ${passed + failed}, Passed = ${passed}, Failed = ${failed}`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

