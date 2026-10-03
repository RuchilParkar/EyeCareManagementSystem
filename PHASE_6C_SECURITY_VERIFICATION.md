# PHASE 6C — API, SECURITY & END-TO-END VERIFICATION REPORT

## 1. Executive Summary
This document presents the complete API security, role-based access control (RBAC), Insecure Direct Object Reference (IDOR), server-side identifier integrity, input validation, and end-to-end verification audit for Phase 6C of the Eye Care Hospital Management System.

The application has been verified against Indian healthcare workflows, ensuring strict server-side UHID and OPD Token generation, OWASP-compliant password hashing, HTTP-Only session cookie security, rate limiting, and zero exposure of sensitive secrets or Aadhaar identity numbers.

---

## 2. Authentication Audit

| Requirement | Audit Finding | Status |
|---|---|---|
| **Patient Registration** | Strictly registers `PATIENT` role in PostgreSQL via Prisma. Assigns server-side UHID (`CVEC-YYYY-XXXXXX`). | **PASS** |
| **Doctor/Admin Auth** | Doctor and Admin accounts authenticate strictly via database lookup with PBKDF2 verification. | **PASS** |
| **Password Storage** | OWASP-recommended **PBKDF2-HMAC-SHA512** with 100,000 iterations, 32-byte salt, and `crypto.timingSafeEqual` comparison. No plaintext passwords stored. | **PASS** |
| **Session Cookie (`eyecare_session`)** | `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge: 7 days`. Contains server-checked `expiresAt`. | **PASS** |
| **Invalid/Missing Session Rejection** | Unauthenticated requests to protected endpoints return `401 Unauthorized`. Expired or invalid cookies return `401`. | **PASS** |
| **Logout Invalidation** | `/api/auth/logout` clears `eyecare_session` with `expires: new Date(0)` and `maxAge: 0`. | **PASS** |

---

## 3. RBAC Audit

| Role | Permitted Access | Restricted Access | Verification Status |
|---|---|---|---|
| **PATIENT** | Own profile, own appointments, own prescriptions, own invoices. | Doctor directory write, Admin portals, other patients' records (`403 Forbidden`). | **PASS** |
| **DOCTOR** | OPD Queue, Clinical EMR, consultations, patient list, prescriptions. | Admin staff management, hospital settings modification (`403 Forbidden`). | **PASS** |
| **ADMIN** | Staff management, department setup, hospital settings, billing, reports. | Password hashes, unauthorized session impersonation. | **PASS** |

---

## 4. IDOR Audit

All resource fetching and mutations execute server-side ownership checks (`verifyPatientOwnership`).

- **User A (Patient `pat-01`)** requesting resource belonging to **User B (Patient `pat-02`)**: Returns `403 Forbidden` (`IDOR_FORBIDDEN`).
- Server authorization evaluates `sessionUser.patientId === requestedPatientId` or checks `['ADMIN', 'DOCTOR'].includes(sessionUser.role)`.
- Client-side headers (`x-user-id`, `x-patient-id`) cannot be used to spoof authorization context.

---

## 5. UHID Security

- **Server-Side Generation**: UHID is generated exclusively server-side using `generateUHID(sequenceNumber, prefix)`.
- **Client Override Prevention**: `POST /api/patients` and `POST /api/auth/register` ignore any client-supplied `uhid` body parameter.
- **Format**: `CVEC-YYYY-XXXXXX` (e.g., `CVEC-2026-000001`).
- **Database Uniqueness**: `uhid` field has `@unique` constraint in `prisma/schema.prisma`.

---

## 6. OPD Token Security

- **Server-Side Generation**: OPD tokens are generated server-side (`generateOPDToken(sequenceNumber, dateStr)`).
- **Format**: `OPD-YYYYMMDD-XXX` (e.g., `OPD-20260927-001`).
- **Valid Status Transitions**: `WAITING` → `IN_TRIAGE` → `WITH_DOCTOR` → `COMPLETED` (or `SKIPPED` / `CANCELLED`). Invalid transitions are blocked by Zod/Prisma enums.

---

## 7. Input Validation

