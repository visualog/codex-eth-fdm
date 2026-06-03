# Ethereum Fundamentals Dashboard Detailed Test And Improvement Report

Created: 2026-06-01

Basis document: `docs/2026-06-01-fundamentals-site-improvement-plan.md`

Test target: `working_dashboard.html`

## 1. Executive Summary

The dashboard is functional as a local-first single HTML artifact. The live ETH/USDT market panel loaded in a real desktop browser, the core public API sources responded with HTTP 200 and CORS `*`, and the code already includes good foundations such as source failure badges, stale live-state handling, dark/light theme support, reduced-motion CSS, no-lookahead backtest structure, and local trading journal storage.

However, several issues should be fixed before treating this as a polished decision-support product:

- P1: Trading journal text is rendered back with `innerHTML` without escaping, creating a local stored-XSS and UI breakage risk.
- P1: Metric cards are clickable `article` elements without keyboard semantics, so keyboard users cannot operate a core interaction.
- P1: `Clear journal` immediately deletes user records without confirmation or undo.
- P2: Initial data loading is heavy. Some single API payloads are multi-MB, which can hurt mobile, slow networks, and rate-limit resilience.
- P2: Small touch targets, one unlabeled readonly input, and tooltip/dialog semantics need accessibility cleanup.
- P2: The UI mixes Korean and English labels in default Korean mode, which weakens trust and comprehension.
- P2: The dashboard needs automated browser regression tests. Manual browser evidence exists, but Playwright/Chromium is not installed in this project.

Overall audit score: **11/20 Acceptable**

UX heuristic score: **24/40 Usable but overloaded**

Recommended next action: fix P1 issues first, then add an automated browser/API test harness before adding more metrics.

## 2. Test Evidence

### 2.1 Static Code Inspection

Commands used:

```bash
wc -l working_dashboard.html
rg -n "fetchJSON|fetchLive|startLivePolling|localStorage|backtest|stale|failed|error" working_dashboard.html
rg -n "<button|<input|<select|<textarea|aria-|role=|tabindex|label" working_dashboard.html
node static DOM/CSS audit snippets
```

Findings:

- `working_dashboard.html` has 3,772 lines.
- Static scan found 29 buttons, 10 form controls, 30 `aria-label` attributes, 17 `innerHTML` assignment sites, 11 click-handler sites, and 3 media queries.
- One form control was detected without a proper `for` label: `backtestPeriod` at `working_dashboard.html:1453`.
- Metric cards are rendered as clickable `article.card` elements at `working_dashboard.html:3693` and only receive mouse click handlers at `working_dashboard.html:3706`.
- Journal entries are saved from user input at `working_dashboard.html:3551` and rendered back via `innerHTML` at `working_dashboard.html:3596`.
- Reduced-motion support exists for live chart transitions at `working_dashboard.html:1014`.
- No-lookahead backtest structure uses `signalDay = rows[i - 1]` before applying today's return at `working_dashboard.html:3439`.

### 2.2 Public API And Source Checks

All tested primary sources returned HTTP 200 with CORS `*` from `curl -H 'Origin: null'`.

| Source | Result | Response Size | Time | Schema Check |
|---|---:|---:|---:|---|
| Binance 24h ticker | 200 | 550 B | 0.08s | `lastPrice`, `priceChangePercent` present |
| Binance 1m klines | 200 | 10,086 B | 0.08s | 60 rows, finite close values |
| Binance 1d klines | 200 | 83,129 B | 0.08s | 450 rows, finite close values |
| CoinGecko ETH market chart | 200 | 37,843 B | 0.33s | 366 prices, market caps, volumes |
| DefiLlama Ethereum TVL | 200 | 116,886 B | 0.70s | 3,170 rows |
| DefiLlama fees overview | 200 | 5,427,224 B | 2.90s | 2,984 chart rows |
| DefiLlama DEX overview | 200 | 212,747 B | 3.22s | 2,769 chart rows |
| DefiLlama stablecoin chart | 200 | 1,465,713 B | 2.34s | 3,107 rows |
| DefiLlama Lido yield | 200 | 225,972 B | 1.94s | 1,461 rows |
| growthepie fundamentals | 200 | 3,934,605 B | 2.19s | 37,918 rows |

