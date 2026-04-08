const fs = require("fs");
const { SOURCE_CATALOG, DISCOVERY_KEYWORDS, OPPORTUNITY_URL_HINTS } = require("./sources.cjs");
const { fetchText, sleep } = require("./http.cjs");
const {
  stripHtml,
  extractTitle,
  extractLinks,
  extractDuckDuckGoLinks,
  extractAmount,
  extractDeadline,
  summarizeText,
  hashString,
} = require("./parsers.cjs");
const { repairText } = require("./text.cjs");
const { evaluateFilters, evaluateMatrix, isViable } = require("./eligibility.cjs");
const { loadState, saveState, hasSeen, markSeen } = require("./state.cjs");
const {
  writeOpportunityPackage,
  writePublicOpportunitySnapshot,
  writePublicOpportunityHistory,
} = require("./generator.cjs");
const { sendOpportunityEmail } = require("./mailer.cjs");

const TED_API_URL = "https://api.ted.europa.eu/v3/notices/search";
const SECOP_OPEN_DATA_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";
const MINCIENCIAS_ACTEI_PLAN_URL =
  "https://minciencias.gov.co/plan-convocatorias-actei-2025-2026-0";
const SNAPSHOT_TARGET_REGIONS = ["COLOMBIA", "USA", "EUROPA"];
const MAX_PUBLISHED_OPPORTUNITIES = 10;
const MAX_HISTORY_OPPORTUNITIES = 250;
const MIN_REGION_QUOTAS = {
  COLOMBIA: 3,
  USA: 1,
  EUROPA: 1,
};
const MIN_SOURCE_QUOTAS = {
  minciencias: 2,
};
const USA_REGION_HINTS = ["usaid", "grants.gov", "united states"];
const EUROPE_REGION_HINTS = ["ted-europa", "europeaid", "europe", "europa", "ted.europa.eu"];
const COLOMBIA_REGION_HINTS = [
  "secop",
  "apc-colombia",
  "minciencias",
  "mintic",
  "minambiente",
  "prosperidadsocial",
  "sgr",
  "findeter",
  "gov.co",
  "colombia",
];

const TEXT_KEYWORDS = [
  "convocatoria",
  "grant",
  "funding",
  "call for proposals",
  "proposal",
  "cooperacion",
  "subvencion",
  "donor",
  "ngo",
  "organizacion",
];

const NAVIGATION_HINTS = [
  "quienes-somos",
  "contacto",
  "contact",
  "home",
  "inicio",
  "facebook",
  "twitter",
  "instagram",
  "youtube",
  "linkedin",
  "rss",
  "menu",
  "politica",
  "privacy",
  "terminos",
  "about",
];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function withinWindow(deadlineIso, maxDaysAhead) {
  if (!deadlineIso) {
    return false;
  }
  const deadline = new Date(deadlineIso);
  if (Number.isNaN(deadline.getTime())) {
    return false;
  }
  const now = new Date();
  const delta = deadline.getTime() - now.getTime();
  const days = delta / 86400000;
  return days >= 0 && days <= maxDaysAhead;
}

