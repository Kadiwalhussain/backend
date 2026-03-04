# Banking Frontend Foundation (Phase 1)

Production-grade React foundation integrated with the existing Node.js + Express + MongoDB backend using secure httpOnly-cookie auth.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Ensure backend is running on `http://localhost:3000` with CORS origin set to `http://localhost:5173`.

4. Start frontend:

```bash
npm run dev
```

## Key Architecture Decisions

- **Service layer isolation** (`src/services`): keeps API logic centralized, testable, and reusable, while components remain UI-focused.
- **Context-based global state** (`AuthContext`, `AccountContext`): provides lightweight app-wide auth/account state with minimal boilerplate and strong cohesion for this app size.
- **Axios interceptors** (`src/services/api.js`): enforce cross-cutting behavior globally (401 handling, 5xx toast, network failure fallback, request logging).
- **httpOnly cookie auth model**: avoids localStorage token exposure to XSS and relies on browser-managed secure cookies (`withCredentials: true`).
- **Protected route boundary** (`ProtectedRoute`): blocks unauthorized access to sensitive screens and handles auth/account loading gates.

## Implemented Foundation Scope

- Vite + React app scaffold with modular folder architecture.
- React Router v6 route constants and protected-route wrapper.
- Auth bootstrap on app load via `/auth/me`.
- Account bootstrap after auth (`account`, `balance`, `recent transactions`).
- Centralized API service modules (`auth`, `account`, `transaction`).
- UUID idempotency support in transfer service.
- Global loading overlay and global backend/network error banner.
- Tailwind config with fintech palette + soft dark mode.
- Framer Motion page transition wrapper.
- Toast provider and global style baseline.
- ESLint + Prettier configuration.

## Important Backend Contract Notes

Frontend service methods expect these endpoints:

- `POST /api/auth/verify-otp`
- `GET /api/account/balance`
- `GET /api/transaction/recent`
- `GET /api/transaction/history`

If any are missing in backend, corresponding frontend calls fail gracefully but should be implemented server-side for full feature completion in next phases.