Interpretation:

- Source availability is currently good.
- The heavy endpoints are the main data-performance risk, especially `fees`, `stablecoins`, and `growthepie`.
- The local single-file model still depends on many third-party APIs at page load, so source-failure and slow-network tests must be automated.

### 2.3 Browser Verification

Manual browser check:

- Opened `working_dashboard.html` directly with `open`.
- Captured desktop state after load.
- Evidence image: `docs/captures/2026-06-01-audit-desktop-afterload.png`

Observed:

- The page opened from the local file path.
- Live ETH/USDT price loaded.
- Live status showed active 15-second refresh.
- Header displayed final load timestamp.
- Top viewport had no obvious overlap in the tested desktop split-screen viewport.
- The live market area looked functional, but dense.

Limitation:

- Playwright and `@playwright/test` were not installed.
- `chromium`, `google-chrome`, and `playwright` CLI were not available.
- Mobile and full-page browser checks were therefore limited to static CSS/DOM review plus manual desktop capture.

### 2.4 Contrast And Theme Checks

Computed contrast ratios for representative token pairs:

| Pair | Ratio | Result |
|---|---:|---|
| Light muted text on panel | 5.00:1 | Pass AA |
| Light muted text on background | 4.64:1 | Pass AA, close to threshold |
| Light ink on panel | 17.61:1 | Pass |
| Light accent on panel | 6.62:1 | Pass |
| Dark muted text on panel | 7.00:1 | Pass |
| Dark ink on panel | 15.37:1 | Pass |
| Dark accent on panel | 8.29:1 | Pass |
| Button text light mode | 17.61:1 | Pass |
| Button text dark mode | 16.15:1 | Pass |

Interpretation:

- Color contrast is generally solid.
- The weakest checked pair still passes WCAG AA, but small 10-11px chart labels may remain hard to read even with sufficient contrast.

## 3. Audit Health Score

| # | Dimension | Score | Key Finding |
|---|---:|---:|---|
| 1 | Accessibility | 2/4 | Core keyboard path is incomplete for metric cards; tooltip/dialog semantics need work. |
| 2 | Performance | 2/4 | Initial page load pulls several large public API payloads. |
| 3 | Theming | 3/4 | Tokenized light/dark theme is good; some hardcoded values and generic typography remain. |
| 4 | Responsive Design | 2/4 | Breakpoints exist, but touch targets and dense chart controls are weak on mobile. |
| 5 | Anti-Patterns | 2/4 | Some dark-card dashboard and hero-metric patterns remain visible. |
| **Total** |  | **11/20** | **Acceptable, but needs targeted hardening.** |

## 4. UX Heuristic Score

| # | Heuristic | Score | Key Issue |
|---|---:|---:|---|
| 1 | Visibility of System Status | 3/4 | Live/stale badges and timestamps exist, but source status is not comprehensive. |
| 2 | Match System / Real World | 3/4 | Finance concepts are mostly clear, but mixed Korean/English labels reduce clarity. |
| 3 | User Control And Freedom | 2/4 | Journal clear has no undo; metric selection is mouse-first. |
| 4 | Consistency And Standards | 2/4 | Korean mode still contains `No Edge`, `No trade`, `Score threshold`, `buy/add/hold`. |
| 5 | Error Prevention | 2/4 | Staleness guard helps, but destructive journal delete and user-input HTML are unsafe. |
| 6 | Recognition Rather Than Recall | 3/4 | Labels and info buttons help, but too many controls are visible at once. |
| 7 | Flexibility And Efficiency | 2/4 | Filters and chart modes exist; keyboard efficiency is incomplete. |
| 8 | Aesthetic And Minimalist Design | 2/4 | Useful, but visually dense and dashboard-card heavy. |
| 9 | Error Recovery | 2/4 | Live stale fallback exists; per-source retry and recovery guidance are limited. |
| 10 | Help And Documentation | 3/4 | Info buttons and docs exist, but popover accessibility is weak. |
| **Total** |  | **24/40** | **Usable but overloaded.** |

## 5. Detailed Findings

### P1-SEC-01: Journal Reason Can Render Unescaped HTML

