#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const dashboardPath = path.join(root, "working_dashboard.html");
const html = fs.readFileSync(dashboardPath, "utf8");
const capturesDir = path.join(root, "docs", "captures");
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "eth-dashboard-browser-"));

const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "google-chrome",
  "chromium",
  "chromium-browser"
];

function findChrome() {
  for (const candidate of chromeCandidates) {
    if (candidate.includes(path.sep) && fs.existsSync(candidate)) return candidate;
    const which = spawnSync("which", [candidate], { encoding: "utf8" });
    if (which.status === 0) {
      const resolved = which.stdout.trim();
      if (resolved) return resolved;
    }
  }
  throw new Error("Chrome/Chromium binary not found");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function timeMs(offsetDays = 0) {
  return Date.now() - offsetDays * 24 * 60 * 60 * 1000;
}

function dateIso(offsetDays = 0) {
  return new Date(timeMs(offsetDays)).toISOString();
}

function series(days = 365, base = 100, step = 1, scale = 1) {
  return Array.from({ length: days }, (_, index) => {
    const x = base + index * step;
    return [timeMs(days - 1 - index), x * scale];
  });
}

function seriesRows(days = 365, base = 100, step = 1, scale = 1) {
  return series(days, base, step, scale).map(([ts, value]) => ({ date: ts, totalLiquidityUSD: value, tvl: value, value }));
}

function protocolTvlRows(days = 365, base = 100, step = 1, scale = 1) {
  return series(days, base, step, scale).map(([ts, value]) => ({ date: ts, totalLiquidityUSD: value, tvl: value, value }));
}

function stableRows(days = 365, base = 1000, step = 5) {
  return series(days, base, step).map(([ts, value]) => ({
    date: ts / 1000,
    totalCirculatingUSD: { peggedUSD: value },
    totalCirculating: { peggedUSD: value }
  }));
}

function yieldRows(days = 365, base = 3, step = 0.002) {
  return series(days, base, step).map(([ts, value]) => ({
    timestamp: new Date(ts).toISOString(),
    apy: value
  }));
}

function growthepieRows(days = 365) {
  const rows = [];
  const metrics = {
    txcount: 1000000,
    daa: 500000,
    profit_usd: 2000000,
    blob_size_bytes: 4000000000
  };
  const origins = ["ethereum", "base", "arbitrum", "optimism"];
  for (let i = 0; i < days; i++) {
    const date = new Date(timeMs(days - 1 - i)).toISOString().slice(0, 10);
    for (const [metricKey, base] of Object.entries(metrics)) {
      origins.forEach((origin, originIndex) => {
        rows.push({
          date,
          metric_key: metricKey,
          origin_key: origin,
          value: base + i * (originIndex + 1) * 1000
        });
      });
    }
  }
  return rows;
}

function klineRows(limit = 60, base = 2500, step = 2) {
  return Array.from({ length: limit }, (_, index) => {
    const openTime = timeMs(limit - 1 - index);
    const open = base + index * step;
    const close = open + (index % 2 === 0 ? 4 : -3);
    const high = Math.max(open, close) + 5;
    const low = Math.min(open, close) - 5;
    return [openTime, String(open), String(high), String(low), String(close), "1000", openTime + 60_000];
  });
}

function buildJournalHarness(scenario) {
  if (!scenario) return "";
  const scenarios = {
    corruptedJournalStorage: `
      try {
        localStorage.setItem("ethTradingJournal", JSON.stringify({ corrupted: true }));
      } catch (error) {}
    `,
    unavailableJournalStorage: `
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new Error("localStorage unavailable");
        }
      });
    `,
    longJournalReason: `
      try {
        localStorage.setItem("ethTradingJournal", JSON.stringify([{
          timestamp: new Date().toISOString(),
          decision: "buy",
          ethPrice: 2500,
          regime: "우위 없음",
          scores: {},
          reason: "${"가".repeat(5000)}",
          invalidation: "$2,100.00",
          reviewDate: new Date().toISOString().slice(0, 10)
        }]));
      } catch (error) {}
      window.addEventListener("load", () => {
        const tick = () => {
          const first = document.querySelector("#journalList li");
          if (!first) {
            requestAnimationFrame(tick);
            return;
          }
          const probe = document.createElement("div");
          probe.id = "journalProbe";
          probe.style.display = "none";
          probe.textContent = String(first.textContent.length);
          document.body.appendChild(probe);
        };
        requestAnimationFrame(tick);
      });
    `,
    exportSpecialChars: `
      const seededEntries = ${JSON.stringify([{
        timestamp: "2026-06-03T00:00:00.000Z",
        decision: "buy",
        ethPrice: 2500,
        regime: "우위 없음",
        scores: {},
        reason: "한국어 \"quotes\" & <tags> and commas, too",
        invalidation: "$2,100.00",
        reviewDate: "2026-06-10"
      }])};
      try {
        localStorage.setItem("ethTradingJournal", JSON.stringify(seededEntries));
      } catch (error) {}
      window.addEventListener("load", () => {
        const tick = () => {
          const first = document.querySelector("#journalList li");
          if (!first) {
            requestAnimationFrame(tick);
            return;
          }
          const probe = document.createElement("div");
          probe.id = "journalProbe";
          probe.style.display = "none";
          probe.textContent = first.textContent;
          document.body.appendChild(probe);
          const header = ["timestamp", "decision", "ethPrice", "regime", "reason", "invalidation", "reviewDate"];
          const rows = seededEntries.map(entry => header.map(key => '"' + String(entry[key] ?? '').replaceAll('"', '""') + '"').join(","));
          const exportProbe = document.createElement("div");
          exportProbe.id = "journalExportProbe";
          exportProbe.style.display = "none";
          exportProbe.textContent = [header.join(","), ...rows].join("\\n");
          document.body.appendChild(exportProbe);
        };
        requestAnimationFrame(tick);
      });
    `,
    clearJournalConfirm: `
      try {
        localStorage.setItem("ethTradingJournal", JSON.stringify([{
          timestamp: "2026-06-03T00:00:00.000Z",
          decision: "buy",
          ethPrice: 2500,
          regime: "우위 없음",
          scores: {},
          reason: "clear-confirm",
          invalidation: "$2,100.00",
          reviewDate: "2026-06-10"
        }]));
      } catch (error) {}
      window.addEventListener("load", () => {
        const tick = () => {
          window.confirm = () => true;
          document.getElementById("clearJournal")?.click();
          const probeTick = () => {
            const first = document.querySelector("#journalList li");
            if (!first) {
              requestAnimationFrame(probeTick);
              return;
            }
            const probe = document.createElement("div");
            probe.id = "journalProbe";
            probe.style.display = "none";
            probe.textContent = first ? first.textContent : "";
            document.body.appendChild(probe);
          };
          requestAnimationFrame(probeTick);
        };
        requestAnimationFrame(tick);
      });
    `,
    clearJournalCancel: `
      try {
        localStorage.setItem("ethTradingJournal", JSON.stringify([{
          timestamp: "2026-06-03T00:00:00.000Z",
          decision: "buy",
          ethPrice: 2500,
          regime: "우위 없음",
          scores: {},
          reason: "clear-cancel",
          invalidation: "$2,100.00",
          reviewDate: "2026-06-10"
        }]));
      } catch (error) {}
      window.addEventListener("load", () => {
        const tick = () => {
          window.confirm = () => false;
          document.getElementById("clearJournal")?.click();
          const probeTick = () => {
            const first = document.querySelector("#journalList li");
            if (!first) {
              requestAnimationFrame(probeTick);
              return;
            }
            const probe = document.createElement("div");
            probe.id = "journalProbe";
            probe.style.display = "none";
            probe.textContent = first ? first.textContent : "";
            document.body.appendChild(probe);
          };
          requestAnimationFrame(probeTick);
        };
        requestAnimationFrame(tick);
      });
    `
  };
  const scenarioScript = scenarios[scenario] || "";
  if (!scenarioScript) return "";
  if (scenario === "longJournalReason" || scenario === "exportSpecialChars") {
    return scenarioScript;
  }
  return `${scenarioScript}
      window.addEventListener("load", () => {
        const tick = () => {
          const first = document.querySelector("#journalList li");
          if (!first) {
            requestAnimationFrame(tick);
            return;
          }
          const probe = document.createElement("div");
          probe.id = "journalProbe";
          probe.style.display = "none";
          probe.textContent = first ? first.textContent : "";
          document.body.appendChild(probe);
        };
        requestAnimationFrame(tick);
      });
    `;
}

function makeFixture({ staleMetric = false, failLive = false, failLiveAfterFirst = false, failGrowthepie = false, failCoinGecko = false, slowFeesTimeout = false, journalScenario = "" } = {}) {
  const freshDaily = series(365);
  const staleDaily = series(365, 100, 1).map(([ts, value], index) => [ts - 72 * 60 * 60 * 1000, value + index]);
  const journalHarness = buildJournalHarness(journalScenario);
  return `
    (function () {
      ${journalHarness}
      const staleMetric = ${JSON.stringify(staleMetric)};
      const failLive = ${JSON.stringify(failLive)};
      const failLiveAfterFirst = ${JSON.stringify(failLiveAfterFirst)};
      const failGrowthepie = ${JSON.stringify(failGrowthepie)};
      const failCoinGecko = ${JSON.stringify(failCoinGecko)};
      const slowFeesTimeout = ${JSON.stringify(slowFeesTimeout)};
      const freshDaily = ${JSON.stringify(freshDaily)};
      const staleDaily = ${JSON.stringify(staleDaily)};
      const klineRows = ${JSON.stringify(klineRows(240))};
      const growthepieRows = ${JSON.stringify(growthepieRows(365))};
      const callCounts = new Map();
      const fixtures = {
        "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=365&interval=daily": () => failCoinGecko ? null : ({
          prices: freshDaily,
          market_caps: freshDaily.map(([ts, value]) => [ts, value * 1000000]),
          total_volumes: freshDaily.map(([ts, value]) => [ts, value * 10000])
        }),
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily": () => failCoinGecko ? null : ({
          prices: freshDaily.map(([ts, value]) => [ts, value * 20]),
          market_caps: freshDaily.map(([ts, value]) => [ts, value * 20000000]),
          total_volumes: freshDaily.map(([ts, value]) => [ts, value * 15000])
        }),
        "https://api.llama.fi/v2/historicalChainTvl/Ethereum": () => staleMetric
          ? staleDaily.map(([ts, value]) => ({ date: ts, totalLiquidityUSD: value * 1000000, tvl: value * 1000000, value: value * 1000000 }))
          : freshDaily.map(([ts, value]) => ({ date: ts, totalLiquidityUSD: value * 1000000, tvl: value * 1000000, value: value * 1000000 })),
        "https://api.llama.fi/overview/fees/ethereum?excludeTotalDataChart=false": (_url, init) => {
          if (!slowFeesTimeout) {
            return { totalDataChart: staleMetric ? staleDaily : freshDaily };
          }
          const signal = init?.signal;
          if (signal?.aborted) {
            return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
          }
          return new Promise((_, reject) => {
            window.setTimeout(() => reject(new DOMException("The operation was aborted.", "AbortError")), 0);
            if (signal) {
              signal.addEventListener("abort", () => reject(new DOMException("The operation was aborted.", "AbortError")), { once: true });
            }
          });
        },
        "https://api.llama.fi/overview/dexs/Ethereum?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=true": () => ({
          totalDataChart: freshDaily
        }),
        "https://stablecoins.llama.fi/stablecoincharts/Ethereum": () => staleMetric
          ? staleDaily.map(([ts, value]) => ({ date: ts / 1000, totalCirculatingUSD: { peggedUSD: value * 100000 }, totalCirculating: { peggedUSD: value * 100000 } }))
          : freshDaily.map(([ts, value]) => ({ date: ts / 1000, totalCirculatingUSD: { peggedUSD: value * 100000 }, totalCirculating: { peggedUSD: value * 100000 } })),
        "https://api.llama.fi/chains": () => [],
        "https://api.llama.fi/protocol/lido": () => ({ chainTvls: { Ethereum: { tvl: ${JSON.stringify(protocolTvlRows(365, 500, 2, 1000000))} } } }),
        "https://api.llama.fi/protocol/rocket-pool": () => ({ chainTvls: { Ethereum: { tvl: ${JSON.stringify(protocolTvlRows(365, 50, 1, 1000000))} } } }),
        "https://api.llama.fi/protocol/aave-v3": () => ({ chainTvls: { Ethereum: { tvl: ${JSON.stringify(protocolTvlRows(365, 200, 1, 1000000))} } } }),
        "https://api.llama.fi/protocol/uniswap": () => ({ chainTvls: { Ethereum: { tvl: ${JSON.stringify(protocolTvlRows(365, 300, 1, 1000000))} } } }),
        "https://api.llama.fi/protocol/curve": () => ({ chainTvls: { Ethereum: { tvl: ${JSON.stringify(protocolTvlRows(365, 120, 1, 1000000))} } } }),
        "https://api.llama.fi/v2/historicalChainTvl/Base": () => ${JSON.stringify(protocolTvlRows(365, 100, 1, 1000000))},
        "https://api.llama.fi/v2/historicalChainTvl/Arbitrum": () => ${JSON.stringify(protocolTvlRows(365, 80, 1, 1000000))},
        "https://api.llama.fi/v2/historicalChainTvl/OP%20Mainnet": () => ${JSON.stringify(protocolTvlRows(365, 60, 1, 1000000))},
        "https://api.llama.fi/v2/historicalChainTvl/Linea": () => ${JSON.stringify(protocolTvlRows(365, 40, 1, 1000000))},
        "https://api.llama.fi/v2/historicalChainTvl/Scroll": () => ${JSON.stringify(protocolTvlRows(365, 30, 1, 1000000))},
        "https://api.llama.fi/v2/historicalChainTvl/ZKsync%20Era": () => ${JSON.stringify(protocolTvlRows(365, 20, 1, 1000000))},
        "https://api.growthepie.com/v1/fundamentals.json": () => failGrowthepie ? null : growthepieRows,
        "https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT": () => failLive ? null : {
          lastPrice: "2525.11",
          priceChangePercent: "1.35",
          quoteVolume: "1289038471.11",
          highPrice: "2550.00",
          lowPrice: "2475.00"
        },
        "https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1m&limit=60": () => klineRows.slice(-60),
        "https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=15m&limit=60": () => klineRows.slice(-60),
        "https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1h&limit=60": () => klineRows.slice(-60),
        "https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=4h&limit=60": () => klineRows.slice(-60),
        "https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1d&limit=60": () => klineRows.slice(-60)
      };
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : String(input?.url || input);
        const nextCount = (callCounts.get(url) || 0) + 1;
        callCounts.set(url, nextCount);
        if (failLive && url.includes("api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT")) {
          return new Response(JSON.stringify({ error: "forced failure" }), {
            status: 503,
            headers: { "content-type": "application/json" }
          });
        }
        if (failLiveAfterFirst && nextCount > 1 && url.includes("api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT")) {
          return new Response(JSON.stringify({ error: "forced post-load failure" }), {
            status: 503,
            headers: { "content-type": "application/json" }
          });
        }
        if (failLiveAfterFirst && nextCount > 1 && url.includes("api.binance.com/api/v3/klines?symbol=ETHUSDT")) {
          return new Response(JSON.stringify({ error: "forced post-load failure" }), {
            status: 503,
            headers: { "content-type": "application/json" }
          });
        }
        const fixture = fixtures[url];
        if (!fixture) return originalFetch(input, init);
        const value = await fixture(url, init || {});
        if (value === null) {
          return new Response(JSON.stringify({ error: "forced failure" }), {
            status: 503,
            headers: { "content-type": "application/json" }
          });
        }
        return new Response(JSON.stringify(value), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      };
    })();
  `;
}

function writeVariantHtml(name, options) {
  const injected = html.replace("<script>", `<script>\n${makeFixture(options)}\n`);
  const file = path.join(tmpDir, `${name}.html`);
  fs.writeFileSync(file, injected, "utf8");
  return file;
}

function runChrome(chrome, args) {
  const result = spawnSync(chrome, args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error(`Chrome failed: ${result.stderr || result.stdout || result.status}`);
  }
  return result.stdout;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fileUrl(file) {
  return pathToFileURL(file).href;
}

function browserArgs({ url, screenshot, windowSize, dumpDom = false }) {
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=16000",
    `--window-size=${windowSize}`,
    "--allow-file-access-from-files",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--disable-client-side-phishing-detection",
    "--no-pings",
    "--disable-hang-monitor"
  ];
  if (dumpDom) args.push("--dump-dom");
  if (screenshot) args.push(`--screenshot=${screenshot}`);
  args.push(url);
  return args;
}

(async () => {
  const chrome = findChrome();
  const files = {
    success: writeVariantHtml("success", { staleMetric: false, failLive: false }),
    failure: writeVariantHtml("failure", { staleMetric: true, failLive: true }),
    liveRecovery: writeVariantHtml("live-recovery", { staleMetric: false, failLiveAfterFirst: true }),
    partialFundamentals: writeVariantHtml("partial-fundamentals", { staleMetric: false, failGrowthepie: true }),
    coinGeckoFailure: writeVariantHtml("coingecko-failure", { staleMetric: false, failCoinGecko: true }),
    slowFeesTimeout: writeVariantHtml("slow-fees-timeout", { staleMetric: false, slowFeesTimeout: true }),
    staleDailyData: writeVariantHtml("stale-daily-data", { staleMetric: true, failLive: false }),
    corruptedJournalStorage: writeVariantHtml("corrupted-journal-storage", { journalScenario: "corruptedJournalStorage" }),
    unavailableJournalStorage: writeVariantHtml("unavailable-journal-storage", { journalScenario: "unavailableJournalStorage" }),
    longJournalReason: writeVariantHtml("long-journal-reason", { journalScenario: "longJournalReason" }),
    exportSpecialChars: writeVariantHtml("export-special-chars", { journalScenario: "exportSpecialChars" }),
    clearJournalConfirm: writeVariantHtml("clear-journal-confirm", { journalScenario: "clearJournalConfirm" }),
    clearJournalCancel: writeVariantHtml("clear-journal-cancel", { journalScenario: "clearJournalCancel" })
  };

  const desktopShot = path.join(capturesDir, "2026-06-03-browser-regression-desktop.png");
  const laptopShot = path.join(capturesDir, "2026-06-03-browser-regression-laptop.png");
  const mobileShot = path.join(capturesDir, "2026-06-03-browser-regression-mobile.png");

  runChrome(chrome, browserArgs({
    url: fileUrl(files.success),
    screenshot: desktopShot,
    windowSize: "1440,1200"
  }));

  runChrome(chrome, browserArgs({
    url: fileUrl(files.success),
    screenshot: laptopShot,
    windowSize: "1280,900"
  }));

  runChrome(chrome, browserArgs({
    url: fileUrl(files.success),
    screenshot: mobileShot,
    windowSize: "390,844"
  }));

  const fileSmoke = runChrome(chrome, browserArgs({
    url: fileUrl(files.success),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(fileSmoke.includes("미래 데이터 배제 백테스트"), "file:// smoke should include localized backtest eyebrow");
  assert(fileSmoke.includes("소스 상태 로딩 중") || fileSmoke.includes("Signal guard"), "file:// smoke should render dashboard content");
  assert(fileSmoke.includes("확인한 모든 소스가 정상입니다.") || fileSmoke.includes("All checked sources are healthy."), "file:// smoke should expose the positive failed-source empty state");

  const failureDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.failure),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(failureDom.includes("실패") || failureDom.includes("지연"), "failure scenario should expose a failed or stale state");
  assert(failureDom.includes("우위 없음"), "failure scenario should move the regime to no edge");

  const recoveryDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.liveRecovery),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(recoveryDom.includes("지연") || recoveryDom.includes("실패"), "live recovery scenario should downgrade to stale or failed after refresh");
  assert(recoveryDom.includes("2525.11"), "live recovery scenario should preserve the previous live price after refresh failure");

  const partialDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.partialFundamentals),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(partialDom.includes("사용 불가") || partialDom.includes("Unavailable"), "partial fundamentals scenario should still render failed rows");
  assert(partialDom.includes("후보 지표") || partialDom.includes("Metric candidates"), "partial fundamentals scenario should keep the dashboard summary visible");

  const coinGeckoDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.coinGeckoFailure),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(coinGeckoDom.includes("실패") || coinGeckoDom.includes("사용 불가"), "CoinGecko failure scenario should expose a failed source state");
  assert(coinGeckoDom.includes("대시보드 요약") || coinGeckoDom.includes("Dashboard Summary"), "CoinGecko failure scenario should keep the summary visible");

  const slowFeesDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.slowFeesTimeout),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(slowFeesDom.includes("실패") || slowFeesDom.includes("지연"), "slow fees scenario should time out or fail cleanly");
  assert(slowFeesDom.includes("Ethereum Fees") || slowFeesDom.includes("ethereum_fees"), "slow fees scenario should still identify the fees source");

  const staleDailyDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.staleDailyData),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(staleDailyDom.includes("지연") || staleDailyDom.includes("stale"), "stale daily data scenario should expose stale status");
  assert(staleDailyDom.includes("2525.11"), "stale daily data scenario should keep live ETH price visible");
  assert(staleDailyDom.includes("우위 없음") || staleDailyDom.includes("No Edge"), "stale daily data scenario should keep decision layer neutral");

  const corruptedJournalDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.corruptedJournalStorage),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(corruptedJournalDom.includes("journalProbe"), "corrupted journal storage scenario should render a journal probe");
  assert(corruptedJournalDom.includes("데이터 없음") || corruptedJournalDom.includes("No data"), "corrupted journal storage should fall back to empty journal state");

  const unavailableJournalDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.unavailableJournalStorage),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(unavailableJournalDom.includes("journalProbe"), "unavailable journal storage scenario should render a journal probe");
  assert(unavailableJournalDom.includes("데이터 없음") || unavailableJournalDom.includes("No data"), "unavailable journal storage should still render the dashboard");

  const longJournalDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.longJournalReason),
    windowSize: "1280,900",
    dumpDom: true
  }));
  const longJournalMatch = longJournalDom.match(/<div id="journalProbe"[^>]*>(\d+)<\/div>/);
  assert(longJournalMatch && Number(longJournalMatch[1]) > 4000, "long journal reason should remain rendered");

  const exportSpecialDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.exportSpecialChars),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(exportSpecialDom.includes("journalExportProbe"), "special-character export scenario should capture the export payload");
  assert(exportSpecialDom.includes("한국어") && exportSpecialDom.includes('""quotes""'), "special-character export should preserve Korean text and escape quotes in CSV");

  const clearConfirmDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.clearJournalConfirm),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(clearConfirmDom.includes("journalProbe"), "clear confirm scenario should render a journal probe");
  assert(clearConfirmDom.includes("데이터 없음") || clearConfirmDom.includes("No data"), "clear confirm should empty the journal after confirmation");

  const clearCancelDom = runChrome(chrome, browserArgs({
    url: fileUrl(files.clearJournalCancel),
    windowSize: "1280,900",
    dumpDom: true
  }));
  assert(clearCancelDom.includes("journalProbe"), "clear cancel scenario should render a journal probe");
  assert(clearCancelDom.includes("clear-cancel"), "clear cancel should keep the journal entry when confirmation is denied");

  console.log("browser regression checks passed");
  console.log(`desktop: ${desktopShot}`);
  console.log(`laptop: ${laptopShot}`);
  console.log(`mobile: ${mobileShot}`);
})().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
