import { useEffect } from "react";

import { logClientEvent } from "../services/log.service";

export const useGlobalMonitoring = () => {
  useEffect(() => {
    const onOnline = () => {
      logClientEvent({
        level: "info",
        category: "network",
        message: "Network connection restored",
      });
    };

    const onOffline = () => {
      logClientEvent({
        level: "warn",
        category: "network",
        message: "Network connectivity lost",
      });
    };

    const onUnhandledRejection = (event) => {
      logClientEvent({
        level: "error",
        category: "unhandled-rejection",
        message: event?.reason?.message || "Unhandled promise rejection",
      });
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
};
