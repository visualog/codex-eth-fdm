# 수익 실현형 Ethereum Dashboard 고도화 계획

## 목적

현재 대시보드는 ETH와 Ethereum 생태계의 펀더멘털을 관찰하는 정보창이다. 다음 단계의 목표는 이 정보를 단순 관찰에서 끝내지 않고, 사용자가 **진입 근거, 보유 근거, 청산 근거, 리스크 축소 근거**를 일관되게 만들 수 있는 수익 실현형 의사결정 대시보드로 고도화하는 것이다.

중요한 전제:

- 이 대시보드는 수익을 보장하는 자동매매 시스템이 아니다.
- 최종 목표는 "예측"이 아니라 **검증 가능한 규칙, 백테스트, 리스크 관리, 실행 체크리스트**를 제공하는 것이다.
- 기본 로컬 HTML은 계속 keyless/public API 중심으로 유지한다.
- 실제 주문 실행, 거래소 계정 연결, API key 저장은 기본 범위에서 제외한다.

## 현재 상태 요약

현재 `working_dashboard.html`은 다음을 제공한다.

- Binance ETH/USDT 실시간 가격, 24h 변화, 60분 1분봉
- CoinGecko 가격/시총/거래량/ETH-BTC/변동성/낙폭
- DefiLlama 수수료, TVL, DEX, stablecoin, protocol TVL, staking yield
- growthepie L2 거래수, 활성주소, L2 수익, blob 데이터 게시량
- RAG 인사이트 패널: growthepie, Ethereum Dashboards, Dune, L2BEAT 관점
- 한/영 토글

현재 한계:

- 지표는 많지만 매수/보유/청산 판단 규칙이 없다.
- 지표 간 조합을 점수화하지 않는다.
- 신호가 실제 수익으로 이어졌는지 검증하는 백테스트가 없다.
- 리스크 관리 규칙이 UI에 없다.
- 수익 실현 조건, 손절 조건, 포지션 크기, 투자 기간이 정의되어 있지 않다.

## 외부 근거 및 데이터 소스

### 이미 통합된 keyless 데이터

| source | 현재 사용 | 수익형 고도화에서의 역할 |
|---|---|---|
| Binance Spot REST | ETH/USDT 실시간 가격, 24h 변화, 1분봉 | 단기 모멘텀, 변동성, 진입 타이밍, 손절/익절 기준 |
| CoinGecko market chart | 90일 가격/시총/거래량/ETH-BTC | 시장 국면, 추세, 상대강도, 리스크 프리미엄 |
| DefiLlama | fees, TVL, DEX, stablecoin, yield | 펀더멘털 확인, DeFi 유동성, 수수료 기반 수요 |
| growthepie fundamentals | L2 tx, active addresses, profit, blob data | L2 채택, blob 수요, rollup economics |

### RAG 근거로 유지할 데이터

| source | 활용 방식 | 이유 |
|---|---|---|
| Ethereum Dashboards | 커뮤니티 관찰 포인트 큐레이션 | blobs, gas, MEV, staking, network health, L2 risk 등 Ethereum 커뮤니티에서 반복적으로 보는 주제를 보강 |
| Dune | rollup economics, gas/fees, custom community dashboards | 강력하지만 API key/account workflow가 필요할 수 있어 기본 로컬 대시보드에는 링크/후보로 유지 |
| L2BEAT | L2 risk, scaling summary | 투자 판단에서 L2 리스크 컨텍스트 제공. 숫자 API 직접 통합은 별도 검증 필요 |
| SEC/FINRA investor education | 리스크 경고 및 사용자 보호 문구 | crypto asset은 변동성과 손실 가능성이 크므로 대시보드에 리스크 경고와 포지션 제한을 명시 |

참고 링크:

- Binance Spot API docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints
- CoinGecko API docs: https://docs.coingecko.com/reference/endpoint-overview
- DefiLlama API docs: https://defillama.com/docs/api
- growthepie docs: https://docs.growthepie.com/
- Ethereum Dashboards: https://ethereumdashboards.com/
- Dune gas/fees docs: https://docs.dune.com/data-catalog/dune-index/gas-fees
- L2BEAT scaling risk: https://l2beat.com/scaling/risk
- FINRA crypto asset risks: https://www.finra.org/investors/investing/investment-products/crypto-assets/risks
- SEC crypto asset investor alerts: https://www.sec.gov/oiea/investor-alert-5-ways-fraudsters-may-lure-victims-scams-involving-crypto-asset

