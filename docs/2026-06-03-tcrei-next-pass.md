# TCREI Next Pass: Ethereum Fundamentals Dashboard

Created: 2026-06-03

Basis:

- `/Users/visualog/Documents/GitHub/xcodex-02/TCREI-auto-verification-loop.md`
- `docs/2026-06-01-detailed-test-and-improvement-report.md`
- `docs/2026-06-01-fundamentals-site-improvement-plan.md`
- `working_dashboard.html`

## Current State

`working_dashboard.html` is a local-first single HTML dashboard. It already includes live ETH/USDT polling, fundamentals metrics, decision/profit panels, a no-lookahead backtest, data-quality guards, and a local trading journal.

The next pass should avoid adding more metrics. It should close the highest-risk audit findings first, verify them with targeted commands, and keep the single-file `file://` workflow intact.

Current repository state at plan creation:

```text
Untracked:
- docs/2026-06-01-detailed-test-and-improvement-report.md
- docs/2026-06-01-fundamentals-site-improvement-plan.md
- docs/captures/2026-06-01-audit-desktop-afterload.png
```

## Task 1

### Task

Fix the P1 journal and destructive-action risks.

### Context

- Journal input is user-controlled and is rendered back into the page.
- The audit identified unsafe `innerHTML` rendering around the trading journal.
- `Clear journal` deletes local records immediately.

### Requirements

- User-entered journal fields must render as text, not executable HTML.
- Clearing the journal must require confirmation or provide an undo path.
- Existing localStorage journal behavior must continue to work.
- `working_dashboard.html` must remain directly openable without a build step.

### Small Tasks

1. Inspect the journal save, render, filter, export, and clear paths.
2. Replace unsafe journal row rendering with escaped text or DOM text nodes.
3. Add a clear confirmation or undo state.
4. Add targeted tests for script syntax, journal escaping, and clear behavior.
5. Update this document with the test evidence.

### Verification Commands

```sh
node -e 'const fs=require("fs"),vm=require("vm"); const html=fs.readFileSync("working_dashboard.html","utf8"); const script=html.match(/<script>([\s\S]*)<\/script>/)[1]; new vm.Script(script); console.log("syntax ok");'
node - <<'NODE'
const fs = require("fs");
const html = fs.readFileSync("working_dashboard.html", "utf8");
if (!html.includes("escapeHtml(entry.reason)") && !html.includes("textContent")) process.exit(1);
if (!html.includes("confirm(") && !html.includes("undo")) process.exit(1);
console.log("journal hardening markers ok");
NODE
```

### Artifacts

- `working_dashboard.html`
- `docs/2026-06-03-tcrei-next-pass.md`

### Pass Criteria

- Syntax check passes.
- Journal text containing HTML is displayed safely.
- Clearing the journal is no longer a one-click irreversible action.
- The document records the verification result.

### Next Task Trigger

Start Task 2 after Task 1 passes targeted verification.

## Task 2

### Task

Make metric-card selection keyboard-accessible.

### Context

Metric cards are a core dashboard interaction. The audit found they are clickable `article` elements without full keyboard semantics.

### Requirements

- Metric cards must be focusable and operable with Enter and Space, or use semantic buttons.
- Focus state must remain visible.
- Source links inside cards must remain separately usable.
- Selected state should be exposed with an accessible state such as `aria-pressed` or equivalent.

### Small Tasks

1. Inspect metric-card markup and click binding.
2. Add keyboard activation without breaking pointer selection.
3. Add selected-state semantics.
4. Run syntax and static accessibility marker checks.

### Verification Commands

```sh
node -e 'const fs=require("fs"),vm=require("vm"); const html=fs.readFileSync("working_dashboard.html","utf8"); const script=html.match(/<script>([\s\S]*)<\/script>/)[1]; new vm.Script(script); console.log("syntax ok");'
rg -n "keydown|tabindex|aria-pressed|role=\"button\"" working_dashboard.html
```

