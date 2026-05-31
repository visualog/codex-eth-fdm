# RAG Context For Real-Time Chart Planning

Generated on 2026-05-30.

This file is the retrieved context used to plan the next implementation pass. It combines current project files, live endpoint checks, and implementation knowledge.

## Retrieved From Current Project

### `source_map.md`

- Working keyless sources:
  - CoinGecko market chart for ETH price, market cap, volume, volatility, drawdown, ETH/BTC, and Lido ETH proxy.
  - DefiLlama chain TVL for Ethereum, Base, Arbitrum, OP Mainnet, and aggregate L2 TVL.
  - DefiLlama fees, DEX, stablecoin chart, protocol TVL, and yield endpoints.
  - growthepie `fundamentals.json` for ecosystem transaction count, active addresses, L2 onchain profit, and blob data posted.
- Current dashboard prioritizes historical chartable series.
- Binance ticker and klines are reachable and now power the top live market panel.
- beaconcha.in validator endpoints returned HTTP 401 without an API key.
- Etherscan, Dune, Flipside, L2Beat TVS history, and ultrasound.money were excluded from direct local HTML fetch unless a stable keyless/CORS endpoint is selected.
- Ethereum Dashboards was used as a RAG source for community-observed data categories: blobs, gas, MEV, staking, network health, L2 risks, DeFi, and ecosystem directories.

### `failed_metrics.md`

- Runtime failures from otherwise working public APIs should render failed badges in `working_dashboard.html`.
- Excluded metrics include beaconcha.in validator count/queue, slashing events, and individual USDT/USDC cards without 90-day series.

### `working_dashboard.html`

- Current dashboard is a single local HTML file.
- Fundamentals data loading happens once in `init()`.
- `fetchJSON()` caches each URL response in a `Map`.
- The `Live Market` section uses separate Binance REST polling and does not store ticker or kline responses in the fundamentals cache.
- Live polling runs every 15 seconds through `startLivePolling()` and `refreshLiveMarket()`.
- Charts are dependency-free SVG paths from `renderSvg()` and `renderLiveSvg()`.
- Current metric set has 30 working 90-day series after adding four growthepie ecosystem/L2 metrics.
- The profit-realization layer adds signal scores, regime/action hints, PnL/TP/trailing-stop/invalidation, data quality guards, a local trading journal, and a no-lookahead backtest.

## RAG Update: Community And Ecosystem Data Sources

Verified and applied on 2026-05-30:

| source | evidence | dashboard decision |
|---|---|---|
| growthepie | Open analytics platform for Ethereum Mainnet and 27+ L2 networks; tracks daily active addresses, transaction counts, throughput, fees, stablecoins, TVL, and onchain application revenue via public API. | Added four working metrics from `https://api.growthepie.com/v1/fundamentals.json`. |
| Ethereum Dashboards | Curated 160+ Ethereum dashboards; repeatedly surfaces blobs, gas, MEV, staking, network health, DeFi, L2 risk, and ecosystem resources. | Added RAG insight panel and source links rather than scraping dashboard pages. |
| Dune gas/fees docs and community dashboards | Useful curated gas and rollup economics datasets, but API access is account/key oriented. | Kept as linked evidence/future candidate; not wired into keyless local default. |
| L2BEAT | Community-standard L2 risk and TVS reference. | Linked in RAG insight panel as a risk context source. |

Endpoint checks:

| endpoint | result | CORS note | intended use |
|---|---|---|---|
| `https://api.growthepie.com/v1/fundamentals.json` | HTTP 200 | `access-control-allow-origin: *` when requested with `Origin: null` | 90-day ecosystem/L2 metrics |
| `https://api.growthepie.com/v1/export/txcount.json` | HTTP 200 | downloadable public export | Full-history metric export candidate |
| `https://api.growthepie.com/v1/metrics/profit.json` | HTTP 403 | legacy/path mismatch | Do not use; replaced by documented endpoints |

