#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const sep = trimmed.indexOf("=");
    if (sep <= 0) {
      continue;
    }
    const key = trimmed.slice(0, sep).trim();
    const value = trimmed.slice(sep + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.uci-agent"));

const { config } = require("./config.cjs");
const { createLogger } = require("./logger.cjs");
const { runAgentCycle } = require("./agent.cjs");

const logger = createLogger(config.logLevel);

function parseMode(args) {
  if (args.includes("--watch")) {
    return "watch";
  }
  return "once";
}

async function runOnce() {
  try {
    const result = await runAgentCycle(config, logger);
    logger.info("Resumen del ciclo UCI-F.", result);
  } catch (error) {
    logger.error("Ejecucion fallida del agente UCI-F.", { error: error.message });
    process.exitCode = 1;
  }
}

async function runWatch() {
  logger.info("Modo recurrente activado.", {
    intervalMinutes: config.scanIntervalMinutes,
    transport: config.transport,
    notifyEmail: config.notifyEmail,
  });

  await runOnce();

  const intervalMs = Math.max(1, config.scanIntervalMinutes) * 60 * 1000;
  setInterval(async () => {
    await runOnce();
  }, intervalMs);
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  if (mode === "watch") {
    await runWatch();
    return;
  }
  await runOnce();
}

main();
