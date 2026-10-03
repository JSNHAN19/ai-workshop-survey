# AI Readiness Survey — 제작 명세서 (Claude Code용) v3

## 0. 프로젝트 개요

- **목적**: 미국 아동가족학(Child & Family Studies) 교수진 약 5명을 대상으로 AI 교육 커리큘럼을 설계하기 전, 각자의 AI 사용 경험·활용 희망 영역·배우고 싶은 것·우려사항·학습 선호를 파악한다.
- **대상 특성**: AI 문외한에 가까움, 영어 또는 한국어 사용자, 연령대 다양(40~60대 포함 가능성), 워크숍은 **Zoom**(컴퓨터)으로 진행하지만, **설문 자체는 휴대폰으로 응답할 가능성이 높음** (이메일 링크를 폰에서 바로 여는 경우). → 모바일 완전 지원 필수 (§4-1).
- **톤**: 깔끔하고 프로페셔널. 학술적이지만 딱딱하지 않게. "테스트 받는 느낌"이 아니라 "나를 위한 수업을 준비하는 과정"으로 느껴지게.
- **소요 시간 목표**: 약 9분, 질문 24개 (조건부 건너뛰기 포함 시 더 적음). 질문 번호(Q5a 등)는 순서 표기용이며, 구현 기준은 `id`.
- **시차**: 응답자는 미국, 진행자는 한국(KST). 일정 질문에서 응답자 현지 시간과 KST를 동시에 보여줘야 함.
- **언어**: 영어(EN) / 한국어(KO) 이중 언어. 시작 시 선택, 언제든 전환 가능.
- **배포**: GitHub Pages (정적). 응답 저장은 Google Apps Script → Google Sheets (Phase 2).

---

## 1. 기술 스택 & 파일 구조

빌드 도구 없이 바닐라 HTML/CSS/JS로 구성. GitHub Pages에 그대로 올라가야 함.

```
/
├── index.html
├── styles.css
├── app.js           # 화면 전환, 상태 관리, 키보드 내비게이션, 언어 전환, 제출
├── questions.js     # 질문 정의 (EN/KO 텍스트 포함, 데이터만)
├── i18n.js          # 버튼·안내 문구 등 UI 문자열 (EN/KO)
└── config.js        # SUBMIT_URL 등 설정값
```

- 질문은 `questions.js`의 배열만 수정하면 추가/삭제/순서 변경이 되도록 **데이터 기반 렌더링**.
- 진행 상태(선택 언어 포함)는 `localStorage`에 자동 저장 → 새로고침해도 이어서 작성 (try/catch로 감싸고, 실패해도 정상 동작).
- 외부 JS 라이브러리 사용하지 않음. 폰트만 CDN 로드.

### 다국어 처리 규칙

- 모든 화면 텍스트는 `{ en: "...", ko: "..." }` 객체로 정의.
- **응답 데이터는 언어와 무관하게 옵션 `id`로 저장** (예: `"monthly"`). 번역된 라벨을 저장하지 않음 → 시트에서 EN/KO 응답이 같은 기준으로 집계됨.
- "Other" 입력값은 `{questionId}_other` 키에 원문 그대로 저장.
- 언어 전환 시 `<html lang>` 속성 업데이트, 입력된 답변은 유지.
- URL 파라미터 `?lang=ko` 또는 `?lang=en`이 있으면 언어 선택 화면 건너뛰고 해당 언어로 시작.

---

## 2. 화면 흐름

```
[Language Select] → [Welcome] → Section 1~7 (intro + questions) → [Review] → [Thank You]
```

---

## 3. 질문 구성

### 질문 타입 정의

| type | 설명 |
|---|---|
| `intro` | 섹션 시작 화면 (질문 아님) |
| `text` | 한 줄 텍스트 입력 |
| `longtext` | 여러 줄 텍스트 입력 |
| `single` | 단일 선택 카드 |
| `multi` | 복수 선택 카드 (`max`로 개수 제한 가능, `groups`로 소제목 그룹화 가능) |
| `scale` | 1~5 척도 (양 끝 라벨 포함) |
| `likert` | 여러 문장 × 동의 정도 (매트릭스) |
| `rank` | 이전 질문에서 고른 항목 중 상위 N개 순서대로 선택 |
| `schedule` | 주간 가능 시간 그리드. 응답자 현지 시간 + KST 동시 표시 (상세는 Q19a) |

- `allowOther: true` → 마지막에 "Other / 기타" 옵션, 선택 시 텍스트 입력란 표시.
- `required: false` → "Skip / 건너뛰기" 버튼 표시.
- 옵션 표기 형식: `id` · EN · KO

### 문구 원칙 (중요)

- **질문 제목 아래 안내문(helper text)을 두지 않는다.** "Select all that apply", "어려워 보여도 괜찮아요" 같은 보조 문구는 전부 제거. 화면에는 질문 제목과 선택지만.
- 섹션 인트로도 제목만 두고 설명 문장은 없음. 대신 mono 한 줄로 `6 QUESTIONS · ABOUT 2 MIN` / `6문항 · 약 2분`만 표시.
- 선택 개수 제한(`max`)은 문구 대신 OK 버튼 옆 카운터(`1 / 2`)로 표시.
- placeholder는 입력란 예시로만 사용 (유지).

---

### Language Select 화면 (최초 진입)

- **Title**: Choose your language · 언어를 선택해 주세요
- 큰 카드 2개 나란히 (모바일은 세로):
  - `en` · **English**
  - `ko` · **한국어**
- **Note**: You can switch anytime. · 언제든 바꿀 수 있어요.
- 키보드: `E` = English, `K` = 한국어
- 선택 즉시 Welcome 화면으로 전환
- 이후 모든 화면 상단 바 우측에 `EN | 한` 토글 상시 노출

---

### Welcome 화면

