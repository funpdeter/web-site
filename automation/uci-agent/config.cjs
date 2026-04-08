const path = require("path");

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

const now = new Date();

const config = {
  enabled: toBoolean(process.env.UCI_AGENT_ENABLED, true),
  scanIntervalMinutes: toNumber(process.env.UCI_SCAN_INTERVAL_MINUTES, 360),
  maxDaysAhead: toNumber(process.env.UCI_MAX_DAYS_AHEAD, 120),
  minAmountUsd: toNumber(process.env.UCI_MIN_AMOUNT_USD, 5000),
  maxAmountUsd: toNumber(process.env.UCI_MAX_AMOUNT_USD, 5000000),
  copToUsdRate: toNumber(process.env.UCI_COP_TO_USD_RATE, 4000),
  eurToUsdRate: toNumber(process.env.UCI_EUR_TO_USD_RATE, 1.08),
  maxLinksPerSource: toNumber(process.env.UCI_MAX_LINKS_PER_SOURCE, 8),
  maxSourcesPerCycle: toNumber(process.env.UCI_MAX_SOURCES_PER_CYCLE, 20),
  alwaysIncludeColombia: toBoolean(process.env.UCI_ALWAYS_INCLUDE_COLOMBIA, true),
  sourceIds: (process.env.UCI_SOURCE_IDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  timeoutMs: toNumber(process.env.UCI_HTTP_TIMEOUT_MS, 20000),
  userAgent:
    process.env.UCI_USER_AGENT ||
    "FUNDETER-UCI-Agent/1.0 (+https://fundeter.org; contacto: info@fundeter.org)",
  useSearchEngine: toBoolean(process.env.UCI_USE_SEARCH_ENGINE, true),
  searchQueriesPerSource: toNumber(process.env.UCI_SEARCH_QUERIES_PER_SOURCE, 2),
  notifyEmail: process.env.UCI_NOTIFY_EMAIL || "info@fundeter.org",
  transport: (process.env.UCI_MAIL_TRANSPORT || "console").trim().toLowerCase(),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: toNumber(process.env.SMTP_PORT, 587),
    secure: toBoolean(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || "",
    from: process.env.RESEND_FROM || "",
  },
  outputDir:
    process.env.UCI_OUTPUT_DIR ||
    path.resolve(__dirname, "output", `${now.getUTCFullYear()}`),
  publicOpportunityFile:
    process.env.UCI_PUBLIC_OPPORTUNITY_FILE ||
    path.resolve(__dirname, "..", "..", "public", "uci-opportunity.json"),
  publicOpportunityHistoryFile:
    process.env.UCI_PUBLIC_OPPORTUNITY_HISTORY_FILE ||
    path.resolve(__dirname, "..", "..", "public", "uci-opportunity-history.json"),
  stateFile:
    process.env.UCI_STATE_FILE ||
    path.resolve(__dirname, "state", "processed-opportunities.json"),
  logLevel: (process.env.UCI_LOG_LEVEL || "info").trim().toLowerCase(),
};

module.exports = {
  config,
  toBoolean,
  toNumber,
};
