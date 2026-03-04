import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { AuthService } from "../services/auth.service";
import {
  setCsrfErrorHandler,
  setGlobalErrorHandler,
  setRateLimitHandler,
  setUnauthorizedHandler,
} from "../services/api";
import { logClientEvent } from "../services/log.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState(0);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearAuthState();
    setSessionExpired(true);
    toast.error("Session expired. Please log in again.");
    logClientEvent({
      level: "warn",
      category: "auth",
      message: "Session expired and auto-logout executed",
    });
  }, [clearAuthState]);

  const handleRateLimit = useCallback((cooldownMs = 15000) => {
    setRateLimitUntil(Date.now() + cooldownMs);
  }, []);

  const handleCsrf = useCallback(() => {
    setGlobalError("Security verification failed. Please refresh and retry.");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await AuthService.getCurrentUser();
      setUser(response?.user || null);
      setIsAuthenticated(Boolean(response?.user));
      setGlobalError("");
      return response?.user || null;
    } catch {
      clearAuthState();
      return null;
    }
  }, [clearAuthState]);

  const login = useCallback(
    async (payload) => {
      await AuthService.login(payload);
      logClientEvent({
        level: "info",
        category: "auth",
        message: "User login successful",
      });
      return refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  const bootstrappedRef = useRef(false);

  // Register global API error handlers once on mount
  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    setGlobalErrorHandler(setGlobalError);
    setRateLimitHandler(handleRateLimit);
    setCsrfErrorHandler(handleCsrf);

    return () => {
      setUnauthorizedHandler(null);
      setGlobalErrorHandler(null);
      setRateLimitHandler(null);
      setCsrfErrorHandler(null);
    };
  }, [handleCsrf, handleRateLimit, handleUnauthorized]);

  // Bootstrap auth check — runs exactly once on mount
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const bootstrap = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };

    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      globalError,
      login,
      logout,
      refreshUser,
      clearGlobalError: () => setGlobalError(""),
      sessionExpired,
      dismissSessionExpired: () => setSessionExpired(false),
      rateLimitUntil,
    }),
    [
      globalError,
      isAuthenticated,
      loading,
      login,
      logout,
      rateLimitUntil,
      refreshUser,
      sessionExpired,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
