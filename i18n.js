// UI 문자열 (EN/KO). {key}는 치환, *텍스트*는 강조(accent) 처리
window.SURVEY_I18N = {
  // 공통 (spec §3)
  ok: { en: 'OK', ko: '확인' },
  enterHint: { en: 'press Enter ↵', ko: 'Enter ↵ 누르기' },
  back: { en: 'Back', ko: '이전' },
  skip: { en: 'Skip', ko: '건너뛰기' },
  continue: { en: 'Continue →', ko: '계속 →' },
  sectionOf: { en: 'Section {n} of {total}', ko: '섹션 {n} / {total}' },
  required: { en: 'Please answer to continue.', ko: '계속하려면 응답해 주세요.' },
  maxReached: { en: "You've selected the maximum.", ko: '최대 개수를 선택하셨어요.' },
  other: { en: 'Other', ko: '기타' },
  otherPlaceholder: { en: 'Please specify', ko: '직접 입력해 주세요' },
  submitting: { en: 'Submitting…', ko: '제출 중…' },
  backToReview: { en: 'Back to review', ko: '확인 화면으로' },

  // 헤더
  brandSub: { en: 'Pre-session survey', ko: '사전 설문' },
  complete: { en: 'Complete', ko: '완료' },

  // 언어 선택 (두 언어 동시 표기)
  langTitle: { en: 'Choose your language', ko: '언어를 선택해 주세요' },
  langNote: { en: 'You can switch anytime', ko: '언제든 바꿀 수 있어요' },
  langCta: { en: 'Continue in English', ko: '한국어로 진행하기' },
  langTerm: 'FALL 2026',
  langPress: 'PRESS E OR K',

  // Welcome
  welcomeEyebrow: { en: 'Welcome', ko: '환영합니다' },
  welcomeTitle: { en: "Let's design your AI workshop *together.*", ko: '함께 AI 워크숍을 *설계해 봐요*' },
  welcomeTitleNamed: { en: "Hi {firstName} — let's design your AI workshop *together.*", ko: '{name} 교수님, 함께 AI 워크숍을 *설계해 봐요*' },
  welcomeBody: {
    en: "Before our sessions, I'd love to learn a bit about you — how you work, what you're curious about, and what concerns you. There are no right or wrong answers, and no experience is required.",
    ko: '워크숍에 앞서 교수님의 업무 방식, 궁금한 점, 우려되는 점을 미리 알고 싶습니다. 정답은 없으며, AI 경험이 전혀 없으셔도 괜찮습니다.'
  },
  welcomeTime: { en: 'About 9 minutes', ko: '약 9분 소요' },
  welcomeSaved: { en: 'Your progress is saved automatically', ko: '진행 상황은 자동 저장됩니다' },
  start: { en: 'Get started →', ko: '시작하기 →' },
  cover: { en: "What we'll cover", ko: '다룰 내용' },

  // 섹션 인트로
  introMeta: { en: '{n} QUESTIONS · ABOUT {m} MIN', ko: '{n}문항 · 약 {m}분' },
  introMetaOne: { en: '1 QUESTION · ABOUT {m} MIN', ko: '1문항 · 약 {m}분' },

  // 하단 키보드 안내
  hintSelect: { en: '{range} select', ko: '{range} 선택' },
  hintNumbers: { en: '1–5 select', ko: '1–5 선택' },
  hintRows: { en: 'Tab between rows · 1–5 to answer', ko: 'Tab 행 이동 · 1–5 응답' },
  hintNewline: { en: 'Shift+Enter new line', ko: 'Shift+Enter 줄바꿈' },
  hintArrows: { en: 'Arrows move · Space selects', ko: '방향키 이동 · Space 선택' },
  hintEnter: { en: 'Enter continue', ko: 'Enter 계속' },
  hintEsc: { en: 'Esc back', ko: 'Esc 이전' },

  // 카운터
  selectedN: { en: '{n} selected', ko: '{n}개 선택됨' },
  answeredN: { en: '{n} of {total} answered', ko: '{total}개 중 {n}개 응답' },

  // 일정 (Q19a)
  you: { en: 'You', ko: '나' },
  hostCity: { en: 'Seoul', ko: '서울' },
  tzYour: { en: 'Your time zone', ko: '내 시간대' },
  tzChange: { en: 'Change', ko: '변경' },
  tzOther: { en: 'Other…', ko: '기타…' },
  tzSearch: { en: 'Search time zones', ko: '시간대 검색' },
  aheadOf: { en: 'Seoul is {n} hours ahead of you', ko: '서울이 {n}시간 빠릅니다' },
  behindOf: { en: 'Seoul is {n} hours behind you', ko: '서울이 {n}시간 느립니다' },
  sameAs: { en: 'Same time as Seoul', ko: '서울과 같은 시간입니다' },
  cellTip: { en: '{local} your time → {kst} in Seoul', ko: '{local} (현지) → {kst} (서울)' },
  cellOff: { en: "Outside the instructor's available hours", ko: '진행자 가능 시간 외' },
  slotsSelected: { en: '{n} time slots selected', ko: '{n}개 시간대 선택됨' },
  slotsShort: { en: '{n} slots', ko: '{n}개' },
  legendFree: { en: 'Available to pick', ko: '선택 가능' },
  legendOn: { en: 'Selected', ko: '선택됨' },
  legendOff: { en: "Outside instructor's hours", ko: '진행자 가능 시간 외' },
  unavailable: { en: 'Instructor unavailable', ko: '진행자 불가' },
  schedNote: { en: 'Any other scheduling notes? (optional)', ko: '일정 관련 참고사항 (선택)' },
  schedNotePh: { en: 'e.g., Not available Nov 20–30', ko: '예: 11월 20~30일은 어려워요' },
  removeSlot: { en: 'Remove time slot', ko: '시간대 삭제' },
  days: { en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], ko: ['월', '화', '수', '목', '금', '토', '일'] },
  weeklyGrid: { en: 'Weekly availability', ko: '주간 가능 시간' },

  // Review
  reviewEyebrow: { en: 'Review', ko: '확인' },
  reviewTitle: { en: 'Review your answers', ko: '응답 확인' },
  reviewSub: { en: 'Take a quick look before submitting.', ko: '제출 전에 한 번 확인해 주세요.' },
  edit: { en: 'Edit', ko: '수정' },
  submit: { en: 'Submit responses', ko: '제출하기' },
  noAnswer: { en: '—', ko: '—' },

  // Thank you / 에러
  thanksTitle: { en: 'Thank you, *{firstName}*.', ko: '감사합니다, *{name} 교수님*.' },
  thanksTitleNoName: { en: 'Thank you.', ko: '감사합니다.' },
  thanksBody: { en: "I'll be in touch soon!", ko: '곧 연락드릴게요!' },
  errorTitle: { en: 'Something went wrong.', ko: '제출 중 문제가 발생했어요.' },
  retry: { en: 'Try again', ko: '다시 시도' },
  download: { en: 'Download my responses', ko: '내 응답 다운로드' }
};