## 목표 사용자 행동

대시보드는 사용자가 다음 행동을 하도록 돕는다.

1. ETH가 매수 관심 구간인지 판단한다.
2. 이미 보유 중인 ETH를 계속 보유할 근거가 있는지 확인한다.
3. 펀더멘털 약화 또는 시장 과열 시 비중 축소/익절/손절을 고려한다.
4. 단기 가격 움직임이 펀더멘털 개선과 같이 움직이는지, 아니면 가격만 앞서가는지 구분한다.
5. 거래 전후 판단 근거를 기록하고 나중에 성과를 검증한다.

## 고도화 방향

### 1. Signal Score 레이어 추가

각 지표를 그대로 나열하지 않고, 사용자의 판단에 맞는 5개 점수로 압축한다.

| score | 구성 지표 | 의미 |
|---|---|---|
| Market Momentum Score | ETH 1h/24h change, ETH 30D trend, ETH/BTC, volume | 시장이 ETH를 사고 있는가 |
| Fundamental Demand Score | fees, fees/market cap, fees/TVL, DEX volume/TVL | Ethereum blockspace 수요가 살아있는가 |
| Liquidity Score | DeFi TVL, stablecoin supply, DEX volume, protocol TVL | 온체인 유동성이 유입되는가 |
| L2 Adoption Score | ecosystem txcount, DAA, blob data, L2 profit | L2 확장이 실제 사용량과 수익을 만드는가 |
| Risk Score | volatility, drawdown, ETH/BTC weakness, TVL decline, stale data | 포지션을 줄여야 할 위험이 커졌는가 |

점수는 0-100으로 표시한다.

초기 규칙:

- 70 이상: 강함
- 45-69: 중립/관찰
- 45 미만: 약함
- Risk Score는 높을수록 위험으로 해석한다.

### 2. Regime Detection 추가

점수 조합으로 현재 시장 국면을 표시한다.

| regime | 조건 예시 | 사용자 행동 |
|---|---|---|
| Accumulation Watch | 가격 약세, 펀더멘털 개선, 리스크 보통 이하 | 분할 매수 후보 관찰 |
| Confirmed Strength | 모멘텀, 수요, 유동성, L2 점수 동시 개선 | 보유/추세 추종 후보 |
| Fragile Rally | 가격 상승, 펀더멘털 부진, 리스크 상승 | 추격 매수 주의 |
| Risk-Off | ETH/BTC 약세, 변동성/낙폭 확대, TVL/fees 약화 | 비중 축소/손절 검토 |
| No Edge | 신호 충돌, 데이터 부족, stale source | 거래 보류 |

UI에는 "현재 국면", "근거 3개", "반대 증거 3개"를 함께 보여준다.

### 3. Entry / Hold / Exit Playbook 추가

대시보드가 바로 매수/매도하라고 말하지 않고, 사용자가 실행 규칙을 확인하게 한다.

#### Entry 후보

- Market Momentum Score >= 60
- Fundamental Demand Score >= 55
- L2 Adoption Score >= 55
- Risk Score < 65
- ETH price가 20D/30D 추세선을 회복하거나 ETH/BTC가 개선

#### Hold 후보

- 보유 중이고 Fundamental Demand Score 또는 L2 Adoption Score가 50 이상 유지
- 가격 조정이 있지만 Risk Score가 급등하지 않음
- ETH/BTC가 7일 기준 크게 훼손되지 않음

#### Exit / Reduce 후보

- Risk Score >= 75
- ETH/BTC 7D/30D 약세가 동시에 발생
- fees, TVL, DEX volume, L2 tx 중 3개 이상이 하락 전환
- 가격은 상승하지만 Fundamental Demand Score와 L2 Adoption Score가 동반 하락
- 목표 수익률 도달 후 trailing stop 조건 충족

### 4. Profit Realization Panel 추가

사용자가 수익을 실현할 수 있도록 별도 패널을 만든다.

표시 항목:

- 선택한 전략: conservative / balanced / aggressive
- 기준 진입가
- 현재가
- 미실현 수익률
- 1차 익절 구간
- 2차 익절 구간
- trailing stop 기준
- invalidation level
- 현재 신호: add / hold / trim / exit / no trade
- 신호 근거

초기 기본값:

