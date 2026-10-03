# User Roles & Matrix

## Role Definitions

### 1. Patient
- **Permissions**: View available services/doctors, book appointments, view/cancel own appointments, view own medical records & prescriptions, update own profile.
- **Restrictions**: Cannot access doctor or admin portals, cannot view other patients' records, cannot modify clinical diagnoses.

### 2. Doctor
- **Permissions**: View assigned patient queue and schedule, open patient medical history for active consultations, enter examination notes & diagnoses, generate prescriptions, update appointment statuses.
- **Restrictions**: Cannot modify system-wide hospital settings, cannot manage staff accounts, cannot access unauthorized patient records outside care workflow.

### 3. Hospital Admin
- **Permissions**: Manage doctor profiles and availability, manage departments and eye care services, view hospital operational statistics, oversee all appointments, audit system activity.
- **Restrictions**: Cannot alter medical consultation notes without authorized medical workflow audit logs.

## Permission Matrix
| Feature | Patient | Doctor | Hospital Admin |
| :--- | :---: | :---: | :---: |
| View Public Site | Yes | Yes | Yes |
| Book Appointment | Yes | No | Yes |
| Consult Patient | No | Yes | No |
| Issue Prescription | No | Yes | No |
| Manage Doctors & Services | No | No | Yes |
| View System Stats | No | No | Yes |