// 일정 질문의 시간대 선택 목록
window.SURVEY_TIMEZONES = [
  { tz: 'America/New_York', en: 'Eastern (New York)', ko: '미국 동부 (뉴욕)', city: { en: 'New York', ko: '뉴욕' } },
  { tz: 'America/Chicago', en: 'Central (Chicago)', ko: '미국 중부 (시카고)', city: { en: 'Chicago', ko: '시카고' } },
  { tz: 'America/Denver', en: 'Mountain (Denver)', ko: '미국 산악 (덴버)', city: { en: 'Denver', ko: '덴버' } },
  { tz: 'America/Phoenix', en: 'Arizona (Phoenix)', ko: '애리조나 (피닉스)', city: { en: 'Phoenix', ko: '피닉스' } },
  { tz: 'America/Los_Angeles', en: 'Pacific (Los Angeles)', ko: '미국 서부 (로스앤젤레스)', city: { en: 'Los Angeles', ko: '로스앤젤레스' } },
  { tz: 'America/Anchorage', en: 'Alaska (Anchorage)', ko: '알래스카 (앵커리지)', city: { en: 'Anchorage', ko: '앵커리지' } },
  { tz: 'Pacific/Honolulu', en: 'Hawaii (Honolulu)', ko: '하와이 (호놀룰루)', city: { en: 'Honolulu', ko: '호놀룰루' } },
  { tz: 'Asia/Seoul', en: 'Korea (Seoul)', ko: '한국 (서울)', city: { en: 'Seoul', ko: '서울' } }
];
