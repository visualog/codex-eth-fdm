#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const TIMEOUT_MS = 15000;
const MAX_WARNINGS = 16;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "eth-dashboard-api-"));

const endpoints = [
  {
    name: "binanceTicker",
    url: "https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT",
    critical: true,
    parse: value => {
      assert(value && typeof value === "object" && !Array.isArray(value), "ticker must be an object");
      assert(typeof value.lastPrice === "string", "ticker must include lastPrice");
      assert(typeof value.priceChangePercent === "string", "ticker must include priceChangePercent");
      return { freshnessMs: null };
    }
  },
  {
    name: "ethMarketChart",
    url: "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=365&interval=daily",
    critical: true,
    parse: value => {
      assert(Array.isArray(value?.prices), "market chart must include prices");
      assert(value.prices.length >= 365, "market chart must include at least 365 price points");
      const latest = value.prices[value.prices.length - 1];
      assert(Array.isArray(latest) && Number.isFinite(latest[0]) && Number.isFinite(latest[1]), "latest price point must be numeric");
      return { freshnessMs: Date.now() - latest[0] };
    }
  },
  {
    name: "ethTvl",
    url: "https://api.llama.fi/v2/historicalChainTvl/Ethereum",
    critical: true,
    parse: value => {
      assert(Array.isArray(value), "TVL response must be an array");
      assert(value.length >= 365, "TVL response must include at least 365 rows");
      const latest = value[value.length - 1];
      const ts = Number(latest?.date ?? latest?.timestamp ?? latest?.t);
      assert(Number.isFinite(ts), "TVL response must include a numeric date");
      return { freshnessMs: Date.now() - (ts < 10_000_000_000 ? ts * 1000 : ts) };
    }
  },
  {
    name: "feesOverview",
    url: "https://api.llama.fi/overview/fees/ethereum?excludeTotalDataChart=false",
    critical: true,
    parse: value => {
      assert(Array.isArray(value?.totalDataChart), "fees overview must include totalDataChart");
      assert(value.totalDataChart.length >= 365, "fees overview must include at least 365 chart rows");
      const latest = value.totalDataChart[value.totalDataChart.length - 1];
      const ts = Array.isArray(latest) ? Number(latest[0]) : Number(latest?.date ?? latest?.timestamp ?? latest?.t);
      assert(Number.isFinite(ts), "fees overview must include a numeric latest date");
      return { freshnessMs: Date.now() - (ts < 10_000_000_000 ? ts * 1000 : ts) };
    }
  },
  {
    name: "growthepieFundamentals",
    url: "https://api.growthepie.com/v1/fundamentals.json",
    critical: false,
    parse: value => {
      assert(Array.isArray(value), "growthepie response must be an array");
      assert(value.length > 0, "growthepie response must not be empty");
      const latest = value[value.length - 1];
      assert(latest && typeof latest === "object", "growthepie latest row must be an object");
      assert(typeof latest.date === "string", "growthepie latest row must include date");
      assert(typeof latest.metric_key === "string", "growthepie latest row must include metric_key");
      return { freshnessMs: Date.now() - new Date(`${latest.date}T00:00:00Z`).getTime() };
    }
  },
  {
    name: "btcMarketChart",
    url: "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily",
    critical: false,
    parse: value => {
      assert(Array.isArray(value?.prices), "BTC chart must include prices");
      assert(value.prices.length >= 365, "BTC chart must include at least 365 price points");
      return { freshnessMs: null };
    }
  }
];

function warn(message) {
  process.stderr.write(`${message}\n`);
}

function fetchJson(url) {
  const startedAt = Date.now();
  const headersPath = path.join(tmpDir, "headers.txt");
  const bodyPath = path.join(tmpDir, "body.json");
  const result = spawnSync("curl", [
    "-sSL",
    "--max-time",
    String(Math.ceil(TIMEOUT_MS / 1000)),
    "-D",
    headersPath,
    "-o",
    bodyPath,
    url
  ], {
    encoding: "utf8",
    maxBuffer: 30 * 1024 * 1024
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `curl exited with ${result.status}`);
  }

  const fetchedAt = Date.now();
  const headerText = fs.readFileSync(headersPath, "utf8");
  const body = fs.readFileSync(bodyPath, "utf8");
  const headerLines = headerText.split(/\r?\n/).filter(Boolean);
  const statusLine = headerLines.find(line => /^HTTP\/\d/.test(line)) || "";
  const statusMatch = statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d+)/);
  const status = statusMatch ? Number(statusMatch[1]) : NaN;
  const headers = new Map();
  for (const line of headerLines) {
    const idx = line.indexOf(":");
    if (idx === -1 || /^HTTP\/\d/.test(line)) continue;
    headers.set(line.slice(0, idx).trim().toLowerCase(), line.slice(idx + 1).trim());
  }

  const parseStartedAt = Date.now();
  let value;
  try {
    value = JSON.parse(body);
  } catch (error) {
    throw new Error(`invalid JSON: ${error.message}`);
  }
  const parsedAt = Date.now();

  return {
    response: {
      ok: Number.isFinite(status) && status >= 200 && status < 300,
      status,
      headers
    },
    value,
    metrics: {
      status,
      ok: Number.isFinite(status) && status >= 200 && status < 300,
      contentType: headers.get("content-type") || "",
      cors: headers.get("access-control-allow-origin") || "",
      bytes: Buffer.byteLength(body),
      fetchMs: fetchedAt - startedAt,
      parseMs: parsedAt - parseStartedAt
    }
  };
}

(async () => {
  const warnings = [];
  const failures = [];

  for (const endpoint of endpoints) {
    try {
      const { response, value, metrics } = await fetchJson(endpoint.url);
      assert(response.ok, `${endpoint.name} returned HTTP ${response.status}`);
      assert(metrics.cors === "*" || metrics.cors.length > 0, `${endpoint.name} missing CORS header`);
      assert(metrics.contentType.includes("json"), `${endpoint.name} missing JSON content-type`);
      assert(metrics.bytes > 0, `${endpoint.name} returned an empty body`);
      assert(metrics.parseMs < 5000, `${endpoint.name} took too long to parse (${metrics.parseMs}ms)`);
      const parsed = endpoint.parse(value);
      if (parsed && Number.isFinite(parsed.freshnessMs)) {
        const freshnessHours = parsed.freshnessMs / (60 * 60 * 1000);
        assert(freshnessHours < 72, `${endpoint.name} looks stale (${freshnessHours.toFixed(1)}h old)`);
      }
      console.log(`PASS ${endpoint.name} ${metrics.status} ${metrics.bytes}B fetch=${metrics.fetchMs}ms parse=${metrics.parseMs}ms`);
    } catch (error) {
      const message = `${endpoint.critical ? "FAIL" : "WARN"} ${endpoint.name}: ${error.message || String(error)}`;
      if (endpoint.critical) {
        failures.push(message);
      } else {
        warnings.push(message);
      }
      warn(message);
    }
  }

  if (warnings.length > MAX_WARNINGS) {
    throw new Error(`too many warnings (${warnings.length})`);
  }

  if (failures.length) {
    console.error(`\n${failures.length} critical API contract check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAPI contract checks passed with ${warnings.length} warning(s).`);
})().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
