# Ethereum Fundamentals Dashboard Handoff

Created: 2026-06-03

## Current Goal

Continue the single-file `working_dashboard.html` dashboard using the TCREI + auto-verification loop.

The next session should read:

- `/Users/visualog/Documents/GitHub/xcodex-02/TCREI-auto-verification-loop.md`
- `docs/2026-06-03-tcrei-next-pass.md`
- `docs/2026-06-01-detailed-test-and-improvement-report.md`
- `docs/2026-06-01-fundamentals-site-improvement-plan.md`
- `README.md`

## Current State

`working_dashboard.html` is still the main artifact. It remains a local-first single HTML dashboard with:

- live ETH/USDT polling
- fundamentals metrics
- decision/profit panels
- a no-lookahead backtest
- data-quality guards
- a local trading journal

The dashboard still opens directly via `file://` without a build step.

## Completed Work

### TCREI Operating Setup

- Added `docs/2026-06-03-tcrei-next-pass.md` as the current execution plan.
- Added `scripts/verify_dashboard_static.cjs` as a dependency-free static verification harness.

### Task 1: Journal Hardening

- Escaped user-controlled journal row content before rendering.
- Added KR/EN confirmation text for clearing the journal.
- Added a confirmation gate before clearing saved journal entries.
- Verified with `node scripts/verify_dashboard_static.cjs` and `node -e ...` syntax checks.

### Task 2: Metric Card Keyboard Accessibility

- Added visible focus styling for metric cards.
- Added `role="button"`, `tabindex`, `aria-pressed`, and `aria-disabled`.
- Added Enter/Space keyboard activation.
- Preserved link behavior inside cards.
- Verified with static marker checks and JS syntax checks.

### Task 3: Compact Regression Harness

- Added `scripts/verify_dashboard_static.cjs`.
- The harness checks:
  - inline script parsing
  - no external script dependency
  - no build-time import
  - live polling and `no-store` fetch behavior
  - timeout guard
  - journal hardening
  - metric card keyboard semantics
  - no-lookahead marker
  - journal localStorage marker
- Captured desktop smoke evidence:
  - `docs/captures/2026-06-03-tcrei-task3-desktop.png`

### P3-UX-04 Empty Failed-Source List Positive State

- Added a positive empty state for the unavailable/failed-source list when all selected sources are healthy.
- Localized the empty-state copy in Korean and English.
- Extended the static regression harness to guard the positive empty state.
- Extended the browser regression harness to assert the positive empty state in the success path.
- Verified with:
  - `node scripts/verify_dashboard_static.cjs`
  - `node scripts/verify_dashboard_browser.cjs`

### API Contract Regression Harness

- Added `scripts/verify_dashboard_api_contract.cjs` as a small live source contract check.
- The harness checks:
  - Binance ticker
  - CoinGecko ETH market chart
  - DefiLlama Ethereum TVL
  - DefiLlama Ethereum fees overview
  - growthepie fundamentals, as a warning-only source in the current harness
  - CoinGecko BTC market chart as a noncritical warning path
- Verified with:
  - `node scripts/verify_dashboard_api_contract.cjs`

### Failure And Recovery Browser Regression

- Extended the browser regression harness with:
  - a live recovery scenario that fails after the first successful ticker/klines load
  - a partial fundamentals failure scenario
- Added a CoinGecko failure scenario.
- Added a simulated DefiLlama fees timeout scenario.
- Added a stale-but-valid daily data scenario.
- Verified that:
  - the previous live price remains visible after a later live refresh failure
  - the dashboard still renders when a noncritical fundamentals source fails
- Verified that CoinGecko failures still keep the summary visible while surfacing a failed source state.
- Verified that the fees timeout path surfaces a failed source state without breaking the page.
- Verified that stale but valid daily data still shows a stale badge, keeps live price visible, and leaves the decision layer neutral.
- Added static guards for the new browser regression scenarios.
- Verified with:
  - `node scripts/verify_dashboard_static.cjs`
  - `node scripts/verify_dashboard_browser.cjs`

### P2 Accessibility Cleanup

