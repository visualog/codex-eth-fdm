# Failed Metrics

The working dashboard excludes these known key-gated metrics. Runtime failures from otherwise working public APIs still render as failed badges inside `working_dashboard.html`.

| metric_name | preferred_source | failure_reason | remediation |
|---|---|---|---|
| Active Validator Count | beaconcha.in | `https://beaconcha.in/api/v1/charts/validators` returned HTTP 401 without an API key during verification. | Add a user-provided beaconcha.in API key, or replace with a stable public Beacon API aggregation endpoint. |
| Validator Activation / Exit Queue | beaconcha.in | `https://beaconcha.in/api/v1/validators/queue` returned HTTP 401 without an API key. | Use beaconcha.in authenticated API, a self-hosted beacon node REST endpoint, or a Dune/Rated query. |

## Excluded Candidates

| candidate_metric | exclusion_reason |
|---|---|
| Etherscan gas oracle / transaction count | Etherscan is useful but requires an API key for reliable API usage, so it was excluded from the keyless local dashboard. |
| Ultrasound.money burn/supply series | Public website is useful, but a stable documented CORS JSON endpoint was not verified in this pass. |
| L2Beat TVS history | L2Beat is a preferred reference for L2 risk/TVS, but a stable keyless JSON API was not selected for local browser fetch. DefiLlama L2 TVL is used as the working fallback. |
| Dune rollup economics dashboards | Dune remains a strong community data source, but direct API use generally requires account/key workflow, so it is linked as RAG evidence instead of wired into the local default. |
| growthepie legacy `metrics/*.json` paths | `https://api.growthepie.com/v1/metrics/profit.json` returned HTTP 403. The dashboard uses the verified `fundamentals.json` endpoint instead. |
| Slashing events | No stable keyless historical endpoint was verified for direct browser use from a local HTML file. |
| USDT / USDC individual Ethereum supply cards | DefiLlama's keyless stablecoin-by-chain endpoint exposes current, previous-day, and previous-week snapshots for individual assets, not a 90-day individual asset time series. The aggregate Ethereum stablecoin supply chart remains included. |
