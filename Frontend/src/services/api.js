import axios from "axios";
import toast from "react-hot-toast";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  GLOBAL_ERRORS,
  REQUEST_TIMEOUT_MS,
  UI_COOLDOWN,
} from "../config/constants";
import { logClientEvent } from "./log.service";

let unauthorizedHandler = null;
let globalErrorHandler = null;
let rateLimitHandler = null;
let csrfErrorHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const setGlobalErrorHandler = (handler) => {
  globalErrorHandler = handler;
};

export const setRateLimitHandler = (handler) => {
  rateLimitHandler = handler;
};

export const setCsrfErrorHandler = (handler) => {
  csrfErrorHandler = handler;
};

const MAX_RETRY_ATTEMPTS = 1;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use(
  (config) => {
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    if (import.meta.env.DEV) {
      console.info(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config || {};
    const isLogEndpoint = String(originalRequest.url || "").includes(API_ENDPOINTS.LOGS.CREATE);

    if (!error.response) {
      const isRetryableMethod = ["get", "head", "options"].includes(
        (originalRequest.method || "").toLowerCase()
      );
      originalRequest.__retryCount = originalRequest.__retryCount || 0;

      if (isRetryableMethod && originalRequest.__retryCount < MAX_RETRY_ATTEMPTS) {
        originalRequest.__retryCount += 1;
        return api(originalRequest);
      }

      globalErrorHandler?.(GLOBAL_ERRORS.BACKEND_UNAVAILABLE);
      toast.error(GLOBAL_ERRORS.BACKEND_UNAVAILABLE);
      if (!isLogEndpoint) {
        logClientEvent({
          level: "error",
          category: "network",
          message: "Network outage or backend unreachable",
          meta: { url: originalRequest.url || "", method: originalRequest.method || "" },
        });
      }
      return Promise.reject(error);
    }

    if (status === 401) {
      unauthorizedHandler?.();
      if (!isLogEndpoint) {
        logClientEvent({
          level: "warn",
          category: "auth",
          message: "Unauthorized API response",
          meta: { url: originalRequest.url || "" },
        });
      }
      toast.error(GLOBAL_ERRORS.SESSION_EXPIRED);
    }

    if (status === 403 && /csrf|token/i.test(String(error?.response?.data?.message || ""))) {
      csrfErrorHandler?.();
      toast.error(GLOBAL_ERRORS.CSRF_ERROR);
      if (!isLogEndpoint) {
        logClientEvent({
          level: "warn",
          category: "security",
          message: "CSRF protection triggered",
          meta: { url: originalRequest.url || "" },
        });
      }
    }

    if (status === 429) {
      rateLimitHandler?.(UI_COOLDOWN.RATE_LIMIT_MS);
      toast.error(GLOBAL_ERRORS.RATE_LIMITED);
      if (!isLogEndpoint) {
        logClientEvent({
          level: "warn",
          category: "rate-limit",
          message: "Rate limit response received",
          meta: { url: originalRequest.url || "" },
        });
      }
    }

    if (status >= 500) {
      globalErrorHandler?.(GLOBAL_ERRORS.INTERNAL_SERVER);
      toast.error(GLOBAL_ERRORS.INTERNAL_SERVER);
      if (!isLogEndpoint) {
        logClientEvent({
          level: "error",
          category: "server",
          message: "Backend returned server error",
          meta: { url: originalRequest.url || "", status },
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