- Associated `backtestPeriod` label with `for="backtestPeriod"`.
- Raised mobile hit areas for header toggles, info triggers, and chart mode/range/overlay buttons.
- Added mobile wrapping for the live-market kicker so the control row does not crowd the line.
- Captured mobile smoke evidence:
  - `docs/captures/2026-06-03-tcrei-p2-mobile-touch.png`

### P2 Info Popover Semantics And Mobile Tap Behavior

- Changed the shared info help surface from dialog semantics to tooltip semantics.
- Connected info triggers with `aria-describedby`, `aria-controls`, and `aria-expanded`.
- Added tap-to-toggle behavior for mobile/touch use.
- Added Escape close and outside-click close behavior.
- Extended the static regression harness with info popover checks.
- Captured mobile smoke evidence:
  - `docs/captures/2026-06-03-tcrei-info-popover-mobile.png`

### P2 Korean Default Mixed-Language Cleanup

- Localized default Korean UI labels for regime, profit action, backtest title, quality guard, journal decisions, and quality guard status.
- Preserved journal stored/exported values such as `buy`, `hold`, and `no trade` while displaying localized labels.
- Added static regression checks for the Korean default label cleanup.
- Captured desktop smoke evidence:
  - `docs/captures/2026-06-03-tcrei-ko-labels-desktop.png`

### P2 Top Chart Control Density

- Kept live chart range controls visible.
- Moved overlay and render-mode controls into a `차트 옵션` / `Chart options` disclosure on mobile.
- Kept advanced chart controls open by default on desktop.
- Added static regression checks for the chart control disclosure behavior.
- Captured mobile smoke evidence:
  - `docs/captures/2026-06-03-tcrei-chart-controls-mobile.png`
  - `docs/captures/2026-06-03-tcrei-chart-controls-mobile-tall.png`

### P2-TEST-01 Automated Browser Regression

- Added `scripts/verify_dashboard_browser.cjs` as a lightweight browser regression harness.
- The harness runs headless Chrome against `file://` success and failure variants, captures desktop/laptop/mobile screenshots, and checks both a normal smoke path and a stale/failure path.
- Added a static guard for the browser regression verifier in `scripts/verify_dashboard_static.cjs`.
- Captured browser evidence:
  - `docs/captures/2026-06-03-browser-regression-desktop.png`
  - `docs/captures/2026-06-03-browser-regression-laptop.png`
  - `docs/captures/2026-06-03-browser-regression-mobile.png`

### P3-PERF-02 Live Market Resize Debounce

- Added a RAF-based resize scheduler for the live market panel.
- The resize path now coalesces repeated events and only re-renders when the live chart width changes.
- Extended `scripts/verify_dashboard_static.cjs` with a resize debounce marker check.

### P2-DATA-01 Metric Contract First Pass

- Added an explicit default metric contract with cadence, required fields, minimum points, stale threshold, criticality, and fallback behavior.
- Marked decision-critical metrics through `CRITICAL_METRIC_IDS`.
- Mapped all metric definitions through `withMetricContract(...)`.
- Connected `loadMetric(...)` to contract validation for required fields, `minPoints`, and stale detection.
- Added compact contract metadata to metric cards, selected metric meta, and failed/stale metric rows.
- Extended `scripts/verify_dashboard_static.cjs` with metric-contract checks.

### P2-PERF-01 Initial Load Reduction

- Split metric loading into core and deferred stages with `INITIAL_METRIC_IDS`.
- Loaded decision-critical metrics first, then deferred the remaining metric cards and backtest data with `requestIdleCallback`/`setTimeout` fallback.
- Added `summaryPending` so the summary shows how many metrics are still queued.
- Changed the backtest panel to show a loading state until the daily backtest data arrives.
- Kept source telemetry visible on cards, the main metric panel, and the source-health panel.

### P2-UX-02 Korean Default Label Cleanup

- Changed the Korean default backtest eyebrow to `미래 데이터 배제 백테스트`.
- Changed the Korean default quality loading title to `소스 상태 로딩 중`.
- Updated the Korean backtest info modal title to `미래 데이터 배제 백테스트`.
- Extended the static regression harness to guard against the old mixed-English labels returning.

