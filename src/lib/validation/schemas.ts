import { z } from 'zod';
import { validateIndianMobile, validatePincode } from '@/lib/utils/localization';

export const userRoleEnum = z.enum(['PATIENT', 'DOCTOR', 'ADMIN']);
export const userStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'PENDING']);
export const appointmentStatusEnum = z.enum([
  'REQUESTED',
  'CONFIRMED',
  'ARRIVED',
  'CHECKED_IN',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'RESCHEDULED',
]);

export const paymentModeEnum = z.enum([
  'UPI',
  'CASH',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'NET_BANKING',
  'INSURANCE_TPA',
]);

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  role: userRoleEnum.optional(),
});

export const registerPatientSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  firstName: z.string().min(2, 'First name is required.'),
  lastName: z.string().min(2, 'Last name is required.'),
  phone: z
    .string()
    .min(8, 'Phone number is required.')
    .refine((val) => validateIndianMobile(val), {
      message: 'Please enter a valid 10-digit Indian mobile number (+91).',
    }),
  dateOfBirth: z.string().min(4, 'Date of birth is required.'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  address: z.string().min(3, 'Address is required.'),
  addressLine: z.string().optional(),
  locality: z.string().optional(),
  city: z.string().optional().default('Mumbai'),
  district: z.string().optional(),
  state: z.string().optional().default('Maharashtra'),
  pincode: z
    .string()
    .optional()
    .refine((val) => !val || validatePincode(val), {
      message: 'Please enter a valid 6-digit Indian PIN code.',
    }),
  emergencyContact: z.string().min(3, 'Emergency contact is required.'),
  bloodGroup: z.string().optional(),
  aadhaarNumber: z.string().optional(),
});

export const patientSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  patientNumber: z.string().optional(),
  uhid: z.string().optional(),
  mrn: z.string().optional(),
  firstName: z.string().min(2, 'First name is required.'),
  lastName: z.string().min(2, 'Last name is required.'),
  dateOfBirth: z.string().min(4, 'Date of birth is required.'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  phone: z
    .string()
    .min(8, 'Phone number is required.')
    .refine((val) => validateIndianMobile(val), {
      message: 'Please enter a valid 10-digit Indian mobile number.',
    }),
  address: z.string().min(3, 'Address is required.'),
  addressLine: z.string().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z
    .string()
    .optional()
    .refine((val) => !val || validatePincode(val), {
      message: 'Please enter a valid 6-digit Indian PIN code.',
    }),
  emergencyContact: z.string().min(3, 'Emergency contact is required.'),
  bloodGroup: z.string().optional(),
  aadhaarNumber: z.string().optional(),
});

export const updatePatientMeSchema = z.object({
  firstName: z.string().min(2, 'First name is required.').optional(),
  lastName: z.string().min(2, 'Last name is required.').optional(),
  phone: z
    .string()
    .min(8, 'Phone number is required.')
    .refine((val) => validateIndianMobile(val), {
      message: 'Please enter a valid 10-digit Indian mobile number.',
    })
    .optional(),
  dateOfBirth: z.string().min(4, 'Date of birth is required.').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().min(3, 'Address is required.').optional(),
  addressLine: z.string().optional(),
  locality: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z
    .string()
    .optional()
    .refine((val) => !val || validatePincode(val), {
      message: 'Please enter a valid 6-digit Indian PIN code.',
    }),
  emergencyContact: z.string().min(3, 'Emergency contact is required.').optional(),
  bloodGroup: z.string().optional(),
  aadhaarNumber: z.string().optional(),
});

export const updateDoctorMeSchema = z.object({
  firstName: z.string().min(2, 'First name is required.').optional(),
  lastName: z.string().min(2, 'Last name is required.').optional(),
  qualification: z.string().min(2, 'Qualification is required.').optional(),
  phone: z.string().min(8, 'Phone number is required.').optional(),
  bio: z.string().min(5, 'Bio description is required.').optional(),
  profileImage: z.string().optional(),
  experience: z.number().min(0).optional(),
});

