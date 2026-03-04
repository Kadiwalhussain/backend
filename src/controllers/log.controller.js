const MAX_LOG_BUFFER = 500;

const logsBuffer = [];

async function createLogController(req, res) {
  try {
    const { level, category, message, meta, timestamp } = req.body || {};

    if (!level || !category || !message) {
      return res.status(400).json({
        success: false,
        message: "level, category and message are required",
      });
    }

    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      level,
      category,
      message,
      timestamp: timestamp || new Date().toISOString(),
      meta: meta && typeof meta === "object" ? meta : {},
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
    };

    logsBuffer.unshift(entry);
    if (logsBuffer.length > MAX_LOG_BUFFER) {
      logsBuffer.length = MAX_LOG_BUFFER;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[client-log]", entry.level, entry.category, entry.message);
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
}

async function getLogsController(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  return res.status(200).json({
    success: true,
    logs: logsBuffer.slice(0, limit),
  });
}

module.exports = {
  createLogController,
  getLogsController,
};
