const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function createLogger(level = "info") {
  const threshold = LEVELS[level] || LEVELS.info;

  function canLog(messageLevel) {
    return (LEVELS[messageLevel] || LEVELS.info) >= threshold;
  }

  function line(messageLevel, message, context) {
    if (!canLog(messageLevel)) {
      return;
    }
    const time = new Date().toISOString();
    const prefix = `[${time}] [${messageLevel.toUpperCase()}]`;
    if (context === undefined) {
      console.log(`${prefix} ${message}`);
      return;
    }
    console.log(`${prefix} ${message}`, context);
  }

  return {
    debug: (message, context) => line("debug", message, context),
    info: (message, context) => line("info", message, context),
    warn: (message, context) => line("warn", message, context),
    error: (message, context) => line("error", message, context),
  };
}

module.exports = {
  createLogger,
};