export const updateDoctorAdminSchema = z.object({
  firstName: z.string().min(2, 'First name is required.').optional(),
  lastName: z.string().min(2, 'Last name is required.').optional(),
  specialization: z.string().min(3, 'Specialization is required.').optional(),
  qualification: z.string().min(2, 'Qualification is required.').optional(),
  phone: z.string().min(8, 'Phone number is required.').optional(),
  bio: z.string().min(5, 'Bio description is required.').optional(),
  profileImage: z.string().optional(),
  departmentId: z.string().optional(),
  experience: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const doctorSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  doctorNumber: z.string().optional(),
  firstName: z.string().min(2, 'First name is required.'),
  lastName: z.string().min(2, 'Last name is required.'),
  specialization: z.string().min(3, 'Specialization is required.'),
  qualification: z.string().min(2, 'Qualification is required.'),
  licenseNumber: z.string().min(3, 'License number is required.'),
  phone: z.string().min(8, 'Phone number is required.'),
  bio: z.string().min(10, 'Bio description is required.'),
  departmentId: z.string().min(1, 'Department is required.'),
  experience: z.number().min(0).default(5),
  status: z.string().default('ACTIVE'),
});

export const patientBookAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor selection is required.'),
  serviceId: z.string().optional(),
  departmentId: z.string().optional(),
  appointmentDate: z.string().min(4, 'Appointment date is required.'),
  startTime: z.string().min(2, 'Start time is required.'),
  endTime: z.string().optional(),
  type: z.string().optional().default('NEW_CONSULTATION'),
  reason: z.string().min(3, 'Reason for visit is required.'),
  notes: z.string().optional(),
});

export const adminBookAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required.'),
  doctorId: z.string().min(1, 'Doctor selection is required.'),
  serviceId: z.string().optional(),
  departmentId: z.string().optional(),
  appointmentDate: z.string().min(4, 'Appointment date is required.'),
  startTime: z.string().min(2, 'Start time is required.'),
  endTime: z.string().optional(),
  type: z.string().optional().default('NEW_CONSULTATION'),
  fee: z.number().optional().default(500),
  reason: z.string().min(3, 'Reason for visit is required.'),
  status: appointmentStatusEnum.optional().default('CONFIRMED'),
  notes: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusEnum,
  notes: z.string().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().min(4, 'New appointment date is required.'),
  startTime: z.string().min(2, 'New start time slot is required.'),
  endTime: z.string().optional(),
  reason: z.string().optional(),
});

export const appointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, 'Patient selection is required.'),
  doctorId: z.string().min(1, 'Doctor selection is required.'),
  serviceId: z.string().optional(),
  departmentId: z.string().optional(),
  appointmentDate: z.string().min(4, 'Appointment date is required.'),
  startTime: z.string().min(2, 'Start time is required.'),
  endTime: z.string().optional(),
  type: z.string().optional().default('NEW_CONSULTATION'),
  fee: z.number().optional().default(500),
  reason: z.string().min(3, 'Reason for visit is required.'),
  status: appointmentStatusEnum.optional().default('CONFIRMED'),
  tokenNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const visualAcuitySchema = z.object({
  odDistance: z.string().optional().default('6/6'),
  osDistance: z.string().optional().default('6/6'),
  ouDistance: z.string().optional(),
  odNear: z.string().optional().default('N6'),
  osNear: z.string().optional().default('N6'),
  ouNear: z.string().optional(),
  rightDistance: z.string().optional(),
  leftDistance: z.string().optional(),
  rightNear: z.string().optional(),
  leftNear: z.string().optional(),
});

export const iopMeasurementSchema = z.object({
  odIop: z.string().optional().default('15'),
  osIop: z.string().optional().default('15'),
  rightEye: z.string().optional(),
  leftEye: z.string().optional(),
  method: z.string().optional().default('Applanation'),
  notes: z.string().optional(),
});