### Artifacts

- `working_dashboard.html`
- Updated verification notes in this document.

### Pass Criteria

- Cards are keyboard-reachable.
- Enter and Space update the selected metric.
- Syntax check passes.

### Next Task Trigger

Start Task 3 after Task 2 passes targeted verification.

## Task 3

### Task

Add a compact regression harness and update readiness evidence.

### Context

The audit found manual browser evidence but no automated browser/API regression coverage. Keep the first harness small to avoid turning the single-file dashboard into a framework project.

### Requirements

- Add the lightest useful verification commands before introducing new dependencies.
- Preserve no-build, no-key default usage.
- If browser automation requires installing dependencies, record that as a blocker or explicit setup step instead of hiding it.

### Small Tasks

1. Add or document static checks for source endpoints, script syntax, and critical UI markers.
2. If available locally, run browser screenshot or headless smoke checks.
3. Record exact commands and results.
4. Update README or this document with current readiness.

### Verification Commands

```sh
node -e 'const fs=require("fs"),vm=require("vm"); const html=fs.readFileSync("working_dashboard.html","utf8"); const script=html.match(/<script>([\s\S]*)<\/script>/)[1]; new vm.Script(script); console.log("syntax ok");'
curl -I 'https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'
```

### Artifacts

- Optional script or documented command list.
- Updated TCREI evidence notes.

### Pass Criteria

- Minimum local syntax/static checks are repeatable.
- Any unavailable browser automation is documented as a blocker with evidence.
- Current readiness is clear without replaying old conversation context.

### Next Task Trigger

After Task 3, choose the next smallest P2 item from the detailed audit report.

## Iteration Log

### 2026-06-03

- Created this TCREI task plan from the current repo state and existing audit documents.
- Task 1 implementation completed:
  - Escaped user-controlled journal row fields before rendering through `innerHTML`.
  - Added KR/EN `clearJournalConfirm` copy.
  - Added a confirmation gate before deleting saved journal entries.
- Task 1 targeted verification:
  - JS syntax check: `syntax ok`
  - Static hardening marker check: journal reason, decision, regime escaping present.
  - Static destructive-action marker check: clear confirmation translation and `window.confirm(...)` path present.
- Task 2 implementation completed:
  - Added visible focus styling for metric cards.
  - Added `role="button"`, focusability, selected-state, and disabled-state semantics to metric cards.
  - Added Enter/Space keyboard activation.
  - Preserved source-link behavior by ignoring card selection when the event target is inside a link.
- Task 2 targeted verification:
  - JS syntax check: `syntax ok`
  - Static accessibility marker check: role, tabindex, `aria-pressed`, `aria-disabled`, keydown handling, Enter/Space handling, source-link guard, and focus-visible CSS present.
- Task 3 implementation completed:
  - Added `scripts/verify_dashboard_static.cjs`.
  - The script checks inline JavaScript parsing, no external script dependency, no build-time import, live polling, `no-store` fetch behavior, timeout guard, journal hardening, metric-card keyboard semantics, no-lookahead marker, and journal localStorage marker.
  - Added desktop browser smoke evidence at `docs/captures/2026-06-03-tcrei-task3-desktop.png`.
- Task 3 targeted verification:
  - `node scripts/verify_dashboard_static.cjs`: `20 static dashboard checks passed.`
  - JS syntax check: `syntax ok`
  - `curl -I 'https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'`: `HTTP/2 200`, `access-control-allow-origin: *`, `cache-control: no-cache, no-store, must-revalidate`
  - Chrome headless screenshot: `docs/captures/2026-06-03-tcrei-task3-desktop.png`, PNG `1440 x 1200`, 188 KB.
  - Browser smoke note: Chrome printed macOS `CVDisplayLinkCreateWithCGDisplay` warnings, but exited successfully and wrote the screenshot.
