# Implementation Metaprompt

Use this prompt as the next goal/objective for completing the real-time dashboard enhancement.

```text
Goal:
Advance the Ethereum Fundamentals Dashboard in `/Users/visualog/Documents/GitHub/xcodex-02/ethereum_fundamentals_dashboard` from a daily fundamentals dashboard into a local-first dashboard that clearly includes real-time market movement.

Current project state:
- `working_dashboard.html` is the current single-file local dashboard.
- It renders 26 verified public API metrics with 90-day historical series.
- Most existing charts are daily/slow-moving CoinGecko and DefiLlama fundamentals.
- `docs/rag_context.md` contains retrieved project context and endpoint checks.
- `docs/realtime_chart_plan.md` contains the implementation plan.
- Binance REST endpoints were checked and returned HTTP 200 plus `access-control-allow-origin: *`:
  - `https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT`
  - `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1m&limit=60`

Required implementation:
1. Preserve the existing 26 fundamentals metric cards and 90-day charts.
2. Add a top `Live Market` section above the existing summary cards.
3. Fetch Binance ETH/USDT public REST data without API keys:
   - 24h ticker every 15 seconds.
   - 1-minute klines every 15 seconds.
4. Render in the live section:
   - ETH/USDT last price.
   - 24h percentage change.
   - 24h quote volume.
   - 24h high and low.
   - last refresh timestamp.
   - 60-minute line chart from 1-minute closes.
5. Add stale/failure behavior:
   - If live fetch fails, do not blank the panel.
   - Keep previous values if available.
   - Show a stale or failed badge and the error/source-unavailable message.
6. Keep daily fundamentals visually distinct from real-time market data.
   - Do not make daily DeFi/fundamental metrics appear tick-level live.
7. Keep the final user-facing artifact directly openable as a local file.
   - Prefer keeping the first implementation inside `working_dashboard.html`.
   - If source files are split into `src/` and `styles/`, also produce or maintain a final inlined `working_dashboard.html`.
8. Update documentation after implementation:
   - `README.md`
   - `source_map.md`
   - `docs/rag_context.md` if endpoint status changes
   - `docs/realtime_chart_plan.md` with completion notes

Project organization constraints:
- Keep the project under `ethereum_fundamentals_dashboard/`.
- If new files are needed, use this structure:
  - `src/api.js`
  - `src/liveMarket.js`
  - `src/metrics.js`
  - `src/charts.js`
  - `src/format.js`
  - `src/state.js`
  - `styles/dashboard.css`
  - `dist/working_dashboard.html`
- Do not introduce build tooling unless it is clearly needed.
- Do not require API keys for the default local dashboard.
- Do not remove the Markdown source/failure/catalog documentation.

Technical notes:
- Use REST polling first, not WebSockets.
- Use `fetch(..., { cache: "no-store" })` and timeout handling for live data.
- Do not store live ticker/klines in the existing long-lived fundamentals cache.
- Reuse existing SVG charting if adequate.
- Add a last-point marker or subtle refresh pulse so live updates are visible.
- Make all failures visible through badges and concise messages.

Verification requirements:
1. Verify `working_dashboard.html` JavaScript syntax.
2. Verify the existing 26 fundamentals still load successfully.
3. Verify Binance ticker and kline live fetches work from the implemented code.
4. Verify the live panel updates on the polling interval.
5. Verify that a simulated live fetch failure shows stale/failed state instead of blank UI.
6. Report exact validation commands and results.

Definition of done:
- A person can open `ethereum_fundamentals_dashboard/working_dashboard.html` locally and see:
  - a live ETH/USDT market panel updating periodically;
  - the existing 26 fundamentals cards;
  - clear source labels;
  - clear stale/failure states when live data cannot be fetched.
```
```
