const fs = require("fs");
const path = require("path");

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function loadState(stateFile) {
  try {
    const raw = fs.readFileSync(stateFile, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { seen: {}, scans: [] };
    }
    return {
      seen: parsed.seen || {},
      scans: Array.isArray(parsed.scans) ? parsed.scans.slice(-30) : [],
    };
  } catch (_error) {
    return { seen: {}, scans: [] };
  }
}

function saveState(stateFile, state) {
  ensureDirForFile(stateFile);
  const stable = {
    seen: state.seen || {},
    scans: Array.isArray(state.scans) ? state.scans.slice(-30) : [],
  };
  fs.writeFileSync(stateFile, JSON.stringify(stable, null, 2), "utf-8");
}

function markSeen(state, fingerprint, metadata) {
  state.seen[fingerprint] = {
    at: new Date().toISOString(),
    ...(metadata || {}),
  };
}

function hasSeen(state, fingerprint) {
  return Boolean(state.seen[fingerprint]);
}

module.exports = {
  loadState,
  saveState,
  markSeen,
  hasSeen,
};