Location:

- Input captured at `working_dashboard.html:3551`
- Rendered through `innerHTML` at `working_dashboard.html:3596`

Impact:

The trading journal accepts arbitrary user text and later injects it into the DOM without escaping. Even though this is a local dashboard, a copied/imported journal entry or pasted note containing HTML can break layout or execute script in the local page context.

Recommendation:

- Render journal rows with DOM methods (`createElement`, `textContent`) instead of string templates.
- If retaining templates, wrap every user-controlled field with `escapeHtml()`.
- Escape at least `entry.decision`, `entry.regime`, `entry.reason`, and any imported future journal data.

Additional test:

- Save a journal reason containing `<img src=x onerror=alert(1)>`.
- Confirm the literal text is displayed and no image/error handler executes.

### P1-A11Y-01: Metric Cards Are Mouse-Only Interactive Surfaces

Location:

- Card markup at `working_dashboard.html:3693`
- Click handler at `working_dashboard.html:3706`

Impact:

The metric explorer is a core workflow. Keyboard and assistive-technology users cannot reliably focus or activate metric cards because the clickable surface is an `article`, not a button/link, and no Enter/Space key handler is attached.

Recommendation:

- Add an explicit `button` inside each metric card for selecting the metric, or convert the selectable surface to a semantic button-like control.
- If keeping `article`, add `tabindex="0"`, `role="button"`, `aria-pressed` for selected state, and Enter/Space key handling.
- Avoid nesting a full-card button around the source link; keep the source link separately focusable.

Additional test:

- Tab from the filter toolbar to the metric grid.
- Activate a metric using Enter and Space.
- Confirm focus remains visible and the main chart updates.

### P1-UX-01: `Clear journal` Is Destructive Without Confirmation Or Undo

Location:

- Clear action at `working_dashboard.html:3579`

Impact:

The journal is the only local record of user decisions. One click deletes all entries with no confirmation, undo, or backup prompt. This is a high-friction trust issue for a decision-support tool.

Recommendation:

- Require a confirmation dialog or inline confirmation state.
- Prefer an undo snackbar: "Journal cleared. Undo" for 8-10 seconds.
- Consider exporting a local backup automatically before clearing.

Additional test:

- Create two journal entries.
- Click clear.
- Confirm an undo path exists and restores both entries.

### P2-A11Y-02: Info Modal Uses Dialog Semantics For Hover Tooltip Behavior

Location:

- Modal markup at `working_dashboard.html:1300`
- Hover/focus behavior at `working_dashboard.html:2467`

Impact:

The element has `role="dialog"` but behaves like a tooltip/popover. It opens on hover/focus, does not move focus, has no `aria-labelledby`/`aria-describedby`, has no Escape close behavior, and cannot be explored easily by keyboard while focus remains on the trigger.

Recommendation:

- If it is explanatory hover help, use `role="tooltip"` and connect triggers with `aria-describedby`.
- If it is a real dialog, add `aria-modal`, labelledby/describedby, Escape close, and focus management.
- On mobile, make info triggers tap-to-toggle rather than hover-dependent.

Additional test:

- Navigate info triggers with keyboard only.
- Confirm screen reader announces the help text once and does not trap focus.
- Confirm Escape hides the panel.

### P2-A11Y-03: Some Touch Targets Are Below 44px

Location:

- Theme/language toggles: `working_dashboard.html:146`
- Info trigger: `working_dashboard.html:206`
- Chart mode buttons: `working_dashboard.html:898`

Impact:

Several important controls are visually and physically small. This is especially risky on mobile, where chart range, overlay, and mode controls are dense.

Recommendation:

- Set mobile `min-height: 44px` for all buttons and interactive controls.
- Keep desktop compact if needed, but expand hit areas with padding or pseudo-elements.
- Group chart controls into segmented controls with larger tap targets.

Additional test:

- Verify touch target size at 390px and 430px wide mobile viewports.

### P2-A11Y-04: Backtest Period Input Has A Label Without `for`

Location:

- `working_dashboard.html:1453`

Impact:

The readonly backtest period field is visible, but its label is not programmatically associated with the input.

Recommendation:

- Change to `<label for="backtestPeriod">`.
- Since it is output-like, consider replacing the readonly input with `<output id="backtestPeriod">`.

Additional test:

- Run an accessibility tree check and confirm every form control has a computed accessible name.

### P2-PERF-01: Initial Load Pulls Several Large API Payloads

Evidence:

- DefiLlama fees: 5.43 MB
- growthepie fundamentals: 3.93 MB
- DefiLlama stablecoins: 1.47 MB
- Lido yield: 226 KB

Impact:

The dashboard opens locally, but first render depends on multiple large external API responses. This may feel slow on mobile or unstable networks and may increase third-party rate-limit exposure.

Recommendation:

- Load live market first, then progressively load fundamentals.
- Lazy-load low-priority metric categories after first meaningful paint.
- Add per-source size and timing telemetry to the source-health panel.
- Cache successful fundamentals in `localStorage` or IndexedDB with timestamped stale labels.
- Consider a small optional build/snapshot step for heavy daily fundamentals if single-file runtime speed becomes more important.

Additional test:

- Run slow 3G or network throttling.
- Measure time to first live price, first fundamentals card, and all metrics loaded.

### P2-DATA-01: Metric Contract Is Still Implicit In Code

Location:

- Metric definitions start at `working_dashboard.html:2793`
- Fetch and stale logic at `working_dashboard.html:2644`

Impact:

Each metric contains source, unit, and compute logic, but the full contract from the improvement plan is not explicit: update cadence, required fields, series length requirement, stale threshold, and fallback behavior are not first-class fields.

Recommendation:

- Extend each metric definition with `cadence`, `requiredFields`, `minPoints`, `staleAfterHours`, and `criticality`.
- Use those fields in source health, rendering, and decision gating.
- Show per-source freshness rather than only a final page load timestamp.

Additional test:

- Force one source to return old-but-valid data.
- Confirm it renders as stale rather than live.

### P2-UX-02: Korean Default UI Still Contains Mixed English Labels

Evidence:

- `No Edge`
- `No trade`
- `Score threshold vs buy-and-hold`
- `buy`, `add`, `hold`, `trim`, `exit`
- `Signal guard`

Impact:

This is not a functional break, but it makes the dashboard feel less finished and increases cognitive load for Korean users.

Recommendation:

- Translate all default Korean UI labels.
- Keep technical English only where it is a market convention, and provide Korean helper text.
- Add a static i18n completeness check that compares Korean and English translation keys and scans hardcoded visible strings.

Additional test:

- Switch to Korean and English.
- Confirm no orphaned hardcoded labels remain in either mode.

### P2-UX-03: Top Chart Controls Are Dense And Always Visible

Location:

- Chart range, overlay, and mode controls at `working_dashboard.html:1352`

Impact:

The live chart exposes time range, overlays, and rendering mode all at once. This is powerful, but on a small screen it becomes a dense control strip before the user has understood the chart.

Recommendation:

- Keep range controls visible.
- Move overlay and render mode controls into compact segmented menus or a disclosure panel on mobile.
- Use clearer grouping and reduce simultaneous decisions.

Additional test:

- Count visible controls in the top live section on 390px width.
- Confirm the first-time path is price -> range -> decision context, not all controls at once.

### P2-TEST-01: Automated Browser Regression Is Missing

Evidence:

- `playwright` and `@playwright/test` modules were not installed.
- `chromium`, `google-chrome`, and `playwright` CLI were not available.

Impact:

Manual and static tests can catch many issues, but cannot prove mobile layout, keyboard behavior, stale states, and local-file behavior repeatably.

Recommendation:

- Add Playwright as a dev dependency or a lightweight verification script.
- Run against both `file://` and a local static server.
- Add screenshots for desktop, laptop, and mobile.
- Add route interception for failed API states.

Additional test:

- `file://` smoke test
- 390x844 mobile screenshot
- keyboard tab-order test
- network failure/stale state test
- journal XSS test

### P3-PERF-02: Resize Handler Re-renders Live Market Without Debounce

Location:

- `working_dashboard.html:3750`

Impact:

The live market SVG can be rebuilt many times while resizing the window. It is not a current blocker, but it is easy to harden.

