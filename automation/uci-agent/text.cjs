const WINDOWS_1252_BYTE_TO_CHAR = {
  0x80: "€",
  0x82: "‚",
  0x83: "ƒ",
  0x84: "„",
  0x85: "…",
  0x86: "†",
  0x87: "‡",
  0x88: "ˆ",
  0x89: "‰",
  0x8a: "Š",
  0x8b: "‹",
  0x8c: "Œ",
  0x8e: "Ž",
  0x91: "‘",
  0x92: "’",
  0x93: "“",
  0x94: "”",
  0x95: "•",
  0x96: "–",
  0x97: "—",
  0x98: "˜",
  0x99: "™",
  0x9a: "š",
  0x9b: "›",
  0x9c: "œ",
  0x9e: "ž",
  0x9f: "Ÿ",
};

const WINDOWS_1252_CHAR_TO_BYTE = Object.entries(WINDOWS_1252_BYTE_TO_CHAR).reduce(
  (acc, [byte, char]) => {
    acc[char] = Number(byte);
    return acc;
  },
  {}
);

const MOJIBAKE_PATTERN = /(?:Ã.|Â.|â.|Å.|ðŸ|ï¿½|�)/g;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g;

function countMatches(value, pattern) {
  const matches = String(value || "").match(pattern);
  return matches ? matches.length : 0;
}

function scoreText(value) {
  return (
    countMatches(value, MOJIBAKE_PATTERN) * 4 +
    countMatches(value, CONTROL_CHAR_PATTERN) * 6 +
    countMatches(value, /�/g) * 8
  );
}

function decodeWindows1252(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return "";
  }

  let output = "";
  for (const byte of buffer.values()) {
    if (Object.prototype.hasOwnProperty.call(WINDOWS_1252_BYTE_TO_CHAR, byte)) {
      output += WINDOWS_1252_BYTE_TO_CHAR[byte];
      continue;
    }
    output += String.fromCharCode(byte);
  }
  return output;
}

function encodeSingleByteText(value, encoding) {
  const bytes = [];

  for (const char of String(value || "")) {
    if (
      encoding === "windows1252" &&
      Object.prototype.hasOwnProperty.call(WINDOWS_1252_CHAR_TO_BYTE, char)
    ) {
      bytes.push(WINDOWS_1252_CHAR_TO_BYTE[char]);
      continue;
    }

    const codePoint = char.codePointAt(0);
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    return null;
  }

  return Buffer.from(bytes);
}

function decodeUtf8FromSingleByteText(value, encoding) {
  const buffer = encodeSingleByteText(value, encoding);
  if (!buffer) {
    return "";
  }

  try {
    return buffer.toString("utf8");
  } catch (_error) {
    return "";
  }
}

function repairText(text) {
  let best = String(text || "");
  let bestScore = scoreText(best);

  if (bestScore === 0) {
    return best;
  }

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const candidates = [
      decodeUtf8FromSingleByteText(best, "latin1"),
      decodeUtf8FromSingleByteText(best, "windows1252"),
    ].filter(Boolean);

    let improved = best;
    let improvedScore = bestScore;

    for (const candidate of candidates) {
      const score = scoreText(candidate);
      if (score < improvedScore) {
        improved = candidate;
        improvedScore = score;
      }
    }

    if (improved === best) {
      break;
    }

    best = improved;
    bestScore = improvedScore;
  }

  return best;
}

function normalizeCharset(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^["']|["']$/g, "");
}

function extractCharsetFromContentType(contentType) {
  const match = String(contentType || "").match(/charset\s*=\s*["']?([^;"'\s]+)/i);
  return match?.[1] || "";
}

function detectHtmlCharset(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return "";
  }

  const sample = buffer.slice(0, 4096).toString("latin1");
  const directMatch = sample.match(/<meta[^>]+charset=["']?\s*([^"'>\s]+)/i);
  if (directMatch?.[1]) {
    return directMatch[1];
  }

  const contentMatch = sample.match(
    /<meta[^>]+content=["'][^"']*charset=([^;"'>\s]+)[^"']*["']/i
  );
  return contentMatch?.[1] || "";
}

function decodeByCharset(buffer, charset) {
  const normalized = normalizeCharset(charset);

  if (
    normalized === "utf-8" ||
    normalized === "utf8" ||
    normalized === "unicode-1-1-utf-8"
  ) {
    return buffer.toString("utf8");
  }

  if (normalized === "utf-16le" || normalized === "utf16le") {
    return buffer.toString("utf16le");
  }

  if (
    normalized === "windows-1252" ||
    normalized === "cp1252" ||
    normalized === "x-cp1252" ||
    normalized === "iso-8859-1" ||
    normalized === "latin1" ||
    normalized === "latin-1"
  ) {
    return decodeWindows1252(buffer);
  }

  return "";
}

function decodeHttpBody(buffer, headers = {}) {
  if (!Buffer.isBuffer(buffer)) {
    return "";
  }

  const contentType = headers["content-type"] || headers["Content-Type"] || "";
  const detectedCharset =
    extractCharsetFromContentType(contentType) || detectHtmlCharset(buffer);
  const declared = decodeByCharset(buffer, detectedCharset);
  if (declared) {
    return declared;
  }

  const utf8 = buffer.toString("utf8");
  const windows1252 = decodeWindows1252(buffer);

  return scoreText(utf8) <= scoreText(windows1252) ? utf8 : windows1252;
}

module.exports = {
  decodeHttpBody,
  repairText,
};
