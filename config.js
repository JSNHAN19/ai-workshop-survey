// 설정값. 배포 전 SUBMIT_URL / SUBMIT_TOKEN만 채우면 됨 (docs/google-sheets-setup.md 참고)
window.SURVEY_CONFIG = {
  SUBMIT_URL: "https://script.google.com/macros/s/AKfycbzB1qpIWLtnPz4ZSEE3lbIOq4UMtrTiVCjV3LlwCLMjGY4F-p8p1XbEgPzJ9ggjCxMJ/exec", // Apps Script 웹 앱 URL (…/exec). 비어 있으면 콘솔에 payload만 출력
  SUBMIT_TOKEN: "ws-7f3k9q2m",            // Code.gs의 SHARED_TOKEN과 같은 값
  SCHEDULE_REFERENCE_WEEK: "2026-11-09",        // 워크숍 예정 주의 월요일 (시간 변환 기준, DST 대응)
  SCHEDULE_LOCAL_HOURS: { start: 7, end: 22 },  // 응답자 현지 기준 행: start시 ~ end시 시작 슬롯
  HOST_TIMEZONE: "Asia/Seoul",
  HOST_AVAILABLE_KST: { start: 8, end: 24 },    // 진행자 가능 시간 (KST, end는 미포함)
  HOST_NAME: "Jason"
};
