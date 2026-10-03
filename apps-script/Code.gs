/**
 * AI Workshop Survey — response collector
 *
 * Google Sheet에 붙어 있는(container-bound) Apps Script로 사용.
 * 설치 방법: docs/google-sheets-setup.md
 *
 * - 서베이 페이지가 text/plain으로 JSON을 POST하면 Responses 시트에 한 줄 추가
 * - 컬럼은 응답 데이터 키를 보고 자동 생성/확장 (질문을 추가해도 코드 수정 불필요)
 * - 같은 사람이 여러 번 제출하면 여러 줄로 쌓임 (최신 줄 기준으로 보면 됨)
 */

const SHEET_NAME = 'Responses';

// config.js의 SUBMIT_TOKEN과 같은 값으로 바꿀 것.
// 프론트엔드 코드에 노출되는 값이라 보안 장치는 아니고, 아무나 URL로 쓰레기 데이터를 보내는 걸 막는 정도.
const SHARED_TOKEN = 'CHANGE_ME';

// 새 응답이 들어올 때 알림 받을 이메일. 비워두면 알림 없음.
const NOTIFY_EMAIL = '';

// 항상 앞쪽에 고정될 컬럼 순서
const LEADING_COLUMNS = ['submittedAt', 'name', 'lang', 'durationSec'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_({ ok: false, error: 'empty body' });
    }
    const data = JSON.parse(e.postData.contents);

    if (SHARED_TOKEN && data.token !== SHARED_TOKEN) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    delete data.token;

    const row = flatten_(data);
    const sheet = getSheet_();
    const headers = ensureHeaders_(sheet, Object.keys(row));
    sheet.appendRow(headers.map(function (h) {
      return row.hasOwnProperty(h) ? sanitize_(row[h]) : '';
    }));

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        '[AI Workshop Survey] ' + (row.name || 'New response'),
        'New response from ' + (row.name || '(no name)') + ' (' + (row.lang || '?') + ').\n\n' +
          SpreadsheetApp.getActiveSpreadsheet().getUrl()
      );
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 브라우저에서 /exec URL을 열었을 때 동작 확인용
function doGet() {
  return json_({ ok: true, status: 'ready' });
}

/** 중첩된 응답 객체를 시트 한 줄용 평면 객체로 변환 */
function flatten_(d) {
  const a = d.answers || {};
  const out = {
    submittedAt: d.submittedAt || new Date().toISOString(),
    name: a.name || d.respondentName || '',
    lang: d.lang || '',
    durationSec: d.durationSec || '',
    startedAt: d.startedAt || ''
  };

  Object.keys(a).forEach(function (k) {
    const v = a[k];
    if (k === 'name') return;

    if (k === 'availability' && v && typeof v === 'object') {
      const slots = v.slots || [];
      out.availability_timezone = v.timeZone || '';
      out.availability_reference_week = v.referenceWeek || '';
      out.availability_local = slots.map(function (s) { return s.local; }).join(', ');
      out.availability_kst = slots.map(function (s) { return s.kst; }).join(', ');
      out.availability_utc = slots.map(function (s) { return s.utc; }).join(', ');
      out.availability_note = v.note || '';
    } else if (Array.isArray(v)) {
      out[k] = v.join(', ');
    } else if (v && typeof v === 'object') {
      // likert 등: attitudes → attitudes_save_time, attitudes_trust ...
      Object.keys(v).forEach(function (sub) { out[k + '_' + sub] = v[sub]; });
    } else {
      out[k] = v === undefined || v === null ? '' : v;
    }
  });

  out.userAgent = d.userAgent || '';
  out.raw_json = JSON.stringify(d);
  return out;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

/** 1행 헤더를 읽고, 없는 키가 있으면 오른쪽에 컬럼 추가 */
function ensureHeaders_(sheet, keys) {
  const lastCol = sheet.getLastColumn();
  let headers = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].filter(String)
    : [];

  if (headers.length === 0) {
    const ordered = LEADING_COLUMNS.filter(function (k) { return keys.indexOf(k) >= 0; })
      .concat(keys.filter(function (k) { return LEADING_COLUMNS.indexOf(k) < 0; }));
    sheet.getRange(1, 1, 1, ordered.length).setValues([ordered]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return ordered;
  }

  const missing = keys.filter(function (k) { return headers.indexOf(k) < 0; });
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    headers = headers.concat(missing);
  }
  return headers;
}

/** 자유 입력값이 =, +, -, @ 로 시작하면 수식으로 실행되지 않게 막기 */
function sanitize_(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 에디터에서 직접 실행해서 시트에 테스트 줄이 들어가는지 확인 (실행 → testInsert) */
function testInsert() {
  const sample = {
    token: SHARED_TOKEN,
    lang: 'en',
    respondentName: 'Test Person',
    startedAt: new Date(Date.now() - 480000).toISOString(),
    submittedAt: new Date().toISOString(),
    durationSec: 480,
    answers: {
      name: 'Test Person',
      roles: ['teaching', 'research'],
      ai_frequency: 'monthly',
      attitudes: { save_time: 4, trust: 3, students: 2, curious: 5 },
      availability: {
        timeZone: 'America/Chicago',
        referenceWeek: '2026-11-09',
        slots: [{ local: 'Tue 19:00', kst: 'Wed 10:00', utc: '2026-11-11T01:00:00Z' }],
        note: ''
      },
      wish_task: '=this should stay as text'
    },
    userAgent: 'testInsert'
  };
  const res = doPost({ postData: { contents: JSON.stringify(sample) } });
  Logger.log(res.getContent());
}