| mode | 1차 익절 | 2차 익절 | trailing stop | max drawdown trigger |
|---|---:|---:|---:|---:|
| conservative | +8% | +15% | -5% from local high | -6% |
| balanced | +12% | +25% | -8% from local high | -10% |
| aggressive | +20% | +40% | -12% from local high | -15% |

이 값은 사용자 설정으로 바꿀 수 있어야 한다.

### 5. Backtest Engine 추가

수익형 대시보드의 핵심은 백테스트다.

최소 백테스트:

- 데이터 기간: 가능한 최대 기간, 기본 365일 이상
- 기준 자산: ETH/USD
- 비교 기준: buy-and-hold ETH
- 전략:
  - score threshold strategy
  - regime strategy
  - ETH/BTC relative strength filter
  - drawdown/risk-off filter
- 비용:
  - 거래 수수료
  - 슬리피지
  - funding/borrow cost는 파생상품 사용 시만

성과 지표:

- total return
- annualized return
- max drawdown
- Sharpe-like ratio
- win rate
- profit factor
- average trade return
- number of trades
- time in market
- worst trade

반드시 포함할 검증:

- look-ahead bias 방지
- daily metric은 다음 날부터 신호에 반영
- train/test 분리
- 최근 90일 out-of-sample 표시
- 거래비용 반영 전/후 비교

### 6. Data Quality & Staleness Guard 추가

수익 판단에 쓰는 데이터는 stale이면 신호를 내면 안 된다.

필요 기능:

- source freshness table
- last successful fetch
- stale threshold
- failed source count
- critical source failure 시 `No Edge` 표시
- live price는 살아있지만 fundamentals가 stale이면 진입 신호 비활성화

Critical sources:

- Binance live ticker/klines
- CoinGecko ETH and BTC price
- DefiLlama fees/TVL
- growthepie fundamentals

### 7. Trading Journal 추가

대시보드에 "판단 기록"을 남겨야 실제 개선이 가능하다.

Local-first 방식:

- localStorage 또는 JSON export
- 기록 항목:
  - timestamp
  - decision: buy / add / hold / trim / exit / no trade
  - ETH price
  - regime
  - five scores
  - reason
  - invalidation condition
  - review date

추후 개선:

- CSV export
- performance review panel
- 같은 조건에서 과거 결과 조회

## 구현 로드맵

### Phase 1: 점수화와 국면 표시

작업:

- `scoreState` 추가
- 5개 score 계산 함수 추가
- Regime Detection 규칙 추가
- 상단에 `Decision Dashboard` 패널 추가
- 한/영 번역 추가

완료 기준:

- 모든 점수는 0-100으로 표시
- 각 점수에 근거 지표 2-4개 표시
- 현재 regime과 action hint 표시
- 데이터가 stale이면 `No Edge` 표시

### Phase 2: Profit Realization Panel

작업:

- 사용자가 entry price 입력
- strategy mode 선택
- unrealized PnL, take-profit, trailing stop, invalidation 계산
- 현재 action: add / hold / trim / exit 표시

완료 기준:

- 가격 업데이트에 따라 PnL이 변함
- mode 변경 시 익절/손절 기준이 즉시 갱신
- 입력값은 localStorage에 저장

### Phase 3: 백테스트

작업:

- historical series normalization
- daily signal generation
- no-lookahead backtest
- strategy result table
- buy-and-hold 비교

완료 기준:

- 최소 365일 이상 데이터로 테스트
- 거래 비용 적용 가능
- max drawdown, win rate, total return 표시
- test period와 parameter가 UI에 명시

### Phase 4: Alert & Journal

작업:

- signal threshold 알림
- stale source 알림
- journal form
- CSV/JSON export

완료 기준:

- 사용자가 판단 근거를 저장 가능
- 저장된 기록을 필터링 가능
- 기록별 이후 수익률을 계산 가능

### Phase 5: Optional Advanced Data

기본 로컬 파일 범위를 넘어설 때만 적용한다.

- Dune API key 연결
- Etherscan gas/proxy metrics
- L2BEAT risk data adapter
- Coinbase/Kraken alternative market feed
- backend proxy for CORS/key management
- portfolio exchange connection

## 우선 적용할 UI 구조

```text
Header
Live Market
Decision Dashboard
  - Current Regime
  - Suggested Stance
  - Confidence
  - Main supporting evidence
  - Main risk evidence
Profit Realization
  - Entry price
  - Strategy mode
  - PnL
  - Take-profit / trailing stop / invalidation
Score Matrix
  - Market Momentum
  - Fundamental Demand
  - Liquidity
  - L2 Adoption
  - Risk
RAG Insight
Summary Cards
Main Chart
Metric Grid
Unavailable Sources
```

