import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AccountService } from "../services/account.service";
import { useAuth } from "./AuthContext";

const AccountContext = createContext(null);

export const AccountProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const refreshInFlightRef = useRef(false);
  const unmountedRef = useRef(false);

  const dedupeTransactions = useCallback((transactions = []) => {
    const map = new Map();

    transactions.forEach((item) => {
      if (!item?._id) return;
      if (!map.has(item._id)) {
        map.set(item._id, item);
      }
    });

    return Array.from(map.values()).sort(
      (first, second) => new Date(second?.createdAt || 0) - new Date(first?.createdAt || 0)
    );
  }, []);

  const clearAccount = useCallback(() => {
    setAccount(null);
    setBalance(0);
    setRecentTransactions([]);
    setError("");
    setLastSyncedAt(null);
  }, []);

  const refreshAccount = useCallback(async ({ silent = false } = {}) => {
    if (refreshInFlightRef.current) {
      // Already fetching — don't leave caller stuck; just ensure loading resolves
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      clearAccount();
      setLoading(false);
      return;
    }

    refreshInFlightRef.current = true;

    if (!silent) {
      setLoading(true);
    }

    setIsRefreshing(true);

    try {
      const [accountResult, balanceResult, recentResult] = await Promise.allSettled([
        AccountService.getAccount(),
        AccountService.getBalance(),
        AccountService.getRecentTransactions(),
      ]);

      const accountResponse =
        accountResult.status === "fulfilled" ? accountResult.value : { account: null };
      const balanceResponse =
        balanceResult.status === "fulfilled"
          ? balanceResult.value
          : { balance: accountResponse?.account?.balance ?? 0 };
      const recentResponse =
        recentResult.status === "fulfilled" ? recentResult.value : { transactions: [] };

      if (!unmountedRef.current) {
        setAccount(accountResponse?.account || null);
        setBalance(balanceResponse?.balance ?? accountResponse?.account?.balance ?? 0);
        setRecentTransactions(dedupeTransactions(recentResponse?.transactions || []));
        setLastSyncedAt(new Date().toISOString());
        setError("");
      }
    } catch {
      if (!unmountedRef.current) {
        setError("Unable to sync account data. Please retry.");
      }
    } finally {
      refreshInFlightRef.current = false;
      if (!unmountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [clearAccount, dedupeTransactions, isAuthenticated]);

  useEffect(() => {
    unmountedRef.current = false;
    refreshAccount();
    return () => {
      unmountedRef.current = true;
    };
  }, [refreshAccount]);

  useEffect(() => {
    const onStorageSync = (event) => {
      if (event.key === "bank_sync_event") {
        refreshAccount({ silent: true });
      }
    };

    window.addEventListener("storage", onStorageSync);

    return () => {
      window.removeEventListener("storage", onStorageSync);
    };
  }, [refreshAccount]);

  const value = useMemo(
    () => ({
      account,
      balance,
      recentTransactions,
      loading,
      isRefreshing,
      error,
      lastSyncedAt,
      refreshAccount,
      clearAccount,
    }),
    [
      account,
      balance,
      clearAccount,
      error,
      isRefreshing,
      lastSyncedAt,
      loading,
      recentTransactions,
      refreshAccount,
    ]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
};

export const useAccount = () => {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccount must be used inside AccountProvider");
  }

  return context;
};
