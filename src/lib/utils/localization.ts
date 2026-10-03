/**
 * Indian Healthcare Localization Utilities
 * Standards: Timezone Asia/Kolkata, Currency INR (₹), Locale en-IN, 10-digit Mobile (+91), UHID & OPD Token conventions.
 */

export const INDIAN_STATES_AND_UTS = [
  // 28 States
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // 8 Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export type IndianStateOrUT = (typeof INDIAN_STATES_AND_UTS)[number];

export const OPHTHALMOLOGY_SPECIALTIES = [
  'General Ophthalmology',
  'Cataract & Refractive Surgery',
  'Cornea & External Disease',
  'Retina & Vitreous Surgery',
  'Glaucoma Service',
  'Pediatric Ophthalmology & Strabismus',
  'Oculoplasty & Orbital Surgery',
  'Neuro-Ophthalmology',
  'Low Vision Rehabilitation',
] as const;

export const APPOINTMENT_TYPES = [
  { id: 'NEW_CONSULTATION', label: 'New Consultation', fee: 500 },
  { id: 'FOLLOW_UP', label: 'Follow-up Consultation', fee: 300 },
  { id: 'ROUTINE_CHECKUP', label: 'Routine Eye Check-up', fee: 400 },
  { id: 'CATARACT_EVALUATION', label: 'Cataract Evaluation', fee: 800 },
  { id: 'RETINA_CHECKUP', label: 'Retina Diagnostic Check-up', fee: 1200 },
  { id: 'GLAUCOMA_SCREENING', label: 'Glaucoma Screening & IOP', fee: 750 },
  { id: 'CORNEA_CONSULTATION', label: 'Cornea Specialty Consultation', fee: 900 },
  { id: 'PEDIATRIC_EYE_CARE', label: 'Pediatric Eye Care', fee: 600 },
  { id: 'POST_OPERATIVE', label: 'Post-operative Check-up', fee: 0 },
  { id: 'EMERGENCY', label: 'Emergency Eye Care', fee: 1000 },
] as const;

export const PAYMENT_MODES = [
  { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm / BHIM)' },
  { id: 'CASH', label: 'Cash' },
  { id: 'DEBIT_CARD', label: 'Debit Card' },
  { id: 'CREDIT_CARD', label: 'Credit Card' },
  { id: 'NET_BANKING', label: 'Net Banking' },
  { id: 'INSURANCE_TPA', label: 'Insurance / TPA Cashless' },
] as const;

/**
 * Format numbers as Indian Rupee (INR / ₹) using en-IN locale
 * e.g., 500 -> ₹500, 1200 -> ₹1,200, 150000 -> ₹1,50,000
 */
export function formatINR(amount: number, showDecimals = false): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: showDecimals ? 2 : 0,
      minimumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  } catch {
    return `₹${amount}`;
  }
}

/**
 * Format date in Indian convention (dd/mm/yyyy or dd MMM yyyy) in Asia/Kolkata timezone
 */
export function formatIndianDate(
  dateInput: string | Date | null | undefined,
  style: 'short' | 'long' = 'short'
): string {
  if (!dateInput) return 'N/A';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    if (style === 'long') {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format time in Indian 12-hour AM/PM format in Asia/Kolkata timezone
 */
export function formatIndianTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Validates 10-digit Indian mobile number (with optional +91 or 0 prefix)
 */
export function validateIndianMobile(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Matches +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX where X is 6-9
  return /^(?:\+?91|0)?[6-9]\d{9}$/.test(cleaned);
}

/**
 * Formats a mobile number into clean Indian +91 format
 */
export function formatIndianMobile(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Validates 6-digit Indian PIN code
 */
export function validatePincode(pincode: string): boolean {
  if (!pincode) return false;
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Server-side UHID Generator (e.g., CVEC-2026-000042)
 * Prefix is configurable via process.env.UHID_PREFIX or default 'CVEC'
 */
export function generateUHID(seqNumber: number, customPrefix?: string): string {
  const prefix = customPrefix || process.env.UHID_PREFIX || 'CVEC';
  const year = new Date().getFullYear();
  const padSeq = String(seqNumber).padStart(6, '0');
  return `${prefix}-${year}-${padSeq}`;
}

/**
 * Server-side OPD Token Generator (e.g., OPD-20260927-015)
 */
export function generateOPDToken(seqNumber: number, dateStr?: string): string {
  const today = dateStr || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const padSeq = String(seqNumber).padStart(3, '0');
  return `OPD-${today}-${padSeq}`;
}
