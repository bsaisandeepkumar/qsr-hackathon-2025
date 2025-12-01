// src/utils/logger.js

// Read correlation ID from localStorage (set by backend or generated locally)
function getCorrelationId() {
  let cid = localStorage.getItem("cid");
  if (!cid) {
    cid = crypto.randomUUID();
    localStorage.setItem("cid", cid);
  }
  return cid;
}

// Sends logs to backend for central storage
export async function sendBackendLog(level, message, extra = {}) {
  try {
    await fetch("http://localhost:8000/fe-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-ID": getCorrelationId(),
      },
      body: JSON.stringify({
        level,
        message,
        extra,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn("Failed to send log to backend", err);
  }
}

// Main logging API
export const FELog = {
  info(message, extra) {
    console.info("[FE][INFO]", message, extra || {});
    sendBackendLog("info", message, extra);
  },
  warn(message, extra) {
    console.warn("[FE][WARN]", message, extra || {});
    sendBackendLog("warn", message, extra);
  },
  error(message, extra) {
    console.error("[FE][ERROR]", message, extra || {});
    sendBackendLog("error", message, extra);
  },
  event(name, payload) {
    console.log("[FE][EVENT]", name, payload || {});
    sendBackendLog("event", name, payload);
  }
};
