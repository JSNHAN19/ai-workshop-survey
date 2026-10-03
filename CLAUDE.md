# AI Workshop Survey

미국 아동가족학 교수진(약 5명)을 위한 AI 워크숍 사전 설문 웹앱. EN/KO 이중 언어, 모바일 우선, GitHub Pages 정적 배포, 응답은 Google Sheets로 저장.

## 먼저 읽을 것 (순서대로)

1. `docs/spec.md` — 전체 제작 명세. 질문 문구(EN/KO), 질문 타입, UX, 모바일 규칙, 데이터 형식, 완료 기준 전부 여기 있음. **문구는 명세의 것을 그대로 사용.**
2. `docs/design-reference/README.md` — 확정된 디자인과 토큰. 화면별 원본은 같은 폴더의 `.dc.html` 파일.
3. `docs/google-sheets-setup.md` + `apps-script/Code.gs` — 제출 백엔드. 프론트는 이 형식에 맞춰 POST만 하면 됨.

## 만들 것

```
/
├── index.html
├── styles.css
├── app.js
├── questions.js
├── i18n.js
├── config.js
└── apps-script/Code.gs   (이미 있음 — 수정 불필요, 시트에 붙여넣는 용도)
```

- 빌드 도구·프레임워크·외부 JS 라이브러리 없이 바닐라 HTML/CSS/JS
- 폰트만 Google Fonts에서 로드 (Source Serif 4, Noto Serif KR, IBM Plex Sans, IBM Plex Sans KR, IBM Plex Mono)
- 모든 경로는 상대경로 (GitHub Pages 하위 경로 `/repo-name/`에서 동작해야 함)

## 지켜야 할 핵심 규칙

- **질문 제목 아래 안내문(helper text) 금지.** 섹션 인트로도 제목 + mono 메타 한 줄만.
- **모바일이 1급 환경.** 360px에서 가로 스크롤 없음, `100dvh`, safe-area, 입력 16px 이상, 터치에서 키 배지·단축키 힌트 숨김. 상세는 spec §4-1.
- 응답은 언어와 무관하게 **옵션 id로 저장**.
- 일정 질문은 응답자 시간대 자동 감지 + KST 동시 표시. 시간 변환은 `Intl.DateTimeFormat`으로, `SCHEDULE_REFERENCE_WEEK` 기준 실제 날짜로 계산 (DST 대응). 화면에 DST 설명 문구는 넣지 않음.
- 제출은 `Content-Type: text/plain;charset=utf-8` (application/json 금지 — Apps Script CORS).
- 완료 화면은 체크 아이콘 + "Thank you, {name}." + "I'll be in touch soon!"만.
- `localStorage`는 try/catch로 감싸고, 실패해도 정상 동작.
- 디자인 레퍼런스의 `.dc.html` 포맷(`x-dc`, `sc-for`, `DCLogic`, `support.js`)은 최종 코드에 들여오지 말 것.

## 작업 순서 제안

1. `questions.js`, `i18n.js`, `config.js` — 명세의 데이터 그대로 옮기기
2. `styles.css` — 토큰, 모바일 기본 → `min-width: 600px`, `900px` 확장
3. `app.js` — 상태/라우팅/조건부 건너뛰기/진행바 → 질문 타입 렌더러 → 키보드 → 언어 전환 → localStorage → 제출
4. 일정(`schedule`) 타입은 가장 복잡하니 별도 모듈 함수로 분리
5. Review / Thank You / 에러 화면
6. spec §8 완료 기준 체크리스트로 자체 점검

## 로컬 실행

```bash
python3 -m http.server 8000
# http://localhost:8000
# http://localhost:8000/?name=Jane%20Smith&lang=en
# 크롬 DevTools 기기 모드로 360 / 390 / 768 확인
```

`config.js`의 `SUBMIT_URL`이 비어 있으면 제출 시 콘솔에 payload만 출력됨.

## 배포 (GitHub Pages)

1. GitHub에 레포 생성 후 푸시 (`main` 브랜치, 루트에 `index.html`)
2. 레포 Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`
3. 1~2분 뒤 `https://<user>.github.io/<repo>/` 에서 확인
4. 교수님별 링크: `…/?name=Jane%20Smith&lang=en`
