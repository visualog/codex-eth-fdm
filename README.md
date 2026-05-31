# Ethereum Fundamentals Dashboard

Local-first Ethereum valuation and fundamentals dashboard.

## Current Files

- `working_dashboard.html` - single-file local dashboard.
- `metrics_catalog.md` - original 30-metric catalog.
- `source_map.md` - verified source map and CORS/key notes.
- `failed_metrics.md` - excluded or failed metrics and remediation notes.
- `docs/rag_context.md` - retrieved project context used for the real-time plan.
- `docs/realtime_chart_plan.md` - implementation plan for real-time market panels and live chart behavior.

## Current State

The dashboard renders 30 working public-API fundamentals metrics with 90-day historical series. Most fundamentals are daily or slow-moving CoinGecko, DefiLlama, and growthepie series, so they are visually separated from the high-frequency market panel.

The top `Live Market` section polls Binance public REST endpoints every 15 seconds for ETH/USDT 24h ticker data and the latest 60 one-minute closes. It shows last price, 24h percentage change, quote volume, high/low, last refresh time, and a 60-minute line chart. If live polling fails, the panel keeps the previous values when available and displays a stale or failed badge with the source error.

The RAG insight panel summarizes high-signal community dashboard themes: L2 adoption, blob demand, rollup economics, gas/MEV/staking/network health, and L2 risk. It directly integrates only keyless browser-friendly data and links the rest as evidence sources.

The profit-realization layer adds signal scores, regime/action hints, entry-price PnL, take-profit and trailing-stop levels, source staleness guards, a no-lookahead backtest against buy-and-hold ETH, and a local trading journal.

No API keys or build step are required. Open `working_dashboard.html` directly in a browser.
