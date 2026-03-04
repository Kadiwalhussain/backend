import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import PageTransition from "../components/animations/PageTransition";
import WelcomeBonusModal from "../components/ui/WelcomeBonusModal";
import { APP_ROUTES } from "../config/routes";
import { useAccount } from "../context/AccountContext";
import { useAuth } from "../context/AuthContext";
import { TransactionService } from "../services/transaction.service";
import { clearWelcomeBonusResult, getWelcomeBonusResult } from "../utils/auth-flow";
import { formatDateTime } from "../utils/date";
import { formatInr, formatShortId, formatTimelineDate } from "../utils/format";

const MotionSection = motion.section;
const MotionArticle = motion.article;

const STATUS_STYLES = {
  ACTIVE: "border-emerald-500/40 bg-emerald-900/20 text-emerald-200",
  SUSPENDED: "border-amber-500/40 bg-amber-900/20 text-amber-200",
  CLOSED: "border-red-500/40 bg-red-900/20 text-red-200",
};

const statusClassName = (status) => STATUS_STYLES[status] || STATUS_STYLES.ACTIVE;

const buildTransactionType = (transaction, accountId) => {
  if (!transaction || !accountId) return "CREDIT";
  return String(transaction.fromAccount) === String(accountId) ? "DEBIT" : "CREDIT";
};

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="h-44 animate-pulse rounded-2xl border border-slate-700 bg-slate-900/70" />
    <div className="h-64 animate-pulse rounded-2xl border border-slate-700 bg-slate-900/70" />
    <div className="h-72 animate-pulse rounded-2xl border border-slate-700 bg-slate-900/70" />
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    account,
    balance,
    recentTransactions,
    loading,
    isRefreshing,
    error,
    lastSyncedAt,
    refreshAccount,
  } = useAccount();

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [expandedTransactionId, setExpandedTransactionId] = useState("");
  const [displayBalance, setDisplayBalance] = useState(0);
  const [bonusOpen, setBonusOpen] = useState(Boolean(getWelcomeBonusResult()));

  const pendingBonus = useMemo(() => getWelcomeBonusResult(), []);
  const accountStatus = account?.status || "ACTIVE";
  const isTransferBlocked = accountStatus === "CLOSED" || accountStatus === "SUSPENDED";
  const previousBalanceRef = useRef(0);

  const mergedRecentTransactions = useMemo(() => {
    const map = new Map();
    [...(recentTransactions || []), ...(history || [])].forEach((item) => {
      if (item?._id && !map.has(item._id)) {
        map.set(item._id, item);
      }
    });

    return Array.from(map.values())
      .sort((first, second) => new Date(second?.createdAt || 0) - new Date(first?.createdAt || 0))
      .slice(0, 5);
  }, [history, recentTransactions]);

  const fetchTransactionHistory = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setHistoryLoading(true);

    try {
      const response = await TransactionService.getTransactionHistory({ limit: 20, page: 1 });
      setHistory(response?.transactions || []);
      setHistoryError("");
    } catch {
      setHistoryError("Unable to load activity timeline right now.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async ({ silent = false } = {}) => {
    await Promise.all([refreshAccount({ silent }), fetchTransactionHistory({ silent })]);
  }, [fetchTransactionHistory, refreshAccount]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = previousBalanceRef.current;
    const to = Number(balance || 0);
    const duration = 650;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(from + (to - from) * progress);
      setDisplayBalance(value);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    previousBalanceRef.current = to;
    return () => cancelAnimationFrame(frame);
  }, [balance]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAll({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshAll({ silent: true });
      }
    }, 45000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      clearInterval(interval);
    };
  }, [refreshAll]);

  const timelineEvents = useMemo(() => {
    const events = [];

    if (account?.createdAt) {
      events.push({
        id: `account-created-${account._id}`,
        title: "Account Created",
        subtitle: `Account ${account.accountNumber || "--"} opened`,
        createdAt: account.createdAt,
        tone: "info",
      });
    }

    history.forEach((transaction) => {
      const direction = buildTransactionType(transaction, account?._id);
      const isWelcomeBonus = String(transaction?.idempotencyKey || "").startsWith("WELCOME_BONUS_");

      events.push({
        id: transaction._id,
        title: isWelcomeBonus
          ? "Welcome Credit Received"
          : direction === "DEBIT"
            ? "Transfer Sent"
            : "Transfer Received",
        subtitle: `${direction === "DEBIT" ? "Debited" : "Credited"} ${formatInr(transaction.amount)}`,
        createdAt: transaction.createdAt,
        tone: isWelcomeBonus ? "success" : direction === "DEBIT" ? "danger" : "success",
      });
    });

    return events.sort(
      (first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0)
    );
  }, [account?._id, account?.accountNumber, account?.createdAt, history]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out securely");
    navigate(APP_ROUTES.LOGIN, { replace: true });
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(account?.accountNumber || "");
      toast.success("Account number copied");
    } catch {
      toast.error("Could not copy account number");
    }
  };

  const welcomeBonusTransaction = mergedRecentTransactions.find((transaction) =>
    String(transaction?.idempotencyKey || "").startsWith("WELCOME_BONUS_")
  );

  if (loading) {
    return (
      <PageTransition>
        <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <DashboardSkeleton />
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Welcome, {user?.name}</h1>
            <p className="text-sm text-slate-300">Live account status and transaction activity</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-brand-primary hover:text-brand-primary"
          >
            Logout
          </button>
        </header>

        {accountStatus === "SUSPENDED" ? (
          <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
            Account is suspended. Transfers are temporarily disabled.
          </div>
        ) : null}

        {accountStatus === "CLOSED" ? (
          <div className="mt-5 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            Account is closed. Transfer operations are blocked.
          </div>
        ) : null}

        {(error || historyError) ? (
          <div className="mt-5 rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            <p>{error || historyError}</p>
            <button
              type="button"
              onClick={() => refreshAll()}
              className="mt-2 rounded-lg border border-red-300/40 px-3 py-1 text-xs font-semibold"
            >
              Retry Sync
            </button>
          </div>
        ) : null}

        <MotionSection
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 rounded-2xl border bg-slate-900/80 p-6 shadow-soft ${
            welcomeBonusTransaction ? "border-emerald-400/50 shadow-[0_0_40px_rgba(52,211,153,0.15)]" : "border-slate-700"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Available Balance</p>
              <p className="mt-2 text-4xl font-semibold text-brand-primary">{formatInr(displayBalance)}</p>
              <p className="mt-2 text-sm text-slate-300">Currency: {account?.currency || "INR"}</p>
            </div>

            <div className="space-y-2 text-right">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassName(accountStatus)}`}
              >
                {accountStatus}
              </span>
              <p className="text-xs text-slate-400">Last sync: {formatDateTime(lastSyncedAt)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-200">
            <span className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5">
              Account: {account?.accountNumber || "--"}
            </span>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium transition hover:border-brand-primary hover:text-brand-primary"
            >
              Copy Account Number
            </button>
            {welcomeBonusTransaction ? (
              <span className="rounded-lg border border-emerald-500/40 bg-emerald-900/20 px-3 py-1.5 text-xs text-emerald-200">
                Welcome bonus credited
              </span>
            ) : null}
          </div>
        </MotionSection>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <MotionSection
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5"
          >
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            <div className="mt-4 space-y-3">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                disabled={isTransferBlocked}
                onClick={() => navigate(APP_ROUTES.TRANSFER)}
                className="w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-ink transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send Money
              </motion.button>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => navigate(APP_ROUTES.TRANSACTIONS)}
                className="w-full rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-brand-primary hover:text-brand-primary"
              >
                View All Transactions
              </motion.button>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                disabled={isRefreshing}
                onClick={() => refreshAll()}
                className="w-full rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefreshing ? "Refreshing..." : "Refresh Balance"}
              </motion.button>
            </div>
          </MotionSection>

          <MotionSection
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 lg:col-span-2"
          >
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>

            {!mergedRecentTransactions.length ? (
              <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/60 p-8 text-center">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="mx-auto mb-3 h-10 w-10 rounded-full bg-slate-700/70"
                />
                <p className="text-sm text-slate-300">No transactions yet. Activity will appear here.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <AnimatePresence initial={false}>
                  {mergedRecentTransactions.map((transaction, index) => {
                    const type = buildTransactionType(transaction, account?._id);
                    const isExpanded = expandedTransactionId === transaction._id;

                    return (
                      <MotionArticle
                        key={transaction._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="rounded-xl border border-slate-700 bg-slate-950/70"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTransactionId((value) =>
                              value === transaction._id ? "" : transaction._id
                            )
                          }
                          className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-100">
                              Txn #{formatShortId(transaction._id)}
                            </p>
                            <p className="text-xs text-slate-400">{formatDateTime(transaction.createdAt)}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                type === "DEBIT"
                                  ? "border-red-500/40 bg-red-900/20 text-red-200"
                                  : "border-emerald-500/40 bg-emerald-900/20 text-emerald-200"
                              }`}
                            >
                              {type}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs ${
                                transaction.status === "COMPLETED"
                                  ? "border-emerald-500/40 bg-emerald-900/20 text-emerald-200"
                                  : transaction.status === "FAILED"
                                    ? "border-red-500/40 bg-red-900/20 text-red-200"
                                    : "border-amber-500/40 bg-amber-900/20 text-amber-200"
                              }`}
                            >
                              {transaction.status}
                            </span>
                            <span className="text-sm font-semibold text-brand-primary">
                              {formatInr(transaction.amount)}
                            </span>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-slate-800"
                            >
                              <div className="grid gap-2 px-4 py-3 text-xs text-slate-300 sm:grid-cols-2">
                                <p>Transaction ID: {transaction._id}</p>
                                <p>Created: {formatDateTime(transaction.createdAt)}</p>
                                <p>From: {formatShortId(String(transaction.fromAccount || ""))}</p>
                                <p>To: {formatShortId(String(transaction.toAccount || ""))}</p>
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </MotionArticle>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </MotionSection>
        </section>

        <MotionSection
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-5"
        >
          <h2 className="text-lg font-semibold text-white">Activity Timeline</h2>

          {historyLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-14 animate-pulse rounded-xl bg-slate-800/70" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-800/70" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-800/70" />
            </div>
          ) : (
            <div className="relative mt-4 space-y-3 pl-6">
              <div className="absolute left-2 top-0 h-full w-px bg-slate-700" />

              {timelineEvents.length ? (
                timelineEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.025 }}
                    className="relative rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3"
                  >
                    <span
                      className={`absolute -left-[18px] top-4 inline-block h-3 w-3 rounded-full ${
                        event.tone === "success"
                          ? "bg-emerald-400"
                          : event.tone === "danger"
                            ? "bg-red-400"
                            : "bg-sky-400"
                      }`}
                    />
                    <p className="text-sm font-medium text-slate-100">{event.title}</p>
                    <p className="text-xs text-slate-300">{event.subtitle}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{formatTimelineDate(event.createdAt)}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Timeline will populate once activity starts.</p>
              )}
            </div>
          )}
        </MotionSection>

        <WelcomeBonusModal
          open={bonusOpen}
          onClose={() => {
            setBonusOpen(false);
            clearWelcomeBonusResult();
          }}
          transactionId={pendingBonus?.transactionId}
          balance={balance}
          supportMessage={pendingBonus?.credited ? null : pendingBonus?.error}
        />
      </main>
    </PageTransition>
  );
};

export default DashboardPage;