| | EN | KO |
|---|---|---|
| Title | Let's design your AI workshop together | 함께 AI 워크숍을 설계해 봐요 |
| Title (개인화) | Hi {firstName} — let's design your AI workshop together | {name} 교수님, 함께 AI 워크숍을 설계해 봐요 |
| Body | Before our sessions, I'd love to learn a bit about you — how you work, what you're curious about, and what concerns you. There are no right or wrong answers, and no experience is required. | 워크숍에 앞서 교수님의 업무 방식, 궁금한 점, 우려되는 점을 미리 알고 싶습니다. 정답은 없으며, AI 경험이 전혀 없으셔도 괜찮습니다. |
| Meta | ⏱ About 9 minutes · Your progress is saved automatically | ⏱ 약 9분 소요 · 진행 상황은 자동 저장됩니다 |
| Button | Get started → | 시작하기 → |

---

### Section 1 — About You · 교수님에 대해

**Intro**: `01` · About You · 교수님에 대해

**Q1** `text` · required · id: `name`
- EN: What's your name?
- KO: 성함을 알려주세요.
- placeholder: e.g., Dr. Jane Smith · 예: 김지현
- 비고: URL 파라미터 `?name=`이 있으면 미리 채움

**Q2** `multi` · required · id: `roles`
- EN: Which parts of your work take up most of your time?
- KO: 업무 중 가장 많은 시간을 쓰시는 분야는 무엇인가요?
- options:
  - `teaching` · Teaching · 강의
  - `research` · Research · 연구
  - `advising` · Advising & mentoring students · 학생 지도 및 멘토링
  - `outreach` · Clinical or community outreach · 임상 또는 지역사회 활동
  - `admin` · Administrative / committee work · 행정·위원회 업무
  - `grants` · Grant writing · 연구비 제안서 작성
- allowOther

**Q3** `text` · optional · id: `research_area`
- EN: In a few words, what's your area of research or expertise?
- KO: 연구 분야나 전문 분야를 간단히 알려주세요.
- placeholder: e.g., early childhood development, family resilience · 예: 영유아 발달, 가족 회복탄력성

---

### Section 2 — Your Experience with AI · AI 사용 경험

**Intro**: `02` · Your Experience with AI · AI 사용 경험

**Q4** `single` · required · id: `ai_frequency`
- EN: How often do you currently use AI tools like ChatGPT?
- KO: ChatGPT 같은 AI 도구를 얼마나 자주 사용하시나요?
- options:
  - `never` · I've never used one · 한 번도 사용해 본 적 없어요
  - `tried` · I've tried it once or twice · 한두 번 써봤어요
  - `monthly` · Occasionally — a few times a month · 가끔 — 한 달에 몇 번
  - `weekly` · Regularly — every week · 꾸준히 — 매주
  - `daily` · Almost every day · 거의 매일

**Q5** `multi` · optional · id: `tools_used`
- EN: Which of these have you used, even briefly?
- KO: 잠깐이라도 사용해 보신 도구를 모두 골라주세요.
- options: `chatgpt` ChatGPT · `claude` Claude · `gemini` Google Gemini · `copilot` Microsoft Copilot · `grammarly` Grammarly (AI features · AI 기능) · `perplexity` Perplexity · `notebooklm` NotebookLM · `none` None of these · 사용해 본 것 없음
- allowOther
- 비고: `none` 선택 시 다른 선택 해제 (상호 배타)
- **조건**: Q4 = `never`이면 건너뜀

**Q5a** `multi` · optional · id: `paid_accounts`
- EN: Do you have access to any paid or university-provided AI accounts?
- KO: 유료 AI 계정이나 학교에서 제공하는 AI 계정이 있으신가요?
- options:
  - `chatgpt_paid` · ChatGPT Plus, Team, or Edu · ChatGPT Plus, Team 또는 Edu
  - `claude_paid` · Claude Pro or Team · Claude Pro 또는 Team
  - `gemini_paid` · Google Gemini (paid, or through Google Workspace) · Google Gemini (유료 또는 Google Workspace 포함)
  - `copilot_m365` · Microsoft Copilot through my university's Microsoft 365 · 학교 Microsoft 365 계정의 Copilot
  - `university_other` · Another AI tool provided by my university · 학교에서 제공하는 기타 AI 도구
  - `none` · None — I only use free versions · 없음 — 무료 버전만 사용해요
  - `not_sure` · Not sure · 잘 모르겠어요
- allowOther
- 비고: `none`, `not_sure`는 상호 배타. Q4 응답과 무관하게 항상 표시 (AI를 안 써봤어도 학교 라이선스가 있을 수 있음)

**Q6** `multi` · optional · id: `past_uses`
- EN: What have you used AI for so far?
- KO: 지금까지 AI를 어디에 사용해 보셨나요?
- options:
  - `email` · Writing or editing emails · 이메일 작성·수정
  - `summarize` · Summarizing articles or papers · 기사·논문 요약
  - `brainstorm` · Brainstorming ideas · 아이디어 브레인스토밍
  - `teaching_materials` · Creating teaching materials · 강의 자료 제작
  - `search` · Searching for information · 정보 검색
  - `translation` · Translation · 번역
  - `exploring` · Just exploring out of curiosity · 호기심에 이것저것 시도
- allowOther
- **조건**: Q4 = `never`이면 건너뜀

**Q7** `scale` · required · id: `comfort`
- EN: How comfortable do you feel using AI tools today?
- KO: 현재 AI 도구를 사용하는 것이 얼마나 편하신가요?
- 1 = Not at all comfortable · 전혀 편하지 않음
- 5 = Very comfortable · 매우 편함

**Q8** `single` · required · id: `coding_experience`
- EN: Have you ever written code or used a programming tool?
- KO: 코드를 작성하거나 프로그래밍 도구를 써보신 적이 있나요?
- options:
  - `none` · Never · 전혀 없어요
  - `stats_basic` · A little — statistical software (R, SPSS, Stata) · 조금 — 통계 프로그램 (R, SPSS, Stata)
  - `web_basic` · A little — basic websites or HTML · 조금 — 간단한 웹사이트나 HTML
  - `comfortable` · I'm comfortable with R, Python, or similar · R, Python 등에 익숙해요
- 비고: Section 4 "직접 만들기" 실습 난이도 설정용

---

### Section 3 — Where AI Could Help · AI가 도울 수 있는 일

**Intro**: `03` · Where AI Could Help · AI가 도울 수 있는 일

