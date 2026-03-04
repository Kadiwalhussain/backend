import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ReactConfetti from "react-confetti";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import AuthLayout from "../components/layout/AuthLayout";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import { APP_ROUTES } from "../config/routes";
import { useAccount } from "../context/AccountContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { AccountService } from "../services/account.service";
import { logClientEvent } from "../services/log.service";
import { TransactionService } from "../services/transaction.service";
import { formatInr } from "../utils/format";
import {
  clearPendingTransfer,
  getPendingTransfer,
  savePendingTransfer,
} from "../utils/transfer-flow";
import { transferSchema } from "../utils/validators";

const MotionDiv = motion.div;

const STATUS_TONE = {
  ACTIVE: "border-emerald-500/40 bg-emerald-900/20 text-emerald-200",
  SUSPENDED: "border-amber-500/40 bg-amber-900/20 text-amber-200",
  CLOSED: "border-red-500/40 bg-red-900/20 text-red-200",
};

const resolveTransferError = (error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  if (status === 400 && /Insufficient balance/i.test(message || "")) {
    return "Insufficient balance. Balance may have changed due to another transfer.";
  }

  if (status === 400 && /Self transfer/i.test(message || "")) {
    return "Self transfer is not allowed.";
  }

  if (status === 403) {
    return "Transfer blocked. Please verify account ownership and status.";
  }

  if (status === 401) {
    return "Session expired. Please login again.";
  }

  if (!error?.response) {
    return "Network issue detected. You can retry safely using the same transfer key.";
  }

  return message || "Transfer failed. Please retry.";
};

