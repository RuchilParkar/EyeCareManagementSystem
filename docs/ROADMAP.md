# Project Roadmap

## Phase 1: Frontend Foundation (COMPLETED)
- [x] Project architecture, Next.js 15+, strict TypeScript & Tailwind CSS design system.
- [x] All 22 reusable atomic UI components with state variations.
- [x] Global layout shells (Public Header/Footer, Authenticated Portal Shell with Sidebar/Topbar).
- [x] Simulated Auth/Role Context & Dev Role Switcher.
- [x] Mock API service abstraction layer & realistic fixtures.
- [x] Design System & Architecture Showcase page.

## Phase 2: Public Website + Authentication + Onboarding (COMPLETED)
- [x] Public Website Routes (`/`, `/about`, `/services`, `/doctors`, `/departments`, `/contact`).
- [x] Role-aware Authentication Pages (`/login`, `/register`, `/forgot-password`, `/reset-password`).
- [x] Patient Profile Onboarding wizard (`/patient/onboarding`).
- [x] Role Redirection & Portal Shell Guards (`PatientGuard`).
- [x] Mock API Service extensions (`patientService.updatePatientProfile`, `authService.registerPatient`, etc.).

## Phase 3A: Complete Patient Portal (COMPLETED)
- [x] Role protection guard (`PatientGuard`) enforcing `PATIENT` role access.
- [x] Patient Dashboard (`/patient/dashboard`) with quick stats, featured upcoming appointment, quick actions, and activity feed.
- [x] Appointments Management (`/patient/appointments`) with status filter tabs, search, detail modal, date/slot rescheduling modal, and cancellation dialog.
- [x] Multi-step Appointment Booking Wizard (`/patient/appointments/book`) with department, service, doctor, date/slot picker, and review step.
- [x] Medical Records Viewer (`/patient/records`) with clinical findings, examination notes, and PDF download/print options.
- [x] Optical Prescriptions & Eyewear Rx (`/patient/prescriptions`) with lens specifications (OD/OS), medication schedules, and order actions.
- [x] Profile & Medical Background Editor (`/patient/profile`) with Zod validation & patient profile updates.

## Phase 4: Doctor Clinical Portal & Specialized Ophthalmology EMR (COMPLETED)
- [x] Doctor route protection guard (`DoctorGuard`) enforcing `DOCTOR` role access.
- [x] Doctor Dashboard (`/doctor/dashboard`) with OPD queue stats, active appointments preview, and quick consultation links.
- [x] OPD Clinical Queue Workspace (`/doctor/queue`) with status filter tabs & live patient status transition.
- [x] Patient Clinical Directory (`/doctor/patients`) & Patient Profile (`/doctor/patients/[patientId]`) with history timelines.
- [x] Specialized 12-Section Ophthalmology EMR Workspace (`/doctor/consultations/[appointmentId]`):
  - Visual Acuity (OD / OS / OU Distance & Near)
  - Intraocular Pressure IOP (OD / OS mmHg & Tonometry method)
  - Refraction Table (OD / OS SPH, CYL, AXIS, ADD, VA)
  - Slit Lamp Anterior Segment Examination
  - Fundus Posterior Segment Examination
  - Diagnostic Investigations (OCT scans, Visual Field, Pachymetry)
  - Diagnosis Entry & Affected Eye Selection (OD / OS / OU)
  - Treatment Plan & Follow-up Intervals
  - Medication & Eyewear Prescription Generator
  - Draft Saving & Consultation Finalization (Emits Medical Record & Prescription)
- [x] Doctor Prescriptions Directory (`/doctor/prescriptions`).

## Phase 5: Hospital Admin & Operations Portal (COMPLETED)
- [x] Admin route protection guard (`AdminGuard`) enforcing `ADMIN` role access.
- [x] Master Hospital Admin Dashboard (`/admin/dashboard`) with key metrics, OPD workload breakdown, quick shortcuts, and live audit feed.
- [x] Patient Directory (`/admin/patients` & `/admin/patients/[patientId]`) with search, filter, and registration modal.
- [x] Doctor Management (`/admin/doctors` & `/admin/doctors/[doctorId]`) with department breakdown, rate tariffs, and Add Doctor modal.
- [x] Staff Management (`/admin/staff`) with role directory (Nurses, Optometrists, Receptionists, Techs) and Add Staff modal.
- [x] Appointment Schedule Management (`/admin/appointments` & `/admin/appointments/new`) with status filters and booking form.
- [x] Live OPD Queue Operations (`/admin/opd`) with real-time lounge stats and doctor/room reassignment modal.
- [x] Billing & Financial Invoices (`/admin/billing` & `/admin/billing/[invoiceId]`) with printable invoices and "Mark as Paid" workflow.
- [x] Hospital Services & Rate Card Manager (`/admin/services`) with procedure tariffs and category filters.
- [x] Operational Reports & Analytics (`/admin/reports`) with revenue charts and export options.
- [x] Audit Logs & Activity Trail (`/admin/activity`) with HIPAA security logs.
- [x] Hospital System Settings (`/admin/settings`) with tabbed configuration for profile, OPD limits, and HIPAA security.

## Future Phase: Backend & Database Integration (UPCOMING)
- [ ] Backend & Database Integration (Node.js, PostgreSQL, Prisma ORM, JWT auth).

