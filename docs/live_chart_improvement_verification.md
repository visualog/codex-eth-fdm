# 최근 1시간 가격 차트 개선 및 검증 보고서

작성일: 2026-05-31

## 작업 목적

최근 1시간 가격 차트가 라인만으로 표시될 때 가격 방향은 쉽게 보이지만, 1분 안에서 고가/저가가 얼마나 흔들렸는지는 알기 어렵다.

이번 작업의 목적은 캔들 차트처럼 복잡하게 만들지 않으면서도, 초보자가 가격 방향과 변동 폭을 함께 읽을 수 있게 만드는 것이다.

## 비포 화면

캡처 파일:

- `ethereum_fundamentals_dashboard/docs/captures/live_market_before.png`

비포 상태:

- 라인 차트 중심으로 최근 1시간 흐름을 표시했다.
- 1분/10분 세로 시간 보조선은 존재했다.
- hover 시 시각과 가격 툴팁을 확인할 수 있었다.
- 하지만 1분 구간 안에서 고가/저가가 어느 정도 벌어졌는지는 차트에서 직접 보이지 않았다.

## 검토 내용 요약

### 라인 차트 유지가 적절한 이유

- 실시간 시장 섹션은 초보 사용자가 시장 분위기를 빠르게 읽는 영역이다.
- 라인 차트는 가격 방향을 가장 쉽게 보여준다.
- 캔들 차트는 정보량은 많지만 초보자에게 해석 부담이 크다.

### 라인 차트만으로 부족한 점

- 1분 안의 고가/저가 변동 폭이 보이지 않는다.
- 급격히 흔들린 구간도 부드러운 선으로 보일 수 있다.
- 트레이딩 경험자에게는 가격 압력 정보가 부족하게 느껴질 수 있다.

### 선택한 개선 방향

```text
라인 차트 유지 + 1분별 고가/저가 변동 범위 밴드 추가
```

이 방식은 라인의 쉬운 방향성은 유지하면서, 캔들보다 낮은 인지 부담으로 가격 변동 폭을 보여준다.

## 구현 내용

반영 파일:

- `ethereum_fundamentals_dashboard/working_dashboard.html`

구현 항목:

- Binance 1분봉 데이터에서 `close`, `high`, `low`를 함께 파싱하도록 변경했다.
- 기존 라인 차트는 `close` 기준으로 유지했다.
- 각 1분봉의 `high/low`를 연결해 `range-band` 영역을 생성했다.
- `range-band`는 라인 뒤에 아주 연하게 표시해 가격 방향성을 방해하지 않도록 했다.
- hover tooltip에 종가뿐 아니라 고가/저가 범위도 함께 표시하도록 확장했다.
- tooltip 크기를 키워 범위 텍스트가 잘리지 않도록 했다.

## 애프터 화면

캡처 파일:

- `ethereum_fundamentals_dashboard/docs/captures/live_market_after.png`

애프터 상태:

- 최근 1시간 가격 라인은 기존처럼 유지된다.
- 라인 주변에 연한 변동 범위 밴드가 추가되어 1분별 흔들림을 더 직관적으로 볼 수 있다.
- 1분 보조선과 10분 보조선은 유지되어 시간 구조를 계속 읽을 수 있다.
- 최신 시점 강조선, 현재가 기준선, hover 세로선/툴팁도 유지된다.

## 개선 효과

### 1. 초보자 관점

- 라인을 따라가면 가격 방향을 쉽게 이해할 수 있다.
- 연한 밴드를 통해 "이 구간은 많이 흔들렸다"는 감각을 얻을 수 있다.
- 캔들 차트보다 시각적 부담이 낮다.

### 2. 트레이딩 경험자 관점

- 단순 종가 흐름만 보던 상태보다 단기 변동성이 더 잘 보인다.
- 캔들 차트 수준은 아니지만 고가/저가 압력을 일부 확인할 수 있다.
- hover tooltip에서 특정 시점의 종가와 가격 범위를 함께 볼 수 있다.

### 3. 정보 구조 관점

- 상단 실시간 시장 섹션의 목적은 여전히 "빠른 시장 분위기 파악"이다.
- 차트가 과도하게 전문화되지 않으면서 정보량만 보강되었다.
- 기존 1분/10분 시간 보조선과 자연스럽게 결합된다.

## 테스트 및 검증

### 1. JavaScript 문법 검사

검증 명령:

```sh
node -e 'const fs=require("fs"),vm=require("vm"); const html=fs.readFileSync("ethereum_fundamentals_dashboard/working_dashboard.html","utf8"); const script=html.match(/<script>([\s\S]*)<\/script>/)[1]; new vm.Script(script); console.log("syntax ok");'
```

결과:

```text
syntax ok
```

### 2. 1분봉 파싱 검증

검증 내용:

- `parseKlines()`가 `date`, `value`, `high`, `low`를 생성하는지 확인했다.

결과:

```text
parsed date,value,high,low
```

### 3. 변동 범위 밴드 렌더링 검증

검증 내용:

- SVG 안에 `range-band`가 생성되는지 확인했다.
- hover tooltip용 고가/저가 범위 문자열이 생성되는지 확인했다.

결과:

```text
band true
tooltipRange true
```

### 4. 화면 캡처 검증

캡처 방식:

```sh
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --headless=new --disable-gpu --hide-scrollbars --window-size=1440,1200 --screenshot=... file:///Users/visualog/Documents/GitHub/xcodex-02/ethereum_fundamentals_dashboard/working_dashboard.html
```

결과:

- 비포 캡처: `1440 x 1200`, PNG, 저장 완료
- 애프터 캡처: `1440 x 1200`, PNG, 저장 완료

저장 위치:

- `ethereum_fundamentals_dashboard/docs/captures/live_market_before.png`
- `ethereum_fundamentals_dashboard/docs/captures/live_market_after.png`

## 완료 판단

완료 기준:

- 라인 차트 개선 방향 문서화
- 비포 화면 캡처 저장
- 변동 범위 밴드 구현
- 애프터 화면 캡처 저장
- 문법/렌더링 테스트 통과
- 개선 전후와 검증 내용을 마크다운으로 정리

결론:

```text
완료
```
