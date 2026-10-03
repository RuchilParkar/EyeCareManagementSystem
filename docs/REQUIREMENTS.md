# Functional & Non-Functional Requirements

## Functional Requirements
- **Authentication & Authorization**: Role-aware session management (Patient, Doctor, Admin), role redirection, unauthorized access handling.
- **Patient Features**: Profile management, service discovery, interactive appointment booking, appointment cancellation/rescheduling, medical record & prescription history.
- **Doctor Features**: Daily schedule/queue view, consultation workspace, eye examination entry, diagnostic notes, digital prescription generator, follow-up scheduler.
- **Hospital Admin Features**: Staff management (doctor onboarding), department & service management, appointment schedule configuration, operational metrics dashboard.

## Non-Functional Requirements
- **Performance**: Instant page transitions, lightweight bundles, skeleton loading states.
- **Accessibility**: WCAG 2.2 AA compliant contrast, semantic HTML, keyboard-accessible navigation and dialogs.
- **Type Safety**: End-to-end TypeScript strict mode across frontend models and service contracts.
- **Responsive Design**: Mobile (375px), Tablet (768px), Desktop (1440px) layout optimization.