export const refractionSchema = z.object({
  od: z.object({
    sphere: z.string().default('-1.00'),
    cylinder: z.string().default('-0.50'),
    axis: z.string().default('90'),
    add: z.string().default('+0.00'),
    visualAcuity: z.string().default('6/6'),
  }).optional(),
  os: z.object({
    sphere: z.string().default('-1.00'),
    cylinder: z.string().default('-0.50'),
    axis: z.string().default('85'),
    add: z.string().default('+0.00'),
    visualAcuity: z.string().default('6/6'),
  }).optional(),
  rightSph: z.string().optional(),
  rightCyl: z.string().optional(),
  rightAxis: z.string().optional(),
  leftSph: z.string().optional(),
  leftCyl: z.string().optional(),
  leftAxis: z.string().optional(),
});

export const consultationSchema = z.object({
  id: z.string().optional(),
  appointmentId: z.string().min(1, 'Appointment ID is required.'),
  patientId: z.string().min(1, 'Patient ID is required.'),
  doctorId: z.string().min(1, 'Doctor ID is required.'),
  chiefComplaint: z.string().min(3, 'Chief complaint is required.'),
  symptoms: z.string().optional(),
  clinicalNotes: z.string().optional(),
  examinationNotes: z.string().optional(),
  diagnosis: z.string().min(3, 'Diagnosis is required.'),
  followUpDate: z.string().optional(),
  status: z.enum(['draft', 'completed']).default('completed'),
  visualAcuity: visualAcuitySchema.optional(),
  iop: iopMeasurementSchema.optional(),
  refraction: refractionSchema.optional(),
  externalExam: z.any().optional(),
  slitLampExam: z.any().optional(),
  fundusExam: z.any().optional(),
  investigations: z.any().optional(),
  diagnosisDetail: z.any().optional(),
  treatmentPlan: z.any().optional(),
});

export const prescriptionItemSchema = z.object({
  id: z.string().optional(),
  medicineName: z.string().min(2, 'Medicine name is required.'),
  dosage: z.string().min(1, 'Dosage is required.'),
  frequency: z.string().min(1, 'Frequency is required.'),
  duration: z.string().min(1, 'Duration is required.'),
  instructions: z.string().min(1, 'Instructions are required.'),
});

export const prescriptionSchema = z.object({
  id: z.string().optional(),
  consultationId: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required.'),
  doctorId: z.string().min(1, 'Doctor ID is required.'),
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one prescription item is required.'),
});

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required.'),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required.'),
  patientName: z.string().optional(),
  appointmentId: z.string().optional(),
  serviceName: z.string().min(1, 'Service name is required.'),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  totalAmount: z.number().min(0),
  paymentMode: paymentModeEnum.optional().default('UPI'),
  status: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'DRAFT', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  issueDate: z.string().optional(),
  dueDate: z.string().min(4, 'Due date is required.'),
  items: z.array(invoiceItemSchema).optional(),
});

export const hospitalSettingsSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Hospital name is required.'),
  hospitalName: z.string().optional(),
  tagline: z.string().optional(),
  phone: z.string().min(7, 'Phone number is required.'),
  emergencyPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().min(5, 'Address is required.'),
  email: z.string().email('Invalid email address.'),
  opdHours: z.string().optional(),
  operatingHours: z.string().optional(),
  appointmentDurationMinutes: z.number().optional(),
  defaultSlotDuration: z.number().min(5).optional(),
  maxDailyAppointmentsPerDoctor: z.number().min(1).optional(),
  requireAppointmentApproval: z.boolean().optional(),
  taxRatePercentage: z.number().optional(),
  tokenPrefix: z.string().optional(),
  requireTriageBeforeDoctor: z.boolean().optional(),
  enableAuditLogging: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().min(5).optional(),
  requireMfaForStaff: z.boolean().optional(),
});