- Current readiness:
  - The dashboard still preserves the direct `working_dashboard.html` artifact.
  - The new harness is dependency-free and does not introduce a build step.
  - Desktop smoke evidence exists for this pass.
  - Full mobile, keyboard runtime, stale-source interception, and localStorage behavior tests are still not automated.
- P2 accessibility cleanup implementation completed:
  - Associated the `backtestPeriod` label with `for="backtestPeriod"`.
  - Raised mobile hit areas for header toggles, info triggers, and chart mode/range/overlay buttons.
  - Added mobile wrapping for the live-market kicker so the larger info trigger and status controls do not crowd the line.
  - Extended `scripts/verify_dashboard_static.cjs` with label and mobile touch-target markers.
- P2 accessibility cleanup targeted verification:
  - `node scripts/verify_dashboard_static.cjs`: `23 static dashboard checks passed.`
  - JS syntax check: `syntax ok`
  - Static marker search found `label for="backtestPeriod"`, `min-height: 44px`, and `min-width: 44px`.
  - Mobile Chrome headless screenshot: `docs/captures/2026-06-03-tcrei-p2-mobile-touch.png`, PNG `390 x 844`, 53 KB.
  - Browser smoke note: Chrome printed macOS `CVDisplayLinkCreateWithCGDisplay` warnings, but exited successfully and wrote the screenshot.
- P2-DATA-01 first pass implementation completed:
  - Added a default metric contract with cadence, required fields, minimum point count, stale threshold, criticality, and fallback behavior.
  - Added critical metric IDs and mapped all metric definitions through `withMetricContract(...)`.
  - Connected `loadMetric(...)` to `validateMetricSeries(...)` so required fields, `contract.minPoints`, and `contract.staleAfterHours` are consumed before a metric can be marked live.
  - Added a `stale` metric status for old-but-valid series.
  - Rendered compact contract metadata on metric cards, the selected metric meta area, and failed/stale metric rows.
  - Escaped source/error text in the affected rendering path while editing nearby markup.
- P2-DATA-01 first pass targeted verification:
  - `node scripts/verify_dashboard_static.cjs`: `48 static dashboard checks passed.`
  - JS syntax check: `syntax ok`
  - Static marker search confirmed `DEFAULT_METRIC_CONTRACT`, `validateMetricSeries`, stale detection, `contract.minPoints`, `contract.staleAfterHours`, `metricContractText`, and `withMetricContract` usage.
- P2-DATA-01 second pass implementation completed:
  - Added per-source timing and payload telemetry via `sourceTelemetry`.
  - Displayed telemetry on metric cards, selected metric meta, the failed metric list, and the source-health panel.
  - Added a dedicated runtime contract verifier script that exercises `validateMetricSeries(...)` against fresh, stale, and too-short series.
- P2-DATA-01 second pass targeted verification:
  - `node scripts/verify_dashboard_static.cjs`: `52 static dashboard checks passed.`
  - `node scripts/verify_dashboard_runtime_contract.cjs`: `dashboard runtime contract checks passed`
  - JS syntax check: `syntax ok`
- Current readiness update:
  - The narrow P2 label/touch-target pass is complete.
  - Full keyboard runtime, localStorage behavior, and full mobile visual regression are still not automated.
- P2-PERF-01 implementation completed:
  - Added `INITIAL_METRIC_IDS` and split metric loading into core and deferred stages.
  - Loaded the core decision-critical metrics first, then deferred the remaining metric cards and backtest data with `requestIdleCallback`/`setTimeout` fallback.
  - Added a `summaryPending` counter and a loading state for the backtest panel before its data arrives.
  - Kept source telemetry visible so the source-health panel now shows progress plus timing/payload context.
- P2-PERF-01 targeted verification:
  - `node scripts/verify_dashboard_static.cjs`: `56 static dashboard checks passed.`
  - `node scripts/verify_dashboard_runtime_contract.cjs`: `dashboard runtime contract checks passed`
  - JS syntax check: `syntax ok`