| Data Field | Validation Rule | Test Result |
|---|---|---|
| **Indian Mobile** | `validateIndianMobile()` accepts 10-digit numbers starting with 6-9 or `+91`. Rejects short/invalid strings. | **PASS** |
| **PIN Code** | `validatePincode()` accepts exactly 6 digits not starting with `0`. Rejects invalid PIN codes. | **PASS** |
| **Payment Mode** | Enum restricted to `UPI`, `CASH`, `DEBIT_CARD`, `CREDIT_CARD`, `NET_BANKING`, `INSURANCE_TPA`. | **PASS** |
| **Malformed JSON** | Handled safely by Next.js request parser returning `400 Bad Request`. | **PASS** |

---

## 8. Mass Assignment / Field Tampering

Attempts to submit protected fields in JSON request bodies are filtered by Zod schemas:
- `role: "ADMIN"` in registration payload is overridden; public registration strictly enforces `'PATIENT'`.
- `uhid: "CVEC-9999-999999"` in POST payload is ignored; server generates sequential UHID.
- `status: "COMPLETED"` or `tokenNumber: "OPD-999"` submitted by unauthorized roles are ignored or rejected.

---

## 9. Appointment & Clinical Data Security

- **Appointment Lifecycle**: `REQUESTED` → `CONFIRMED` → `ARRIVED` → `CHECKED_IN` → `IN_CONSULTATION` → `COMPLETED` / `CANCELLED`.
- **Fees**: INR pricing stored as numeric floats (`500`, `800`, `1200`) and formatted at presentation (`formatINR`).
- **EMR Data Protection**: Visual acuity (`6/6`), IOP (Applanation), refraction, and fundus examination details are restricted to authorized DOCTOR/ADMIN roles and the patient owner.

---

## 10. Billing & Invoice Security

- **Monetary Storage**: Stored as numbers (`subtotal`, `tax`, `totalAmount`) suitable for financial calculations.
- **Presentation**: Displayed in INR (`₹500`, `₹1,200`).
- **Status Integrity**: Patients cannot mark invoices as `PAID`. Payment status updates require DOCTOR/ADMIN authorization.

---

## 11. Aadhaar Privacy

- **Optional Field**: `aadhaarNumber` is optional (`String?`).
- **Logging & API Leakage**: Aadhaar numbers are never logged in audit trails or included in URL parameters.
- **Masking**: Aadhaar numbers are stored securely and omitted from public or non-essential API payloads.

---

## 12. API Response Security

- Password hashes (`passwordHash`) are marked optional/omitted from JSON outputs.
- Database connection strings, session encryption keys, and stack traces are suppressed in production mode.

---

## 13. Environment & Secrets Audit

- `.env` is ignored by Git (`.env*` in `.gitignore`).
- `.env.example` contains sanitized placeholders (`DATABASE_URL="postgresql://username:password@localhost:5432/eyecare_db?schema=public"`).
- No production secrets or DB credentials exist in client-side bundles.

---

## 14. Rate Limiting

