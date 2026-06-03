#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const dashboardPath = path.join(root, "working_dashboard.html");
const html = fs.readFileSync(dashboardPath, "utf8");

const checks = [];

function check(label, condition) {
  checks.push({ label, ok: Boolean(condition) });
}

const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
check("single inline script exists", scriptMatch);

if (scriptMatch) {
  try {
    new vm.Script(scriptMatch[1]);
    check("inline script parses", true);
  } catch (error) {
    check(`inline script parses: ${error.message}`, false);
  }
}

check("no external module script", !/<script[^>]+src=/.test(html));
check("no build-time module import", !/\bimport\s+[^("]/.test(scriptMatch?.[1] || ""));
check("live polling interval present", html.includes("setInterval(refreshLiveMarket, LIVE_POLL_MS)"));
check("live fetch uses no-store", html.includes('cache: "no-store"'));
check("fetch timeout guard present", html.includes("AbortController"));
check("journal reason is escaped", html.includes('escapeHtml(entry.reason || "")'));
check("journal decision label is escaped", html.includes("escapeHtml(decisionLabel(entry.decision))"));
check("journal clear has confirmation", html.includes('window.confirm(t("clearJournalConfirm"))'));
check("metric cards expose button role", html.includes('role="button"'));
check("metric cards expose selected state", html.includes('aria-pressed="${selected ? "true" : "false"}'));
check("metric cards expose disabled state", html.includes('aria-disabled="${ok ? "false" : "true"}'));
check("metric cards handle keyboard", html.includes('card.addEventListener("keydown"'));
check("metric cards handle Enter", html.includes('event.key !== "Enter"'));
check("metric cards handle Space", html.includes('event.key !== " "'));
check("metric source links are guarded", html.includes('event.target.closest("a")'));
check("metric cards have visible focus style", html.includes(".card:focus-visible"));
check("backtest period label is associated", html.includes('label for="backtestPeriod"'));
check("mobile touch targets are raised", html.includes("min-height: 44px"));
check("mobile info trigger width is raised", html.includes("min-width: 44px"));
check("info help uses tooltip semantics", html.includes('role="tooltip"') && !html.includes('role="dialog"'));
check("info triggers are described by tooltip", html.includes('button.setAttribute("aria-describedby", "sectionInfoModal")'));
check("info triggers expose expanded state", html.includes('button.setAttribute("aria-expanded", "false")'));
check("info triggers support tap toggle", html.includes("toggleInfoModal(key, button)"));
check("info popover supports escape close", html.includes('event.key === "Escape"'));
check("info popover supports outside click close", html.includes('event.target.closest("[data-info-key]")'));
check("korean default regime label is localized", html.includes('id="regimeLabel">우위 없음</div>'));
check("korean default profit action is localized", html.includes('id="profitAction">거래 보류</h2>'));
check("korean backtest title is localized", html.includes('data-i18n="backtestTitle">점수 기준 전략과 매수 후 보유 비교'));
check("korean quality eyebrow is localized", html.includes('data-i18n="qualityEyebrow">데이터 품질 / 지연 방어'));
check("korean backtest eyebrow is localized", html.includes('data-i18n="backtestEyebrow">미래 데이터 배제 백테스트'));
check("korean loading source health label is localized", html.includes('id="qualityTitle">소스 상태 로딩 중'));
check("failed list has positive empty state", html.includes("noFailedSources") && html.includes('class="status-empty"'));
check("journal decision labels are localized dynamically", html.includes("function decisionLabel(value)") && html.includes("updateJournalSelectLabels()"));
check("korean signal guard label exists", html.includes('signalGuard: "신호 방어"'));
check("korean option defaults are localized", !html.includes('<option value="buy">buy</option>') && !html.includes('<option value="all">all</option>'));
check("journal load guards array shape", html.includes("Array.isArray(parsed)") && html.includes("loadJournalEntries()"));
check("journal save/load storage guards exist", html.includes("saveJournalEntries()") && html.includes("Local storage can be unavailable in hardened file contexts."));
check("chart advanced controls use disclosure", html.includes('<details class="chart-advanced-controls" open>') && html.includes('data-i18n="chartOptionsSummary"'));
check("mobile chart options summary is visible", html.includes(".chart-options-summary") && html.includes("display: inline-flex"));
check("mobile chart advanced controls can expand", html.includes(".chart-advanced-controls[open]"));
check("chart range group remains outside disclosure", html.indexOf('class="chart-range-group"') < html.indexOf('<details class="chart-advanced-controls" open>'));
check("chart advanced disclosure syncs mobile default", html.includes("function syncChartAdvancedDisclosure()") && html.includes('window.matchMedia("(max-width: 820px)")') && html.includes("details.open = !isMobile"));
check("korean no-lookahead title removed", !html.includes('No-lookahead 백테스트'));
check("english loading source health removed", !html.includes('Loading source health'));
check("metric contract defaults exist", html.includes("const DEFAULT_METRIC_CONTRACT") && html.includes("staleAfterHours") && html.includes("fallbackBehavior"));
check("metric contract critical ids exist", html.includes("const CRITICAL_METRIC_IDS = new Set") && html.includes('"ethereum_fees"') && html.includes('"blob_data_posted"'));
check("metric load plan exists", html.includes("const INITIAL_METRIC_IDS = new Set") && html.includes('loadStage: INITIAL_METRIC_IDS.has(def.id) ? 0 : 1'));
check("metric defs are mapped through contract helper", html.includes("].map(withMetricContract);"));
check("metric load helpers exist", html.includes("function loadMetricStage(def)") && html.includes("function loadMetricBatch(defs)") && html.includes("function coreMetrics()") && html.includes("function deferredMetrics()") && html.includes("function scheduleDeferredLoad(task)"));
check("metric contract validates required fields", html.includes("function validateMetricSeries(series, contract)") && html.includes("contract.requiredFields.some"));
check("metric contract enforces min points", html.includes("usable.length < contract.minPoints"));
check("metric contract detects stale series", html.includes("function isSeriesStale(series, contract)") && html.includes("contract.staleAfterHours"));
check("metric contract metadata renders on cards", html.includes("metricContractText(result)") && html.includes("stale ${contract.staleAfterHours}h"));
check("source telemetry map exists", html.includes("const sourceTelemetry = new Map();"));
check("source telemetry records fetch timing", html.includes("performance.now() - startedAt") && html.includes("new TextEncoder().encode(text).length"));
check("source telemetry summary helper exists", html.includes("function sourceTelemetrySummary(ids)") && html.includes("function formatTelemetry(meta)"));
check("initial summary pending exists", html.includes('id="summaryPending"') && html.includes("updateSummaryCounts()") && html.includes('backtestPeriod").value = t("loadingMetrics")'));
check("progressive load scheduling exists", html.includes("scheduleDeferredLoad(async () => {") && html.includes("loadMetricBatch(coreMetrics())") && html.includes("loadMetricBatch(deferredMetrics())"));
check("runtime contract verifier exists", fs.existsSync(path.join(root, "scripts", "verify_dashboard_runtime_contract.cjs")));
check("browser regression verifier exists", fs.existsSync(path.join(root, "scripts", "verify_dashboard_browser.cjs")));
check("browser regression live-recovery scenario exists", html.includes("failLiveAfterFirst") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("failLiveAfterFirst"));
check("browser regression partial-fundamentals scenario exists", html.includes("partialFundamentals") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("partialFundamentals"));
check("browser regression coingecko-failure scenario exists", html.includes("failCoinGecko") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("failCoinGecko"));
check("browser regression slow-fees-timeout scenario exists", html.includes("slowFeesTimeout") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("slowFeesTimeout"));
check("browser regression stale-daily-data scenario exists", html.includes("staleDailyData") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("staleDailyData"));
check("browser regression corrupted journal scenario exists", html.includes("corruptedJournalStorage") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("corruptedJournalStorage"));
check("browser regression unavailable storage scenario exists", html.includes("unavailableJournalStorage") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("unavailableJournalStorage"));
check("browser regression long reason scenario exists", html.includes("longJournalReason") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("longJournalReason"));
check("browser regression special export scenario exists", html.includes("exportSpecialChars") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("exportSpecialChars"));
check("browser regression clear confirm scenario exists", html.includes("clearJournalConfirm") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("clearJournalConfirm"));
check("browser regression clear cancel scenario exists", html.includes("clearJournalCancel") || fs.readFileSync(path.join(root, "scripts", "verify_dashboard_browser.cjs"), "utf8").includes("clearJournalCancel"));
check("live market resize debounce exists", html.includes("scheduleLiveMarketResizeRender") && html.includes("liveMarketResizeFrame") && html.includes("liveMarketRenderedWidth") && html.includes('window.addEventListener("resize", scheduleLiveMarketResizeRender)'));
check("no-lookahead marker present", html.includes("signalDay = rows[i - 1]"));
check("local journal storage key present", html.includes("ethTradingJournal"));

const failed = checks.filter(item => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.label}`);
}

if (failed.length) {
  console.error(`\n${failed.length} static dashboard checks failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} static dashboard checks passed.`);
