# Ethereum Fundamentals Site Improvement Plan

Created: 2026-06-01

## Purpose

This document defines what to reference and what to test before further improving the Ethereum fundamentals dashboard.

The current dashboard is a local-first, single-file artifact at `working_dashboard.html`. It already combines slow-moving fundamentals, a high-frequency Binance market panel, RAG-style ecosystem context, and a profit-realization layer. The next pass should not simply add more charts. It should improve source reliability, decision explainability, failure handling, and browser-verified usability while preserving the no-build, no-key default experience.

## Current Project Baseline

- User-facing artifact: `working_dashboard.html`
- Source inventory: `source_map.md`
- Metric catalog: `metrics_catalog.md`
- Excluded or failed source notes: `failed_metrics.md`
- Existing planning context: `docs/rag_context.md`, `docs/realtime_chart_plan.md`, `docs/profit_realization_dashboard_plan.md`
- Current constraint: the dashboard must still open directly in a browser without an API key or build step.

## Reference Sources

### Primary Working Sources

These sources are suitable for direct browser usage because they have already been selected for public, keyless, local-file-friendly use.

| Source | Use In Dashboard | Notes |
|---|---|---|
| Binance Spot REST | Live ETH/USDT ticker, 24h change, high/low, quote volume, klines, daily backtest data | Best source for high-frequency market movement. Keep separate from daily fundamentals. |
| CoinGecko market chart | ETH price, market cap, volume, ETH/BTC, volatility, drawdown | Good for valuation history. Re-check public API limits before expanding historical depth. |
| DefiLlama free API | Ethereum TVL, chain TVL, fees, DEX volume, stablecoin supply, protocol TVL, yields | Core source for DeFi and network economics. Prefer free `api.llama.fi` endpoints unless API keys are allowed. |
| growthepie API | L2/ecosystem transactions, active addresses, onchain profit, blob data | Best source for Ethereum ecosystem and L2 adoption signals. Respect public rate-limit guidance. |

### Reference-Only Sources

These are useful for context, methodology, or external evidence, but should not be wired as default live dependencies unless the access model is solved.

| Source | Use | Reason To Treat Carefully |
|---|---|---|
| L2BEAT | L2 risk, TVS interpretation, scaling trust assumptions | Excellent evidence source, but no stable keyless JSON source has been selected for the local dashboard. |
| Ethereum Dashboards | Discovery of community watchpoints: blobs, gas, MEV, staking, network health, DeFi, L2 risk | Use as a curated reference directory, not as a scraped numeric feed. |
| Dune / Flipside | Rollup economics, MEV, blob attribution, custom historical queries | Usually account/API-key oriented. Good future backend candidate. |
| Etherscan API V2 | Gas oracle, account, transaction, token, and multichain explorer data | Requires API key. Do not add to default single-file mode unless key handling is designed. |
| beaconcha.in | Validator count, validator queues, staking and withdrawal context | Previous validator endpoints returned HTTP 401. Keep unavailable unless a key/proxy or alternative source is approved. |
| Ethereum execution RPC `eth_feeHistory` | Recent base fee, gas usage ratio, priority fee percentiles | Strong candidate for gas state if a reliable public RPC endpoint or backend proxy is selected. |

## Improvement Themes

### 1. Data Contract And Freshness

Create a small internal contract for every metric:

- `source`
- `endpoint`
- `update cadence`
- `required fields`
- `unit`
- `series length requirement`
- `stale threshold`
- `fallback behavior`
- `failure display`

This prevents slow daily fundamentals from being presented as live data and makes failures easier to understand.

### 2. Decision Explainability

Refactor the decision layer into explicit factor groups:

- Market momentum
- Network demand
- DeFi liquidity
- L2 adoption
- Staking/security
- Risk and data quality

Each score should show which metrics contributed to it. A user should be able to answer: "Why did the dashboard say this?"

### 3. Chart And Interaction Quality

Keep the live market chart focused on current execution context:

- current price tag
- 24h high/low
- entry price
- take-profit level
- trailing stop
- invalidation level
- stale/failure badge

For fundamentals, prioritize interpretation over animation:

- 7D, 30D, and 90D changes
- z-score or percentile where useful
- drawdown from local high
- source and freshness label
- empty/partial data states

### 4. Source Resilience

Do not let one broken API break the page. Every external source should degrade independently.

Required behavior:

- Keep prior live values visible during temporary live-source failure.
- Mark stale data clearly.
- Show partial success when some fundamentals load and others fail.
- Avoid silently replacing real missing data with zero.
- Separate "not available because source is key-gated" from "temporarily failed."