## Live Endpoint Checks

Verified with `curl -I` on 2026-05-30:

| endpoint | result | CORS note | intended use |
|---|---|---|---|
| `https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT` | HTTP 200 | `access-control-allow-origin: *` | Live ETH/USDT price, 24h change, high/low, quote volume |
| `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1m&limit=60` | HTTP 200 | `access-control-allow-origin: *` | 1-minute live chart for last 60 minutes |
| `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1d&limit=450` | HTTP 200 | `access-control-allow-origin: *` | No-lookahead strategy backtest |
| `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=450` | HTTP 200 | `access-control-allow-origin: *` | ETH/BTC relative-strength filter in backtest |

## Profit Realization Implementation Notes

- CoinGecko public API rejected 450-day market_chart requests with error code `10012`, so the backtest uses Binance daily klines for 365+ day coverage while keeping CoinGecko as the dashboard valuation source.
- The backtest starts after a 31-day warmup and uses only the previous day's signal for the next day's return.
- Critical source failures set the action layer to `No Edge` rather than emitting a constructive signal.

## Implementation Knowledge

- Fundamentals APIs are mostly daily and should not be made to look tick-level live.
- Real-time panels should be sourced from market APIs designed for high-frequency updates.
- For local-file dashboards, prefer REST polling over WebSockets unless the exchange WebSocket endpoint is verified for browser CORS/network behavior.
- A good first live layer is REST polling every 10-15 seconds:
  - Lower complexity than WebSockets.
  - Works from a single HTML file.
  - Rate-limit friendly for a small dashboard.
- Use a separate cache policy for live data:
  - Do not store live ticker/klines in the long-lived `cache` Map.
  - Use `fetch(..., { cache: "no-store" })`.
- Implemented live behavior keeps previous Binance values visible after a failed poll and changes the badge/message to stale or failed.
- Keep daily fundamentals and real-time market data visually distinct:
  - Label as `Live market data`.
  - Show last refresh timestamp.
  - Show stale/failure state if polling fails.
  - Do not imply daily DeFi fundamentals update every few seconds.

## Project Structure Decision

The current project started as one local HTML file plus three Markdown files. That is acceptable for a static proof of concept, but real-time chart work introduces enough concerns that the implementation should be organized before it grows further.

Recommended project layout:

```text
ethereum_fundamentals_dashboard/
  README.md
  working_dashboard.html
  metrics_catalog.md
  source_map.md
  failed_metrics.md
  docs/
    rag_context.md
    realtime_chart_plan.md
    implementation_metaprompt.md
  src/
    api.js
    liveMarket.js
    metrics.js
    charts.js
    format.js
    state.js
  styles/
    dashboard.css
  dist/
    working_dashboard.html
```

Local-file constraint:

- A browser can open one self-contained HTML file directly via `file://`.
- If JavaScript is split into ES modules such as `src/api.js`, many browsers block module imports from `file://` or behave inconsistently.
- Therefore, the safest workflow is to develop in structured files, then produce a final inlined `working_dashboard.html` for direct local opening.

Recommended workflow:

1. Keep `working_dashboard.html` as the user-facing local artifact.
2. Add `src/` and `styles/` only when implementation complexity requires it.
3. If files are split, use a local dev server for verification.
4. Before final handoff, inline or bundle the JS/CSS back into `working_dashboard.html`.
5. Preserve docs and source maps separately in Markdown.

## Technologies Needed

- Browser Fetch API for REST data loading.
- AbortController for timeout handling.
- REST polling with `setInterval` for live updates.
- SVG for dependency-free line charts and sparklines.
- Optional Canvas only if chart density or animation becomes too heavy for SVG.
- Local state object for live/fundamental loading, stale, and failed states.
- Formatter utilities for USD, percent, basis points, and compact values.
- CORS-aware endpoint selection; keyless browser-accessible APIs are required for direct local-file operation.