Recommendation:

- Debounce resize with `requestAnimationFrame`.
- Only re-render when chart width actually changes.

Additional test:

- Resize the browser window repeatedly and measure render calls.

### P3-UX-04: Empty Failed-Source List Has No Positive Empty State

Location:

- `working_dashboard.html:3726`

Impact:

When no metrics fail, the "unavailable" section may appear visually empty rather than explicitly confirming that all selected metrics loaded.

Recommendation:

- Render a compact success message such as "현재 사용 불가 지표 없음".
- Keep a separate section for structurally excluded/key-gated metrics from `failed_metrics.md`.

Additional test:

- Load with all sources successful and confirm the unavailable section has a clear empty state.

## 6. Positive Findings To Preserve

- The page remains a single local HTML artifact.
- Live market data is visually separated from slow fundamentals.
- Live polling preserves previous values on failure by spreading `liveState` in the catch path.
- `fetchWithTimeout()` uses `AbortController` and `cache: "no-store"`.
- The backtest uses previous-day signal inputs before applying today's return.
- Dark/light theme tokens are implemented consistently enough to pass representative contrast checks.
- Reduced-motion CSS exists for live chart transitions.
- The source map and failed metrics docs make data-source decisions traceable.

## 7. Additional Tests To Add Before The Next Feature Pass

### 7.1 Automated API Contract Test

Create a script that checks:

- endpoint HTTP status
- CORS header
- response schema
- minimum series length
- latest timestamp freshness
- payload size
- parse time

The script should fail if a decision-critical source is missing or stale, and warn if a noncritical source fails.

### 7.2 Browser Smoke Test

Use Playwright or equivalent:

- Open `working_dashboard.html` through `file://`.
- Wait for live price to be non-placeholder.
- Wait for summary live count to become nonzero.
- Confirm no console errors.
- Confirm theme and language toggles work.

### 7.3 Responsive Visual Regression

Capture:

- 1440x1000 desktop
- 1180x900 laptop
- 820x1180 tablet
- 390x844 mobile

Assert:

- no horizontal scroll
- no chart-control overlap
- no text overflow inside cards/buttons
- live price and key action remain visible

### 7.4 Accessibility Regression

Use axe or browser accessibility snapshots:

- all form controls have accessible names
- all clickable surfaces are keyboard reachable
- focus order is logical
- focus styles are visible
- tooltip/popover behavior is announced correctly
- touch targets are at least 44px on mobile

### 7.5 Failure And Stale-State Tests

Intercept or mock:

- Binance ticker failure
- Binance kline failure
- CoinGecko failure
- growthepie slow response
- DefiLlama fees oversized/timeout response
- stale-but-valid daily data

Assert:

- previous live values stay visible where expected
- stale/failed badge appears
- decision layer moves to neutral/no-edge for critical failures
- partial fundamentals still render

### 7.6 Security And Local-Storage Tests

Test:

- journal reason HTML injection
- very long journal reason
- corrupted `ethTradingJournal` localStorage value
- unavailable localStorage
- export after special characters and Korean text
- clear journal undo/confirmation

## 8. Recommended Fix Order

1. Fix journal rendering XSS by replacing unsafe `innerHTML` for user-entered journal content.
2. Make metric card selection keyboard-accessible.
3. Add confirmation or undo for clearing the journal.
4. Fix info popover semantics and mobile tap behavior.
5. Raise touch target sizes and fix the `backtestPeriod` label.
6. Add metric contract fields and source freshness/staleness display.
7. Progressive-load heavy fundamentals and show source timing/payload status.
8. Complete Korean/English translation consistency.
9. Add Playwright/API contract tests and store desktop/mobile screenshots under `docs/captures/`.
10. Re-run this audit after fixes.

## 9. Completion Criteria For The Next Pass

The next implementation pass should be considered complete only when:

- The P1 issues above are fixed.
- The dashboard still opens directly as `working_dashboard.html`.
- Automated tests prove live market, fundamentals, journal, and failure states.
- Mobile screenshot verifies no overlap or unusable controls.
- The source health panel shows freshness and failures per source.
- Korean mode contains no unintended English labels.
- The report is updated with before/after evidence.

