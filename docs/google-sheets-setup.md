# Google Sheets 연동 가이드

서베이 응답을 구글 시트에 한 줄씩 쌓는 방법. 10분 정도 걸림.

```
[서베이 페이지 (GitHub Pages)]
        │  POST (text/plain JSON)
        ▼
[Apps Script 웹 앱 (/exec URL)]
        │  appendRow
        ▼
[Google Sheet · Responses 탭]
```

## 1. 시트 만들기

1. Google Sheets에서 빈 스프레드시트 생성 (이름 예: `AI Workshop Survey Responses`)
2. 탭 이름은 신경 안 써도 됨. 첫 응답이 들어올 때 `Responses` 탭과 헤더가 자동으로 생김

## 2. Apps Script 붙이기

1. 시트 상단 메뉴 **확장 프로그램 → Apps Script**
2. 기본 `Code.gs` 내용을 전부 지우고 `apps-script/Code.gs` 내용을 붙여넣기
3. 맨 위 설정값 수정
   - `SHARED_TOKEN`: 아무 랜덤 문자열 (예: `ws-7f3k9q2m`). `config.js`의 `SUBMIT_TOKEN`에 같은 값
   - `NOTIFY_EMAIL`: 새 응답 알림 받을 이메일 (원하면)
4. 저장 (⌘S / Ctrl+S)

## 3. 테스트 실행

1. 에디터 상단 함수 선택 드롭다운에서 `testInsert` 선택 → **실행**
2. 처음엔 권한 요청 창이 뜸 → 본인 계정 선택 → "Google에서 확인하지 않은 앱" 경고가 나오면 **고급 → (프로젝트 이름)(으)로 이동** → 허용
   - 내가 만든 스크립트라 뜨는 경고고, 내 시트에만 접근함
3. 시트로 돌아가서 `Responses` 탭에 테스트 줄이 들어왔는지 확인
4. 확인했으면 테스트 줄은 지워도 됨 (헤더 행은 남겨둘 것)

## 4. 웹 앱으로 배포

1. 우측 상단 **배포 → 새 배포**
2. 톱니바퀴 → 유형 **웹 앱**
3. 설정
   - 설명: `v1`
   - 다음 사용자 인증 정보로 실행: **나**
   - 액세스 권한이 있는 사용자: **모든 사용자** (교수님들이 로그인 없이 제출해야 하므로)
4. **배포** → 나오는 **웹 앱 URL** (`https://script.google.com/macros/s/…/exec`) 복사
5. 브라우저에서 그 URL을 열었을 때 `{"ok":true,"status":"ready"}`가 보이면 성공

## 5. 서베이에 연결

`config.js`:

```js
SUBMIT_URL: "https://script.google.com/macros/s/xxxxxxxx/exec",
SUBMIT_TOKEN: "ws-7f3k9q2m",
```

로컬에서 서베이를 끝까지 한 번 제출해보고 시트에 줄이 생기는지 확인.

## 코드를 수정했을 때 (중요)

Apps Script 코드를 바꾼 뒤 저장만 하면 **배포된 웹 앱에는 반영이 안 됨.**

- **배포 → 배포 관리 → 연필 아이콘 → 버전: 새 버전 → 배포**
- 이렇게 하면 URL은 그대로 유지됨. "새 배포"를 누르면 URL이 바뀌니까 주의

## 시트 컬럼 구성

| 컬럼 | 내용 |
|---|---|
| `submittedAt`, `name`, `lang`, `durationSec` | 항상 맨 앞 |
| 질문 id (`roles`, `ai_frequency`, …) | 선택지 id. 복수 선택은 `teaching, research`처럼 쉼표로 연결 |
| `{id}_other` | "Other" 직접 입력값 |
| `attitudes_save_time` 등 | Likert 문장별 1~5 점수 |
| `availability_local` / `_kst` / `_utc` | 가능 시간 (현지 / 한국 / UTC) |
| `availability_timezone`, `availability_note` | 응답자 시간대, 일정 메모 |
| `raw_json` | 원본 전체 (백업용) |

- 선택지 id는 영어라서 한국어로 응답해도 같은 기준으로 집계됨
- 질문을 추가해도 새 컬럼이 오른쪽에 자동으로 생김

## 문제 해결

| 증상 | 원인 / 해결 |
|---|---|
| 콘솔에 CORS 에러 | `Content-Type`을 `text/plain;charset=utf-8`로 보내는지 확인. `application/json`이면 막힘 |
| `{"ok":false,"error":"unauthorized"}` | `SUBMIT_TOKEN`과 `SHARED_TOKEN` 값 불일치 |
| 수정했는데 반영 안 됨 | "배포 관리 → 새 버전"으로 재배포 안 함 |
| 로그인 화면이 뜸 | 액세스 권한이 "모든 사용자"가 아님 |
| 숫자가 날짜로 바뀜 등 서식 문제 | 시트에서 해당 열 서식을 "일반 텍스트"로 |
