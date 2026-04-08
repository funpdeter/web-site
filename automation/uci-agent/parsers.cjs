const { URL } = require("url");
const { repairText } = require("./text.cjs");

const MONTHS = {
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

function decodeEntities(text) {
  if (!text) {
    return "";
  }
  return repairText(
    String(text)
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#([0-9]+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
  );
}

function stripHtml(html) {
  if (!html) {
    return "";
  }
  return decodeEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function extractTitle(html) {
  if (!html) {
    return "";
  }
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    return decodeEntities(titleMatch[1]).replace(/\s+/g, " ").trim();
  }
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    return decodeEntities(h1Match[1]).replace(/\s+/g, " ").trim();
  }
  return "";
}

function normalizeUrl(value, baseUrl) {
  if (!value) {
    return "";
  }
  try {
    let normalized;
    if (value.startsWith("//")) {
      const base = new URL(baseUrl);
      normalized = new URL(`${base.protocol}${value}`);
    } else {
      normalized = new URL(value, baseUrl);
    }
    normalized.hash = "";
    if (normalized.pathname.length > 1 && normalized.pathname.endsWith("/")) {
      normalized.pathname = normalized.pathname.slice(0, -1);
    }
    return normalized.toString();
  } catch (_error) {
    return "";
  }
}

function extractLinks(html, baseUrl) {
  const links = [];
  const seen = new Set();
  if (!html) {
    return links;
  }

  const regex = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match = regex.exec(html);
  while (match) {
    const href = normalizeUrl(match[1], baseUrl);
    const text = stripHtml(match[2]);
    if (href && href.startsWith("http") && !seen.has(href)) {
      seen.add(href);
      links.push({ href, text });
    }
    match = regex.exec(html);
  }

  return links;
}

function extractDuckDuckGoLinks(html) {
  const links = [];
  const seen = new Set();
  const regex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match = regex.exec(html);
  while (match) {
    const raw = decodeEntities(match[1]);
    let href = raw;
    if (raw.includes("uddg=")) {
      const params = raw.split("uddg=");
      const encoded = params[params.length - 1].split("&")[0];
      try {
        href = decodeURIComponent(encoded);
      } catch (_error) {
        href = raw;
      }
    }
    if (!href.startsWith("http")) {
      match = regex.exec(html);
      continue;
    }
    if (!seen.has(href)) {
      seen.add(href);
      links.push({
        href,
        text: stripHtml(match[2]),
      });
    }
    match = regex.exec(html);
  }
  return links;
}

function toNumberLoose(value) {
  if (!value) {
    return null;
  }
  const normalized = String(value).replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractAmount(text, copToUsdRate, eurToUsdRate = 1.08) {
  const safeText = repairText(String(text || ""));
  const usdPattern = /(?:USD|US\$|\$)\s*([0-9][0-9.,]{3,})/gi;
  const eurPattern = /(?:EUR|€)\s*([0-9][0-9.,]{3,})/gi;
  const copPattern = /(?:COP|\$)\s*([0-9][0-9.,]{5,})/gi;

  const amounts = [];
  let match = usdPattern.exec(safeText);
  while (match) {
    const value = toNumberLoose(match[1]);
    if (value) {
      amounts.push({ currency: "USD", value });
    }
    match = usdPattern.exec(safeText);
  }

  match = copPattern.exec(safeText);
  while (match) {
    const value = toNumberLoose(match[1]);
    if (value) {
      amounts.push({ currency: "COP", value });
    }
    match = copPattern.exec(safeText);
  }

  match = eurPattern.exec(safeText);
  while (match) {
    const value = toNumberLoose(match[1]);
    if (value) {
      amounts.push({ currency: "EUR", value });
    }
    match = eurPattern.exec(safeText);
  }

  if (!amounts.length) {
    return {
      detectedCurrency: "",
      detectedAmount: null,
      amountUsd: null,
    };
  }

  const strongest = amounts.sort((a, b) => b.value - a.value)[0];
  if (strongest.currency === "USD") {
    return {
      detectedCurrency: "USD",
      detectedAmount: strongest.value,
      amountUsd: strongest.value,
    };
  }

  if (strongest.currency === "EUR") {
    return {
      detectedCurrency: "EUR",
      detectedAmount: strongest.value,
      amountUsd: strongest.value * eurToUsdRate,
    };
  }

  return {
    detectedCurrency: "COP",
    detectedAmount: strongest.value,
    amountUsd: strongest.value / copToUsdRate,
  };
}

function parseDate(day, month, year) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) {
    return null;
  }
  const iso = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(iso.getTime())) {
    return null;
  }
  return iso;
}

function extractDeadline(text) {
  const safeText = String(text || "").toLowerCase();
  const found = [];

  const numericPattern = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g;
  let match = numericPattern.exec(safeText);
  while (match) {
    const parsed = parseDate(match[1], match[2], match[3]);
    if (parsed) {
      found.push(parsed);
    }
    match = numericPattern.exec(safeText);
  }

  const wordsPattern =
    /(\d{1,2})\s*(?:de)?\s*(enero|january|febrero|february|marzo|march|abril|april|mayo|may|junio|june|julio|july|agosto|august|septiembre|september|setiembre|octubre|october|noviembre|november|diciembre|december)\s*(?:de)?\s*(\d{4})/g;
  match = wordsPattern.exec(safeText);
  while (match) {
    const month = MONTHS[match[2]];
    const parsed = parseDate(match[1], month, match[3]);
    if (parsed) {
      found.push(parsed);
    }
    match = wordsPattern.exec(safeText);
  }

  const wordsPatternReverse =
    /(enero|january|febrero|february|marzo|march|abril|april|mayo|may|junio|june|julio|july|agosto|august|septiembre|september|setiembre|octubre|october|noviembre|november|diciembre|december)\s+(\d{1,2}),?\s+(\d{4})/g;
  match = wordsPatternReverse.exec(safeText);
  while (match) {
    const month = MONTHS[match[1]];
    const parsed = parseDate(match[2], month, match[3]);
    if (parsed) {
      found.push(parsed);
    }
    match = wordsPatternReverse.exec(safeText);
  }

  if (!found.length) {
    return null;
  }

  const now = new Date();
  const future = found.filter((d) => d.getTime() >= now.getTime() - 86400000);
  const selected = (future.length ? future : found).sort((a, b) => a.getTime() - b.getTime())[0];
  return selected.toISOString();
}

function summarizeText(text, maxChars = 540) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars - 3)}...`;
}

function slugify(value) {
  return repairText(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

function hashString(input) {
  let hash = 2166136261;
  const value = String(input || "");
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

module.exports = {
  decodeEntities,
  stripHtml,
  extractTitle,
  extractLinks,
  extractDuckDuckGoLinks,
  extractAmount,
  extractDeadline,
  summarizeText,
  slugify,
  hashString,
  repairText,
};
