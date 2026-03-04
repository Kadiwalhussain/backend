import { AnimatePresence, motion as Motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { APP_ROUTES } from "../../config/routes";

const SessionExpiredModal = ({ open, onClose }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open ? (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/85 px-4"
        >
          <Motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-slate-900 p-6"
          >
            <h2 className="text-lg font-semibold text-white">Session Expired</h2>
            <p className="mt-2 text-sm text-slate-300">
              Your secure session ended. Please sign in again.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(APP_ROUTES.LOGIN, { replace: true });
              }}
              className="mt-4 w-full rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-ink"
            >
              Go to Login
            </button>
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default SessionExpiredModal;