const TransferPage = () => {
  const navigate = useNavigate();
  const { account, balance, refreshAccount } = useAccount();

  const [receiver, setReceiver] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingTransferState, setPendingTransferState] = useState(getPendingTransfer());

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      receiverQuery: pendingTransferState?.receiverQuery || "",
      amount: pendingTransferState?.amount ? String(pendingTransferState.amount) : "",
    },
  });

  const receiverQuery = watch("receiverQuery");
  const amountInput = watch("amount");
  const debouncedReceiver = useDebouncedValue(receiverQuery, 500);

  const parsedAmount = useMemo(() => Number(amountInput || 0), [amountInput]);
  const remainingBalance = useMemo(
    () => Number(balance || 0) - Number(parsedAmount || 0),
    [balance, parsedAmount]
  );

  const senderBlocked = account?.status !== "ACTIVE";
  const receiverBlocked = receiver ? receiver.status !== "ACTIVE" : false;
  const amountInvalid = parsedAmount <= 0 || Number.isNaN(parsedAmount) || parsedAmount > Number(balance || 0);
  const canSubmit =
    Boolean(receiver) && !amountInvalid && !senderBlocked && !receiverBlocked && !processing;

  useEffect(() => {
    if (!debouncedReceiver || debouncedReceiver.length < 3) {
      setLookupError("");
      setReceiver(null);
      return;
    }

    let cancelled = false;

    const lookup = async () => {
      setLookupLoading(true);
      setLookupError("");

      try {
        const data = await AccountService.lookupReceiver(debouncedReceiver.trim());
        if (cancelled) return;

        if (data?.receiver?.isSelf) {
          setReceiver(null);
          setLookupError("You cannot transfer to your own account.");
          return;
        }

        setReceiver(data?.receiver || null);
      } catch (error) {
        if (cancelled) return;
        setReceiver(null);
        setLookupError(error?.response?.data?.message || "Receiver not found.");
      } finally {
        if (!cancelled) setLookupLoading(false);
      }
    };

    lookup();

    return () => {
      cancelled = true;
    };
  }, [debouncedReceiver]);

  useEffect(() => {
    if (!processing) return;

    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "Transfer is being processed. Leaving now is safe, but confirmation may be delayed.";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [processing]);

  const pendingKey = pendingTransferState?.idempotencyKey || uuidv4();

  const handleOpenConfirm = () => {
    if (!canSubmit) return;
    setConfirmOpen(true);
  };

  const executeTransfer = async () => {
    if (!receiver || !account?._id) return;

    const payload = {
      fromAccount: account._id,
      toAccount: receiver._id,
      amount: parsedAmount,
      idempotencyKey: pendingKey,
      receiverQuery: receiverQuery.trim(),
    };

    setConfirmOpen(false);
    setProcessing(true);
    setLookupError("");
    setResult(null);

    savePendingTransfer(payload);
    setPendingTransferState(payload);
    logClientEvent({
      level: "info",
      category: "transfer",
      message: "Transfer attempt initiated",
      meta: {
        fromAccount: payload.fromAccount,
        toAccount: payload.toAccount,
        amount: payload.amount,
      },
    });

    try {
      const response = await TransactionService.createTransfer(payload);
      const transaction = response?.transaction;

      await refreshAccount({ silent: true });
      clearPendingTransfer();
      setPendingTransferState(null);
      localStorage.setItem("bank_sync_event", String(Date.now()));

      setResult({
        type: "success",
        transaction,
        receiver,
        amount: parsedAmount,
      });

      logClientEvent({
        level: "info",
        category: "transfer",
        message: "Transfer completed",
        meta: {
          transactionId: transaction?._id || null,
          status: transaction?.status || "UNKNOWN",
        },
      });

      toast.success("Transfer completed successfully");
    } catch (error) {
      const message = resolveTransferError(error);

      if (error?.response) {
        clearPendingTransfer();
        setPendingTransferState(null);
      }

      setResult({
        type: "error",
        message,
      });

      logClientEvent({
        level: "error",
        category: "transfer",
        message: "Transfer failed",
        meta: {
          reason: message,
          status: error?.response?.status || null,
        },
      });

      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryPending = async () => {
    if (!pendingTransferState) return;

    setValue("receiverQuery", pendingTransferState.receiverQuery || "");
    setValue("amount", String(pendingTransferState.amount || ""));

    if (!receiver && pendingTransferState.receiverQuery) {
      try {
        const lookup = await AccountService.lookupReceiver(pendingTransferState.receiverQuery);
        setReceiver(lookup?.receiver || null);
      } catch {
        setLookupError("Could not restore receiver details. Re-enter receiver.");
        return;
      }
    }

    await executeTransfer();
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.type === "success") {
      return (
        <MotionDiv
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-900/20 p-6"
        >
          <ReactConfetti recycle={false} numberOfPieces={220} gravity={0.25} />
          <h2 className="text-xl font-semibold text-emerald-200">Transfer Successful</h2>
          <p className="mt-2 text-4xl font-semibold text-white">{formatInr(result.amount)}</p>
          <p className="mt-2 text-sm text-emerald-100">
            Sent to {result.receiver?.owner?.name || result.receiver?.accountNumber}
          </p>
          <p className="mt-1 text-xs text-emerald-100/80">Transaction ID: {result.transaction?._id}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.DASHBOARD)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.TRANSACTIONS)}
              className="rounded-xl border border-emerald-300/50 px-4 py-2 text-sm font-semibold text-emerald-100"
            >
              View Transactions
            </button>
          </div>
        </MotionDiv>
      );
    }

    return (
      <MotionDiv
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        className="mt-6 rounded-2xl border border-red-500/40 bg-red-900/20 p-5"
      >
        <h2 className="text-lg font-semibold text-red-100">Transfer Failed</h2>
        <p className="mt-1 text-sm text-red-200">{result.message}</p>
        <button
          type="button"
          onClick={handleRetryPending}
          className="mt-4 rounded-xl border border-red-300/50 px-4 py-2 text-sm font-semibold text-red-100"
        >
          Retry Safely (Same Key)
        </button>
      </MotionDiv>
    );
  };

  return (
    <AuthLayout
      title="Send Money"
      subtitle="Secure idempotent transfer engine with real-time balance validation."
    >
      {processing ? <LoadingOverlay fullScreen label="Processing transfer securely..." /> : null}

      {senderBlocked ? (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-xs text-amber-200">
          Your account is {account?.status}. Transfers are currently blocked.
        </div>
      ) : null}

      {pendingTransferState ? (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-xs text-amber-200">
          Pending transfer detected. You can retry safely using the same idempotency key.
          <button
            type="button"
            onClick={handleRetryPending}
            className="ml-2 rounded-md border border-amber-300/40 px-2 py-1 font-semibold"
          >
            Retry Pending
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit(handleOpenConfirm)}
        className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5"
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-100">Receiver (Account Number or Email)</span>
          <input
            {...register("receiverQuery")}
            className="w-full rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            placeholder="ACC... or user@example.com"
          />
          {errors.receiverQuery ? (
            <p className="mt-1 text-xs text-red-300">{errors.receiverQuery.message}</p>
          ) : null}

          <div className="mt-2 min-h-6 text-xs">
            {lookupLoading ? <span className="text-slate-400">Checking receiver...</span> : null}
            {!lookupLoading && receiver ? (
              <span className="text-emerald-300">
                ✓ {receiver?.owner?.name} ({receiver?.accountNumber})
              </span>
            ) : null}
            {!lookupLoading && lookupError ? <span className="text-red-300">{lookupError}</span> : null}
          </div>

          {receiver ? (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`rounded-full border px-2 py-0.5 ${STATUS_TONE[receiver.status] || STATUS_TONE.ACTIVE}`}>
                {receiver.status}
              </span>
              <span className="text-slate-300">{receiver?.owner?.email}</span>
              {receiverBlocked ? <span className="text-red-300">Transfer blocked for this receiver.</span> : null}
            </div>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-100">Amount (INR)</span>
          <input
            {...register("amount")}
            inputMode="decimal"
            className="w-full rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            placeholder="0.00"
          />
          {errors.amount ? <p className="mt-1 text-xs text-red-300">{errors.amount.message}</p> : null}

          <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
            <span>Available Balance: {formatInr(balance)}</span>
            <span>Remaining: {formatInr(Math.max(remainingBalance, 0))}</span>
          </div>

          <AnimatePresence>
            {amountInvalid && amountInput ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 text-xs text-red-300"
              >
                Insufficient or invalid amount.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-brand-ink transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Review Transfer
        </button>
      </form>

      {renderResult()}

      <AnimatePresence>
        {confirmOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 px-4 backdrop-blur"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/95 p-6 shadow-soft"
            >
              <h2 className="text-xl font-semibold text-white">Confirm Transfer</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>From: {account?.accountNumber}</p>
                <p>To: {receiver?.accountNumber}</p>
                <p>Receiver: {receiver?.owner?.name}</p>
                <p>Amount: {formatInr(parsedAmount)}</p>
                <p>Remaining Balance: {formatInr(remainingBalance)}</p>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeTransfer}
                  className="flex-1 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-ink"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default TransferPage;
