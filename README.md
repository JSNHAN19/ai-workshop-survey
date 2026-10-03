# AI Workshop Survey — 개발 킷

## 들어있는 것

| 경로 | 내용 |
|---|---|
| `CLAUDE.md` | Claude Code가 자동으로 읽는 프로젝트 지침 |
| `docs/spec.md` | 제작 명세서 v3 (질문 EN/KO, UX, 모바일, 데이터) |
| `docs/design-reference/` | 확정 디자인 원본 (데스크톱 8화면 + 모바일 3화면) + 토큰 |
| `docs/google-sheets-setup.md` | 구글 시트 연동 단계별 가이드 |
| `apps-script/Code.gs` | 시트에 붙여넣을 Apps Script 코드 |

## 시작하기

1. 이 폴더를 압축 해제한 위치에서 Claude Code 실행
2. 첫 메시지 예시:

   > CLAUDE.md랑 docs/spec.md 읽고 서베이 만들어줘. 디자인은 docs/design-reference 기준으로.

3. 완성되면 `docs/google-sheets-setup.md` 따라서 시트 연결 → `config.js`에 URL 넣기
4. GitHub에 올리고 Pages 켜기 (CLAUDE.md 하단 참고)
