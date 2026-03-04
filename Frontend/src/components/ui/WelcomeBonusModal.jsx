import { AnimatePresence, motion } from "framer-motion";
import ReactConfetti from "react-confetti";

const MotionBackdrop = motion.div;
const MotionDialog = motion.div;

const WelcomeBonusModal = ({ open, onClose, transactionId, balance, supportMessage }) => {
  return (
    <AnimatePresence>
      {open ? (
        <MotionBackdrop
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/80 px-4 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ReactConfetti recycle={false} numberOfPieces={320} gravity={0.2} />
          <MotionDialog
            initial={{ scale: 0.9, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="w-full max-w-md rounded-2xl border border-emerald-400/40 bg-slate-900/95 p-6 text-white shadow-soft"
          >
            <h2 className="text-xl font-semibold">Welcome Bonus ₹1000 Credited</h2>
            <p className="mt-2 text-sm text-slate-300">
              Your account has been activated and funded successfully.
            </p>

            <div className="mt-4 space-y-2 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm">
              <p>
                <span className="text-slate-400">Transaction ID:</span>{" "}
                <span className="font-medium">{transactionId || "Pending"}</span>
              </p>
              <p>
                <span className="text-slate-400">Updated Balance:</span>{" "}
                <span className="font-semibold text-brand-primary">₹{Number(balance || 0).toLocaleString("en-IN")}</span>
              </p>
            </div>

            {supportMessage ? (
              <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
                {supportMessage}
              </p>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:scale-[1.01]"
            >
              Continue to Dashboard
            </button>
          </MotionDialog>
        </MotionBackdrop>
      ) : null}
    </AnimatePresence>
  );
};

export default WelcomeBonusModal;