- P2-UX-02 implementation completed:
  - Changed the Korean default backtest eyebrow to `미래 데이터 배제 백테스트`.
  - Changed the Korean default quality loading title to `소스 상태 로딩 중`.
  - Updated the Korean backtest info modal title to `미래 데이터 배제 백테스트`.
  - Extended the static regression harness to verify the Korean default strings and to guard against the old mixed-English labels returning.
- P2-UX-02 targeted verification:
  - `node scripts/verify_dashboard_static.cjs`: `60 static dashboard checks passed.`
  - JS syntax check: `syntax ok`
  - Static search confirmed `No-lookahead 백테스트` and `Loading source health` are gone from `working_dashboard.html`.
- Info popover semantics/mobile tap behavior implementation completed:
  - Changed the shared info help surface from `role="dialog"` to `role="tooltip"` so its semantics match explanatory hover/focus help.
  - Connected every info trigger to the tooltip with `aria-describedby`, `aria-controls`, and `aria-expanded`.
  - Added tap-to-toggle behavior for touch/mobile use.
  - Added Escape close, outside-click close, and trigger focus restoration on Escape.
  - Kept hover/focus behavior for desktop without adding a build step or dependency.
  - Extended `scripts/verify_dashboard_static.cjs` with info popover semantics and mobile tap markers.
- Info popover targeted verification:
  - JS syntax check: `syntax ok`
  - `node scripts/verify_dashboard_static.cjs`: `29 static dashboard checks passed.`
  - Static marker search found `role="tooltip"`, no `role="dialog"`, `aria-describedby`, `aria-expanded`, `aria-controls`, `toggleInfoModal`, Escape close, and outside-click close.
  - Mobile Chrome headless screenshot: `docs/captures/2026-06-03-tcrei-info-popover-mobile.png`, PNG `390 x 844`, 44 KB.
  - Browser smoke note: Chrome printed macOS `CVDisplayLinkCreateWithCGDisplay` warnings, but exited successfully and wrote the screenshot.
- Current readiness update:
  - The narrow P2 info popover semantics/mobile tap pass is complete.
  - Full keyboard runtime, stale-source interception, localStorage behavior, and full mobile visual regression are still not automated.
- Korean default mixed-language cleanup implementation completed:
  - Localized the default `No Edge`, `No trade`, and `Score threshold vs buy-and-hold` labels in the initial Korean HTML.
  - Localized the Korean quality eyebrow from `Staleness Guard` to `지연 방어`.
  - Localized Korean regime/action labels such as risk-off, confirmed strength, fragile rally, accumulation watch, hold, trim, exit, and add.
  - Added `decisionLabels` for Korean and English while preserving stored journal decision values such as `buy`, `hold`, and `no trade`.
  - Added `decisionLabel(...)` and `updateJournalSelectLabels()` so journal select options and rendered journal rows display localized labels without changing persistence/export values.
  - Localized `Signal guard`, `ok`, and `weak` in Korean-rendered score/quality details.
  - Extended `scripts/verify_dashboard_static.cjs` with Korean default label and journal label checks.
- Korean label cleanup targeted verification:
  - JS syntax check: `syntax ok`
  - `node scripts/verify_dashboard_static.cjs`: `36 static dashboard checks passed.`
  - Static audit-string search found no hardcoded Korean-default instances of `id="regimeLabel">No Edge`, `id="profitAction">No trade`, `<option value="buy">buy</option>`, `<option value="all">all</option>`, `Buy & Hold보다`, or `No Edge로`. Remaining `Score threshold vs buy-and-hold` and `Signal guard` matches are inside the English translation block.
  - Desktop Chrome headless screenshot: `docs/captures/2026-06-03-tcrei-ko-labels-desktop.png`, PNG `1440 x 1200`, 195 KB.
  - Browser smoke note: Chrome printed macOS `CVDisplayLinkCreateWithCGDisplay` and related headless warnings, but exited successfully and wrote the screenshot.
