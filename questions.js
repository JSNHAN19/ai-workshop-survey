// 질문 정의 (데이터만). 이 배열만 수정하면 추가/삭제/순서 변경이 반영됨.
// - intro: 섹션 시작. 다음 intro 전까지의 질문이 이 섹션에 속함
// - 옵션: { id, en, ko }. 응답은 항상 id로 저장
// - showIf(answers): false면 건너뜀 (진행바·번호 계산에서도 제외)
// - dependsOn: showIf가 참조하는 질문 id (그 질문 응답 전에는 번호·진행바에 포함해 둠)
// - exclusive: 이 옵션을 고르면 나머지 해제 (반대도 마찬가지)
window.SURVEY_QUESTIONS = (function () {
  var BUILD_IDS = ['website', 'personal_tool', 'survey_tool', 'interactive_materials', 'dashboard', 'automation'];
  var count = function (v) { return Array.isArray(v) ? v.length : 0; };

  return [
    // ── Section 1 ─────────────────────────────────────────
    {
      type: 'intro', section: 1,
      title: { en: 'About you', ko: '교수님에 대해' },
      short: { en: 'About you', ko: '교수님에 대해' }
    },
    {
      id: 'name', type: 'text', required: true,
      title: { en: "What's your name?", ko: '성함을 알려주세요.' },
      placeholder: { en: 'e.g., Dr. Jane Smith', ko: '예: 김지현' }
    },
    {
      id: 'roles', type: 'multi', required: true, allowOther: true,
      title: { en: 'Which parts of your work take up most of your time?', ko: '업무 중 가장 많은 시간을 쓰시는 분야는 무엇인가요?' },
      options: [
        { id: 'teaching', en: 'Teaching', ko: '강의' },
        { id: 'research', en: 'Research', ko: '연구' },
        { id: 'advising', en: 'Advising & mentoring students', ko: '학생 지도 및 멘토링' },
        { id: 'outreach', en: 'Clinical or community outreach', ko: '임상 또는 지역사회 활동' },
        { id: 'admin', en: 'Administrative / committee work', ko: '행정·위원회 업무' },
        { id: 'grants', en: 'Grant writing', ko: '연구비 제안서 작성' }
      ]
    },
    {
      id: 'research_area', type: 'text', required: false,
      title: { en: "In a few words, what's your area of research or expertise?", ko: '연구 분야나 전문 분야를 간단히 알려주세요.' },
      placeholder: { en: 'e.g., early childhood development, family resilience', ko: '예: 영유아 발달, 가족 회복탄력성' }
    },

    // ── Section 2 ─────────────────────────────────────────
    {
      type: 'intro', section: 2,
      title: { en: 'Your experience with AI', ko: 'AI 사용 경험' },
      short: { en: 'Experience', ko: 'AI 경험' }
    },
    {
      id: 'ai_frequency', type: 'single', required: true,
      title: { en: 'How often do you currently use AI tools like ChatGPT?', ko: 'ChatGPT 같은 AI 도구를 얼마나 자주 사용하시나요?' },
      options: [
        { id: 'never', en: "I've never used one", ko: '한 번도 사용해 본 적 없어요' },
        { id: 'tried', en: "I've tried it once or twice", ko: '한두 번 써봤어요' },
        { id: 'monthly', en: 'Occasionally — a few times a month', ko: '가끔 — 한 달에 몇 번' },
        { id: 'weekly', en: 'Regularly — every week', ko: '꾸준히 — 매주' },
        { id: 'daily', en: 'Almost every day', ko: '거의 매일' }
      ]
    },
    {
      id: 'tools_used', type: 'multi', required: false, allowOther: true,
      dependsOn: 'ai_frequency',
      showIf: function (a) { return a.ai_frequency !== 'never'; },
      title: { en: 'Which of these have you used, even briefly?', ko: '잠깐이라도 사용해 보신 도구를 모두 골라주세요.' },
      options: [
        { id: 'chatgpt', en: 'ChatGPT', ko: 'ChatGPT' },
        { id: 'claude', en: 'Claude', ko: 'Claude' },
        { id: 'gemini', en: 'Google Gemini', ko: 'Google Gemini' },
        { id: 'copilot', en: 'Microsoft Copilot', ko: 'Microsoft Copilot' },
        { id: 'grammarly', en: 'Grammarly (AI features)', ko: 'Grammarly (AI 기능)' },
        { id: 'perplexity', en: 'Perplexity', ko: 'Perplexity' },
        { id: 'notebooklm', en: 'NotebookLM', ko: 'NotebookLM' },
        { id: 'none', en: 'None of these', ko: '사용해 본 것 없음', exclusive: true }
      ]
    },
    {
      id: 'paid_accounts', type: 'multi', required: false, allowOther: true,
      title: { en: 'Do you have access to any paid or university-provided AI accounts?', ko: '유료 AI 계정이나 학교에서 제공하는 AI 계정이 있으신가요?' },
      options: [
        { id: 'chatgpt_paid', en: 'ChatGPT Plus, Team, or Edu', ko: 'ChatGPT Plus, Team 또는 Edu' },
        { id: 'claude_paid', en: 'Claude Pro or Team', ko: 'Claude Pro 또는 Team' },
        { id: 'gemini_paid', en: 'Google Gemini (paid, or through Google Workspace)', ko: 'Google Gemini (유료 또는 Google Workspace 포함)' },
        { id: 'copilot_m365', en: "Microsoft Copilot through my university's Microsoft 365", ko: '학교 Microsoft 365 계정의 Copilot' },
        { id: 'university_other', en: 'Another AI tool provided by my university', ko: '학교에서 제공하는 기타 AI 도구' },
        { id: 'none', en: 'None — I only use free versions', ko: '없음 — 무료 버전만 사용해요', exclusive: true },
        { id: 'not_sure', en: 'Not sure', ko: '잘 모르겠어요', exclusive: true }
      ]
    },
    {
      id: 'past_uses', type: 'multi', required: false, allowOther: true,
      dependsOn: 'ai_frequency',
      showIf: function (a) { return a.ai_frequency !== 'never'; },
      title: { en: 'What have you used AI for so far?', ko: '지금까지 AI를 어디에 사용해 보셨나요?' },
      options: [
        { id: 'email', en: 'Writing or editing emails', ko: '이메일 작성·수정' },
        { id: 'summarize', en: 'Summarizing articles or papers', ko: '기사·논문 요약' },
        { id: 'brainstorm', en: 'Brainstorming ideas', ko: '아이디어 브레인스토밍' },
        { id: 'teaching_materials', en: 'Creating teaching materials', ko: '강의 자료 제작' },
        { id: 'search', en: 'Searching for information', ko: '정보 검색' },
        { id: 'translation', en: 'Translation', ko: '번역' },
        { id: 'exploring', en: 'Just exploring out of curiosity', ko: '호기심에 이것저것 시도' }
      ]
    },
    {
      id: 'comfort', type: 'scale', required: true,
      title: { en: 'How comfortable do you feel using AI tools today?', ko: '현재 AI 도구를 사용하는 것이 얼마나 편하신가요?' },
      min: 1, max: 5,
      minLabel: { en: 'Not at all comfortable', ko: '전혀 편하지 않음' },
      maxLabel: { en: 'Very comfortable', ko: '매우 편함' }
    },
    {
      id: 'coding_experience', type: 'single', required: true,
      title: { en: 'Have you ever written code or used a programming tool?', ko: '코드를 작성하거나 프로그래밍 도구를 써보신 적이 있나요?' },
      options: [
        { id: 'none', en: 'Never', ko: '전혀 없어요' },
        { id: 'stats_basic', en: 'A little — statistical software (R, SPSS, Stata)', ko: '조금 — 통계 프로그램 (R, SPSS, Stata)' },
        { id: 'web_basic', en: 'A little — basic websites or HTML', ko: '조금 — 간단한 웹사이트나 HTML' },
        { id: 'comfortable', en: "I'm comfortable with R, Python, or similar", ko: 'R, Python 등에 익숙해요' }
      ]
    },

    // ── Section 3 ─────────────────────────────────────────
    {
      type: 'intro', section: 3,
      title: { en: 'Where AI could help', ko: 'AI가 도울 수 있는 일' },
      short: { en: 'Where AI helps', ko: 'AI 활용 분야' }
    },
    {
      id: 'interest_areas', type: 'multi', required: true, allowOther: true,
      title: { en: 'Which of these tasks would you most like help with?', ko: '어떤 업무에서 도움을 받고 싶으신가요?' },
      groups: [
        {
          en: 'Teaching', ko: '강의',
          options: [
            { id: 'syllabus', en: 'Designing syllabi or course outlines', ko: '강의계획서·커리큘럼 설계' },
            { id: 'slides', en: 'Creating lecture slides and materials', ko: '강의 슬라이드·자료 제작' },
            { id: 'quiz', en: 'Writing quiz or exam questions', ko: '퀴즈·시험 문제 출제' },
            { id: 'feedback', en: 'Giving feedback on student work', ko: '학생 과제 피드백' },
            { id: 'activities', en: 'Developing case studies or class activities', ko: '사례 연구·수업 활동 개발' }
          ]
        },
        {
          en: 'Research', ko: '연구',
          options: [
            { id: 'lit_review', en: 'Finding and reviewing literature', ko: '문헌 검색 및 검토' },
            { id: 'paper_summary', en: 'Summarizing papers', ko: '논문 요약' },
            { id: 'qual', en: 'Analyzing qualitative data (interviews, open-ended responses)', ko: '질적 자료 분석 (인터뷰, 개방형 응답)' },
            { id: 'quant', en: 'Analyzing quantitative data', ko: '양적 자료 분석' },
            { id: 'manuscript', en: 'Writing and editing manuscripts', ko: '논문 작성·교정' },
            { id: 'grant', en: 'Writing grant proposals', ko: '연구비 제안서 작성' }
          ]
        },
        {
          en: 'Admin & Communication', ko: '행정·커뮤니케이션',
          options: [
            { id: 'email', en: 'Drafting emails', ko: '이메일 초안 작성' },
            { id: 'notes', en: 'Meeting notes and summaries', ko: '회의록·요약 정리' },
            { id: 'reports', en: 'Writing reports', ko: '보고서 작성' },
            { id: 'presentations', en: 'Preparing presentations', ko: '발표 자료 준비' }
          ]
        },
        {
          en: 'Community & Outreach', ko: '지역사회·아웃리치',
          options: [
            { id: 'family_materials', en: 'Creating materials for parents and families', ko: '부모·가족 대상 자료 제작' },
            { id: 'translate', en: 'Translating materials into other languages', ko: '자료 번역' },
            { id: 'public', en: 'Simplifying research for the public', ko: '연구 내용을 대중에게 쉽게 전달' }
          ]
        }
      ]
    },
    {
      id: 'top_priorities', type: 'rank', required: true,
      source: 'interest_areas', max: 3,
      dependsOn: 'interest_areas',
      showIf: function (a) { return count(a.interest_areas) > 3; },
      title: { en: 'Of the tasks you selected, which 3 matter most to you right now?', ko: '선택하신 업무 중 지금 가장 중요한 3가지는 무엇인가요?' }
    },

    // ── Section 4 ─────────────────────────────────────────
    {
      type: 'intro', section: 4,
      title: { en: "What you'd like to learn & build", ko: '배우고 만들어보고 싶은 것' },
      short: { en: 'Learn & build', ko: '배우고 만들기' }
    },
    {
      id: 'learn_build', type: 'multi', required: true, allowOther: true,
      title: { en: 'Which of these would you like to learn?', ko: '어떤 것을 배워보고 싶으신가요?' },
      groups: [
        {
          en: 'Using AI Better', ko: 'AI 더 잘 쓰기',
          options: [
            { id: 'prompting', en: 'Asking AI better questions (prompting)', ko: 'AI에게 더 잘 질문하는 법 (프롬프트 작성)' },
            { id: 'reading_assistant', en: 'Using AI to read and analyze PDFs and papers', ko: 'AI로 PDF·논문 읽고 분석하기' },
            { id: 'custom_assistant', en: 'Setting up a custom AI assistant for a specific task (e.g., a "grant reviewer")', ko: '특정 업무 전용 AI 조수 만들기 (예: "연구비 제안서 검토 도우미")' },
            { id: 'fact_check', en: 'Checking AI outputs for accuracy', ko: 'AI 결과물의 정확성 검증하기' }
          ]
        },
        {
          en: 'Building with AI', ko: 'AI로 직접 만들기',
          options: [
            { id: 'website', en: 'Building a website (personal, lab, or course page)', ko: '웹사이트 만들기 (개인·연구실·강의 페이지)' },
            { id: 'personal_tool', en: 'Building a personal management tool (e.g., schedule, reading list, student tracker)', ko: '나만의 관리 도구 만들기 (예: 일정, 읽을 논문 목록, 학생 관리)' },
            { id: 'survey_tool', en: 'Building surveys or forms like this one', ko: '이런 설문지나 신청 폼 만들기' },
            { id: 'interactive_materials', en: 'Creating interactive teaching materials (quizzes, games, simulations)', ko: '인터랙티브 수업 자료 만들기 (퀴즈, 게임, 시뮬레이션)' },
            { id: 'dashboard', en: 'Turning data into charts and dashboards', ko: '데이터를 차트·대시보드로 시각화하기' },
            { id: 'automation', en: 'Automating repetitive tasks (e.g., sorting emails, organizing files)', ko: '반복 업무 자동화하기 (예: 이메일 분류, 파일 정리)' }
          ]
        },
        {
          en: 'Creating Content', ko: '콘텐츠 제작',
          options: [
            { id: 'visuals', en: 'Making slides, infographics, or visuals', ko: '슬라이드·인포그래픽·이미지 만들기' },
            { id: 'video_audio', en: 'Creating short videos or audio (e.g., lecture summaries)', ko: '짧은 영상·오디오 만들기 (예: 강의 요약)' }
          ]
        }
      ]
    },
    {
      id: 'build_idea', type: 'longtext', required: false,
      dependsOn: 'learn_build',
      showIf: function (a) {
        return (a.learn_build || []).some(function (id) { return BUILD_IDS.indexOf(id) >= 0; });
      },
      title: { en: "Is there a tool or website you've always wished existed for your work?", ko: '업무를 하면서 "이런 게 있었으면 좋겠다" 싶었던 도구나 웹사이트가 있나요?' },
      placeholder: { en: "e.g., a page where families can easily find our program's resources", ko: '예: 부모님들이 프로그램 자료를 쉽게 찾을 수 있는 페이지' }
    },

    // ── Section 5 ─────────────────────────────────────────
    {
      type: 'intro', section: 5,
      title: { en: 'Thoughts & concerns', ko: '생각과 우려' },
      short: { en: 'Concerns', ko: '생각과 우려' }
    },
    {
      id: 'concerns', type: 'multi', required: false, allowOther: true,
      title: { en: 'What concerns, if any, do you have about using AI?', ko: 'AI 사용에 대해 우려되는 점이 있으신가요?' },
      options: [
        { id: 'accuracy', en: 'Accuracy — AI making things up', ko: '정확성 — AI가 사실이 아닌 내용을 만들어냄' },
        { id: 'privacy', en: 'Privacy of student or research participant data', ko: '학생·연구 참여자 데이터 보호' },
        { id: 'integrity', en: 'Academic integrity and student misuse', ko: '학문적 진실성 및 학생들의 부정 사용' },
        { id: 'bias', en: 'Bias in AI outputs', ko: 'AI 결과물의 편향' },
        { id: 'deskilling', en: 'Losing my own skills over time', ko: '나 자신의 역량 저하' },
        { id: 'where_to_start', en: 'Not knowing where to start', ko: '어디서부터 시작해야 할지 모름' },
        { id: 'time', en: 'Not having enough time to learn', ko: '배울 시간이 부족함' },
        { id: 'irb', en: 'Ethical or IRB considerations', ko: '연구 윤리·IRB 관련 문제' }
      ]
    },
    {
      id: 'attitudes', type: 'likert', required: true,
      title: { en: 'How much do you agree with each statement?', ko: '각 문장에 얼마나 동의하시나요?' },
      scale: [
        { en: 'Strongly disagree', ko: '전혀 그렇지 않다' },
        { en: 'Disagree', ko: '그렇지 않다' },
        { en: 'Neutral', ko: '보통이다' },
        { en: 'Agree', ko: '그렇다' },
        { en: 'Strongly agree', ko: '매우 그렇다' }
      ],
      statements: [
        { id: 'save_time', en: 'AI could save me meaningful time in my work.', ko: 'AI가 업무 시간을 의미 있게 줄여줄 수 있을 것 같다.' },
        { id: 'trust', en: 'I would trust AI-generated content after reviewing it.', ko: '검토를 거친다면 AI가 만든 결과물을 신뢰할 수 있다.' },
        { id: 'students', en: 'I feel prepared to talk with students about AI use.', ko: '학생들과 AI 사용에 대해 이야기할 준비가 되어 있다.' },
        { id: 'curious', en: "I'm curious to learn more about AI.", ko: 'AI에 대해 더 배우고 싶다.' }
      ]
    },
    {
      id: 'sensitive_data', type: 'single', required: true,
      title: { en: 'Does your work involve sensitive data — for example, information about children, families, or research participants?', ko: '아동, 가족, 연구 참여자 정보처럼 민감한 데이터를 업무에서 다루시나요?' },
      options: [
        { id: 'frequently', en: 'Yes, frequently', ko: '네, 자주 다뤄요' },
        { id: 'sometimes', en: 'Sometimes', ko: '가끔 다뤄요' },
        { id: 'rarely', en: 'Rarely or never', ko: '거의 없어요' },
        { id: 'not_sure', en: 'Not sure', ko: '잘 모르겠어요' }
      ]
    },
    {
      id: 'policy_awareness', type: 'single', required: false,
      title: { en: 'Does your university or department have guidelines on AI use?', ko: '소속 대학이나 학과에 AI 사용 가이드라인이 있나요?' },
      options: [
        { id: 'familiar', en: "Yes, and I'm familiar with them", ko: '있고, 내용도 알고 있어요' },
        { id: 'not_read', en: "Yes, but I haven't read them closely", ko: '있지만 자세히 읽어보진 않았어요' },
        { id: 'no', en: 'No, not that I know of', ko: '제가 알기로는 없어요' },
        { id: 'not_sure', en: "I'm not sure", ko: '잘 모르겠어요' }
      ]
    },

    // ── Section 6 ─────────────────────────────────────────
    {
      type: 'intro', section: 6,
      title: { en: 'How you like to learn', ko: '학습 방식' },
      short: { en: 'Learning style', ko: '학습 방식' }
    },
    {
      id: 'formats', type: 'multi', required: true, max: 2,
      title: { en: 'Which learning formats work best for you?', ko: '어떤 학습 방식이 가장 잘 맞으세요?' },
      options: [
        { id: 'live_handson', en: 'Live, hands-on practice together', ko: '함께 실시간으로 직접 실습하기' },
        { id: 'demo', en: 'Watching a demonstration first', ko: '먼저 시연 보기' },
        { id: 'recorded', en: 'Short recorded videos I can revisit', ko: '다시 볼 수 있는 짧은 녹화 영상' },
        { id: 'one_on_one', en: 'One-on-one guidance', ko: '1:1 맞춤 지도' },
        { id: 'written_guide', en: 'A written step-by-step guide', ko: '단계별 문서 가이드' }
      ]
    },
    {
      id: 'depth', type: 'single', required: true,
      title: { en: 'Which pace sounds right for you?', ko: '어떤 속도가 적당할까요?' },
      options: [
        {
          id: 'basics', en: 'Start from the very basics', ko: '완전 기초부터',
          desc: { en: 'What AI is, how to sign up, how to ask good questions.', ko: 'AI가 무엇인지, 가입하는 법, 좋은 질문을 하는 법' }
        },
        {
          id: 'practical', en: 'Practical and focused', ko: '실전 위주로',
          desc: { en: 'Skip the theory and show me how to use it in my work.', ko: '이론은 건너뛰고 업무에 바로 쓰는 법' }
        },
        {
          id: 'deeper', en: 'Go deeper', ko: '깊이 있게',
          desc: { en: 'Advanced techniques, workflows, and how it actually works.', ko: '고급 활용법, 업무 흐름 설계, 작동 원리까지' }
        }
      ]
    },
    {
      id: 'device', type: 'single', required: true,
      title: { en: 'Which computer will you use during our Zoom sessions?', ko: 'Zoom 세션에서 어떤 컴퓨터를 사용하실 예정인가요?' },
      options: [
        { id: 'mac_laptop', en: 'Mac laptop (MacBook)', ko: '맥 노트북 (맥북)' },
        { id: 'windows_laptop', en: 'Windows laptop', ko: '윈도우 노트북' },
        { id: 'mac_desktop', en: 'Mac desktop (iMac, Mac mini)', ko: '맥 데스크톱 (아이맥, 맥 미니)' },
        { id: 'windows_desktop', en: 'Windows desktop', ko: '윈도우 데스크톱' },
        { id: 'not_sure', en: 'Not sure yet', ko: '아직 모르겠어요' }
      ]
    },
    {
      id: 'availability', type: 'schedule', required: true,
      title: { en: 'When are you generally available for a 60–90 minute Zoom session?', ko: '60~90분 Zoom 세션이 가능한 시간대를 모두 선택해 주세요.' }
    },

    // ── Section 7 ─────────────────────────────────────────
    {
      type: 'intro', section: 7,
      title: { en: 'Final thoughts', ko: '마무리' },
      short: { en: 'Final thoughts', ko: '마무리' }
    },
    {
      id: 'current_project', type: 'longtext', required: false,
      title: { en: 'Are you working on a paper, course, or project right now that we could use as a practice example?', ko: '지금 진행 중인 논문, 수업, 프로젝트 중에 실습 예제로 활용해 볼 만한 것이 있나요?' },
      placeholder: { en: 'e.g., revising my fall syllabus; drafting a grant proposal', ko: '예: 가을 학기 강의계획서 수정, 연구비 제안서 초안 작성' }
    },
    {
      id: 'wish_task', type: 'longtext', required: false,
      title: { en: 'If AI could take one task off your plate this week, what would it be?', ko: '이번 주 업무 중 딱 하나를 AI에게 맡길 수 있다면, 무엇을 맡기고 싶으세요?' },
      placeholder: { en: 'Be as specific as you like — real examples help me design better exercises.', ko: '구체적일수록 좋아요. 실제 사례가 있으면 더 좋은 실습을 준비할 수 있어요.' }
    },
    {
      id: 'anything_else', type: 'longtext', required: false,
      title: { en: "Anything else you'd like me to know?", ko: '그 밖에 전하고 싶은 말씀이 있으신가요?' },
      placeholder: { en: 'Questions, hopes, hesitations…', ko: '궁금한 점, 기대, 망설여지는 점 등…' }
    }
  ];
})();
