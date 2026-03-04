import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageTransition from "../components/animations/PageTransition";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { TransactionService } from "../services/transaction.service";
import { formatDateTime } from "../utils/date";
import { formatInr, formatShortId } from "../utils/format";

const MotionDiv = motion.div;

const STATUS_STYLE = {
  COMPLETED: "border-emerald-500/40 bg-emerald-900/20 text-emerald-200",
  PENDING: "border-amber-500/40 bg-amber-900/20 text-amber-200",
  FAILED: "border-red-500/40 bg-red-900/20 text-red-200",
  REVERSED: "border-slate-500/40 bg-slate-800 text-slate-200",
};

const TYPE_STYLE = {
  SENT: "border-rose-500/40 bg-rose-900/20 text-rose-200",
  RECEIVED: "border-emerald-500/40 bg-emerald-900/20 text-emerald-200",
  SYSTEM_CREDIT: "border-cyan-500/40 bg-cyan-900/20 text-cyan-200",
};

const getInitialFilters = (params) => ({
  status: params.get("status") || "",
  type: params.get("type") || "",
  sort: params.get("sort") || "newest",
  fromDate: params.get("fromDate") || "",
  toDate: params.get("toDate") || "",
  minAmount: params.get("minAmount") || "",
  maxAmount: params.get("maxAmount") || "",
  search: params.get("search") || "",
  page: Number(params.get("page") || 1),
  limit: Number(params.get("limit") || 10),
});