## Verification Already Run

- `node scripts/verify_dashboard_static.cjs`
- `node scripts/verify_dashboard_browser.cjs`
- `node -e 'const fs=require("fs"),vm=require("vm"); ... new vm.Script(script); ...'`
- `curl -I 'https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'`
- Chrome headless desktop screenshot at `1440x1200`
- Chrome headless mobile screenshot at `390x844`
- Info popover pass: `node scripts/verify_dashboard_static.cjs` reported `29 static dashboard checks passed.`
- Korean label pass: `node scripts/verify_dashboard_static.cjs` reported `36 static dashboard checks passed.`
- Chart controls pass: `node scripts/verify_dashboard_static.cjs` reported `41 static dashboard checks passed.`
- Metric contract first pass: `node scripts/verify_dashboard_static.cjs` reported `48 static dashboard checks passed.`
- Metric contract syntax check: inline script parse reported `syntax ok`.
- Metric contract second pass: `node scripts/verify_dashboard_static.cjs` reported `52 static dashboard checks passed.`
- Runtime contract check: `node scripts/verify_dashboard_runtime_contract.cjs` reported `dashboard runtime contract checks passed`.
- Performance load split: `node scripts/verify_dashboard_static.cjs` reported `56 static dashboard checks passed.`
- Korean default label cleanup: `node scripts/verify_dashboard_static.cjs` reported `60 static dashboard checks passed.`
- Browser regression pass: `node scripts/verify_dashboard_browser.cjs` reported `browser regression checks passed`.
- Resize debounce pass: `node scripts/verify_dashboard_static.cjs` reported `62 static dashboard checks passed.`

## Current Status

The current 7.x regression loop is complete. Section 7.6 security and local-storage tests from `docs/2026-06-01-detailed-test-and-improvement-report.md` are now covered.

Reason:

- The metric contract is explicit, consumed by loading/rendering, and covered by a runtime stale-source test.
- The initial-load payload work is split into staged loading.
- The browser/API regression gap is covered with a lightweight local harness.
- The resize-path debounce gap is covered.
- The empty failed-source list has a positive state.
- The security and local-storage coverage in section 7.6 is now covered by browser and static regression checks.

## Notes For The Next Session

The next session should not reconstruct old conversation context. It should:

1. Read `HANDOFF.md`.
2. Read `TCREI-auto-verification-loop.md`.
3. Read `docs/2026-06-03-tcrei-next-pass.md`.
4. Check current repo state with `git status`.
5. Continue from the next task in the TCREI plan.
6. Keep each iteration small: implement, verify, document, then move to the next task.

## New Session Prompt

Use this as the first message in the new session:

```text
토큰 소모를 줄이기 위해 TCREI + 자동 검증 루프로 진행해줘.

먼저 현재 repo 상태를 확인하고, 아래 문서를 우선 읽어줘:
- /Users/visualog/Documents/GitHub/xcodex-02/ethereum_fundamentals_dashboard/HANDOFF.md
- /Users/visualog/Documents/GitHub/xcodex-02/TCREI-auto-verification-loop.md
- /Users/visualog/Documents/GitHub/xcodex-02/ethereum_fundamentals_dashboard/docs/2026-06-03-tcrei-next-pass.md

긴 대화 전체를 복원하지 말고, handoff 문서와 TCREI 문서, 현재 repo/file 상태만 기준으로 판단해줘.

현재까지 완료된 내용과 다음 태스크를 먼저 확인한 다음, Task 1부터 작은 반복 단위로 진행해줘.
각 반복은 구현 → targeted test → 필요 시 전체 test → 산출물/문서 갱신 → 다음 태스크 정의 순서로 닫아줘.
```

## Project Paths

- Main artifact: `working_dashboard.html`
- Static verifier: `scripts/verify_dashboard_static.cjs`
- Current TCREI plan: `docs/2026-06-03-tcrei-next-pass.md`
- Audit report: `docs/2026-06-01-detailed-test-and-improvement-report.md`
- Improvement plan: `docs/2026-06-01-fundamentals-site-improvement-plan.md`