**Q9** `multi` (groups) · required · id: `interest_areas`
- EN: Which of these tasks would you most like help with?
- KO: 어떤 업무에서 도움을 받고 싶으신가요?
- groups:
  - **Teaching · 강의**
    - `syllabus` · Designing syllabi or course outlines · 강의계획서·커리큘럼 설계
    - `slides` · Creating lecture slides and materials · 강의 슬라이드·자료 제작
    - `quiz` · Writing quiz or exam questions · 퀴즈·시험 문제 출제
    - `feedback` · Giving feedback on student work · 학생 과제 피드백
    - `activities` · Developing case studies or class activities · 사례 연구·수업 활동 개발
  - **Research · 연구**
    - `lit_review` · Finding and reviewing literature · 문헌 검색 및 검토
    - `paper_summary` · Summarizing papers · 논문 요약
    - `qual` · Analyzing qualitative data (interviews, open-ended responses) · 질적 자료 분석 (인터뷰, 개방형 응답)
    - `quant` · Analyzing quantitative data · 양적 자료 분석
    - `manuscript` · Writing and editing manuscripts · 논문 작성·교정
    - `grant` · Writing grant proposals · 연구비 제안서 작성
  - **Admin & Communication · 행정·커뮤니케이션**
    - `email` · Drafting emails · 이메일 초안 작성
    - `notes` · Meeting notes and summaries · 회의록·요약 정리
    - `reports` · Writing reports · 보고서 작성
    - `presentations` · Preparing presentations · 발표 자료 준비
  - **Community & Outreach · 지역사회·아웃리치**
    - `family_materials` · Creating materials for parents and families · 부모·가족 대상 자료 제작
    - `translate` · Translating materials into other languages · 자료 번역
    - `public` · Simplifying research for the public · 연구 내용을 대중에게 쉽게 전달
- allowOther

**Q10** `rank` · required · id: `top_priorities`
- EN: Of the tasks you selected, which 3 matter most to you right now?
- KO: 선택하신 업무 중 지금 가장 중요한 3가지는 무엇인가요?
- source: `interest_areas`, max: 3
- 비고: 클릭 순서대로 ①②③ 배지. 다시 클릭하면 해제되고 순번 재정렬.
- **조건**: Q9에서 3개 이하 선택 시 건너뜀

---

### Section 4 — What You'd Like to Learn & Build · 배우고 만들어보고 싶은 것 (NEW)

**Intro**: `04` · What You'd Like to Learn & Build · 배우고 만들어보고 싶은 것

**Q11** `multi` (groups) · required · id: `learn_build`
- EN: Which of these would you like to learn?
- KO: 어떤 것을 배워보고 싶으신가요?
- groups:
  - **Using AI Better · AI 더 잘 쓰기**
    - `prompting` · Asking AI better questions (prompting) · AI에게 더 잘 질문하는 법 (프롬프트 작성)
    - `reading_assistant` · Using AI to read and analyze PDFs and papers · AI로 PDF·논문 읽고 분석하기
    - `custom_assistant` · Setting up a custom AI assistant for a specific task (e.g., a "grant reviewer") · 특정 업무 전용 AI 조수 만들기 (예: "연구비 제안서 검토 도우미")
    - `fact_check` · Checking AI outputs for accuracy · AI 결과물의 정확성 검증하기
  - **Building with AI · AI로 직접 만들기**
    - `website` · Building a website (personal, lab, or course page) · 웹사이트 만들기 (개인·연구실·강의 페이지)
    - `personal_tool` · Building a personal management tool (e.g., schedule, reading list, student tracker) · 나만의 관리 도구 만들기 (예: 일정, 읽을 논문 목록, 학생 관리)
    - `survey_tool` · Building surveys or forms like this one · 이런 설문지나 신청 폼 만들기
    - `interactive_materials` · Creating interactive teaching materials (quizzes, games, simulations) · 인터랙티브 수업 자료 만들기 (퀴즈, 게임, 시뮬레이션)
    - `dashboard` · Turning data into charts and dashboards · 데이터를 차트·대시보드로 시각화하기
    - `automation` · Automating repetitive tasks (e.g., sorting emails, organizing files) · 반복 업무 자동화하기 (예: 이메일 분류, 파일 정리)
  - **Creating Content · 콘텐츠 제작**
    - `visuals` · Making slides, infographics, or visuals · 슬라이드·인포그래픽·이미지 만들기
    - `video_audio` · Creating short videos or audio (e.g., lecture summaries) · 짧은 영상·오디오 만들기 (예: 강의 요약)
- allowOther

**Q12** `longtext` · optional · id: `build_idea`
- EN: Is there a tool or website you've always wished existed for your work?
- KO: 업무를 하면서 "이런 게 있었으면 좋겠다" 싶었던 도구나 웹사이트가 있나요?
- placeholder: e.g., a page where families can easily find our program's resources · 예: 부모님들이 프로그램 자료를 쉽게 찾을 수 있는 페이지
- **조건**: Q11에서 "Building with AI" 그룹 옵션을 하나라도 선택한 경우에만 표시

---

### Section 5 — Thoughts & Concerns · 생각과 우려

**Intro**: `05` · Thoughts & Concerns · 생각과 우려

**Q13** `multi` · optional · id: `concerns`
- EN: What concerns, if any, do you have about using AI?
- KO: AI 사용에 대해 우려되는 점이 있으신가요?
- options:
  - `accuracy` · Accuracy — AI making things up · 정확성 — AI가 사실이 아닌 내용을 만들어냄
  - `privacy` · Privacy of student or research participant data · 학생·연구 참여자 데이터 보호
  - `integrity` · Academic integrity and student misuse · 학문적 진실성 및 학생들의 부정 사용
  - `bias` · Bias in AI outputs · AI 결과물의 편향
  - `deskilling` · Losing my own skills over time · 나 자신의 역량 저하
  - `where_to_start` · Not knowing where to start · 어디서부터 시작해야 할지 모름
  - `time` · Not having enough time to learn · 배울 시간이 부족함
  - `irb` · Ethical or IRB considerations · 연구 윤리·IRB 관련 문제