### 5. Single-File Delivery With Optional Structured Development

The final user-facing artifact should remain `working_dashboard.html`.

It is acceptable to temporarily split code into `src/`, `styles/`, or test helpers if the implementation becomes too large, but the final handoff should inline or bundle back into a browser-openable single HTML file.

## Testing Plan

### API And Source Tests

- Verify every endpoint returns HTTP 200 or a documented failure.
- Confirm CORS behavior from a browser-like context where relevant.
- Validate response schema and required fields.
- Check that time series are sorted, numeric, and long enough for the chart.
- Confirm public API rate limits are respected.
- Re-test known excluded sources before reintroducing them.

Minimum source checks:

- Binance `ticker/24hr?symbol=ETHUSDT`
- Binance `klines?symbol=ETHUSDT&interval=1m`
- Binance `klines?symbol=ETHUSDT&interval=1d`
- CoinGecko Ethereum market chart
- DefiLlama Ethereum chain TVL, fees, DEX, stablecoin, protocol, and yield endpoints
- growthepie `fundamentals.json` or selected export endpoints

### Data Quality Tests

- No `NaN`, `Infinity`, or accidental string concatenation in derived values.
- No divide-by-zero in ratios such as fees/market cap or stablecoins/TVL.
- Dates are normalized before joining series.
- Derived indicators use matching timestamps.
- Missing data renders as missing, not as zero.
- Daily fundamentals are not mixed into live polling state.

### Live Market Tests

- Polling refreshes every 10-15 seconds.
- Live fetches use uncached or `no-store` behavior.
- Previous values remain visible after a temporary failure.
- Stale badge appears after the configured threshold.
- Failed badge appears when there is no usable current data.
- Range and chart-mode controls do not reset unexpectedly after refresh.
- Live chart labels do not overlap on desktop or mobile.

### Backtest And Signal Tests

- No lookahead: only prior-day signals can affect next-day returns.
- Strategy comparison includes buy-and-hold ETH.
- Warmup periods are explicit.
- Missing daily bars skip or fail safely.
- BTC-relative filters use matching daily timestamps.
- Critical source failure sets the action to a neutral/no-edge state.
- Backtest output includes both return and drawdown, not return alone.

### UI Regression Tests

Check at least:

- desktop wide viewport
- laptop viewport
- mobile viewport
- slow network or failed source state
- all metrics loaded state
- partial metrics failed state
- empty journal state
- journal with saved entries

Visual checks:

- no card text overflow
- no chart label collision
- no floating badge covering data
- loading states are readable
- source/freshness labels are visible but not noisy
- live and daily data are visually distinct

### Local-File Tests

- Open `working_dashboard.html` directly with `file://`.
- Confirm no module import failure.
- Confirm no build step is required.
- Confirm local storage journal still works.
- Confirm network failures do not blank the page.

### Performance Tests

- Measure initial render time.
- Count total API calls on first load.
- Confirm polling does not duplicate intervals after UI interactions.
- Watch memory while live polling runs for several minutes.
- Confirm SVG redraw cost remains acceptable.

## Recommended Implementation Order

1. Create a metric contract table in code or documentation.
2. Add a source health panel or compact source-status strip.
3. Harden live market polling and stale-state display.
4. Add data quality guards for every derived metric.
5. Refactor the decision score into factor groups with visible explanations.
6. Improve fundamentals chart interpretation: 7D/30D/90D change, percentile, freshness.
7. Add browser verification captures for desktop and mobile.
8. Revisit key-gated sources only after deciding whether API keys or a backend proxy are allowed.

## Acceptance Criteria

The next improvement pass is complete only when:

- `working_dashboard.html` still opens directly in a browser.
- Current working sources load independently.
- Any failed source is visible as failed or stale, not hidden.
- Live market data and daily fundamentals remain clearly separated.
- The decision layer explains its score using factor-level evidence.
- Backtest logic remains no-lookahead.
- Desktop and mobile screenshots show no obvious overlap or broken layout.
- The documentation names which sources are live, which are reference-only, and which remain excluded.

## Risks And Open Decisions

- API keys: Etherscan, Dune, Flipside, and some validator data become much more useful with keys, but that breaks the no-key default unless a separate optional mode is designed.
- Backend proxy: a proxy would improve reliability and unlock key-gated data, but changes the project from a pure local HTML artifact into a small app/service.
- WebSockets: useful for lower-latency price updates, but REST polling is simpler and already sufficient for this dashboard.
- More metrics: adding more metrics without better explanation will make the site noisier. Prefer better grouping and source quality first.