## 초기 규칙 예시

### Score 계산 예시

Market Momentum:

- ETH 7D change positive: +20
- ETH 30D trend positive: +20
- ETH/BTC 7D positive: +25
- volume 7D average above 30D average: +20
- drawdown better than -15%: +15

Fundamental Demand:

- fees 7D change positive
- fees/market cap improving
- DEX volume/TVL improving
- stablecoin supply improving

L2 Adoption:

- ecosystem txcount 7D positive
- ecosystem DAA 7D positive
- blob data posted 7D positive
- L2 profit positive and improving

Risk:

- volatility high
- drawdown deep
- ETH/BTC weak
- TVL falling
- source stale

### Action hint 예시

```text
if riskScore >= 75:
  action = "Risk-off / reduce exposure"
elif marketScore >= 65 and fundamentalScore >= 60 and l2Score >= 55:
  action = "Constructive / hold or staged entry"
elif marketScore >= 65 and fundamentalScore < 45:
  action = "Fragile rally / avoid chase"
elif fundamentalScore >= 60 and marketScore < 45:
  action = "Accumulation watch / wait for confirmation"
else:
  action = "No edge"
```

## 리스크 원칙

- 한 번의 신호로 전액 진입하지 않는다.
- 신호가 강해도 max position size를 제한한다.
- 손절 기준 없이 진입하지 않는다.
- 데이터 소스가 stale이면 신규 진입 신호를 끈다.
- backtest 전에는 실거래 신호로 쓰지 않는다.
- crypto asset은 변동성이 크고 원금 전부 손실 가능성이 있으므로 사용자는 자신의 리스크 한도 안에서만 판단해야 한다.

## 완료 정의

수익 실현형 대시보드라고 부르려면 다음이 충족되어야 한다.

- 현재 국면과 action hint가 표시된다.
- 진입가 기반 PnL, 익절, trailing stop, invalidation이 표시된다.
- 5개 점수와 점수 근거가 표시된다.
- 최소 1개 전략의 no-lookahead 백테스트 결과가 표시된다.
- buy-and-hold ETH와 비교된다.
- stale/failed 데이터는 신호를 무효화한다.
- 사용자가 판단 기록을 저장/export할 수 있다.

## 구현 완료 메모

Implemented in `working_dashboard.html`.

- `Decision Dashboard`를 추가해 현재 국면, action hint, confidence, supporting evidence, risk evidence를 표시한다.
- `Signal Score` 5종을 구현했다: Market Momentum, Fundamental Demand, Liquidity, L2 Adoption, Risk.
- `Profit Realization` 패널을 추가해 entry price, strategy mode, max position, current price, unrealized PnL, take-profit 1/2, trailing stop, invalidation, local high를 표시한다.
- `Data Quality / Staleness Guard` 패널을 추가해 live price, core fundamentals, L2/blob source, signal guard 상태를 표시한다. critical source가 stale/failed이면 신규 진입 신호는 `No Edge`로 무효화된다.
- `No-lookahead Backtest`를 추가했다. Binance `ETHUSDT`/`BTCUSDT` 1d klines 450개를 사용해 365일 이상 기간을 확보하고, 전일 신호만 다음 날 수익률에 적용한다.
- Backtest는 score-threshold 성격의 ETH trend + ETH/BTC relative strength + risk-off filter 전략을 buy-and-hold ETH와 비교한다.
- Backtest는 fee bps와 slippage bps 입력을 반영하며 total return, annualized return, max drawdown, win rate, trades, time in market, profit factor, average trade, worst trade, Sharpe-like, 최근 90일 OOS를 표시한다.
- `Trading Journal`을 추가해 decision, ETH price, regime, scores, reason, invalidation, review date를 localStorage에 저장하고 JSON/CSV로 export할 수 있다.
- 저장된 저널은 decision별로 필터링할 수 있고, 각 기록은 현재가 기준 기록 후 수익률을 표시한다.
- 한/영 토글은 새 패널 라벨까지 포함해 동작한다.

Verification snapshot:

- JS syntax: `syntax ok`
- Full data load: `summaryLive 30`, `summaryFailed 0`
- Score cards: `5`
- Backtest period: `2025-04-08 - 2026-05-31 (419D)`
- Backtest stat cards: `13`
- Data quality cards: `4`
