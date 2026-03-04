export const APP_NAME = "Banking Fintech";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const REQUEST_TIMEOUT_MS = 15000;

export const GLOBAL_ERRORS = {
  BACKEND_UNAVAILABLE: "Backend is currently unreachable. Please try again shortly.",
  INTERNAL_SERVER: "Something went wrong on the server. Please try again.",
  SESSION_EXPIRED: "Your session expired. Please log in again.",
  RATE_LIMITED: "Too many requests detected. Please wait before retrying.",
  CSRF_ERROR: "Security validation failed. Refresh and try again.",
};

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    RESEND_OTP: "/auth/resend-otp",
    LOGIN: "/auth/login",
    VERIFY_OTP: "/auth/verify-otp",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  ACCOUNT: {
    ME: "/account/me",
    BALANCE: "/account/balance",
    LOOKUP: "/account/lookup",
  },
  TRANSACTION: {
    TRANSFER: "/transaction/transfer",
    HISTORY: "/transaction/history",
    RECENT: "/transaction/recent",
    DETAIL: "/transaction/detail",
  },
  LOGS: {
    CREATE: "/logs",
  },
};

export const AUTH_LIMITS = {
  OTP_LENGTH: 6,
  OTP_MAX_ATTEMPTS: 5,
  OTP_RESEND_SECONDS: 60,
  LOGIN_MAX_ATTEMPTS_UI: 5,
  LOGIN_LOCK_SECONDS_UI: 60,
};

export const UI_COOLDOWN = {
  RATE_LIMIT_MS: 15000,
};