- Current readiness update:
  - The narrow P2 Korean default mixed-language pass is complete.
  - Full keyboard runtime, stale-source interception, localStorage behavior, and full mobile visual regression are still not automated.
- Top chart control density implementation completed:
  - Kept the live chart range controls visible.
  - Moved overlay and render-mode controls into a native `details` disclosure labeled `차트 옵션` / `Chart options`.
  - Kept the advanced controls open by default on desktop so the desktop workflow remains unchanged.
  - Added `syncChartAdvancedDisclosure()` so mobile widths start with advanced chart controls collapsed.
  - Added mobile CSS for the disclosure summary and expanded-state layout.
  - Extended `scripts/verify_dashboard_static.cjs` with chart control disclosure checks.
- Top chart control density targeted verification:
  - JS syntax check: `syntax ok`
  - `node scripts/verify_dashboard_static.cjs`: `41 static dashboard checks passed.`
  - Static marker search found `chart-advanced-controls`, `chart-options-summary`, `chartOptionsSummary`, `syncChartAdvancedDisclosure`, and range controls before the advanced disclosure.
  - Mobile Chrome headless screenshot: `docs/captures/2026-06-03-tcrei-chart-controls-mobile.png`, PNG `390 x 844`, 53 KB.
  - Tall mobile Chrome headless screenshot: `docs/captures/2026-06-03-tcrei-chart-controls-mobile-tall.png`, PNG `390 x 1600`, 105 KB. The visible control row shows range buttons plus `차트 옵션`; overlay and render-mode controls are collapsed.
  - Browser smoke note: Chrome printed macOS `CVDisplayLinkCreateWithCGDisplay` and related headless warnings, but exited successfully and wrote the screenshots.
- Current readiness update:
  - The narrow P2 top chart control density pass is complete.
  - Full keyboard runtime, stale-source interception, localStorage behavior, and full mobile visual regression are still not automated.
- P2-TEST-01 implementation completed:
  - Added `scripts/verify_dashboard_browser.cjs` as a lightweight browser regression harness with `file://` success and failure variants.
  - Captured desktop, laptop, and mobile screenshots from headless Chrome.
  - Verified a file-based smoke path and a stale/failure path without adding a build step or Playwright dependency.
  - Extended `scripts/verify_dashboard_static.cjs` with a guard that the browser regression verifier exists.
- P2-TEST-01 targeted verification:
  - `node scripts/verify_dashboard_browser.cjs`: `browser regression checks passed`
  - Desktop Chrome headless screenshot: `docs/captures/2026-06-03-browser-regression-desktop.png`
  - Laptop Chrome headless screenshot: `docs/captures/2026-06-03-browser-regression-laptop.png`
  - Mobile Chrome headless screenshot: `docs/captures/2026-06-03-browser-regression-mobile.png`
- Current readiness update:
  - The automated browser regression gap is now covered with a dependency-free local harness.
  - Full resize debounce hardening and the remaining P3 items are still open.
- P3-PERF-02 implementation completed:
  - Added a RAF-based resize scheduler for the live market panel.
  - The resize path now ignores repeated events within the same frame and only re-renders when the live chart width actually changes.
  - Extended `scripts/verify_dashboard_static.cjs` with a resize-debounce marker check.
- P3-PERF-02 targeted verification:
  - JS syntax check: `syntax ok`
  - `node scripts/verify_dashboard_static.cjs`: `62 static dashboard checks passed.`
- Current readiness update:
  - The live-market resize handler is now debounced.
- P3-UX-04 implementation completed:
  - Added a positive empty state for the unavailable/failed-source list when all selected sources are healthy.
  - Localized the empty-state copy in both Korean and English.
  - Added a static regression marker for the empty-state rendering path.
  - Extended the browser regression harness to assert the positive empty state in the success path.