- allowOther

**Q14** `likert` · required · id: `attitudes`
- EN: How much do you agree with each statement?
- KO: 각 문장에 얼마나 동의하시나요?
- scale (1~5): Strongly disagree · 전혀 그렇지 않다 / Disagree · 그렇지 않다 / Neutral · 보통이다 / Agree · 그렇다 / Strongly agree · 매우 그렇다
- statements:
  - `save_time` · AI could save me meaningful time in my work. · AI가 업무 시간을 의미 있게 줄여줄 수 있을 것 같다.
  - `trust` · I would trust AI-generated content after reviewing it. · 검토를 거친다면 AI가 만든 결과물을 신뢰할 수 있다.
  - `students` · I feel prepared to talk with students about AI use. · 학생들과 AI 사용에 대해 이야기할 준비가 되어 있다.
  - `curious` · I'm curious to learn more about AI. · AI에 대해 더 배우고 싶다.
- 비고: 데스크톱은 매트릭스 테이블, 좁은 화면에서는 문장별 카드로 세로 배치

**Q15** `single` · required · id: `sensitive_data`
- EN: Does your work involve sensitive data — for example, information about children, families, or research participants?
- KO: 아동, 가족, 연구 참여자 정보처럼 민감한 데이터를 업무에서 다루시나요?
- options:
  - `frequently` · Yes, frequently · 네, 자주 다뤄요
  - `sometimes` · Sometimes · 가끔 다뤄요
  - `rarely` · Rarely or never · 거의 없어요
  - `not_sure` · Not sure · 잘 모르겠어요
- 비고: 커리큘럼에서 개인정보·IRB 파트 비중 결정용

**Q16** `single` · optional · id: `policy_awareness`
- EN: Does your university or department have guidelines on AI use?
- KO: 소속 대학이나 학과에 AI 사용 가이드라인이 있나요?
- options:
  - `familiar` · Yes, and I'm familiar with them · 있고, 내용도 알고 있어요
  - `not_read` · Yes, but I haven't read them closely · 있지만 자세히 읽어보진 않았어요
  - `no` · No, not that I know of · 제가 알기로는 없어요
  - `not_sure` · I'm not sure · 잘 모르겠어요

---

### Section 6 — How You Like to Learn · 학습 방식

**Intro**: `06` · How You Like to Learn · 학습 방식

**Q17** `multi` · required · id: `formats` · max: 2
- EN: Which learning formats work best for you?
- KO: 어떤 학습 방식이 가장 잘 맞으세요?
- 비고: 최대 2개 제한은 OK 버튼 옆 `0 / 2` 카운터로 표시
- options:
  - `live_handson` · Live, hands-on practice together · 함께 실시간으로 직접 실습하기
  - `demo` · Watching a demonstration first · 먼저 시연 보기
  - `recorded` · Short recorded videos I can revisit · 다시 볼 수 있는 짧은 녹화 영상
  - `one_on_one` · One-on-one guidance · 1:1 맞춤 지도
  - `written_guide` · A written step-by-step guide · 단계별 문서 가이드

**Q18** `single` · required · id: `depth`
- EN: Which pace sounds right for you?
- KO: 어떤 속도가 적당할까요?
- options (제목 + 한 줄 설명):
  - `basics` · **Start from the very basics** — What AI is, how to sign up, how to ask good questions. · **완전 기초부터** — AI가 무엇인지, 가입하는 법, 좋은 질문을 하는 법
  - `practical` · **Practical and focused** — Skip the theory and show me how to use it in my work. · **실전 위주로** — 이론은 건너뛰고 업무에 바로 쓰는 법
  - `deeper` · **Go deeper** — Advanced techniques, workflows, and how it actually works. · **깊이 있게** — 고급 활용법, 업무 흐름 설계, 작동 원리까지

**Q19** `single` · required · id: `device`
- EN: Which computer will you use during our Zoom sessions?
- KO: Zoom 세션에서 어떤 컴퓨터를 사용하실 예정인가요?
- options:
  - `mac_laptop` · Mac laptop (MacBook) · 맥 노트북 (맥북)
  - `windows_laptop` · Windows laptop · 윈도우 노트북
  - `mac_desktop` · Mac desktop (iMac, Mac mini) · 맥 데스크톱 (아이맥, 맥 미니)
  - `windows_desktop` · Windows desktop · 윈도우 데스크톱
  - `not_sure` · Not sure yet · 아직 모르겠어요

**Q19a** `schedule` · required · id: `availability`
- EN: When are you generally available for a 60–90 minute Zoom session?
- KO: 60~90분 Zoom 세션이 가능한 시간대를 모두 선택해 주세요.

**① 시간대 감지 & 변경**
- `Intl.DateTimeFormat().resolvedOptions().timeZone`으로 응답자 시간대 자동 감지
- 질문 상단에 표시: `Your time zone: Central Time (Chicago) · Change` / `내 시간대: 미국 중부 (시카고) · 변경`
- "Change" 클릭 → 드롭다운: Eastern (New York) · Central (Chicago) · Mountain (Denver) · Arizona (Phoenix) · Pacific (Los Angeles) · Alaska · Hawaii · Korea (Seoul) · Other… (전체 IANA 목록 검색)
- 진행자 시간대는 `Asia/Seoul` 고정

**② 듀얼 라이브 시계** (질문 상단, 1분마다 갱신)
```
┌──────────────────────┬──────────────────────┐
│ YOU · CHICAGO        │ JASON · SEOUL        │
│ 1:34 AM              │ 3:34 PM              │
│ Saturday, Oct 3      │ Saturday, Oct 3      │
└──────── Seoul is 14 hours ahead ────────────┘
```
- 시차 문구: `Seoul is {n} hours ahead of you` / `서울이 {n}시간 빠릅니다`
- 서로 날짜가 다르면 날짜 줄에 accent 색 강조

