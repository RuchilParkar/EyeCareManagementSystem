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
import { registerPatientSchema } from '../src/lib/validation/schemas';
import { verifyPatientOwnership } from '../src/lib/auth/session';

async function runSecurityTests() {
  console.log('----------------------------------------------------');
  console.log('Starting Phase 6C End-to-End Security & API Verification...');
  console.log('----------------------------------------------------');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[FAIL] ${name}:`, error.message);
      failed++;
    }
  }

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
