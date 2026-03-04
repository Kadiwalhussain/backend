import { useEffect, useState } from "react";

const RateLimitNotice = ({ rateLimitUntil }) => {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!rateLimitUntil || rateLimitUntil <= Date.now()) {
      setRemainingMs(0);
      return;
    }

    setRemainingMs(rateLimitUntil - Date.now());

    const timer = setInterval(() => {
      setRemainingMs((value) => {
        if (value <= 1000) {
          clearInterval(timer);
          return 0;
        }
        return value - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitUntil]);

  if (remainingMs <= 0) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[65] -translate-x-1/2 rounded-xl border border-amber-500/40 bg-amber-900/80 px-4 py-2 text-xs font-medium text-amber-100 backdrop-blur">
      Too many requests. Please wait {Math.ceil(remainingMs / 1000)}s.
    </div>
  );
};

export default RateLimitNotice;
