# Database Architecture & Backend Integration — Eye Care Hospital Management System

## Overview

Phase 6 introduces the real persistent backend database, server-side RBAC, Zod validation, Prisma ORM data layer, HIPAA-ready security audit logs, and RESTful API route handlers for the Eye Care Hospital Management System.

---

## Technology Stack

- **Framework**: Next.js 15+ App Router & React 19
- **Database**: PostgreSQL (relational database)
- **ORM**: Prisma Client v6
- **Validation**: Zod server-side schemas
- **Authentication**: JWT & Cookie Session Management with Role-Based Access Control (RBAC)

---

## Environment Variables

Copy `.env.example` to `.env` in the root directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eyecare_db?schema=public"
JWT_SECRET="eyecare-super-secret-jwt-key-2026-phase6"
SESSION_SECRET="eyecare-session-cookie-secret-key-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Prisma Commands

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Run Database Migrations (Dev)
```bash
npx prisma migrate dev --name init_phase6
```

### 3. Push Schema Directly to Database
```bash
npx prisma db push
```

### 4. Seed Database with Development Data
```bash
npx prisma db seed
```
or
```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 5. Open Prisma Studio (Database GUI)
```bash
npx prisma studio
```

---

## Database Domain Models

The PostgreSQL schema contains 18 normalized entities:

1. **User**: Authentication credentials, role (`PATIENT`, `DOCTOR`, `ADMIN`), status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
2. **Patient**: Patient profile (`patientNumber`, `mrn`, `dateOfBirth`, `gender`, `bloodGroup`, emergency contact).
3. **Doctor**: Physician details (`doctorNumber`, `specialization`, `qualification`, `licenseNumber`, experience).
4. **Department**: Clinical specialties (Ophthalmology, Cataract & Refractive, Glaucoma, Cornea, Retina, Pediatric Ophthalmology, Optometry).
5. **DoctorAvailability**: Recurring schedule (`dayOfWeek`, `startTime`, `endTime`, `slotDurationMinutes`).
6. **Service**: Medical service offerings and fees.
7. **Appointment**: Consultation bookings (`appointmentNumber`, status: `REQUESTED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
8. **OpdToken**: Queue token management (`tokenNumber`, status: `WAITING`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED`).
9. **Consultation**: Specialized Ophthalmology EMR record (Visual Acuity OD/OS distance & near, IOP OD/OS with applanation method, Refraction SPH/CYL/Axis/ADD, Slit Lamp Findings, Fundus Findings, Diagnosis, Treatment Plan).
10. **Prescription**: Prescriptions tied to consultations and doctors.
11. **PrescriptionItem**: Medication details (medicine, dosage, frequency, duration, instructions).
12. **MedicalDocument**: Storage references for clinical reports and scans.
13. **Invoice**: Billing records (`invoiceNumber`, subtotal, tax, total, status: `PENDING`, `PAID`, `PARTIALLY_PAID`, `CANCELLED`).
14. **InvoiceItem**: Itemized bill breakdown.
15. **Payment**: Payment transactions.
16. **StaffMember**: Non-physician hospital personnel records.
17. **Notification**: User notifications (`APPOINTMENT_CONFIRMED`, `PRESCRIPTION_CREATED`, `REPORT_AVAILABLE`, `SYSTEM`).
18. **AuditLog**: HIPAA audit tracking (`actorUserId`, `action`, `entityType`, `entityId`, `target`, `ipAddress`, `timestamp`).

---

## Security & Server-Side Authorization (RBAC)

All API route handlers enforce strict server-side authentication using [`src/lib/auth/session.ts`](file:///c:/HOspital%20MAngement/src/lib/auth/session.ts):

- **PATIENT**:
  - Can view and update own profile.
  - Can book, reschedule, or cancel own appointments.
  - Can view own clinical EMR records, prescriptions, and invoices.
  - Direct access to another patient's records triggers `403 Forbidden` / `404 Not Found`.

- **DOCTOR**:
  - Can view assigned OPD queue and appointments.
  - Can create and update Ophthalmology EMR clinical encounters.
  - Can issue prescriptions.
  - Restricted from administrative configuration and management.

- **ADMIN**:
  - Full management of users, patients, doctors, departments, and services.
  - Access to hospital financial reports, operational statistics, and system audit logs.

---

## Default Development Accounts (Seeded)

- **Admin Account**: `admin@eyecare.org` / `Admin@123456`
- **Doctor Account**: `dr.vance@eyecare.org` / `Doctor@123456`
- **Patient Account**: `john.doe@example.com` / `Patient@123456`
