# Application Architecture

## Folder Layout & Layering
```text
src/
├── app/                  # Next.js App Router route hierarchy
│   ├── about/            # Public About page
│   ├── services/         # Public Services catalog page
│   ├── doctors/          # Public Doctors directory page
│   ├── departments/      # Public Departments overview page
│   ├── contact/          # Public Contact & inquiry page
│   ├── login/            # Role-aware login screen (alias /auth/login)
│   ├── register/         # Patient registration screen (alias /auth/register)
│   ├── forgot-password/  # Password recovery (alias /auth/forgot-password)
│   ├── reset-password/   # Password reset (alias /auth/reset-password)
│   ├── patient/
│   │   ├── onboarding/   # Patient profile completion screen
│   │   └── dashboard/    # Patient portal dashboard placeholder
│   ├── doctor/
│   │   └── dashboard/    # Doctor portal dashboard placeholder
│   ├── admin/
│   │   └── dashboard/    # Admin portal dashboard placeholder
│   ├── globals.css       # Healthcare design tokens CSS variables
│   ├── layout.tsx        # Root layout with AuthProvider, ToastProvider, RoleSwitcher
│   └── page.tsx          # Public Landing Home Page
│
├── components/
│   ├── ui/               # 22 Atomic reusable UI components (Button, Input, Card, Modal, etc.)
│   └── shared/           # Application shell components (PublicHeader, Footer, Sidebar, Topbar, PortalShell, RoleSwitcher)
│
├── contexts/             # React context providers (AuthContext, ToastContext)
├── hooks/                # Custom hooks (useAuth, useToast)
├── lib/
│   ├── api/              # Mock API services (authService, patientService, doctorService, adminService, appointmentService)
│   └── utils/            # General utilities (cn)
├── mock/                 # Mock datasets and domain fixtures
└── types/                # TypeScript domain models and API interface definitions
```