**③ 주간 그리드**
- 열: 월~일 (응답자 현지 기준 요일)
- 행: 현지 시간 1시간 단위, 기본 07:00~22:00 (`config.js`의 `SCHEDULE_LOCAL_HOURS`)
- 행 라벨 2줄: 위 = 현지 시간 크게 (`7 PM`), 아래 = KST 작게 (`KST 9 AM`, 날짜가 넘어가면 `+1d` 배지)
- 셀 hover 툴팁: `Tue 7:00 PM your time → Wed 9:00 AM in Seoul` / `화 오후 7:00 (현지) → 수 오전 9:00 (서울)`
- 진행자 불가 시간: `config.js`의 `HOST_AVAILABLE_KST` (예: `{ start: 8, end: 24 }`)를 벗어나는 셀은 사선 패턴 + 비활성, 툴팁 `Outside the instructor's available hours` / `진행자 가능 시간 외`
- 선택: 클릭 토글, 마우스 드래그로 연속 선택/해제 (드래그 시작 셀 상태 기준), 키보드는 방향키 이동 + Space 토글
- 선택된 셀: accent 배경, 흰 체크

**④ 선택 요약**
- 그리드 아래 칩 리스트: `Tue 7–8 PM  ·  Wed 9–10 AM KST` 형식, 같은 요일 연속 시간은 묶어서 표시 (`Tue 7–9 PM`)
- 칩의 × 로 개별 해제
- 선택 개수 표시: `{n} time slots selected` / `{n}개 시간대 선택됨`

**⑤ 추가 메모**
- 그리드 아래 한 줄 입력: `Any other scheduling notes? (optional)` / `일정 관련 참고사항 (선택)` — placeholder: e.g., Not available Nov 20–30 · 예: 11월 20~30일은 어려워요

**⑥ 시간 계산 규칙**
- 매주 반복 기준이지만, DST 오차 방지를 위해 `config.js`의 `SCHEDULE_REFERENCE_WEEK` (워크숍 예정 주의 월요일, 예: `"2026-11-09"`)를 기준으로 실제 날짜를 만들어 변환
- 참고: 미국 DST는 2026년 11월 1일 종료, 한국은 DST 없음 → 기준 주가 그 전후인지에 따라 시차 1시간 달라짐
- 변환은 `Intl.DateTimeFormat`의 `timeZone` 옵션으로 처리 (라이브러리 없이)
- DST 관련 설명 문구는 화면에 표시하지 않음 (계산에만 반영)

**⑦ 저장 형식**
```js
availability: {
  timeZone: "America/Chicago",
  referenceWeek: "2026-11-09",
  slots: [
    { local: "Tue 19:00", kst: "Wed 09:00", utc: "2026-11-11T01:00:00Z" }
  ],
  note: ""
}
```
- required 판정: 슬롯 1개 이상 또는 메모 입력

**⑧ 모바일**: 요일 탭 + 하루 단위 세로 리스트로 전환 (§4-1 "일정 그리드" 참고)

---

### Section 7 — Final Thoughts · 마무리

**Intro**: `07` · Final Thoughts · 마무리

**Q20a** `longtext` · optional · id: `current_project`
- EN: Are you working on a paper, course, or project right now that we could use as a practice example?
- KO: 지금 진행 중인 논문, 수업, 프로젝트 중에 실습 예제로 활용해 볼 만한 것이 있나요?
- placeholder: e.g., revising my fall syllabus; drafting a grant proposal · 예: 가을 학기 강의계획서 수정, 연구비 제안서 초안 작성

**Q20** `longtext` · optional · id: `wish_task`
- EN: If AI could take one task off your plate this week, what would it be?
- KO: 이번 주 업무 중 딱 하나를 AI에게 맡길 수 있다면, 무엇을 맡기고 싶으세요?
- placeholder: Be as specific as you like — real examples help me design better exercises. · 구체적일수록 좋아요. 실제 사례가 있으면 더 좋은 실습을 준비할 수 있어요.

**Q21** `longtext` · optional · id: `anything_else`
- EN: Anything else you'd like me to know?
- KO: 그 밖에 전하고 싶은 말씀이 있으신가요?
- placeholder: Questions, hopes, hesitations… · 궁금한 점, 기대, 망설여지는 점 등…

---

### Review 화면

| | EN | KO |
|---|---|---|
| Title | Review your answers | 응답 확인 |
| Sub | Take a quick look before submitting. | 제출 전에 한 번 확인해 주세요. |
| Edit | Edit | 수정 |
| Button | Submit responses | 제출하기 |

- 섹션별 접이식(accordion) 요약, 옵션은 현재 선택 언어 라벨로 표시
- "Edit" → 해당 질문으로 이동, 수정 후 "Back to review / 확인 화면으로" 버튼으로 복귀

### Thank You 화면

| | EN | KO |
|---|---|---|
| Title | Thank you, {firstName}. | 감사합니다, {name} 교수님. |
| Body | I'll be in touch soon! | 곧 연락드릴게요! |
| Error title | Something went wrong. | 제출 중 문제가 발생했어요. |
| Retry | Try again | 다시 시도 |
| Backup (에러 시에만) | Download my responses | 내 응답 다운로드 |

- 성공 화면에는 체크 아이콘 + Title + Body 두 줄만. 그 외 요소(다음 단계 안내, 다운로드 버튼 등) 없음.
- "Download my responses"는 제출 실패 화면에서만 노출.

---

### 공통 UI 문자열 (`i18n.js`)

| key | EN | KO |
|---|---|---|
| `ok` | OK | 확인 |
| `enterHint` | press Enter ↵ | Enter ↵ 누르기 |
| `back` | Back | 이전 |
| `skip` | Skip | 건너뛰기 |
| `continue` | Continue → | 계속 → |
| `sectionOf` | Section {n} of {total} | 섹션 {n} / {total} |
| `required` | Please answer to continue. | 계속하려면 응답해 주세요. |
| `maxReached` | You've selected the maximum. | 최대 개수를 선택하셨어요. |
| `other` | Other | 기타 |
| `otherPlaceholder` | Please specify | 직접 입력해 주세요 |
| `submitting` | Submitting… | 제출 중… |
| `backToReview` | Back to review | 확인 화면으로 |

---

## 4. UI / UX 설계

### 기본 구조: 한 화면에 질문 하나