const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => getInitialFilters(searchParams));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailData, setDetailData] = useState(null);

  const debouncedSearch = useDebouncedValue(filters.search, 450);

  const historyParams = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
      type: filters.type || undefined,
      sort: filters.sort || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
      search: debouncedSearch || undefined,
    }),
    [
      filters.fromDate,
      filters.limit,
      filters.maxAmount,
      filters.minAmount,
      filters.page,
      filters.sort,
      filters.status,
      filters.toDate,
      filters.type,
      debouncedSearch,
    ]
  );

  const syncQueryParams = useCallback(() => {
    const next = new URLSearchParams();

    Object.entries({ ...filters, search: debouncedSearch }).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        next.set(key, String(value));
      }
    });

    setSearchParams(next, { replace: true });
  }, [debouncedSearch, filters, setSearchParams]);

  const fetchHistory = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const response = await TransactionService.getTransactionHistory(historyParams);
      const list = response?.transactions || [];
      const unique = Array.from(new Map(list.map((item) => [item._id, item])).values());

      setTransactions(unique);
      setPagination(response?.pagination || { total: 0, page: 1, limit: filters.limit, totalPages: 1 });
      setError("");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load transaction history.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters.limit, historyParams]);

  useEffect(() => {
    syncQueryParams();
  }, [syncQueryParams]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchHistory({ silent: true });
      }
    }, 45000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchHistory({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [fetchHistory]);

  const updateFilters = (updates, resetPage = true) => {
    setFilters((prev) => ({
      ...prev,
      ...(resetPage ? { page: 1 } : {}),
      ...updates,
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      status: "",
      type: "",
      sort: "newest",
      fromDate: "",
      toDate: "",
      minAmount: "",
      maxAmount: "",
      search: "",
      page: 1,
    }));
  };

  const openDetail = async (transactionId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailData(null);

    try {
      const response = await TransactionService.getTransactionDetail(transactionId);
      setDetailData(response);
    } catch (requestError) {
      setDetailError(requestError?.response?.data?.message || "Unable to load transaction details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = pagination?.totalPages || 1;

  const changePage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    updateFilters({ page: nextPage }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const lifecycleSteps = useMemo(() => {
    const lifecycle = detailData?.transaction?.lifecycle;
    const status = detailData?.transaction?.status;

    return [
      { key: "PENDING", label: "Pending", timestamp: lifecycle?.pendingAt, active: true },
      {
        key: "COMPLETED",
        label: "Completed",
        timestamp: lifecycle?.completedAt,
        active: status === "COMPLETED",
      },
      {
        key: "FAILED",
        label: "Failed",
        timestamp: lifecycle?.failedAt,
        active: status === "FAILED",
      },
      {
        key: "REVERSED",
        label: "Reversed",
        timestamp: lifecycle?.reversedAt,
        active: status === "REVERSED",
      },
    ];
  }, [detailData?.transaction?.lifecycle, detailData?.transaction?.status]);

  return (
    <PageTransition>
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Transaction History</h1>
            <p className="text-sm text-slate-300">Audit-grade ledger and lifecycle visibility</p>
          </div>
          <button
            type="button"
            onClick={() => setFilterPanelOpen((value) => !value)}
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-brand-primary hover:text-brand-primary"
          >
            {filterPanelOpen ? "Hide Filters" : "Show Filters"}
          </button>
        </header>

        <AnimatePresence>
          {filterPanelOpen ? (
            <MotionDiv
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/70 p-5"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  value={filters.search}
                  onChange={(event) => updateFilters({ search: event.target.value })}
                  placeholder="Search transaction ID"
                  className="rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white"
                />

                <select
                  value={filters.status}
                  onChange={(event) => updateFilters({ status: event.target.value })}
                  className="rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white"
                >
                  <option value="">All statuses</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REVERSED">REVERSED</option>
                </select>

                <select
                  value={filters.type}
                  onChange={(event) => updateFilters({ type: event.target.value })}
                  className="rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white"
                >
                  <option value="">All types</option>
                  <option value="SENT">Sent</option>
                  <option value="RECEIVED">Received</option>
                  <option value="SYSTEM_CREDIT">System Credit</option>
                </select>

                <select
                  value={filters.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value })}
                  className="rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>

                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(event) => updateFilters({ fromDate: event.target.value })}
                  className="rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white"
                />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(event) => updateFilters({ toDate: event.target.value })}
                  className="rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white"
                />
                <input
                  type="number"
                  min="0"
                  value={filters.minAmount}
                  onChange={(event) => updateFilters({ minAmount: event.target.value })}
                  placeholder="Min amount"
                  className="rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white"
                />
                <input
                  type="number"
                  min="0"
                  value={filters.maxAmount}
                  onChange={(event) => updateFilters({ maxAmount: event.target.value })}
                  placeholder="Max amount"
                  className="rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200"
                >
                  Clear Filters
                </button>
                {filters.search ? (
                  <button
                    type="button"
                    onClick={() => updateFilters({ search: "" })}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200"
                  >
                    Clear Search
                  </button>
                ) : null}
              </div>
            </MotionDiv>
          ) : null}
        </AnimatePresence>

        <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <p>Total Records: {pagination?.total || 0}</p>
            <div className="flex items-center gap-2">
              <span>Rows</span>
              <select
                value={filters.limit}
                onChange={(event) => updateFilters({ limit: Number(event.target.value), page: 1 }, false)}
                className="rounded-lg border border-slate-600 bg-slate-950/70 px-2 py-1 text-xs text-white"
              >
                {[10, 20, 50].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-200">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => fetchHistory()}
                className="mt-2 rounded-lg border border-red-300/40 px-3 py-1 text-xs"
              >
                Retry
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-800/70" />
              ))}
            </div>
          ) : transactions.length ? (
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div className="grid grid-cols-8 gap-2 px-3 py-2 text-xs uppercase tracking-wide text-slate-400">
                  <p>ID</p>
                  <p>Type</p>
                  <p>Amount</p>
                  <p>Status</p>
                  <p>Date & Time</p>
                  <p>Counterparty</p>
                  <p>Account</p>
                  <p className="text-right">Action</p>
                </div>

                <AnimatePresence initial={false}>
                  {transactions.map((transaction, index) => (
                    <MotionDiv
                      key={transaction._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ delay: index * 0.015 }}
                      className="mb-2 grid grid-cols-8 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-100 transition hover:border-brand-primary/50"
                    >
                      <p className="font-medium">#{formatShortId(transaction._id)}</p>

                      <span className={`w-fit rounded-full border px-2 py-0.5 text-xs ${TYPE_STYLE[transaction.displayType] || TYPE_STYLE.RECEIVED}`}>
                        {transaction.displayType || "RECEIVED"}
                      </span>

                      <p className="font-semibold text-brand-primary">{formatInr(transaction.amount)}</p>

                      <span className={`w-fit rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[transaction.status] || STATUS_STYLE.PENDING}`}>
                        {transaction.status}
                      </span>

                      <p className="text-xs text-slate-300">{formatDateTime(transaction.createdAt)}</p>

                      <p className="text-xs text-slate-200">
                        {transaction.displayType === "SENT"
                          ? transaction.toUserName || "Receiver"
                          : transaction.fromUserName || "Sender"}
                      </p>

                      <p className="text-xs text-slate-300">
                        {transaction.displayType === "SENT"
                          ? transaction.toAccountNumber
                          : transaction.fromAccountNumber}
                      </p>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(transaction._id)}
                          className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-medium hover:border-brand-primary hover:text-brand-primary"
                        >
                          View Details
                        </button>
                      </div>
                    </MotionDiv>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-slate-700 bg-slate-950/60 p-10 text-center"
            >
              <p className="text-sm text-slate-300">No transactions found for the selected filters.</p>
            </MotionDiv>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              Page {pagination?.page || 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => changePage((pagination?.page || 1) - 1)}
                disabled={(pagination?.page || 1) <= 1}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => changePage((pagination?.page || 1) + 1)}
                disabled={(pagination?.page || 1) >= totalPages}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {detailOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4 backdrop-blur"
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 6 }}
                className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-6 shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-white">Transaction Detail</h2>
                  <button
                    type="button"
                    onClick={() => setDetailOpen(false)}
                    className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-200"
                  >
                    Close
                  </button>
                </div>

                {detailLoading ? (
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-800/70" />
                    ))}
                  </div>
                ) : detailError ? (
                  <div className="mt-4 rounded-xl border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-200">
                    {detailError}
                  </div>
                ) : detailData ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <p>ID: {detailData.transaction._id}</p>
                      <p>Amount: {formatInr(detailData.transaction.amount)}</p>
                      <p>Status: {detailData.transaction.status}</p>
                      <p>Created: {formatDateTime(detailData.transaction.createdAt)}</p>
                      <p>Completed: {formatDateTime(detailData.transaction.lifecycle?.completedAt)}</p>
                      <p>Idempotency: {detailData.transaction.idempotencyKey}</p>
                      <p>Email Notification: {detailData.transaction.emailNotificationStatus}</p>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                      <h3 className="mb-3 text-sm font-semibold text-white">Lifecycle</h3>
                      <div className="space-y-2">
                        {lifecycleSteps.map((step, index) => (
                          <motion.div
                            key={step.key}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block h-2.5 w-2.5 rounded-full ${
                                  step.active ? "bg-brand-primary" : "bg-slate-600"
                                }`}
                              />
                              <p className="text-sm text-slate-200">{step.label}</p>
                            </div>
                            <p className="text-xs text-slate-400">{formatDateTime(step.timestamp)}</p>
                          </motion.div>
                        ))}
                      </div>

                      {detailData.transaction.status === "FAILED" ? (
                        <p className="mt-3 text-xs text-amber-200">
                          Transaction failed. Retry transfer with a new idempotency key from transfer screen.
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
                      <div className="rounded-xl border border-rose-500/40 bg-rose-900/20 p-4 text-sm text-rose-100">
                        <h4 className="font-semibold">DEBIT Entry</h4>
                        <p>Account: {detailData.ledger?.debitEntry?.accountNumber || "--"}</p>
                        <p>Owner: {detailData.ledger?.debitEntry?.accountOwner || "--"}</p>
                        <p>Amount: {formatInr(detailData.ledger?.debitEntry?.amount || 0)}</p>
                        <p>
                          Balance Snapshot: {formatInr(detailData.ledger?.debitEntry?.balanceSnapshot || 0)}
                        </p>
                        <p>Timestamp: {formatDateTime(detailData.ledger?.debitEntry?.createdAt)}</p>
                      </div>

                      <div className="grid place-items-center text-brand-primary">➜</div>

                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/20 p-4 text-sm text-emerald-100">
                        <h4 className="font-semibold">CREDIT Entry</h4>
                        <p>Account: {detailData.ledger?.creditEntry?.accountNumber || "--"}</p>
                        <p>Owner: {detailData.ledger?.creditEntry?.accountOwner || "--"}</p>
                        <p>Amount: {formatInr(detailData.ledger?.creditEntry?.amount || 0)}</p>
                        <p>
                          Balance Snapshot: {formatInr(detailData.ledger?.creditEntry?.balanceSnapshot || 0)}
                        </p>
                        <p>Timestamp: {formatDateTime(detailData.ledger?.creditEntry?.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
};

export default TransactionsPage;