- P3-UX-04 targeted verification:
  - JS syntax check: `syntax ok`
  - `node scripts/verify_dashboard_static.cjs`: `63 static dashboard checks passed.`
  - `node scripts/verify_dashboard_browser.cjs`: `browser regression checks passed`
- Current readiness update:
  - The unavailable source list now shows an explicit positive state when nothing is failed.
- Failure/stale-state regression increment completed:
  - Added browser fixtures for live recovery after the first successful load, and for partial fundamentals failure.
  - Verified the previous live price remains visible after a later live refresh failure.
  - Verified the dashboard still renders when a noncritical fundamentals source fails.
  - Added static marker checks for the new browser regression scenarios.
- Failure/stale-state regression targeted verification:
  - JS syntax check: `syntax ok`
  - `node scripts/verify_dashboard_static.cjs`: `65 static dashboard checks passed.`
  - `node scripts/verify_dashboard_browser.cjs`: `browser regression checks passed`
- Current readiness update:
  - The browser harness now covers success, full failure, stale failure, live recovery after initial success, and partial fundamentals failure.
- CoinGecko failure regression increment completed:
  - Added a browser fixture for CoinGecko market-chart failure.
  - Verified the dashboard still exposes a failed source state and keeps the summary visible.
  - Added a static marker check for the new browser regression scenario.
- CoinGecko failure regression targeted verification:
  - JS syntax check: `syntax ok`
  - `node scripts/verify_dashboard_static.cjs`: `66 static dashboard checks passed.`
  - `node scripts/verify_dashboard_browser.cjs`: `browser regression checks passed`
- Current readiness update:
  - The browser harness now covers success, full failure, stale failure, live recovery after initial success, partial fundamentals failure, CoinGecko failure, and a simulated fees timeout.
  - The next smallest remaining item is the last unmodeled failure/stale-state edge case from section 7.5 of `docs/2026-06-01-detailed-test-and-improvement-report.md`.
- Fees timeout regression increment completed:
  - Added a browser fixture that simulates an abort/timeout path for DefiLlama Ethereum fees.
  - Verified the dashboard surfaces the failed fees source without breaking the rest of the page.
  - Added a static marker check for the timeout scenario.
- Fees timeout regression targeted verification:
  - JS syntax check: `syntax ok`
  - `node scripts/verify_dashboard_static.cjs`: `67 static dashboard checks passed.`
  - `node scripts/verify_dashboard_browser.cjs`: `browser regression checks passed`
- Current readiness update:
  - The browser harness now covers success, full failure, stale failure, live recovery after initial success, partial fundamentals failure, CoinGecko failure, and a fees timeout path.
- Stale-but-valid daily data regression increment completed:
  - Added a browser fixture where fundamentals are stale but valid while live ticker data stays fresh.
  - Verified the stale badge appears, the live ETH price remains visible, and the decision layer stays neutral/no-edge.
  - Added a static marker check for the stale-daily-data scenario.
- Stale-but-valid daily data regression targeted verification:
  - JS syntax check: `syntax ok`
  - `node scripts/verify_dashboard_static.cjs`: `68 static dashboard checks passed.`
  - `node scripts/verify_dashboard_browser.cjs`: `browser regression checks passed`
- Current readiness update:
  - Section 7.5 is now fully covered in the browser harness.
- Security and local-storage regression increment completed:
  - Hardened journal loading so corrupted `ethTradingJournal` values fall back to an empty list instead of breaking render.
  - Added browser fixtures for corrupted storage, unavailable storage, very long journal reasons, special-character CSV export, and clear-confirm / clear-cancel flows.
  - Verified the browser harness with `browser regression checks passed` after the new journal scenarios.
  - Updated the static harness to cover the new journal markers, bringing the total to `76 static dashboard checks passed.`
- Current readiness update:
  - The section 7.6 security and local-storage tests are now fully covered.
- Next active iteration:
  - There is no remaining item in the current 7.x regression loop; start the next task from a new audit or follow-up requirement.
