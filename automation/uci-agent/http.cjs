const http = require("http");
const https = require("https");
const { URL } = require("url");
const zlib = require("zlib");
const { decodeHttpBody } = require("./text.cjs");

function decompress(buffer, encoding) {
  if (!encoding) {
    return buffer;
  }
  const normalized = String(encoding).toLowerCase();
  if (normalized.includes("gzip")) {
    return zlib.gunzipSync(buffer);
  }
  if (normalized.includes("deflate")) {
    return zlib.inflateSync(buffer);
  }
  if (normalized.includes("br")) {
    return zlib.brotliDecompressSync(buffer);
  }
  return buffer;
}

function fetchText(url, options = {}) {
  const timeoutMs = options.timeoutMs || 20000;
  const userAgent = options.userAgent || "FUNDETER-UCI-Agent/1.0";
  const maxRedirects = options.maxRedirects || 4;
  const method = (options.method || "GET").toUpperCase();
  const body = options.body || null;
  const extraHeaders = options.headers || {};

  return new Promise((resolve, reject) => {
    function request(currentUrl, redirectsLeft) {
      let parsedUrl;
      try {
        parsedUrl = new URL(currentUrl);
      } catch (error) {
        reject(new Error(`Invalid URL: ${currentUrl}`));
        return;
      }

      const client = parsedUrl.protocol === "https:" ? https : http;

      const req = client.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || undefined,
          path: `${parsedUrl.pathname}${parsedUrl.search}`,
          method,
          headers: {
            "User-Agent": userAgent,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "close",
            ...extraHeaders,
          },
          timeout: timeoutMs,
        },
        (res) => {
          const status = res.statusCode || 0;
          const location = res.headers.location;

          if ([301, 302, 303, 307, 308].includes(status) && location) {
            if (redirectsLeft <= 0) {
              reject(new Error(`Too many redirects: ${currentUrl}`));
              return;
            }
            const redirected = new URL(location, currentUrl).toString();
            request(redirected, redirectsLeft - 1);
            return;
          }

          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            try {
              const raw = Buffer.concat(chunks);
              const inflated = decompress(raw, res.headers["content-encoding"]);
              const body = decodeHttpBody(inflated, res.headers);
              resolve({
                url: currentUrl,
                status,
                body,
                headers: res.headers,
              });
            } catch (error) {
              reject(error);
            }
          });
        }
      );

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy(new Error(`Timeout after ${timeoutMs}ms: ${currentUrl}`));
      });
      if (body) {
        req.write(body);
      }
      req.end();
    }

    request(url, maxRedirects);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  fetchText,
  sleep,
};
