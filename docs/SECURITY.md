# Security & Privacy Guidelines

## Frontend Security Principles
- **No Client Secrets**: No API credentials or environment secrets in client source code.
- **Privacy-by-Design**: No raw medical history or sensitive records stored in `localStorage` or `sessionStorage`.
- **Role Guards UX Only**: Frontend route protection provides smooth navigation UX; server endpoints will enforce true authorization boundaries in Phase 2.
- **XSS Prevention**: Clean React rendering with automatic escaping, sanitized form inputs with Zod validation.