function toIsoDateTime(value) {
  if (!value) {
    return null;
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function parseNumberLoose(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = String(value).replace(/[^\d.,]/g, "");
  if (!raw) {
    return null;
  }

  let normalized = raw;
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseWholeCurrencyAmount(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toAmount(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function linkLooksRelevant(url, text) {
  const blob = normalize(`${url} ${text}`);
  return OPPORTUNITY_URL_HINTS.some((hint) => blob.includes(hint));
}

function pageLooksRelevant(title, text) {
  const blob = normalize(`${title} ${text}`);
  const matches = TEXT_KEYWORDS.reduce((acc, keyword) => (blob.includes(keyword) ? acc + 1 : acc), 0);
  return matches >= 2;
}

function scoreLink(link) {
  const blob = normalize(`${link.href} ${link.text || ""}`);
  let score = 0;

  if (OPPORTUNITY_URL_HINTS.some((hint) => blob.includes(hint))) {
    score += 3;
  }
  const keywordMatches = DISCOVERY_KEYWORDS.reduce(
    (acc, keyword) => (blob.includes(normalize(keyword)) ? acc + 1 : acc),
    0
  );
  score += Math.min(4, keywordMatches);
  if (NAVIGATION_HINTS.some((hint) => blob.includes(hint))) {
    score -= 3;
  }
  if (blob.includes("http")) {
    score += 1;
  }
  return score;
}

function buildSearchQueries(source, config) {
  if (!config.useSearchEngine || !Array.isArray(source.domains) || !source.domains.length) {
    return [];
  }
  const baseKeywords = ["convocatoria", "grant", "call for proposals", "funding"];
  const filters = ["fundacion", "ngo", "social", "territorial"];
  const queries = [];

  for (const domain of source.domains) {
    const query = `site:${domain} (${baseKeywords.join(" OR ")}) (${filters.join(" OR ")})`;
    queries.push(query);
    if (queries.length >= config.searchQueriesPerSource) {
      break;
    }
  }

  return queries;
}

function parseUsDateToIso(value) {
  if (!value) {
    return null;
  }
  const normalized = String(value).trim();
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return null;
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function toAbsoluteUrl(value, baseUrl) {
  if (!value) {
    return "";
  }
  try {
    return new URL(String(value), baseUrl).toString();
  } catch (_error) {
    return "";
  }
}

function parseTextDateToIso(value) {
  if (!value) {
    return null;
  }

  const normalized = normalize(String(value))
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const monthMap = {
    enero: 1,
    january: 1,
    febrero: 2,
    february: 2,
    marzo: 3,
    march: 3,
    abril: 4,
    april: 4,
    mayo: 5,
    may: 5,
    junio: 6,
    june: 6,
    julio: 7,
    july: 7,
    agosto: 8,
    august: 8,
    septiembre: 9,
    september: 9,
    setiembre: 9,
    octubre: 10,
    october: 10,
    noviembre: 11,
    november: 11,
    diciembre: 12,
    december: 12,
  };

  const patterns = [
    /(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)?\s*(\d{1,2})\s+(enero|january|febrero|february|marzo|march|abril|april|mayo|may|junio|june|julio|july|agosto|august|septiembre|september|setiembre|octubre|october|noviembre|november|diciembre|december)\s+(\d{4})/i,
    /(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)?\s*(enero|january|febrero|february|marzo|march|abril|april|mayo|may|junio|june|julio|july|agosto|august|septiembre|september|setiembre|octubre|october|noviembre|november|diciembre|december)\s+(\d{1,2})\s+(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) {
      continue;
    }
    const monthText = pattern === patterns[0] ? match[2] : match[1];
    const day = Number(pattern === patterns[0] ? match[1] : match[2]);
    const year = Number(match[3]);
    const month = monthMap[monthText];
    if (!month || !Number.isFinite(day) || !Number.isFinite(year)) {
      continue;
    }
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

function parseDeadlineFromRemainingDays(text) {
  if (!text) {
    return null;
  }
  const match = normalize(String(text)).match(/cierra\s+en:\s*(\d+)\s*dia/iu);
  if (!match) {
    return null;
  }
  const remainingDays = Number(match[1]);
  if (!Number.isFinite(remainingDays) || remainingDays < 0) {
    return null;
  }
  const deadline = new Date(Date.now() + remainingDays * 86400000);
  if (Number.isNaN(deadline.getTime())) {
    return null;
  }
  return deadline.toISOString();
}

function parseMincienciasStatus(text) {
  const blob = normalize(text);
  if (blob.includes("convocatoria abierta")) {
    return "abierta";
  }
  if (blob.includes("en evaluacion")) {
    return "evaluacion";
  }
  if (blob.includes("cerrada")) {
    return "cerrada";
  }
  return "desconocido";
}

function extractMincienciasPlanRows(planHtml) {
  const html = String(planHtml || "");
  const tableMatch = html.match(
    /<table[^>]*class="[^"]*tabla-convocatorias-final[^"]*"[^>]*>[\s\S]*?<\/table>/i
  );
  if (!tableMatch) {
    return [];
  }

  const tableHtml = tableMatch[0];
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch = rowRegex.exec(tableHtml);

  while (rowMatch) {
    const rowHtml = rowMatch[1];
    const cells = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch = cellRegex.exec(rowHtml);
    while (cellMatch) {
      cells.push(stripHtml(cellMatch[1]).replace(/\s+/g, " ").trim());
      cellMatch = cellRegex.exec(rowHtml);
    }

    if (cells.length >= 5) {
      const linkMatch = rowHtml.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const url = toAbsoluteUrl(linkMatch?.[1] || "", MINCIENCIAS_ACTEI_PLAN_URL);
      const linkedTitle = stripHtml(linkMatch?.[2] || "").replace(/\s+/g, " ").trim();
      if (url) {
        rows.push({
          number: cells[0],
          title: linkedTitle || cells[1],
          description: cells[2],
          amountText: cells[3],
          openingDateText: cells[4],
          url,
        });
      }
    }

    rowMatch = rowRegex.exec(tableHtml);
  }

  return rows;
}

function extractSecopNoticeUid(opportunityUrl) {
  if (!opportunityUrl) {
    return "";
  }
  try {
    const parsed = new URL(opportunityUrl);
    return parsed.searchParams.get("noticeUID") || "";
  } catch (_error) {
    return "";
  }
}

function flattenXmlText(xmlBody) {
  return repairText(
    String(xmlBody || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function pickTedXmlUrl(links) {
  return links?.xml?.MUL || links?.xml?.ENG || links?.xml?.SPA || "";
}

function pickTedHtmlUrl(links, publicationNumber) {
  const byLanguage =
    links?.html?.ENG ||
    links?.html?.SPA ||
    links?.html?.FRA ||
    links?.htmlDirect?.ENG ||
    links?.htmlDirect?.SPA;

  if (byLanguage) {
    return byLanguage;
  }

  if (!publicationNumber) {
    return "";
  }

  return `https://ted.europa.eu/en/notice/-/detail/${publicationNumber}`;
}

function pickNoticeTitle(rawTitle, fallback) {
  if (!rawTitle) {
    return repairText(fallback);
  }

  if (typeof rawTitle === "string") {
    return repairText(rawTitle);
  }

  if (typeof rawTitle === "object") {
    const preferred = ["eng", "spa", "fra", "deu", "ita", "por"];
    for (const key of preferred) {
      if (rawTitle[key]) {
        return repairText(String(rawTitle[key]));
      }
    }

    const firstValue = Object.values(rawTitle).find(Boolean);
    if (firstValue) {
      return repairText(String(firstValue));
    }
  }

  return repairText(fallback);
}

function extractTedDeadlineIso(xmlBody) {
  const deadlinePattern =
    /<cac:TenderSubmissionDeadlinePeriod>[\s\S]*?<cbc:EndDate>([^<]+)<\/cbc:EndDate>/i;
  const match = String(xmlBody || "").match(deadlinePattern);
  if (!match || !match[1]) {
    return null;
  }
  return toIsoDateTime(match[1]);
}

function extractTedAmount(xmlBody, config) {
  const pattern =
    /<cbc:(?:Amount|EstimatedOverallContractAmount|MaximumAmount|TaxExclusiveAmount|ValueAmount)[^>]*currencyID="([A-Z]{3})"[^>]*>([^<]+)<\/cbc:(?:Amount|EstimatedOverallContractAmount|MaximumAmount|TaxExclusiveAmount|ValueAmount)>/gi;

  const amounts = [];
  let match = pattern.exec(String(xmlBody || ""));
  while (match) {
    const currency = String(match[1] || "").toUpperCase();
    const value = parseNumberLoose(match[2]);
    if (value && ["USD", "EUR"].includes(currency)) {
      amounts.push({ currency, value });
    }
    match = pattern.exec(String(xmlBody || ""));
  }

  if (!amounts.length) {
    return {
      detectedCurrency: "",
      detectedAmount: null,
      amountUsd: null,
    };
  }

  const inRange = amounts.filter(
    (item) => item.value >= config.minAmountUsd && item.value <= config.maxAmountUsd
  );
  const strongest = (inRange.length ? inRange : amounts).sort((a, b) => b.value - a.value)[0];

  return {
    detectedCurrency: strongest.currency,
    detectedAmount: strongest.value,
    amountUsd:
      strongest.currency === "EUR"
        ? strongest.value * (config.eurToUsdRate || 1.08)
        : strongest.value,
  };
}

function inferOpportunityRegion(opportunity) {
  if (String(opportunity.sourceTier || "").toLowerCase() === "nacional") {
    return "COLOMBIA";
  }
  const blob = normalize(
    `${opportunity.sourceId} ${opportunity.sourceName} ${opportunity.sourceTier || ""} ${opportunity.url || ""}`
  );
  if (COLOMBIA_REGION_HINTS.some((hint) => blob.includes(hint))) {
    return "COLOMBIA";
  }
  if (USA_REGION_HINTS.some((hint) => blob.includes(hint))) {
    return "USA";
  }
  if (EUROPE_REGION_HINTS.some((hint) => blob.includes(hint))) {
    return "EUROPA";
  }
  return "INTERNACIONAL";
}

function rankSnapshotCandidates(candidates) {
  return candidates.slice().sort((a, b) => {
    if (a.viable !== b.viable) {
      return a.viable ? -1 : 1;
    }
    const amountEligibleA = Boolean(a.evaluation?.filters?.amountEligible);
    const amountEligibleB = Boolean(b.evaluation?.filters?.amountEligible);
    if (amountEligibleA !== amountEligibleB) {
      return amountEligibleA ? -1 : 1;
    }
    const scoreA = a.evaluation?.matrix?.total || 0;
    const scoreB = b.evaluation?.matrix?.total || 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    const amountA = Number(a.opportunity?.detectedAmount || a.opportunity?.amountUsd || 0);
    const amountB = Number(b.opportunity?.detectedAmount || b.opportunity?.amountUsd || 0);
    return amountB - amountA;
  });
}

function toPublicOpportunityRecord(candidate) {
  const hasDetectedAmount =
    candidate.opportunity.detectedAmount !== null &&
    candidate.opportunity.detectedAmount !== undefined;
  const amountDetected = hasDetectedAmount ? Number(candidate.opportunity.detectedAmount) : NaN;
  const hasAmountUsd =
    candidate.opportunity.amountUsd !== null && candidate.opportunity.amountUsd !== undefined;
  const amountUsd = hasAmountUsd ? Number(candidate.opportunity.amountUsd) : NaN;
  const detectedCurrency = String(candidate.opportunity.detectedCurrency || "").toUpperCase();
  const normalizedCurrency =
    detectedCurrency || (Number.isFinite(amountUsd) ? "USD" : "");

  return {
    id: candidate.opportunity.id,
    sourceId: candidate.opportunity.sourceId,
    title: repairText(candidate.opportunity.title),
    source: repairText(candidate.opportunity.sourceName),
    sourceTier: candidate.opportunity.sourceTier,
    region: inferOpportunityRegion(candidate.opportunity),
    deadline: candidate.opportunity.deadlineIso,
    amount: Number.isFinite(amountDetected)
      ? amountDetected
      : Number.isFinite(amountUsd)
      ? amountUsd
      : null,
    currency: normalizedCurrency,
    amountUsd: Number.isFinite(amountUsd) ? amountUsd : null,
    scoreTotal: candidate.evaluation.matrix.total,
    recommendation: candidate.evaluation.matrix.recommendation,
    isViable: candidate.viable,
    url: candidate.opportunity.url,
    publicationNumber: candidate.opportunity.publicationNumber || null,
  };
}

function toPublicSnapshotOpportunity(candidate) {
  return toPublicOpportunityRecord(candidate);
}

function getPublicOpportunityKey(record) {
  if (!record || typeof record !== "object") {
    return "";
  }
  return String(
    record.id ||
      record.publicationNumber ||
      record.url ||
      `${record.source || ""}|${record.title || ""}`
  ).trim();
}

function readPublicOpportunityHistory(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function buildPublicSnapshot(candidates) {
  const updatedAt = new Date().toISOString();
  if (!Array.isArray(candidates) || !candidates.length) {
    return {
      hasOpportunities: false,
      updatedAt,
      opportunities: [],
      message: "No se encontraron oportunidades evaluadas en este ciclo.",
    };
  }

  const ranked = rankSnapshotCandidates(candidates);
  const selected = [];
  const usedIds = new Set();
  const selectedByRegion = {};
  const selectedBySource = {};

  for (const targetRegion of SNAPSHOT_TARGET_REGIONS) {
    const quota = Number(MIN_REGION_QUOTAS[targetRegion] || 0);
    if (quota <= 0) {
      continue;
    }
    if (selected.length >= MAX_PUBLISHED_OPPORTUNITIES) {
      break;
    }
    const regionalPool = ranked.filter(
      (candidate) =>
        inferOpportunityRegion(candidate.opportunity) === targetRegion &&
        !usedIds.has(candidate.opportunity.id)
    );
    for (const hit of regionalPool) {
      if (selected.length >= MAX_PUBLISHED_OPPORTUNITIES) {
        break;
      }
      const currentCount = Number(selectedByRegion[targetRegion] || 0);
      if (currentCount >= quota) {
        break;
      }
      selected.push(hit);
      usedIds.add(hit.opportunity.id);
      selectedByRegion[targetRegion] = currentCount + 1;
      const sourceId = String(hit.opportunity.sourceId || "").toLowerCase();
      selectedBySource[sourceId] = Number(selectedBySource[sourceId] || 0) + 1;
    }
  }

  for (const sourceId of Object.keys(MIN_SOURCE_QUOTAS)) {
    const quota = Number(MIN_SOURCE_QUOTAS[sourceId] || 0);
    if (quota <= 0 || selected.length >= MAX_PUBLISHED_OPPORTUNITIES) {
      continue;
    }
    const sourcePool = ranked.filter(
      (candidate) =>
        String(candidate.opportunity.sourceId || "").toLowerCase() === sourceId &&
        !usedIds.has(candidate.opportunity.id)
    );
    for (const hit of sourcePool) {
      if (selected.length >= MAX_PUBLISHED_OPPORTUNITIES) {
        break;
      }
      const currentCount = Number(selectedBySource[sourceId] || 0);
      if (currentCount >= quota) {
        break;
      }
      selected.push(hit);
      usedIds.add(hit.opportunity.id);
      selectedBySource[sourceId] = currentCount + 1;
      const region = inferOpportunityRegion(hit.opportunity);
      selectedByRegion[region] = Number(selectedByRegion[region] || 0) + 1;
    }
  }

  for (const candidate of ranked) {
    if (selected.length >= MAX_PUBLISHED_OPPORTUNITIES) {
      break;
    }
    if (usedIds.has(candidate.opportunity.id)) {
      continue;
    }
    selected.push(candidate);
    usedIds.add(candidate.opportunity.id);
    const region = inferOpportunityRegion(candidate.opportunity);
    selectedByRegion[region] = Number(selectedByRegion[region] || 0) + 1;
    const sourceId = String(candidate.opportunity.sourceId || "").toLowerCase();
    selectedBySource[sourceId] = Number(selectedBySource[sourceId] || 0) + 1;
  }

  const regionSummary = SNAPSHOT_TARGET_REGIONS.map((region) => {
    const count = Number(selectedByRegion[region] || 0);
    return `${region}: ${count}`;
  }).join(" | ");

  return {
    hasOpportunities: selected.length > 0,
    updatedAt,
    opportunities: selected.map(toPublicSnapshotOpportunity),
    message:
      selected.length > 0
        ? `Oportunidades detectadas por el agente UCI-F y evaluadas con matriz de elegibilidad. ${regionSummary}`
        : "No se encontraron oportunidades evaluadas en este ciclo.",
  };
}

function buildPublicHistory(candidates, historyFilePath) {
  const updatedAt = new Date().toISOString();
  const previousHistory = readPublicOpportunityHistory(historyFilePath);
  const previousRecords = Array.isArray(previousHistory?.opportunities)
    ? previousHistory.opportunities
    : [];
  const merged = new Map();

  for (const record of previousRecords) {
    const key = getPublicOpportunityKey(record);
    if (!key) {
      continue;
    }
    merged.set(key, {
      ...record,
      title: repairText(record.title),
      source: repairText(record.source),
      firstSeenAt: record.firstSeenAt || record.lastSeenAt || record.updatedAt || updatedAt,
      lastSeenAt: record.lastSeenAt || record.updatedAt || updatedAt,
      lastPublishedAt: record.lastPublishedAt || record.lastSeenAt || record.updatedAt || updatedAt,
      isArchived: record.isArchived !== undefined ? Boolean(record.isArchived) : true,
    });
  }

  const currentKeys = new Set();
  const ranked = rankSnapshotCandidates(candidates);

  for (const candidate of ranked) {
    const record = toPublicOpportunityRecord(candidate);
    const key = getPublicOpportunityKey(record);
    if (!key) {
      continue;
    }
    currentKeys.add(key);
    const previousRecord = merged.get(key);
    merged.set(key, {
      ...previousRecord,
      ...record,
      firstSeenAt: previousRecord?.firstSeenAt || updatedAt,
      lastSeenAt: updatedAt,
      lastPublishedAt: updatedAt,
      isArchived: false,
    });
  }

  const opportunities = Array.from(merged.values())
    .map((record) => {
      const key = getPublicOpportunityKey(record);
      return {
        ...record,
        isArchived: !currentKeys.has(key),
      };
    })
    .sort((a, b) => {
      const lastSeenA = new Date(a.lastSeenAt || a.firstSeenAt || 0).getTime();
      const lastSeenB = new Date(b.lastSeenAt || b.firstSeenAt || 0).getTime();
      if (lastSeenA !== lastSeenB) {
        return lastSeenB - lastSeenA;
      }
      const firstSeenA = new Date(a.firstSeenAt || 0).getTime();
      const firstSeenB = new Date(b.firstSeenAt || 0).getTime();
      return firstSeenB - firstSeenA;
    })
    .slice(0, MAX_HISTORY_OPPORTUNITIES);

  const archivedCount = opportunities.filter((record) => record.isArchived).length;

  return {
    hasOpportunities: opportunities.length > 0,
    updatedAt,
    opportunities,
    message:
      opportunities.length > 0
        ? `Historico acumulado del agente UCI-F. Total: ${opportunities.length} | Archivadas: ${archivedCount}`
        : "Aun no hay historico de oportunidades publicado.",
  };
}

async function fetchGrantsGovSearch(keyword, rows, config, logger) {
  try {
    const payload = JSON.stringify({
      keyword,
      rows,
      oppStatuses: "forecasted|posted",
      sortBy: "",
    });
    const response = await fetchText("https://api.grants.gov/v1/api/search2", {
      timeoutMs: config.timeoutMs,
      userAgent: config.userAgent,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      body: payload,
    });
    const parsed = JSON.parse(response.body);
    return Array.isArray(parsed?.data?.oppHits) ? parsed.data.oppHits : [];
  } catch (error) {
    logger.warn("Busqueda Grants.gov fallida.", { keyword, error: error.message });
    return [];
  }
}

async function fetchGrantsGovDetail(opportunityId, config, logger) {
  try {
    const payload = JSON.stringify({ opportunityId: Number(opportunityId) });
    const response = await fetchText("https://api.grants.gov/v1/api/fetchOpportunity", {
      timeoutMs: config.timeoutMs,
      userAgent: config.userAgent,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      body: payload,
    });
    const parsed = JSON.parse(response.body);
    return parsed?.data || null;
  } catch (error) {
    logger.debug("Detalle Grants.gov no disponible.", { opportunityId, error: error.message });
    return null;
  }
}

async function scanGrantsGovConnector(source, config, logger) {
  const keywords = Array.isArray(source.connectorKeywords) && source.connectorKeywords.length
    ? source.connectorKeywords
    : ["community development", "education", "social", "climate"];
  const hitsById = new Map();

  for (const keyword of keywords.slice(0, 6)) {
    const hits = await fetchGrantsGovSearch(keyword, config.maxLinksPerSource, config, logger);
    for (const hit of hits) {
      if (!hit?.id) {
        continue;
      }
      if (!hitsById.has(String(hit.id))) {
        hitsById.set(String(hit.id), hit);
      }
    }
    await sleep(180);
  }

  const selectedHits = Array.from(hitsById.values()).slice(0, config.maxLinksPerSource * 2);
  const opportunities = [];

  for (const hit of selectedHits) {
    const detail = await fetchGrantsGovDetail(hit.id, config, logger);
    const synopsis = detail?.synopsis || {};

    const deadlineIso =
      parseUsDateToIso(hit.closeDate) ||
      parseUsDateToIso(synopsis.closeDate) ||
      parseUsDateToIso(hit.openDate) ||
      parseUsDateToIso(synopsis.openDate);

    if (!withinWindow(deadlineIso, config.maxDaysAhead)) {
      continue;
    }

    const summarySource =
      synopsis.synopsisDesc ||
      synopsis.fundingDesc ||
      synopsis.applicantEligibilityDesc ||
      hit.title ||
      "";
    const title = repairText(hit.title || `Opportunity ${hit.id}`);
    const detailsText = [
      title,
      synopsis.synopsisDesc,
      synopsis.fundingDesc,
      synopsis.applicantEligibilityDesc,
      synopsis.agencyName,
      synopsis.oppCategoryDesc,
    ]
      .filter(Boolean)
      .map((item) => repairText(item))
      .join(" ");

    const awardCeiling = toAmount(synopsis.awardCeiling);
    const summary = summarizeText(repairText(summarySource), 640);

    opportunities.push({
      id: hashString(`grantsgov|${hit.id}`),
      sourceId: source.id,
      sourceName: source.name,
      sourceTier: source.tier,
      url: `https://www.grants.gov/search-results-detail/${hit.id}`,
      title,
      summary,
      detailsText,
      deadlineIso,
      amountUsd:
        awardCeiling ||
        toAmount(synopsis.estimatedTotalProgramFunding) ||
        toAmount(hit.awardCeiling),
      detectedAmount: awardCeiling,
      detectedCurrency: "USD",
      discoveredAt: new Date().toISOString(),
    });
    await sleep(120);
  }

  logger.info("Conector Grants.gov procesado.", {
    source: source.name,
    searchedHits: selectedHits.length,
    opportunities: opportunities.length,
  });
  return opportunities;
}

async function fetchSecopOpenDataRecords(limit, config, logger) {
  const todayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00.000`;
  const select =
    "entidad,nombre_del_procedimiento,descripci_n_del_procedimiento,estado_de_apertura_del_proceso,fecha_de_recepcion_de,precio_base,urlproceso,departamento_entidad,ciudad_entidad";
  const where = `estado_de_apertura_del_proceso='Abierto' AND fecha_de_recepcion_de >= '${todayStart}'`;
  const order = "fecha_de_recepcion_de ASC";
  const requestUrl =
    `${SECOP_OPEN_DATA_URL}?` +
    `$select=${encodeURIComponent(select)}` +
    `&$where=${encodeURIComponent(where)}` +
    `&$order=${encodeURIComponent(order)}` +
    `&$limit=${encodeURIComponent(String(limit))}`;

  try {
    const response = await fetchText(requestUrl, {
      timeoutMs: config.timeoutMs,
      userAgent: config.userAgent,
      headers: {
        Accept: "application/json",
      },
    });
    if (response.status >= 400) {
      logger.warn("SECOP Open Data respondio con error.", {
        status: response.status,
      });
      return [];
    }
    const parsed = JSON.parse(response.body);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.warn("Consulta SECOP Open Data fallida.", { error: error.message });
    return [];
  }
}

async function scanSecopOpenDataConnector(source, config, logger) {
  const rows = Math.max(config.maxLinksPerSource * 8, 30);
  const records = await fetchSecopOpenDataRecords(rows, config, logger);
  const opportunities = [];

  for (const record of records) {
    const deadlineIso = toIsoDateTime(record.fecha_de_recepcion_de);
    if (!withinWindow(deadlineIso, config.maxDaysAhead)) {
      continue;
    }

    const rawUrl = record?.urlproceso?.url || "";
    const noticeUid = extractSecopNoticeUid(rawUrl);
    const title =
      repairText(String(record.nombre_del_procedimiento || "").trim()) ||
      repairText(String(record.entidad || "").trim());
    const description = repairText(String(record.descripci_n_del_procedimiento || "").trim());
    const entity = repairText(String(record.entidad || "").trim());
    const department = repairText(String(record.departamento_entidad || "").trim());
    const city = repairText(String(record.ciudad_entidad || "").trim());
    const priceCop = parseNumberLoose(record.precio_base);

    const detailsText = [
      title,
      description,
      entity,
      department,
      city,
      "convocatoria",
      "proyecto",
      "territorial",
      "social",
      "cooperacion",
    ]
      .filter(Boolean)
      .join(" ");

    const summary = summarizeText(
      `${title}. Entidad: ${entity || "No identificada"}. Departamento: ${
        department || "No identificado"
      }.`,
      640
    );

    opportunities.push({
      id: hashString(`secop-open-data|${noticeUid || rawUrl || title}`),
      sourceId: source.id,
      sourceName: source.name,
      sourceTier: source.tier,
      url: rawUrl || "https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index",
      title,
      summary,
      detailsText,
      deadlineIso,
      amountUsd: Number.isFinite(priceCop) && priceCop > 0 ? priceCop / config.copToUsdRate : null,
      detectedAmount: Number.isFinite(priceCop) && priceCop > 0 ? priceCop : null,
      detectedCurrency: Number.isFinite(priceCop) && priceCop > 0 ? "COP" : "",
      discoveredAt: new Date().toISOString(),
    });

    if (opportunities.length >= config.maxLinksPerSource * 2) {
      break;
    }
  }

  logger.info("Conector SECOP Open Data procesado.", {
    source: source.name,
    fetchedRecords: records.length,
    opportunities: opportunities.length,
  });
  return opportunities;
}

async function fetchMincienciasActeiRows(config, logger) {
  try {
    const response = await fetchText(MINCIENCIAS_ACTEI_PLAN_URL, {
      timeoutMs: config.timeoutMs,
      userAgent: config.userAgent,
    });
    if (response.status >= 400) {
      logger.warn("Plan ACTeI de Minciencias respondio con error.", {
        status: response.status,
      });
      return [];
    }
    return extractMincienciasPlanRows(response.body);
  } catch (error) {
    logger.warn("No se pudo consultar el plan ACTeI de Minciencias.", {
      error: error.message,
    });
    return [];
  }
}

async function scanMincienciasActeiConnector(source, config, logger) {
  const planRows = await fetchMincienciasActeiRows(config, logger);
  const limitedRows = planRows.slice(0, Math.max(config.maxLinksPerSource * 3, 12));
  const opportunities = [];

  for (const row of limitedRows) {
    try {
      const response = await fetchText(row.url, {
        timeoutMs: config.timeoutMs,
        userAgent: config.userAgent,
      });
      if (response.status >= 400) {
        continue;
      }

      const detailsText = stripHtml(response.body).replace(/\s+/g, " ").trim().slice(0, 30000);
      const status = parseMincienciasStatus(detailsText);
      if (status !== "abierta") {
        continue;
      }

      const deadlineIso =
        parseDeadlineFromRemainingDays(detailsText) ||
        extractDeadline(detailsText) ||
        parseTextDateToIso(row.openingDateText);

      if (!withinWindow(deadlineIso, config.maxDaysAhead)) {
        continue;
      }

      const amountFromRowCop = parseWholeCurrencyAmount(row.amountText);
      const amountFromPage = extractAmount(detailsText, config.copToUsdRate, config.eurToUsdRate);
      const detectedAmount =
        Number.isFinite(amountFromRowCop) && amountFromRowCop > 0
          ? amountFromRowCop
          : amountFromPage.detectedAmount;
      const detectedCurrency =
        Number.isFinite(amountFromRowCop) && amountFromRowCop > 0
          ? "COP"
          : amountFromPage.detectedCurrency;
      const amountUsd =
        Number.isFinite(amountFromRowCop) && amountFromRowCop > 0
          ? amountFromRowCop / config.copToUsdRate
          : amountFromPage.amountUsd;

      const title = repairText(row.title || extractTitle(response.body) || "Convocatoria Minciencias");
      const summary = summarizeText(
        repairText(`${title}. Convocatoria ${row.number}. ${row.description || ""}`.trim()),
        640
      );

      opportunities.push({
        id: hashString(`minciencias-actei|${row.number}|${row.url}`),
        sourceId: source.id,
        sourceName: source.name,
        sourceTier: source.tier,
        url: row.url,
        title,
        summary,
        detailsText,
        deadlineIso,
        amountUsd: Number.isFinite(amountUsd) ? amountUsd : null,
        detectedAmount: Number.isFinite(detectedAmount) ? detectedAmount : null,
        detectedCurrency: detectedCurrency || "",
        publicationNumber: row.number || null,
        discoveredAt: new Date().toISOString(),
      });

      if (opportunities.length >= config.maxLinksPerSource * 2) {
        break;
      }

      await sleep(180);
    } catch (error) {
      logger.debug("No se pudo inspeccionar convocatoria ACTeI.", {
        url: row.url,
        error: error.message,
      });
    }
  }

  logger.info("Conector Minciencias ACTeI procesado.", {
    source: source.name,
    planRows: planRows.length,
    opportunities: opportunities.length,
  });

  return opportunities;
}

async function fetchTedSearch(query, limit, config, logger) {
  try {
    const payload = JSON.stringify({
      query,
      page: 1,
      limit,
      fields: ["publication-number", "publication-date", "notice-title", "buyer-country", "links"],
    });

    const response = await fetchText(TED_API_URL, {
      timeoutMs: config.timeoutMs,
      userAgent: config.userAgent,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      body: payload,
    });

    if (response.status >= 400) {
      logger.warn("Busqueda TED API respondio con error.", {
        query,
        status: response.status,
      });
      return [];
    }

    const parsed = JSON.parse(response.body);
    return Array.isArray(parsed?.notices) ? parsed.notices : [];
  } catch (error) {
    logger.warn("Busqueda TED API fallida.", { query, error: error.message });
    return [];
  }
}

async function scanTedEuropeConnector(source, config, logger) {
  const queries = Array.isArray(source.connectorQueries) && source.connectorQueries.length
    ? source.connectorQueries
    : ["publication-date>=today(-30) AND notice-type=cn-standard"];

  const noticesByPublication = new Map();
  const searchLimit = Math.max(config.maxLinksPerSource * 8, 30);

  for (const query of queries.slice(0, 4)) {
    const notices = await fetchTedSearch(query, searchLimit, config, logger);
    for (const notice of notices) {
      const publicationNumber = String(notice?.["publication-number"] || "").trim();
      if (!publicationNumber) {
        continue;
      }
      if (!noticesByPublication.has(publicationNumber)) {
        noticesByPublication.set(publicationNumber, notice);
      }
    }
    await sleep(200);
  }

  const selectedNotices = Array.from(noticesByPublication.values()).slice(0, config.maxLinksPerSource * 12);
  const opportunities = [];

  for (const notice of selectedNotices) {
    const publicationNumber = String(notice?.["publication-number"] || "").trim();
    const xmlUrl = pickTedXmlUrl(notice?.links);
    if (!xmlUrl || !publicationNumber) {
      continue;
    }

    try {
      const response = await fetchText(xmlUrl, {
        timeoutMs: config.timeoutMs,
        userAgent: config.userAgent,
      });
      if (response.status >= 400) {
        continue;
      }

      const xmlBody = response.body;
      const deadlineIso = extractTedDeadlineIso(xmlBody);
      if (!withinWindow(deadlineIso, config.maxDaysAhead)) {
        continue;
      }

      const amount = extractTedAmount(xmlBody, config);
      const title = pickNoticeTitle(notice?.["notice-title"], `Notice ${publicationNumber}`);
      const buyerCountry = Array.isArray(notice?.["buyer-country"])
        ? notice["buyer-country"].join(", ")
        : String(notice?.["buyer-country"] || "");
      const publicationDateIso = toIsoDateTime(notice?.["publication-date"]);
      const htmlUrl = pickTedHtmlUrl(notice?.links, publicationNumber);

      const textPlain = flattenXmlText(xmlBody);
      const detailsText = `${title} ${textPlain}`.slice(0, 20000);
      const summary = summarizeText(
        repairText(
          `${title}. Publicacion TED ${publicationNumber}. Pais comprador: ${
            buyerCountry || "No identificado"
          }.`
        ),
        640
      );

      opportunities.push({
        id: hashString(`ted|${publicationNumber}`),
        sourceId: source.id,
        sourceName: source.name,
        sourceTier: source.tier,
        url: htmlUrl || xmlUrl,
        title,
        summary,
        detailsText,
        deadlineIso,
        amountUsd: amount.amountUsd,
        detectedAmount: amount.detectedAmount,
        detectedCurrency: amount.detectedCurrency,
        publicationNumber,
        publicationDateIso,
        discoveredAt: new Date().toISOString(),
      });

      if (opportunities.length >= config.maxLinksPerSource * 2) {
        break;
      }

      await sleep(110);
    } catch (error) {
      logger.debug("No se pudo inspeccionar notice TED.", {
        publicationNumber,
        error: error.message,
      });
    }
  }

  logger.info("Conector TED Europa procesado.", {
    source: source.name,
    searchedNotices: selectedNotices.length,
    opportunities: opportunities.length,
  });

  return opportunities;
}

async function discoverLinksFromSeed(seedUrl, config, logger) {
  try {
    const response = await fetchText(seedUrl, {
      timeoutMs: config.timeoutMs,
      userAgent: config.userAgent,
    });
    if (response.status >= 400) {
      logger.warn("Seed URL respondio con error.", { seedUrl, status: response.status });
      return [];
    }
    return extractLinks(response.body, seedUrl);
  } catch (error) {
    logger.warn("No se pudo leer seed URL.", { seedUrl, error: error.message });
    return [];
  }
}

async function discoverLinksFromSearch(query, config, logger) {
  try {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=es-es`;
    const response = await fetchText(url, {
      timeoutMs: config.timeoutMs,
      userAgent: config.userAgent,
    });
    if (response.status >= 400) {
      logger.warn("Busqueda web respondio con error.", { query, status: response.status });
      return [];
    }
    return extractDuckDuckGoLinks(response.body);
  } catch (error) {
    logger.warn("Busqueda web fallida.", { query, error: error.message });
    return [];
  }
}

function dedupeLinks(links) {
  const seen = new Set();
  const output = [];
  for (const link of links) {
    if (!link || !link.href || seen.has(link.href)) {
      continue;
    }
    seen.add(link.href);
    output.push(link);
  }
  return output;
}

async function inspectOpportunity(link, source, config, logger) {
  try {
    const response = await fetchText(link.href, {
      timeoutMs: config.timeoutMs,
      userAgent: config.userAgent,
    });
    if (response.status >= 400) {
      return null;
    }

    const title = repairText(extractTitle(response.body) || link.text || "Oportunidad sin titulo");
    const plain = stripHtml(response.body).replace(/\s+/g, " ").trim();
    if (!pageLooksRelevant(title, plain)) {
      return null;
    }

    const summary = summarizeText(plain, 640);
    const detailsText = plain.slice(0, 20000);
    const deadlineIso = extractDeadline(detailsText);
    if (!withinWindow(deadlineIso, config.maxDaysAhead)) {
      return null;
    }

    const amount = extractAmount(detailsText, config.copToUsdRate, config.eurToUsdRate);

    return {
      id: hashString(`${source.id}|${link.href}|${title}`),
      sourceId: source.id,
      sourceName: source.name,
      sourceTier: source.tier,
      url: link.href,
      title,
      summary,
      detailsText,
      deadlineIso,
      amountUsd: amount.amountUsd,
      detectedAmount: amount.detectedAmount,
      detectedCurrency: amount.detectedCurrency,
      discoveredAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.debug("No se pudo inspeccionar posible oportunidad.", {
      url: link.href,
      error: error.message,
    });
    return null;
  }
}

async function scanSource(source, state, config, logger) {
  logger.info(`Escaneando fuente: ${source.name}`);

  if (source.connector === "secopOpenData") {
    return scanSecopOpenDataConnector(source, config, logger);
  }

  if (source.connector === "grantsGovSearch2") {
    return scanGrantsGovConnector(source, config, logger);
  }

  if (source.connector === "mincienciasActeiPlan") {
    return scanMincienciasActeiConnector(source, config, logger);
  }

  if (source.connector === "tedEuSearch") {
    return scanTedEuropeConnector(source, config, logger);
  }

  const discovered = [];

  for (const seedUrl of source.seedUrls || []) {
    const links = await discoverLinksFromSeed(seedUrl, config, logger);
    discovered.push(...links);
    await sleep(220);
  }

  for (const query of buildSearchQueries(source, config)) {
    const links = await discoverLinksFromSearch(query, config, logger);
    discovered.push(...links);
    await sleep(250);
  }

  const uniqueLinks = dedupeLinks(discovered);
  const ranked = uniqueLinks
    .map((link) => ({ ...link, score: scoreLink(link) }))
    .filter((link) => link.score > 0)
    .sort((a, b) => b.score - a.score);

  const filteredForOpportunity = ranked.filter((link) => linkLooksRelevant(link.href, link.text));
  const candidatePool = filteredForOpportunity.length ? filteredForOpportunity : ranked;
  const limitedLinks = candidatePool.slice(0, config.maxLinksPerSource);

  logger.info("Links candidatos seleccionados.", {
    source: source.name,
    discovered: discovered.length,
    unique: uniqueLinks.length,
    selected: limitedLinks.length,
  });
  const opportunities = [];

  for (const link of limitedLinks) {
    const fingerprint = hashString(link.href);
    if (hasSeen(state, fingerprint)) {
      continue;
    }
    const opportunity = await inspectOpportunity(link, source, config, logger);
    if (!opportunity) {
      markSeen(state, fingerprint, {
        sourceId: source.id,
        url: link.href,
        viable: false,
      });
      continue;
    }
    opportunities.push(opportunity);
    await sleep(350);
  }

  return opportunities;
}

function buildSourceList(config) {
  const requestedSources = Array.isArray(config.sourceIds) && config.sourceIds.length
    ? SOURCE_CATALOG.filter((source) => config.sourceIds.includes(source.id))
    : SOURCE_CATALOG.slice();

  if (!config.alwaysIncludeColombia) {
    return requestedSources.slice(0, config.maxSourcesPerCycle);
  }

  const colombiaSources = SOURCE_CATALOG.filter((source) => source.tier === "nacional");
  const mergedMap = new Map(requestedSources.map((source) => [source.id, source]));

  for (const source of colombiaSources) {
    if (!mergedMap.has(source.id)) {
      mergedMap.set(source.id, source);
    }
  }

  const colombiaIds = new Set(colombiaSources.map((source) => source.id));
  const prioritized = Array.from(mergedMap.values()).sort((a, b) => {
    const aIsColombia = colombiaIds.has(a.id);
    const bIsColombia = colombiaIds.has(b.id);
    if (aIsColombia !== bIsColombia) {
      return aIsColombia ? -1 : 1;
    }
    return 0;
  });

  return prioritized.slice(0, config.maxSourcesPerCycle);
}

async function runAgentCycle(config, logger) {
  const startedAt = new Date().toISOString();
  if (!config.enabled) {
    logger.warn("UCI agent desactivado por configuracion.");
    return { scanned: 0, viable: 0, sent: 0, startedAt, endedAt: new Date().toISOString() };
  }

  const state = loadState(config.stateFile);
  const sourceList = buildSourceList(config);
  logger.info("Fuentes activas para este ciclo.", {
    total: sourceList.length,
    alwaysIncludeColombia: Boolean(config.alwaysIncludeColombia),
    sourceIds: sourceList.map((source) => source.id),
  });
  const allCandidates = [];

  for (const source of sourceList) {
    try {
      const opportunities = await scanSource(source, state, config, logger);
      allCandidates.push(...opportunities);
    } catch (error) {
      logger.warn("Fallo el escaneo de fuente.", { source: source.name, error: error.message });
    }
  }

  let viableCount = 0;
  let sentCount = 0;
  const evaluatedCandidates = [];

  for (const opportunity of allCandidates) {
    const fingerprint = hashString(opportunity.url);
    if (hasSeen(state, fingerprint)) {
      continue;
    }

    const filters = evaluateFilters(opportunity, config);
    const matrix = evaluateMatrix(opportunity);
    const evaluation = { filters, matrix };
    const viable = isViable(filters, matrix);

    evaluatedCandidates.push({
      opportunity,
      evaluation,
      viable,
    });

    if (!viable) {
      logger.info("Candidata descartada por filtros o puntaje.", {
        source: opportunity.sourceName,
        title: opportunity.title,
        totalScore: matrix.total,
        recommendation: matrix.recommendation,
        filters,
      });
      markSeen(state, fingerprint, {
        sourceId: opportunity.sourceId,
        url: opportunity.url,
        viable: false,
        reason: matrix.recommendation,
      });
      continue;
    }

    viableCount += 1;

    const pkg = writeOpportunityPackage(config.outputDir, opportunity, evaluation);
    try {
      const result = await sendOpportunityEmail(
        config,
        logger,
        opportunity,
        evaluation,
        pkg.emailAttachments
      );
      if (result.sent) {
        sentCount += 1;
      }
      markSeen(state, fingerprint, {
        sourceId: opportunity.sourceId,
        url: opportunity.url,
        viable: true,
        emailMode: result.mode,
        packageDir: pkg.packageDir,
      });
    } catch (error) {
      logger.error("No se pudo enviar correo de oportunidad.", {
        title: opportunity.title,
        error: error.message,
      });
      markSeen(state, fingerprint, {
        sourceId: opportunity.sourceId,
        url: opportunity.url,
        viable: true,
        emailError: error.message,
        packageDir: pkg.packageDir,
      });
    }
  }

  const snapshotCandidates = evaluatedCandidates.length
    ? evaluatedCandidates
    : allCandidates.map((opportunity) => {
        const filters = evaluateFilters(opportunity, config);
        const matrix = evaluateMatrix(opportunity);
        return {
          opportunity,
          evaluation: { filters, matrix },
          viable: isViable(filters, matrix),
        };
      });

  try {
    writePublicOpportunitySnapshot(config.publicOpportunityFile, buildPublicSnapshot(snapshotCandidates));
  } catch (error) {
    logger.warn("No se pudo actualizar el snapshot publico de oportunidades.", {
      file: config.publicOpportunityFile,
      error: error.message,
    });
  }

  try {
    writePublicOpportunityHistory(
      config.publicOpportunityHistoryFile,
      buildPublicHistory(snapshotCandidates, config.publicOpportunityHistoryFile)
    );
  } catch (error) {
    logger.warn("No se pudo actualizar el historico publico de oportunidades.", {
      file: config.publicOpportunityHistoryFile,
      error: error.message,
    });
  }

  state.scans.push({
    startedAt,
    endedAt: new Date().toISOString(),
    scannedCandidates: allCandidates.length,
    viableCandidates: viableCount,
    sentNotifications: sentCount,
    transport: config.transport,
  });
  saveState(config.stateFile, state);

  logger.info("Ciclo finalizado.", {
    scannedCandidates: allCandidates.length,
    viableCandidates: viableCount,
    sentNotifications: sentCount,
  });

  return {
    scanned: allCandidates.length,
    viable: viableCount,
    sent: sentCount,
    startedAt,
    endedAt: new Date().toISOString(),
  };
}

module.exports = {
  runAgentCycle,
  normalize,
  withinWindow,
  pageLooksRelevant,
  buildSearchQueries,
  dedupeLinks,
  inferOpportunityRegion,
  buildPublicSnapshot,
  buildPublicHistory,
};