- Typeform 스타일. 화면 중앙에 질문 하나만 크게.
- 이유: AI 비전문가 + 다양한 연령대 → 인지 부담 최소화, 응답 품질 향상.

### 레이아웃

```
┌─────────────────────────────────────────────┐
│ AI Workshop Survey        Section 2 of 7  EN|한 │  ← 상단 바 (고정)
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← 진행바 (2px)
│                                             │
│      04 →                                   │  ← 질문 번호 (작게, accent)
│      How often do you currently use         │
│      AI tools like ChatGPT?                 │  ← 질문 (serif, 큼직)
│                                             │
│      ┌─────────────────────────────────┐    │
│      │ A  I've never used one          │    │  ← 선택 카드
│      └─────────────────────────────────┘    │
│      ┌─────────────────────────────────┐    │
│      │ B  I've tried it once or twice  │    │
│      └─────────────────────────────────┘    │
│                                             │
│      [ OK ✓ ]   press Enter ↵               │
│                                             │
│ ← Back                                      │  ← 하단 (고정)
└─────────────────────────────────────────────┘
```

- 콘텐츠 최대 폭 640px, 수직 중앙 정렬
- 그룹형 multi(Q9, Q11)는 옵션이 많으므로: 최대 폭 760px, 그룹별 소제목 + 2열 카드 그리드 (900px 미만에서 1열), 질문 영역은 상단 정렬 + 내부 스크롤 허용
- 모바일 레이아웃은 §4-1에서 별도 정의

### Language Select 화면 디자인

- 화면 중앙, 상단에 작은 서베이 타이틀
- 두 카드 각 240×160px, 큰 텍스트(serif 28px), 카드 하단에 작게 `Press E` / `K 누르기`
- hover 시 테두리 accent, 살짝 들어올림
- 이 화면은 진행바·상단 바 없이 깔끔하게

### 언어 토글 (상단 바)

- `EN | 한` 세그먼트 컨트롤, 현재 언어는 `--ink`, 비선택은 `--ink-muted`
- 클릭 시 현재 화면 텍스트만 150ms 크로스페이드로 교체 (화면 이동 없음)

### 상호작용

- **단일 선택**: 카드 클릭 → 선택 표시 → 400ms 후 자동으로 다음 질문
- **복수 선택**: 토글, "OK"로 다음. `max` 도달 시 나머지 카드 비활성(opacity 0.4) + `maxReached` 안내
- **키보드**:
  - `A`~`Z`: 해당 옵션 선택 (카드 왼쪽 키 배지). 그룹형은 그룹을 넘어 연속 알파벳.
  - `1`~`5`: scale 질문
  - `Enter`: 다음 / `Shift+Enter`: longtext 줄바꿈
  - `Esc` 또는 `↑`: 이전 질문
  - 텍스트 입력 중에는 알파벳 단축키 비활성
- **필수 미응답**: 버튼 흔들림(shake) + `required` 문구
- **조건부 건너뛰기**: Q5, Q6, Q10, Q12. 진행바 계산 시 건너뛴 질문 제외

### 화면 전환 애니메이션

- 다음: 현재 질문 위로 이동하며 페이드아웃(translateY -24px), 다음 질문 아래에서 페이드인. 300ms, `cubic-bezier(0.22, 1, 0.36, 1)`
- 이전: 반대 방향
- `prefers-reduced-motion: reduce`이면 페이드만

### 섹션 인트로 화면

- 큰 섹션 번호 (예: `02`, serif light 240px, accent) + 세로 헤어라인 + 오른쪽에 mono 메타(`6 QUESTIONS · ABOUT 2 MIN`)와 섹션 제목
- 설명 문장 없음
- "Continue →" 버튼, Enter로도 진행

---

## 4-1. 모바일 대응 (필수)

응답자가 이메일 링크를 휴대폰에서 바로 열 가능성이 높으므로, 모바일을 "축소판"이 아니라 **동등한 1급 환경**으로 구현한다. CSS는 모바일 기본값 → `min-width` 미디어쿼리로 확장하는 모바일 퍼스트 방식.

### 브레이크포인트 & 테스트 기준

| 구간 | 폭 | 기준 기기 |
|---|---|---|
| Phone | ≤ 599px | 360px (Android), 390px (iPhone 15), 430px (Pro Max) |
| Tablet | 600–899px | 768px (iPad 세로) |
| Desktop | ≥ 900px | 1280px, 1440px |

- 360px에서 가로 스크롤 0, 텍스트 잘림 0
- 실기기 확인: iOS Safari, Android Chrome (가로 모드 포함)

### 기본 설정

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- 전체 높이는 `100dvh` (주소창 표시/숨김에 따라 레이아웃이 튀지 않게, `100vh` 사용 금지)
- 하단 고정 바는 `padding-bottom: calc(12px + env(safe-area-inset-bottom))` (아이폰 홈 인디케이터)
- 모든 `input`, `textarea` 폰트 16px 이상 (iOS 자동 확대 방지)
- 터치 타겟 최소 44×44px, 인접 타겟 간격 8px 이상
- `@media (hover: none)`: hover 효과 제거, 키 배지(A/B/C)·키보드 단축키 안내·"press Enter" 힌트 전부 숨김
- `-webkit-tap-highlight-color: transparent` + 자체 `:active` 상태(살짝 어두워짐)

### 공통 레이아웃 (Phone)

```
┌───────────────────────────┐
│ AI   SECTION 02/07  EN|한 │ ← 헤더 52px (부제 "Pre-session survey" 숨김)
│▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░│ ← 진행바 2px
│                           │
│ Q · 04 — Your experience  │ ← 왼쪽 레일 → 질문 위 mono 한 줄로 합침
│                           │
│ How often do you          │ ← 질문 serif 26px (KO 24px)
│ currently use AI tools    │
│ like ChatGPT?             │
│                           │
│ ┌───────────────────────┐ │
│ │ I've never used one   │ │ ← 카드 풀폭, 최소 56px
│ └───────────────────────┘ │
│ ...                       │ ← 콘텐츠는 세로 스크롤
│                           │
├───────────────────────────┤
│ [←]  [   OK · 2 / 2   ]   │ ← 하단 고정 액션바 (Back 아이콘 48px + 주 버튼)
└───────────────────────────┘
```

