import { useAuth } from "../../context/AuthContext";

const GlobalErrorBanner = () => {
  const { globalError, clearGlobalError } = useAuth();

  if (!globalError) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-xl border border-red-500/50 bg-red-950/90 px-4 py-3 text-sm text-red-100 backdrop-blur">
        <p>{globalError}</p>
        <button
          type="button"
          onClick={clearGlobalError}
          className="rounded-md border border-red-300/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide transition hover:bg-red-900"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default GlobalErrorBanner;
