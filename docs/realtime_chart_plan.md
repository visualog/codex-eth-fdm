# Real-Time Chart Implementation Plan

## Goal

Add a real-time layer to the existing local HTML Ethereum dashboard while keeping the current 90-day fundamentals dashboard intact.

The dashboard should make it obvious which data is high-frequency market data and which data is daily/slow-moving fundamentals.

## Scope For Next Implementation Pass

1. Add a top `Live Market` band above the existing summary cards.
2. Fetch Binance ETH/USDT public REST endpoints:
   - 24h ticker every 15 seconds.
   - 1-minute klines every 15 seconds.
3. Render:
   - ETH/USDT last price.
   - 24h percentage change.
   - 24h quote volume.
   - 24h high/low.
   - Last update timestamp.
   - 60-minute mini line chart.
4. Preserve existing 26 fundamentals cards and their 90-day charts.
5. Add explicit stale/failure UI for live data fetch failures.

## Why This Design

The current chart set is not wrong; it is mostly daily data. DefiLlama and CoinGecko fundamentals endpoints are designed for historical valuation analysis, not tick-level movement.

The live layer should therefore use a market-data source with high-frequency endpoints. Binance REST is appropriate for a keyless local-file implementation because the checked endpoints returned HTTP 200 and `access-control-allow-origin: *`.

## Technical Approach

### File Organization Strategy

The final deliverable should still be directly openable as a local HTML file. However, the implementation can be developed in a more structured way if needed.

Preferred near-term approach:

- Keep editing `working_dashboard.html` directly for the first real-time pass.
- Add clear internal sections:
  - CSS for live market layout.
  - `LIVE_ENDPOINTS`.
  - `liveState`.
  - `fetchLiveJSON()`.
  - `parseKlines()`.
  - `refreshLiveMarket()`.
  - `renderLiveMarket()`.
- This avoids `file://` module import issues.

If the implementation grows beyond one file:

```text
src/api.js          fetch helpers, timeouts, endpoint constants
src/liveMarket.js   Binance ticker/kline parsing, polling, stale state
src/metrics.js      existing 26 fundamentals metric definitions
src/charts.js       SVG chart rendering, future crosshair/tooltip helpers
src/format.js       USD, percent, basis point, compact number formatting
src/state.js        shared state and refresh orchestration
styles/dashboard.css
dist/working_dashboard.html
```

When using split files, run with a local server for development, then inline/bundle everything back into `working_dashboard.html` for the final local-file artifact.

### Data Fetching

Add separate live fetch functions:

```js
const LIVE_ENDPOINTS = {
  ethTicker: "https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT",
  ethKlines1m: "https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1m&limit=60"
};
```

Use no long-lived cache for live data:

```js
async function fetchLiveJSON(url) {
  const response = await fetchWithTimeout(url, 8000);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}
```

### Polling

Use REST polling:

```js
async function refreshLiveMarket() {
  try {
    const [ticker, klines] = await Promise.all([
      fetchLiveJSON(LIVE_ENDPOINTS.ethTicker),
      fetchLiveJSON(LIVE_ENDPOINTS.ethKlines1m)
    ]);
    liveState = { status: "live", ticker, series: parseKlines(klines), updatedAt: new Date() };
  } catch (error) {
    liveState = { ...liveState, status: "failed", error: error.message };
  }
  renderLiveMarket();
}

refreshLiveMarket();
setInterval(refreshLiveMarket, 15000);
```

### Charting

Reuse existing `renderSvg()` for a first pass:

- Parse kline close prices.
- Render 60 one-minute close values.
- Use a visible `Live` badge.
- Add a small pulse or timestamp change so users can see refreshes.

Later enhancement:

- Add hover crosshair.
- Add last-point marker.
- Add candle chart if needed.

### UI Placement

Place before existing `.summary`:

```html
<section class="live-market" aria-label="Live ETH market data">
  ...
</section>
```

Use a compact layout:

- Left: ETH/USDT price and 24h change.
- Middle: volume, high, low, refresh status.
- Right: 60-minute chart.

### Failure State

If Binance fetch fails:

- Keep the previous live value visible if available.
- Change badge from `live` to `stale`.
- Show `source unavailable` or the error text.
- Do not clear the rest of the dashboard.

## CORS And Local File Notes

Current verified status:

- Binance ticker and klines endpoints returned `access-control-allow-origin: *`.
- CoinGecko and DefiLlama endpoints used by the existing dashboard also allow local browser fetches.

If Binance CORS or regional access fails in a user browser:

1. Fallback to CoinGecko simple price or market chart for less frequent refresh.
2. Run a tiny local proxy only if the user accepts moving beyond pure static HTML.
3. Use Coinbase Exchange public products endpoint as another market-data fallback after verification.

## Acceptance Criteria

- `working_dashboard.html` still opens directly as a local file.
- Existing 26 fundamentals metrics still render.
- Live ETH/USDT panel renders without a build step.
- Live panel updates every 15 seconds.
- User can see last refresh time.
- Failed live fetch shows a stale/failure badge instead of a blank panel.
- No API keys are required.
- The code clearly separates daily fundamentals from real-time market data.
- If split source files are introduced, the final handoff still includes a single-file `working_dashboard.html`.

## Completion Notes

Implemented in `working_dashboard.html` as a single-file local artifact.

- Added a top `Live Market` section above the fundamentals summary.
- Added `LIVE_ENDPOINTS`, `LIVE_POLL_MS`, `liveState`, `fetchLiveJSON()`, `parseTicker()`, `parseKlines()`, `renderLiveMarket()`, `refreshLiveMarket()`, and `startLivePolling()`.
- Polls Binance ETH/USDT 24h ticker and 1-minute klines every 15 seconds with `fetch(..., { cache: "no-store" })` through the shared timeout helper.
- Renders last price, 24h change, quote volume, 24h high/low, last refresh timestamp, and a 60-minute SVG line chart with a last-point marker.
- Keeps prior live values visible after a failed poll and changes the panel badge/message to stale or failed.
- Preserved the existing 26 fundamentals metric definitions and their 90-day charts.
- Did not add split source files or build tooling, so the default artifact remains directly openable via `file://`.

## Out Of Scope For This Pass

- WebSocket streaming.
- Candlestick rendering library.
- API keys for Etherscan, Dune, Flipside, or beaconcha.in.
- Replacing the fundamentals metrics with intraday data.