- 좌우 패딩 20px, 질문은 상단 정렬 (수직 중앙 정렬 X)
- 콘텐츠 영역만 스크롤, 헤더·하단 액션바 고정. 콘텐츠 하단에 액션바 높이만큼 여백
- 단일 선택은 하단 바에 주 버튼 없이 Back만 (선택 시 자동 이동)
- 화면 전환 애니메이션 이동 거리 24px → 12px

### 질문 타입별 모바일 규칙

- **single / multi**: 카드 1열 풀폭. 그룹형(Q9, Q11)은 그룹 소제목 아래 1열, 그룹 간 28px
- **Other 입력**: 선택 시 카드 바로 아래에 입력란 펼침 + 자동 포커스, 키보드가 올라와도 입력란이 가려지지 않게 `scrollIntoView({block: "center"})`
- **scale (1~5)**: 5개 버튼이 폭을 균등 분할 (`grid-template-columns: repeat(5, 1fr)`), 높이 52px, 양 끝 라벨은 아래 좌/우 정렬
- **likert**: 매트릭스 대신 문장별 카드. 카드 안에 문장 → 5칸 버튼 행(1~5) → 아래에 "Strongly disagree ← → Strongly agree" 라벨. 한 문장 답하면 다음 카드로 부드럽게 스크롤
- **rank**: 카드 1열, 왼쪽 ①②③ 배지 동일
- **text / longtext**: 풀폭, longtext는 최소 120px 높이에 자동 늘어남
- **review**: 섹션 아코디언 풀폭, "Edit"은 각 행 오른쪽 44px 타겟

### 일정 그리드 (Q19a) 모바일

데스크톱의 7열 그리드는 폰에서 셀이 너무 작아지므로 **요일 탭 + 하루 단위 리스트**로 전환.

```
┌───────────────────────────┐
│ YOU · CHICAGO │ JASON·SEOUL│ ← 듀얼 시계 가로 2분할, 시각 22px
│ 1:34 AM Sat   │ 3:34 PM Sat│
│ Central (Chicago) · Change │
├───────────────────────────┤
│ Mon Tue• Wed Thu• Fri ... │ ← 요일 탭 (가로 스크롤), 선택 있는 요일엔 점
├───────────────────────────┤
│ 7 AM  ┌─────────────────┐ │
│       │ Seoul · 10 PM   │ │ ← 행 높이 48px, 셀 안에 KST 표기
│       └─────────────────┘ │
│ 9 AM  ┌─────────────────┐ │
│       │/// Unavailable ///│ │ ← 진행자 불가 시간: 빗금 + 라벨
│ ...                       │
├───────────────────────────┤
│ [←]   [  OK · 5 slots  ]  │
└───────────────────────────┘
```

- 탭 순서는 월~일, 처음엔 오늘(현지) 요일 선택
- 셀은 탭으로 토글 (드래그 선택은 데스크톱 전용, 모바일에서 비활성 → 스크롤과 충돌 방지)
- 셀 안 텍스트: `Seoul · Wed 10 AM` (날짜가 넘어가면 요일 포함)
- 연속으로 불가한 시간대(예: 9 AM–4 PM)는 행 여러 개 대신 한 덩어리로 접어서 `9 AM – 4 PM · Instructor unavailable` 한 줄로 표시 → 스크롤 길이 절반으로
- 선택 요약 칩과 메모 입력은 리스트 아래에 배치

### Language Select / Welcome / Thank You 모바일

