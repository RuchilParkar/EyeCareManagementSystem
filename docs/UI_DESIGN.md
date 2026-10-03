# UI & Design System Specification

## Aesthetics & Principles
- **Aesthetic**: Premium modern Healthcare SaaS. Calm, professional, trustworthy, spacious, minimal.
- **Form**: Subtle borders (`#E2E8F0`), clean card surfaces (`#FFFFFF`), light neutral canvas (`#F8FAFC`).
- **Typography**: Inter / Outfit sans-serif font family.
- **Interactions**: Fast 150ms-200ms transitions, focus ring indicators for WCAG accessibility, clear active/hover/disabled states.

## Color Tokens
```css
:root {
  --color-primary: #0F4C81;
  --color-primary-dark: #1E3A8A;
  --color-primary-light: #E0F2FE;
  --color-accent: #0D9488;
  --color-accent-light: #CCFBF1;
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text: #0F172A;
  --color-muted: #64748B;
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: #2563EB;
}
```

## UI Component Standards
- Standardized padding, rounded corners (`rounded-lg`, `rounded-xl`).
- Universal support for `loading`, `disabled`, and `error` states on form controls and action buttons.