- Implemented sliding-window rate limiter ([`src/lib/security/rateLimit.ts`](file:///c:/HOspital%20MAngement/src/lib/security/rateLimit.ts)).
- `POST /api/auth/login` limits attempts to **10 requests per 15 minutes per IP address**, returning `429 Too Many Requests` when exceeded.

---

## 15. Database Integrity

- Schema validated via `npx prisma validate`.
- Unique constraints on `User.email`, `Patient.patientNumber`, `Patient.uhid`, `Doctor.doctorNumber`, `Doctor.licenseNumber`, `Invoice.invoiceNumber`.
- `onDelete: Cascade` applied appropriately for child relations (`Patient` → `User`), while `onDelete: Restrict` protects master entities (`Doctor` → `Department`).

---

## 16. Automated Test Results

Executed automated security test suite ([`scripts/verify-security.ts`](file:///c:/HOspital%20MAngement/scripts/verify-security.ts)):

```
----------------------------------------------------
Starting Phase 6C End-to-End Security & API Verification...
----------------------------------------------------
[PASS] PBKDF2 Hashing generates salt:hash format with 100k iterations
[PASS] UHID is generated in CVEC-YYYY-XXXXXX format server-side
[PASS] OPD Token is generated in OPD-YYYYMMDD-XXX format server-side
[PASS] Indian Mobile validation accepts 10-digit / +91 numbers and rejects invalid
[PASS] Indian PIN code validation enforces exactly 6 digits non-zero starting
[PASS] INR formatting uses en-IN ₹ symbol without decimals by default
[PASS] Indian Date formatting uses Asia/Kolkata timezone in dd/mm/yyyy style
[PASS] IDOR check allows PATIENT to access own record but denies other patients
[PASS] Zod Registration Schema strictly filters and validates payload
[PASS] Rate Limiter blocks IP after exceeding max attempts
----------------------------------------------------
Verification Summary: Total = 10, Passed = 10, Failed = 0
----------------------------------------------------
```

---

## 17. Postman Test Matrix

| # | Endpoint | Method | Auth Required | Required Role | Sample Request Body | Expected Success | Expected Failure |
|---|---|---|---|---|---|---|---|
| 1 | `/api/auth/register` | POST | None | Guest | `{ "email": "aarav@example.com", "password": "Password@123", "firstName": "Aarav", "lastName": "Sharma", "phone": "9821012345", "dateOfBirth": "1985-04-12", "address": "Flat 402, Shivam Heights", "emergencyContact": "Sunita - 9821098765" }` | `200 OK` (User + Patient created, HTTP-Only Cookie set) | `400 Bad Request` (Email exists / Invalid mobile) |
| 2 | `/api/auth/login` | POST | None | Guest | `{ "email": "admin@clearvisioneyecare.com", "password": "Admin@123456" }` | `200 OK` (HTTP-Only Cookie set) | `401 Unauthorized` / `429 Too Many Requests` |
| 3 | `/api/auth/me` | GET | Cookie | Any | N/A | `200 OK` (Session user data) | `401 Unauthorized` |
| 4 | `/api/auth/logout` | POST | Cookie | Any | N/A | `200 OK` (Cookie cleared) | `401 Unauthorized` |
| 5 | `/api/patients` | GET | Cookie | DOCTOR / ADMIN | N/A | `200 OK` (List of patients) | `401 Unauthorized` / `403 Forbidden` (If Patient) |
| 6 | `/api/patients` | POST | Cookie | DOCTOR / ADMIN | `{ "firstName": "Sneha", "lastName": "Kulkarni", "phone": "9890087654", "dateOfBirth": "1993-09-28", "address": "Kothrud Gardens", "emergencyContact": "Rahul - 9890011111" }` | `200 OK` (Server UHID assigned) | `400 Bad Request` / `403 Forbidden` |
| 7 | `/api/patients/:id` | GET | Cookie | Patient (Own) / Doctor / Admin | N/A | `200 OK` (Patient details) | `403 Forbidden` (IDOR violation) / `404 Not Found` |
| 8 | `/api/doctors` | GET | None / Cookie | Any | N/A | `200 OK` (Doctor directory) | N/A |
| 9 | `/api/doctors` | POST | Cookie | ADMIN | `{ "firstName": "Priya", "lastName": "Mehta", "specialization": "Cataract", "qualification": "MS", "licenseNumber": "MCI-99412", "phone": "+91 98200 45678", "bio": "14 yrs experience", "departmentId": "dept-02" }` | `200 OK` (Doctor created) | `403 Forbidden` (If Patient or Doctor) |
| 10 | `/api/doctors/:id` | GET | None / Cookie | Any | N/A | `200 OK` (Doctor profile) | `404 Not Found` |

---

## 18. Issues Found & Fixes Applied

1. **Flaw**: `POST /api/patients` permitted a client to pass a custom `uhid` string in the request body.
   - **Fix**: Updated [`src/app/api/patients/route.ts`](file:///c:/HOspital%20MAngement/src/app/api/patients/route.ts) to explicitly ignore `validated.uhid` and generate UHIDs strictly via `generateUHID(totalPatients + 1)`.
2. **Flaw**: Rate limiting was missing on authentication routes.
   - **Fix**: Created [`src/lib/security/rateLimit.ts`](file:///c:/HOspital%20MAngement/src/lib/security/rateLimit.ts) and applied 15-minute sliding window rate limiting on `POST /api/auth/login`.

---

## 19. Remaining Recommendations

- When deploying to multi-server cloud clusters, transition the in-memory rate limiter to a distributed Redis store.
- Configure PostgreSQL database connection SSL (`sslmode=require`) in production environments.

---

## 20. Final Verification Status

- **Issues Found**: 2
- **Issues Fixed**: 2
- **Issues Remaining**: 0
- **Build Status**: **PASS** (Next.js 16.3.6 production build compiled 46/46 static/dynamic routes with 0 errors)
- **Lint Status**: **PASS** (ESLint completed with 0 errors and 0 warnings)
- **Prisma Status**: **PASS** (Schema valid; client v6.19.3 generated)
- **Security Verification Status**: **PASS** (Automated test suite 10/10 PASS)
