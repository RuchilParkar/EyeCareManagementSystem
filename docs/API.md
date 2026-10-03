# API Specification (Mock Service Layer Contract)

## Standard Response Contract

```typescript
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};
```

## Service Abstractions

- `authService`: `login()`, `logout()`, `getCurrentUser()`, `resetPassword()`
- `patientService`: `getPatientProfile()`, `getAppointments()`, `getMedicalRecords()`, `getPrescriptions()`
- `doctorService`: `getDoctorProfile()`, `getSchedule()`, `getQueue()`, `createConsultation()`, `createPrescription()`
- `adminService`: `getDashboardStats()`, `getDoctors()`, `getPatients()`, `getServices()`, `updateSchedule()`
- `appointmentService`: `getAvailableSlots()`, `bookAppointment()`, `cancelAppointment()`, `rescheduleAppointment()`
