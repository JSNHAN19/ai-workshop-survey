# Design reference

Claude Design 캔버스에서 확정한 화면 디자인 원본. **구현할 때 시각적 기준(source of truth)으로 사용.**

## 이 파일들을 읽는 법

- `.dc.html`은 디자인 캔버스 전용 포맷이라 **브라우저에서 그대로 열면 렌더링되지 않음** (`support.js` 런타임 필요).
- 구조와 스타일은 전부 inline `style="…"`에 있으니 그대로 읽어서 CSS 클래스로 옮기면 됨.
- `{{hole}}`, `<sc-for>`, `<sc-if>`는 템플릿 문법 (반복/조건). 하단 `<script type="text/x-dc">`의 `renderVals()`에 데이터와 계산 로직이 있음. 특히 `QuestionSchedule` / `MobileSchedule`의 시간 변환·칩 그룹핑 로직은 실제 구현에 참고할 만함.
- 이 포맷 자체(`x-dc`, `DCLogic` 등)는 **최종 코드에 가져오지 말 것.** 바닐라 HTML/CSS/JS로 다시 구현.

## 화면 매핑

| 파일 | 화면 | 크기 |
|---|---|---|
| `LanguageSelect.dc.html` | 언어 선택 | Desktop 1280×800 |
| `Welcome.dc.html` | 환영 + 목차 | Desktop |
| `SectionIntro.dc.html` | 섹션 인트로 (02) | Desktop |
| `QuestionSingle.dc.html` | 단일 선택 (Q4) | Desktop |
| `QuestionGroupedKO.dc.html` | 그룹형 복수 선택, 한국어 (learn_build) | Desktop 1280×960 |
| `QuestionLikert.dc.html` | Likert 매트릭스 | Desktop |
| `QuestionSchedule.dc.html` | 일정 그리드 (현지 + KST 이중 축, 듀얼 시계, 선택 요약) | Desktop 1280×920 |
| `ThankYou.dc.html` | 완료 화면 | Desktop |
| `MobileSingle.dc.html` | 단일 선택 | Mobile 390×844 |
| `MobileGroupedKO.dc.html` | 그룹형 복수 선택, 한국어 | Mobile |
| `MobileSchedule.dc.html` | 일정 — 요일 탭 + 하루 리스트 | Mobile |

여기 없는 화면(Review, scale, rank, text 입력, 에러 등)은 같은 컴포넌트·토큰으로 일관되게 만들 것.

## 디자인 토큰 요약

```css
:root {
  --bg: #F7F6F2;
  --surface: #FFFFFF;
  --surface-alt: #FBFBF9;
  --ink: #1C1C1A;
  --ink-body: #3D3C38;
  --ink-muted: #6B6A65;
  --ink-faint: #8A877F;
  --line: #E3E1DA;
  --line-strong: #D6D3CA;
  --rule: #1C1C1A;          /* 질문 위 헤어라인 */
  --accent: #2F5D50;
  --accent-hover: #1F4238;
  --accent-soft: #E6EEEA;
  --hatch-a: #ECEAE3;       /* 진행자 불가 시간 빗금 */
  --error: #A33A2E;

  --font-serif: 'Source Serif 4', serif;
  --font-serif-ko: 'Noto Serif KR', serif;
  --font-sans: 'IBM Plex Sans', sans-serif;
  --font-sans-ko: 'IBM Plex Sans KR', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;

  --radius-card: 10px;
  --radius-panel: 12px;
  --radius-button: 8px;     /* 모바일 하단 바 버튼은 10px */
}
```

## 반복되는 시그니처 요소

- **헤더**: 이탤릭 세리프 `AI` + `WORKSHOP` 자간 넓은 대문자 + 세로 구분선 + "Pre-session survey". 오른쪽에 mono `SECTION 02 / 07` + `EN | 한` 알약형 토글. 하단 2px accent 진행바.
- **질문 블록**: 위에 1px 검정 헤어라인, 왼쪽 160px 레일에 mono `Q · 04` + 섹션명, 오른쪽에 세리프 질문. 모바일에선 레일이 질문 위 한 줄로 합쳐짐.
- **푸터**: Back · 키보드 힌트 · mono 페이지 번호 `04 / 24`.
- **선택 카드**: 키 배지(A, B…) + 라벨 + 선택 시 체크. 모바일/터치에선 키 배지 숨김.
- **질문 아래 안내문 없음.**
