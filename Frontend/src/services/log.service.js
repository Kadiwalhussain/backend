import { API_BASE_URL, API_ENDPOINTS } from "../config/constants";

const LOG_LEVELS = ["info", "warn", "error"];

export const logClientEvent = async ({
  level = "info",
  category = "general",
  message,
  meta,
}) => {
  if (!message) return;

  const safeLevel = LOG_LEVELS.includes(level) ? level : "info";

  try {
    await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGS.CREATE}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      level: safeLevel,
      category,
      message,
      meta: meta && typeof meta === "object" ? meta : {},
      timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    if (import.meta.env.DEV) {
      console.warn("[log] failed to send client log");
    }
  }
};
