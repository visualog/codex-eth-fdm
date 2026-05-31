# Ethereum Dashboard Source Map

## Working live sources

| source | status | used_for | CORS / access note |
|---|---|---|---|
| Binance 24h ticker | working | Live ETH/USDT last price, 24h percentage change, 24h quote volume, 24h high/low | `access-control-allow-origin: *`; no key used; polled every 15 seconds |
| Binance 1m klines | working | Live 60-minute ETH/USDT close chart | `access-control-allow-origin: *`; no key used; polled every 15 seconds |
| Binance daily klines | working | 419-day no-lookahead ETH/USDT strategy backtest and BTC-relative filter | `access-control-allow-origin: *`; no key used; `ETHUSDT` and `BTCUSDT` 1d klines |
| CoinGecko market chart | working | ETH price, market cap, volume, volatility, drawdown, ETH/BTC, Lido ETH proxy | `access-control-allow-origin: *`; no key used |
| DefiLlama chain TVL | working | Ethereum TVL, Base TVL, Arbitrum TVL, OP Mainnet TVL, core L2 aggregate TVL | `access-control-allow-origin: *`; no key used |
| DefiLlama fees overview | working | Ethereum daily fees, fees/market cap, fees/TVL | `access-control-allow-origin: *`; no key used |
| DefiLlama DEX overview | working | Ethereum DEX volume, DEX volume/TVL | `access-control-allow-origin: *`; no key used |
| DefiLlama stablecoin charts | working | Ethereum stablecoin supply, stablecoins/TVL | `access-control-allow-origin: *`; no key used |
| DefiLlama protocol TVL | working | Lido, Rocket Pool, Aave V3, Uniswap, Curve Ethereum TVL | `access-control-allow-origin: *`; no key used |
| DefiLlama yields | working | Lido stETH APY, Rocket Pool rETH APY | Public endpoint; no key used |
| growthepie fundamentals export | working | Ecosystem daily transactions, ecosystem daily active addresses, L2 onchain profit, blob data posted | `access-control-allow-origin: *`; no key used; 90-day daily rows from `fundamentals.json` |

## Verified but not used as primary

| source | status | reason |
|---|---|---|
| CoinGecko >365 day public range | excluded | Public API returned error code 10012 for 450-day market_chart requests, so the backtest uses Binance daily klines instead. |
| DefiLlama chains current | reachable | Good current TVL/rank snapshot, but dashboard prioritizes historical chartable series. |
| DefiLlama stablecoins by chain | reachable | Good for current and previous day/week individual asset snapshots, but excluded from the working dashboard because it does not provide 90-day individual USDT/USDC series. |
| Ethereum Dashboards directory | reference source | Used as RAG evidence for community watchpoints such as blobs, gas, MEV, staking, network health, and L2 risk; not a direct numeric API source. |
| L2Beat website | reference source | Excellent for L2 risk and TVS methodology, but no stable keyless JSON API was selected for local-file dashboard use. |
| Dune community dashboards | reference source | High-value for rollup economics and blob attribution, but excluded from the default local dashboard because API access generally requires a key or account workflow. |

## Failed or excluded sources

| source | attempted_access | result | impact |
|---|---|---|---|
| beaconcha.in validator charts | `https://beaconcha.in/api/v1/charts/validators` | HTTP 401 during verification | Active validator count is excluded from the working dashboard. |
| beaconcha.in staking chart | `https://beaconcha.in/api/v1/charts/staked_ether` | HTTP 401 during verification | Native staked ETH metric replaced with Lido ETH proxy and staking protocol TVL. |
| beaconcha.in validator queue | `https://beaconcha.in/api/v1/validators/queue` | HTTP 401 during verification | Queue metric is excluded from the working dashboard. |
| Etherscan API | API-key access model | Excluded from live local HTML to avoid requiring user keys | Gas oracle, transactions, and address activity are documented candidates but not wired. |
| Dune / Flipside | Query/API-key workflow | Excluded from local single-file live fetch | Useful for future custom historical metrics and community dashboards. |
| growthepie legacy `metrics/*.json` paths | `https://api.growthepie.com/v1/metrics/profit.json` | HTTP 403 during verification | Replaced with documented `fundamentals.json` and `export/{metric}.json` endpoints. |
