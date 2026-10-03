# Application Route Map

## Public Routes (`/`) — Implemented in Phase 2
- `/` — Public Landing Page (Hero, Trust Stats, Services Preview, Why Choose Us, Doctor Roster, CTA)
- `/about` — Hospital introduction, mission, vision, values, technology highlights
- `/services` — Eye care services catalog with category filtering and search
- `/doctors` — Doctor directory with department filtering and availability indicators
- `/departments` — Clinical subspecialty centers overview & doctor counts
- `/contact` — Hospital contact info, operating hours, emergency advisory & validated inquiry form

## Authentication Routes — Implemented in Phase 2
- `/login` / `/auth/login` — Role-aware sign-in (Patient, Doctor, Admin) with automatic role redirection
- `/register` / `/auth/register` — Patient account registration form
- `/forgot-password` / `/auth/forgot-password` — Password recovery request
- `/reset-password` / `/auth/reset-password` — Password reset with strength indicator

## Patient Portal (`/patient/*`) — Implemented in Phase 3A
- `/patient/onboarding` — Profile completion wizard & emergency contact initialization
- `/patient/dashboard` — Patient overview dashboard with stats, upcoming visit banner, quick actions, and recent activity feed
- `/patient/appointments` — Appointment history, status filter tabs, search, detail modal, rescheduling modal, and cancellation dialog
- `/patient/appointments/book` — 4-step consultation booking wizard (Department & Service -> Doctor -> Date & Time Slot -> Review & Confirm)
- `/patient/records` — Clinical consultation history, examination details modal/drawer, download & print report simulations
- `/patient/prescriptions` — Eyewear optical Rx lens specifications, eye drop medication schedules, prescription detail modal, order online action
- `/patient/profile` — Personal information & medical background editor with Zod validation & mock API persistence

## Doctor Portal & Ophthalmology EMR (`/doctor/*`) — Implemented in Phase 4
- `/doctor/dashboard` — Doctor overview dashboard with OPD queue stats, active appointments preview, and quick consultation links
- `/doctor/queue` — OPD Clinical Queue workspace with status filter tabs (All, Waiting, In Consultation, Completed, Cancelled) & live patient status transition
- `/doctor/patients` — Patient Clinical Directory listing registered hospital patients with quick profile search
- `/doctor/patients/[patientId]` — Patient Clinical Profile showing demographics, ocular allergies, chronic eye conditions, past consultations, and active medications
- `/doctor/consultations/[appointmentId]` — **Specialized 12-Section Ophthalmology EMR Consultation Workspace**:
  1. Header & Previous Visit Reference
  2. Chief Complaint & Symptoms Checklist
  3. Visual Acuity (OD / OS / OU Distance & Near)
  4. Intraocular Pressure IOP (OD / OS mmHg & Tonometry method)
  5. Refraction Table (SPH, CYL, AXIS, ADD, VA for OD / OS)
  6. Slit Lamp Anterior Segment Exam (Lids, Conjunctiva, Cornea, AC, Iris, Lens)
  7. Fundus Posterior Segment Exam (Optic Disc, C/D ratio, Macula, Retina, Vitreous)
  8. Diagnostic Investigations (OCT scans, Visual Field, Pachymetry)
  9. Clinical Diagnosis & Affected Eye (OD/OS/OU)
  10. Treatment Plan & Follow-up Interval
  11. Digital Medication & Eyewear Prescription Generator
  12. Save Draft & Finalize Consultation (Emits Medical Record & Prescription)
- `/doctor/prescriptions` — Prescriptions Directory showing digital optical and eye drop prescriptions issued by the doctor

## Hospital Admin Portal (`/admin/*`) — Implemented in Phase 5
- `/admin/dashboard` — Hospital Admin master overview dashboard with operational stats, department workloads, quick actions, and audit feed
- `/admin/patients` — Hospital Patient Master Directory with registration modal and detailed patient record link
- `/admin/patients/[patientId]` — Administrative view of patient profile, appointment history, and billing history
- `/admin/doctors` — Doctor & Clinical Staff Directory with Add Doctor modal and status toggling
- `/admin/doctors/[doctorId]` — Detailed Doctor profile view, department info, consultation fees, and schedule overview
- `/admin/staff` — Administrative, Nursing & Technical Staff Roster directory with Add Staff modal
- `/admin/appointments` — Hospital-wide appointment schedule overview with status filters and quick actions
- `/admin/appointments/new` — Hospital Admin appointment booking form for any patient and consultant
- `/admin/opd` — Real-time hospital OPD token management, live lounge tracking, and room reassignment modal
- `/admin/billing` — Financial invoice management listing consultation charges and optical sales with filter tabs
- `/admin/billing/[invoiceId]` — Printable invoice view with itemized charges, subtotal/tax calculations, and "Mark as Paid" action
- `/admin/services` — Hospital Rate Card and service catalog manager (consultations, OCT, surgeries, eyewear)
- `/admin/reports` — Hospital analytics dashboard showing revenue growth, consultation volume, and patient satisfaction
- `/admin/activity` — Security audit trail log tracking EMR access, administrative actions, and user logins
- `/admin/settings` — Hospital system configuration editor (profile, OPD slot defaults, HIPAA audit settings)

