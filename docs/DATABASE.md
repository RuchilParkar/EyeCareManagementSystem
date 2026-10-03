# Data Models & Schema

## Core Domain Entities

```typescript
User { id, email, role, status, createdAt, updatedAt }
Patient { id, userId, patientNumber, firstName, lastName, dateOfBirth, gender, phone, address, emergencyContact }
Doctor { id, userId, doctorNumber, firstName, lastName, specialization, qualification, licenseNumber, phone, bio }
Hospital { id, name, address, phone, email, website }
Department { id, hospitalId, name, description, status }
Service { id, departmentId, name, description, durationMinutes, status }
Appointment { id, patientId, doctorId, serviceId, appointmentDate, startTime, endTime, status, reason }
Consultation { id, appointmentId, patientId, doctorId, chiefComplaint, symptoms, clinicalNotes, examinationNotes, diagnosis, followUpDate }
Prescription { id, consultationId, patientId, doctorId, issuedAt, notes }
PrescriptionItem { id, prescriptionId, medicineName, dosage, frequency, duration, instructions }
Notification { id, userId, title, message, type, readAt, createdAt }
AuditLog { id, actorUserId, action, entityType, entityId, metadata, createdAt }
```
