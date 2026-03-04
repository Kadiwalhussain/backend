import { cn } from "../../utils/cn";

const LoadingOverlay = ({ fullScreen = false, label = "Loading..." }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-slate-900/60 backdrop-blur-sm",
        fullScreen ? "fixed inset-0 z-50" : "min-h-[200px] w-full rounded-2xl"
      )}
    >
      <div className="rounded-2xl border border-slate-700 bg-slate-900/90 px-6 py-4 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="inline-block size-3 animate-pulse rounded-full bg-emerald-400" />
          <p className="text-sm font-medium text-slate-100">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