- Language Select: 두 카드 세로로 쌓고 각 풀폭 120px 높이
- Welcome: 제목 36px, 본문 17px, 목차(What we'll cover)는 버튼 아래로 이동
- Thank You: 제목 40px, 상단 1/3 지점 배치

---

## 5. 비주얼 디자인 시스템

### 컨셉

**"Academic editorial"** — 잘 편집된 학술 저널이나 대학 출판물 같은 느낌. 넉넉한 여백, 서체 대비로 위계, 절제된 색.

### 컬러 토큰

```css
:root {
  --bg:           #F7F6F2;  /* 따뜻한 오프화이트 */
  --surface:      #FFFFFF;  /* 카드 배경 */
  --ink:          #1C1C1A;  /* 본문 */
  --ink-muted:    #6B6A65;  /* 보조 텍스트 */
  --line:         #E3E1DA;  /* 테두리 */
  --accent:       #2F5D50;  /* 딥 세이지 그린 */
  --accent-soft:  #E6EEEA;  /* 선택된 카드 배경 */
  --accent-ink:   #FFFFFF;
  --error:        #A33A2E;
}
```

- 다크모드 제외 (`<meta name="color-scheme" content="light">`)
- 텍스트 대비 WCAG AA 이상

### 타이포그래피

| 용도 | EN | KO |
|---|---|---|
| Display / 질문 | Source Serif 4 (Google Fonts) | Noto Serif KR (Google Fonts) |
| UI / 본문 / 옵션 | IBM Plex Sans (Google Fonts) | IBM Plex Sans KR (Google Fonts) |
| 번호 / 메타 / 키 배지 | IBM Plex Mono (Google Fonts) | IBM Plex Mono |

- 같은 Plex 패밀리라 EN↔KO 전환 시 톤이 유지됨
- 모바일 스케일: 질문 26px (KO 24px), 옵션 17px, body 17px, 섹션 번호 120px

- `html[lang="ko"]`일 때 폰트 패밀리 교체
- 한국어 추가 규칙: `word-break: keep-all;`, line-height +0.1, 질문 letter-spacing -0.01em
- 스케일:
  - 섹션 번호: 96px / serif / 400
  - 질문: 32px (좁은 화면 24px) / serif / 500 / line-height 1.25
  - 헬퍼: 16px / sans / `--ink-muted`
  - 옵션: 18px / sans / 450
  - body 기본: 18px (대상 연령대 고려)

### 컴포넌트

**선택 카드**
- 최소 높이 56px, 패딩 16px 20px, radius 10px
- 기본: `--surface` + 1px `--line`
- hover: 테두리 `--ink-muted`, translateY -1px
- 선택: `--accent-soft` 배경 + 1.5px `--accent` 테두리 + 우측 체크 아이콘
- 키 배지: 24×24px, 1px 테두리, monospace 12px, 선택 시 accent 배경 + 흰 글자

**척도 (1~5)**: 가로 5개 정사각 버튼(56px), 아래 양 끝 라벨

**Likert**: 데스크톱은 행=문장, 열=5단계 원형 라디오(24px), 열 헤더는 작은 라벨. 좁은 화면은 문장별 카드 + 5개 pill

**Rank**: 카드 왼쪽 빈 원 → 선택 순서대로 ①②③ (accent 배경)

**그룹 소제목**: 13px, uppercase(EN만), letter-spacing 0.08em, `--ink-muted`, 위 24px 여백 + 얇은 구분선

**버튼**
- Primary: accent 배경, 흰 글자, 높이 48px, radius 8px, 옆에 `enterHint`
- Secondary (Back, Skip): 텍스트 버튼, `--ink-muted`

**진행바**: 상단 고정 2px accent, width 애니메이션 400ms. 우측 상단 `sectionOf` 텍스트

### 접근성

- 전 요소 키보드 접근, `:focus-visible` 2px accent outline + 2px offset
- 선택 카드 `role="radio"`/`"checkbox"` + `aria-checked`
- 질문 전환 시 질문 제목으로 포커스 이동
- 클릭 영역 최소 44×44px

---

## 6. 데이터 & 제출 (Google Sheets 연동 — `apps-script/Code.gs`, `docs/google-sheets-setup.md`)

### 상태 객체

```js
{
  lang: "ko",
  respondentName: "김지현",
  startedAt: "2026-10-03T05:30:00Z",
  submittedAt: "2026-10-03T05:38:12Z",
  durationSec: 492,
  answers: {
    name: "김지현",
    roles: ["teaching", "research"],
    roles_other: "",
    ai_frequency: "monthly",
    coding_experience: "stats_basic",
    interest_areas: ["grant", "paper_summary", "email", "family_materials"],
    top_priorities: ["grant", "paper_summary", "email"],
    learn_build: ["prompting", "website", "personal_tool"],
    build_idea: "...",
    attitudes: { save_time: 4, trust: 3, students: 2, curious: 5 },
    device: "mac_laptop",
    // ...
  },
  userAgent: "..."
}
```

### 제출

- `config.js`의 `SUBMIT_URL`로 `fetch` POST, `Content-Type: text/plain;charset=utf-8`, body = `JSON.stringify({ ...state, token: SUBMIT_TOKEN })` (Apps Script CORS 회피 — `application/json`으로 보내면 preflight에서 막힘)
- 응답은 `{ ok: true }` 또는 `{ ok: false, error }` JSON. `ok`가 아니면 에러 화면으로
- `SUBMIT_URL` 비어 있으면 콘솔에 payload 출력 후 Thank You로 이동 (개발용)
- 제출 중 버튼 스피너, 중복 제출 방지
- 성공 시 `localStorage` 진행 상태 삭제
- 시트 컬럼 구성은 `apps-script/Code.gs`가 자동으로 만듦 (질문 id = 컬럼명, 배열은 쉼표로 연결, likert·availability는 하위 컬럼으로 펼침)

```js
// config.js
window.SURVEY_CONFIG = {
  SUBMIT_URL: "",              // Apps Script 웹 앱 URL (…/exec)
  SUBMIT_TOKEN: "",            // Code.gs의 SHARED_TOKEN과 같은 값
  SCHEDULE_REFERENCE_WEEK: "2026-11-09",
  SCHEDULE_LOCAL_HOURS: { start: 7, end: 22 },
  HOST_TIMEZONE: "Asia/Seoul",
  HOST_AVAILABLE_KST: { start: 8, end: 24 },
  HOST_NAME: "Jason"
};
```

```js
// 제출
const res = await fetch(cfg.SUBMIT_URL, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({ ...state, token: cfg.SUBMIT_TOKEN })
});
const out = await res.json();
if (!out.ok) throw new Error(out.error || "submit failed");
```

---

## 7. 개인화 링크

- `?name=Jane%20Smith` → Q1 미리 채움 + Welcome 제목 개인화
- `?lang=ko` → 언어 선택 건너뛰고 한국어로 시작
- 조합 예: `https://{user}.github.io/ai-survey/?name=김지현&lang=ko`

---

## 8. 완료 기준

- [ ] `questions.js`만 수정해서 질문 추가/삭제/순서 변경 가능
- [ ] 모든 질문 타입(intro, text, longtext, single, multi, groups, scale, likert, rank) 동작
- [ ] Language Select → EN/KO 전체 화면 번역 적용, 상단 토글로 중간 전환 시 답변 유지
- [ ] 응답은 언어와 무관하게 옵션 id로 저장
- [ ] 조건부 건너뛰기 (Q5, Q6, Q10, Q12) 동작, 진행바 반영
- [ ] 일정 그리드: 시간대 자동 감지·변경, 듀얼 시계, 행별 KST 표시(+1d 포함), 진행자 불가 시간 비활성, 드래그 선택, UTC 저장 정상
- [ ] 키보드만으로 처음부터 제출까지 완주 가능
- [ ] 새로고침 후 언어·진행 상태 그대로 이어서 작성
- [ ] 360px · 390px · 768px · 1280px에서 모두 정상, 360px에서도 가로 스크롤 없음
- [ ] iOS Safari / Android Chrome 실기기에서 하단 액션바가 홈 인디케이터·키보드에 가려지지 않음
- [ ] 입력란 포커스 시 iOS 자동 확대 없음 (16px 이상)
- [ ] 터치 기기에서 키 배지·단축키 안내 숨김, 일정 그리드는 요일 탭 리스트로 전환
- [ ] 질문 아래 안내문 없음, 성공 화면은 제목 + "I'll be in touch soon!"만
- [ ] Review에서 수정 후 복귀 동작
- [ ] `SUBMIT_URL` 미설정 시 콘솔 출력, 설정 시 POST
- [ ] GitHub Pages에서 상대경로로 정상 로드
