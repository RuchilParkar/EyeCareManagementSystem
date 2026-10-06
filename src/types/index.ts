export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'GUEST';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  patientId?: string;
  doctorId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface Patient {
  id: string;
  userId: string;
  patientNumber: string;
  uhid?: string;
  mrn?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address: string;
  addressLine?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  emergencyContact: string;
  bloodGroup?: string;
  aadhaarNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  userId: string;
  doctorNumber: string;
  firstName: string;
  lastName: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  phone: string;
  bio: string;
  profileImage?: string;
  departmentId: string;
  experience?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  hospitalId?: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Service {
  id: string;
  departmentId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  basePrice?: number;
  category?: 'consultation' | 'diagnostic' | 'surgery' | 'eyewear';
  isAvailable?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'CHECKED_IN'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId?: string;
  departmentId?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  type?: string;
  status: AppointmentStatus;
  reason: string;
  tokenNumber?: string;
  notes?: string;
  fee?: number;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  doctorName?: string;
  serviceName?: string;
}

export interface OPDToken {
  id: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  tokenNumber: string;
  sequenceNumber: number;
  tokenDate: string;
  status: 'WAITING' | 'IN_TRIAGE' | 'WITH_DOCTOR' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  calledAt?: string;
  completedAt?: string;
  patientName?: string;
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
}

// Specialized Ophthalmology EMR Sub-Structures
export type EyeSide = 'OD' | 'OS' | 'OU';

export interface VisualAcuity {
  odDistance: string; // e.g. "6/6", "6/9", "6/12", "PL"
  osDistance: string;
  ouDistance?: string;
  odNear: string; // e.g. "N6", "N8"
  osNear: string;
  ouNear?: string;
}

export interface IOPMeasurement {
  odIop: string; // e.g. "16"
  osIop: string; // e.g. "17"
  method: 'Applanation' | 'Non-contact' | 'Tonopen' | 'Other';
  notes?: string;
}

export interface RefractionEyeSpec {
  sphere: string;
  cylinder: string;
  axis: string;
  add: string;
  visualAcuity: string;
}

export interface Refraction {
  od: RefractionEyeSpec;
  os: RefractionEyeSpec;
}

export interface ExaminationFinding {
  status: 'NORMAL' | 'ABNORMAL';
  notes?: string;
}

export interface EyeExamination {
  lids: ExaminationFinding;
  lashes: ExaminationFinding;
  lacrimalSystem: ExaminationFinding;
  conjunctiva: ExaminationFinding;
  sclera: ExaminationFinding;
  cornea: ExaminationFinding;
  anteriorChamber: ExaminationFinding;
  iris: ExaminationFinding;
  pupil: ExaminationFinding;
  lens: ExaminationFinding;
}

export interface FundusEyeSpec {
  opticDisc: string;
  cupToDiscRatio: string;
  macula: string;
  retina: string;
  vessels: string;
  vitreous: string;
  findings: string;
}

export interface FundusExamination {
  od: FundusEyeSpec;
  os: FundusEyeSpec;
}

export interface OphthalmicInvestigation {
  id: string;
  testName: 'OCT' | 'Fundus Photography' | 'Visual Field' | 'B-Scan' | 'Pachymetry' | 'Keratometry' | 'Other';
  eye: EyeSide;
  date: string;
  result: string;
  notes?: string;
}

export interface DiagnosisEntry {
  primaryDiagnosis: string;
  secondaryDiagnosis?: string;
  affectedEye: EyeSide;
  notes?: string;
}

export interface TreatmentPlan {
  plan: string;
  recommendedProcedures?: string[];
  followUpInterval: '1 week' | '2 weeks' | '1 month' | '3 months' | '6 months' | '1 year' | 'As required';
  notes?: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  symptoms: string;
  clinicalNotes: string;
  examinationNotes: string;
  diagnosis: string;
  followUpDate?: string;
  status?: 'draft' | 'completed';
  visualAcuity?: VisualAcuity;
  iop?: IOPMeasurement;
  refraction?: Refraction;
  externalExam?: EyeExamination;
  slitLampExam?: EyeExamination;
  fundusExam?: FundusExamination;
  investigations?: OphthalmicInvestigation[];
  diagnosisDetail?: DiagnosisEntry;
  treatmentPlan?: TreatmentPlan;
  createdAt: string;
  updatedAt: string;
}

export type PrescriptionStatus = 'ACTIVE' | 'FILLED' | 'COMPLETED' | 'CANCELLED';

export interface PrescriptionItem {
  id: string;
  prescriptionId?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  route?: string;
  duration: string;
  instructions?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  status: PrescriptionStatus;
  consultationId?: string | null;
  appointmentId?: string | null;
  patientId: string;
  doctorId: string;
  issuedAt: string;
  notes?: string | null;
  items: PrescriptionItem[];
  createdAt?: string;
  updatedAt?: string;
  patientName?: string;
  doctorName?: string;
}


export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'SYSTEM' | 'REMINDER';
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  target?: string;
  ipAddress?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Phase 5 Admin & Operational Types
export type InvoiceStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED' | 'REFUNDED' | 'DRAFT' | 'OVERDUE';
export type PaymentMode = 'UPI' | 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'INSURANCE_TPA';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  consultationId?: string;
  prescriptionId?: string;
  serviceName: string;
  subtotal: number;
  discount?: number;
  tax: number;
  taxAmount?: number;
  totalAmount: number;
  amountPaid?: number;
  amountDue?: number;
  paymentMode?: PaymentMode;
  status: InvoiceStatus;
  issueDate?: string;
  dueDate: string;
  createdAt: string;
  items: InvoiceItem[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Receptionist' | 'Nurse' | 'Optician' | 'Billing Officer' | 'Lab Technician' | 'Administrator';
  departmentId: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate: string;
}

export interface HospitalSettings {
  name: string;
  hospitalName?: string;
  tagline?: string;
  address: string;
  phone: string;
  emergencyPhone?: string;
  email: string;
  operatingHours?: string;
  registrationNo?: string;
  appointmentDurationMinutes?: number;
  defaultSlotDuration?: number;
  maxDailyAppointmentsPerDoctor?: number;
  tokenPrefix?: string;
  requireTriageBeforeDoctor?: boolean;
  enableAuditLogging?: boolean;
  sessionTimeoutMinutes?: number;
  requireMfaForStaff?: boolean;
  opdStartTime?: string;
  opdEndTime?: string;
  workingDays?: string[];
  defaultFollowUp?: string;
}

export interface ReportSummary {
  newPatients: number;
  returningPatients: number;
  totalConsultations: number;
  scheduledAppts: number;
  completedAppts: number;
  cancelledAppts: number;
  noShowAppts: number;
  dailyRevenue: number;
  consultationRevenue: number;
  investigationRevenue: number;
  opticalRevenue: number;
  totalRevenue: number;
  totalAppointments: number;
  totalSurgeries: number;
  satisfactionRate: number;
  revenueByCategory: { category: string; amount: number }[];
  appointmentsBySpecialty: { specialty: string; count: number }[];
}

export interface HospitalService {
  id: string;
  name: string;
  category: 'consultation' | 'diagnostic' | 'surgery' | 'eyewear';
  basePrice: number;
  durationMinutes: number;
  description: string;
  isAvailable: boolean;
}

// API Response Utilities
export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  completedConsultations: number;
  pendingAppointments: number;
  revenueThisMonth: number;
}

export interface OpdQueueItem {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  checkInTime: string;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  roomNumber?: string;
}
