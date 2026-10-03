// AI Workshop Survey — 화면 전환, 상태, 렌더링, 키보드, 언어 전환, 저장, 제출
(function () {
  'use strict';

  var CFG = window.SURVEY_CONFIG || {};
  var STEPS = window.SURVEY_QUESTIONS || [];
  var STR = window.SURVEY_I18N || {};
  var TZS = window.SURVEY_TIMEZONES || [];

  var STORE_KEY = 'ai-workshop-survey:v1';
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var HOST_TZ = CFG.HOST_TIMEZONE || 'Asia/Seoul';
  var REF_WEEK = CFG.SCHEDULE_REFERENCE_WEEK || '2026-11-09';
  var SECONDS_PER_QUESTION = 22.5; // 24문항 ≈ 9분

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var mq = function (q) { return window.matchMedia(q).matches; };
  var isPhone = function () { return mq('(max-width: 599px)'); };
  var isTouch = function () { return mq('(hover: none)'); };
  var reducedMotion = function () { return mq('(prefers-reduced-motion: reduce)'); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  // ── 질문 데이터 준비 ─────────────────────────────────

  var section = 0;
  STEPS.forEach(function (s) {
    if (s.type === 'intro') section = s.section;
    s.sectionNo = section;
    s.key = s.type === 'intro' ? 'intro-' + s.section : s.id;
  });
  var SECTIONS = STEPS.filter(function (s) { return s.type === 'intro'; });
  var QUESTIONS = STEPS.filter(function (s) { return s.type !== 'intro'; });
  var BY_KEY = {};
  STEPS.forEach(function (s) { BY_KEY[s.key] = s; });

  // ── 상태 ─────────────────────────────────────────────

  var state = {
    lang: null,
    screen: 'lang',          // lang | welcome | step | review | thanks | error
    step: null,              // 현재 step key (질문 id 또는 intro-N)
    answers: {},
    startedAt: null,
    returnToReview: false,
    submitting: false,
    error: null,
    lastPayload: null,
    ui: { tzOpen: false, tzOther: false, schedDay: null, likertRow: 0 }
  };

  var store = {
    get: function () { try { return JSON.parse(window.localStorage.getItem(STORE_KEY)); } catch (e) { return null; } },
    set: function (v) { try { window.localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) { /* 저장 실패해도 진행 */ } },
    clear: function () { try { window.localStorage.removeItem(STORE_KEY); } catch (e) { /* noop */ } }
  };

  function save() {
    if (state.screen === 'thanks') return;
    store.set({
      lang: state.lang,
      screen: state.screen === 'error' ? 'review' : state.screen,
      step: state.step,
      answers: state.answers,
      startedAt: state.startedAt,
      returnToReview: state.returnToReview
    });
  }

  // ── 텍스트 ───────────────────────────────────────────

  function L(o) {
    if (o == null) return '';
    if (typeof o === 'string' || Array.isArray(o)) return o;
    return o[state.lang] != null ? o[state.lang] : o.en;
  }
  function t(key, vars) {
    var s = L(STR[key]);
    if (typeof s !== 'string') return '';
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // *강조* → accent span
  function rich(s) { return esc(s).replace(/\*([^*]+)\*/g, '<span class="em">$1</span>'); }
  function stripArrow(s) { return s.replace(/\s*→\s*$/, ''); }
  function enterHintHtml() { return esc(t('enterHint')).replace('Enter ↵', '<kbd>Enter ↵</kbd>'); }
  function dayNames() { return L(STR.days); }

  function cleanName() {
    return String(state.answers.name || '').trim().replace(/^(dr|prof|professor|mr|mrs|ms|mx)\.?\s+/i, '');
  }
  function firstName() { return cleanName().split(/\s+/)[0] || ''; }
  function koName() { return cleanName().replace(/\s*(교수님|교수|님)$/, '').trim(); }

  // ── 아이콘 ───────────────────────────────────────────

  function svg(path, cls, sw) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + path + '</svg>';
  }
  var P_CHECK = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
  var ICON = {
    check: svg(P_CHECK, 'check', 2.2),
    ok: svg(P_CHECK, '', 2.2),
    cellCheck: svg(P_CHECK, '', 3),
    big: svg(P_CHECK, '', 2),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>', '', 1.8),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', '', 1.8),
    save: svg('<path d="M5 4h11l3 3v13H5z"/><path d="M9 4v5h6V4"/>', '', 1.8),
    chevron: svg('<path d="M6 9l6 6 6-6"/>', '', 1.8),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    alert: svg('<path d="M12 7v6M12 17h.01"/>', '', 2.2),
    download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', '', 1.8)
  };

  // ── 표시 조건 / 응답 판정 ────────────────────────────

  function isVisible(s) { return !s.showIf || !!s.showIf(state.answers); }
  // 번호·진행바용: 아직 조건이 결정되지 않은(근거 질문 미응답) 질문도 센다
  function countable(q) {
    if (isVisible(q)) return true;
    return !!q.dependsOn && !isAnswered(BY_KEY[q.dependsOn]);
  }
  function visibleQuestions() { return QUESTIONS.filter(isVisible); }
  function countableQuestions() { return QUESTIONS.filter(countable); }

  function nextKey(key) {
    var i = STEPS.findIndex(function (s) { return s.key === key; });
    for (var j = i + 1; j < STEPS.length; j++) if (isVisible(STEPS[j])) return STEPS[j].key;
    return null;
  }
  function prevKey(key) {
    var i = STEPS.findIndex(function (s) { return s.key === key; });
    for (var j = i - 1; j >= 0; j--) if (isVisible(STEPS[j])) return STEPS[j].key;
    return null;
  }

  function baseOptions(q) {
    var opts = q.groups ? [].concat.apply([], q.groups.map(function (g) { return g.options; })) : (q.options || []);
    return q.allowOther ? opts.concat([{ id: 'other', other: true }]) : opts;
  }
  function rankOptions(q) {
    var src = BY_KEY[q.source];
    var sel = state.answers[q.source] || [];
    return baseOptions(src).filter(function (o) { return sel.indexOf(o.id) >= 0; }).map(function (o) {
      if (!o.other) return o;
      var txt = String(state.answers[src.id + '_other'] || '').trim();
      return { id: 'other', label: txt || t('other') };
    });
  }
  function optionList(q) {
    if (q.type === 'rank') return rankOptions(q);
    if (q.type === 'single' || q.type === 'multi') return baseOptions(q);
    return [];
  }
  function optLabel(o) {
    if (o.label) return o.label;
    if (o.other) return t('other');
    return L(o);
  }

  function isAnswered(q) {
    if (!q) return false;
    var v = state.answers[q.id];
    switch (q.type) {
      case 'text':
      case 'longtext': return !!String(v || '').trim();
      case 'single':
      case 'scale': return v != null && v !== '';
      case 'multi': return Array.isArray(v) && v.length > 0;
      case 'likert': return !!v && q.statements.every(function (s) { return !!v[s.id]; });
      case 'rank': return Array.isArray(v) && v.length >= Math.min(q.max, rankOptions(q).length);
      case 'schedule': return !!v && ((v.slots || []).length > 0 || !!String(v.note || '').trim());
      default: return false;
    }
  }
  function validate(q) {
    var v = state.answers[q.id];
    if (q.allowOther && Array.isArray(v) && v.indexOf('other') >= 0 && !String(state.answers[q.id + '_other'] || '').trim()) return 'other';
    if (q.required && !isAnswered(q)) return 'required';
    return null;
  }

  // ── DOM ──────────────────────────────────────────────

  var $app = $('#app');
  var $main = $('#main');
  var $view = $('#view');
  var $topbar = $('#topbarInner');
  var $footer = $('#footer');
  var $progress = $('#progressFill');

  var navSeq = 0;
  var autoTimer = null;
  var clockTimer = null;

  function currentStep() { return state.screen === 'step' ? BY_KEY[state.step] : null; }
  function currentQuestion() { var s = currentStep(); return s && s.type !== 'intro' ? s : null; }

  // ── 화면 전환 ────────────────────────────────────────

  function go(screen, step, dir) {
    clearTimeout(autoTimer);
    state.screen = screen;
    state.step = step || null;
    state.ui.tzOpen = false;
    state.ui.tzOther = false;
    state.ui.likertRow = 0;
    if (screen === 'review') state.returnToReview = false;
    save();
    return transition(dir || 0);
  }

  function transition(dir) {
    var seq = ++navSeq;
    var canAnimate = dir !== 0 && typeof $view.animate === 'function';
    var dist = reducedMotion() ? 0 : (isPhone() ? 12 : 24);
    var out = null;
    var leave = canAnimate && $view.childElementCount
      ? (out = $view.animate(
          [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(' + (-dir * dist) + 'px)' }],
          { duration: 150, easing: 'ease-in', fill: 'forwards' }
        )).finished.catch(function () {})
      : Promise.resolve();

    return leave.then(function () {
      if (seq !== navSeq) return;
      renderAll();
      $main.scrollTop = 0;
      if (out) out.cancel();
      if (canAnimate) {
        $view.animate(
          [{ opacity: 0, transform: 'translateY(' + (dir * dist) + 'px)' }, { opacity: 1, transform: 'none' }],
          { duration: 300, easing: EASE }
        );
      }
      focusInitial();
    });
  }

  function focusInitial() {
    var target = $('#qTitle', $view);
    var q = currentQuestion();
    if (q && (q.type === 'text' || q.type === 'longtext') && !isTouch()) {
      var field = $('[data-field="answer"]', $view);
      if (field) {
        target = field;
        try { field.setSelectionRange(field.value.length, field.value.length); } catch (e) { /* noop */ }
      }
    }
    if (target) target.focus({ preventScroll: true });
  }

  // 같은 화면 다시 그리기 (애니메이션 없이, 포커스·스크롤 유지)
  function refresh() {
    var active = document.activeElement;
    var fid = active && active.dataset ? active.dataset.fid : null;
    var selStart = null;
    var selEnd = null;
    if (fid && active.setSelectionRange) {
      try { selStart = active.selectionStart; selEnd = active.selectionEnd; } catch (e) { /* noop */ }
    }
    var top = $main.scrollTop;
    renderAll();
    $main.scrollTop = top;
    if (fid) {
      var el = document.querySelector('[data-fid="' + CSS.escape(fid) + '"]');
      if (el) {
        el.focus({ preventScroll: true });
        if (selStart != null && el.setSelectionRange) {
          try { el.setSelectionRange(selStart, selEnd); } catch (e) { /* noop */ }
        }
      }
    }
  }

  // ── 렌더링 ───────────────────────────────────────────

  function renderAll() {
    stopTimers();
    document.documentElement.lang = state.lang || 'en';
    $app.dataset.screen = state.screen;
    renderTopbar();
    renderView();
    renderFooter();
    updateProgress();
    afterRender();
  }

  function stopTimers() {
    clearInterval(clockTimer);
    clockTimer = null;
  }

  function afterRender() {
    $$('.text-area', $view).forEach(autosize);
    var q = currentQuestion();
    if (q && q.type === 'schedule') {
      clockTimer = setInterval(updateClocks, 15000);
    }
  }

  function langToggleHtml() {
    return '<div class="lang-toggle" role="group" aria-label="Language">' +
      '<button type="button" data-action="set-lang" data-lang="en" data-fid="lang-en" aria-pressed="' + (state.lang === 'en') + '">EN</button>' +
      '<button type="button" data-action="set-lang" data-lang="ko" data-fid="lang-ko" aria-pressed="' + (state.lang === 'ko') + '" lang="ko">한</button>' +
      '</div>';
  }

  function brandHtml() {
    return '<div class="brand"><span class="brand-ai">AI</span><span class="brand-word">WORKSHOP</span>' +
      '<span class="brand-rule"></span><span class="brand-sub">' + esc(t('brandSub')) + '</span></div>';
  }

  function renderTopbar() {
    if (state.screen === 'lang') { $topbar.innerHTML = ''; return; }
    var right = '';
    if (state.screen === 'thanks') {
      right = '<span class="section-of is-done">' + esc(t('complete')) + '</span>';
    } else {
      var step = currentStep();
      if (step) {
        var n = pad(step.sectionNo);
        var total = pad(SECTIONS.length);
        right += '<span class="section-of"><span class="so-long">' + esc(t('sectionOf', { n: n, total: total })) +
          '</span><span class="so-short">' + n + ' / ' + total + '</span></span>';
      }
      right += langToggleHtml();
    }
    $topbar.innerHTML = brandHtml() + '<div class="topbar-right">' + right + '</div>';
  }

  function updateProgress() {
    var p = 0;
    if (state.screen === 'step') {
      var steps = STEPS.filter(function (s) { return s.type === 'intro' || countable(s); });
      var i = steps.findIndex(function (s) { return s.key === state.step; });
      p = (i + 1) / (steps.length + 1);
    } else if (state.screen === 'review' || state.screen === 'error') {
      p = steps0();
    } else if (state.screen === 'thanks') {
      p = 1;
    }
    $progress.style.width = (p * 100).toFixed(2) + '%';
  }
  function steps0() {
    var steps = STEPS.filter(function (s) { return s.type === 'intro' || countable(s); });
    return steps.length / (steps.length + 1);
  }

  function renderView() {
    var out;
    switch (state.screen) {
      case 'lang': out = { html: renderLang() }; break;
      case 'welcome': out = { html: renderWelcome() }; break;
      case 'step': out = renderStep(currentStep()); break;
      case 'review': out = { html: renderReview() }; break;
      case 'thanks': out = { html: renderThanks() }; break;
      case 'error': out = { html: renderError() }; break;
      default: out = { html: '' };
    }
    $view.className = 'view' + (out.centered ? ' is-centered' : '');
    $view.innerHTML = out.html;
  }

  // ── 하단 바 ──────────────────────────────────────────

  function backBtnHtml() {
    return '<button type="button" class="back-btn" data-action="back" aria-label="' + esc(t('back')) + '">' + ICON.back +
      '<span class="back-text">' + esc(t('back')) + '</span></button>';
  }
  function footPrimary(label, action, sub) {
    return '<button type="button" class="btn btn-primary foot-primary" data-action="' + action + '">' + esc(label) +
      (sub ? ' <span class="sub">· ' + esc(sub) + '</span>' : '') + '</button>';
  }

  function renderFooter() {
    var s = state.screen;
    if (s === 'lang' || s === 'welcome' || s === 'thanks') { $footer.innerHTML = ''; return; }
    var html = backBtnHtml();
    if (s === 'step') {
      var step = currentStep();
      if (step.type === 'intro') {
        html += crumbsHtml(step) + footPrimary(stripArrow(t('continue')), 'next');
      } else {
        html += '<span class="foot-hint kb-only">' + esc(hintFor(step)) + '</span>';
        html += mobilePrimary(step);
        var qs = countableQuestions();
        html += '<span class="foot-page">' + pad(qs.indexOf(step) + 1) + ' <span>/ ' + pad(qs.length) + '</span></span>';
      }
    } else if (s === 'review') {
      html += state.submitting
        ? '<button type="button" class="btn btn-primary foot-primary" data-action="submit" disabled>' + submittingHtml() + '</button>'
        : footPrimary(t('submit'), 'submit');
    }
    $footer.innerHTML = html;
  }

  function crumbsHtml(step) {
    var i = SECTIONS.indexOf(step);
    var f = function (s) { return pad(s.section) + ' ' + esc(L(s.short)); };
    var prev = SECTIONS[i - 1];
    var next = SECTIONS[i + 1];
    return '<span class="foot-crumbs">' + (prev ? f(prev) + ' ' : '') + '<span class="cur">— ' + f(step) + ' —</span>' +
      (next ? ' ' + f(next) : '') + '</span>';
  }

  function hintFor(q) {
    var n = optionList(q).length;
    var range = n ? 'A–' + LETTERS[Math.min(n, 26) - 1] : '';
    var parts;
    switch (q.type) {
      case 'single': parts = [t('hintSelect', { range: range }), t('hintEsc')]; break;
      case 'multi':
      case 'rank': parts = [t('hintSelect', { range: range }), t('hintEnter'), t('hintEsc')]; break;
      case 'scale': parts = [t('hintNumbers'), t('hintEsc')]; break;
      case 'likert': parts = [t('hintRows'), t('hintEnter')]; break;
      case 'longtext': parts = [t('hintNewline'), t('hintEnter')]; break;
      case 'schedule': parts = [t('hintArrows'), t('hintEnter')]; break;
      default: parts = [t('hintEnter'), t('hintEsc')];
    }
    return parts.join(' · ');
  }

  function isAutoAdvance(q) { return q.type === 'single' || q.type === 'scale'; }

  // 휴대폰 하단 바 주 버튼
  function mobilePrimary(q) {
    var answered = isAnswered(q);
    if (isAutoAdvance(q)) return !q.required && !answered ? footPrimary(t('skip'), 'skip') : '';
    if (!q.required && !answered) return footPrimary(t('skip'), 'skip');
    return footPrimary(t('ok'), 'next', mobileCount(q));
  }
  function mobileCount(q) {
    var v = state.answers[q.id];
    var n = Array.isArray(v) ? v.length : 0;
    if (q.type === 'multi') return q.max ? n + ' / ' + q.max : (n ? t('selectedN', { n: n }) : '');
    if (q.type === 'rank') return n + ' / ' + q.max;
    if (q.type === 'likert') return likertCount(q) + ' / ' + q.statements.length;
    if (q.type === 'schedule') return t('slotsShort', { n: ((v && v.slots) || []).length });
    return '';
  }
  function likertCount(q) {
    var v = state.answers[q.id] || {};
    return q.statements.filter(function (s) { return !!v[s.id]; }).length;
  }
  function counterText(q) {
    var v = state.answers[q.id];
    var n = Array.isArray(v) ? v.length : 0;
    if (q.type === 'multi') return q.max ? n + ' / ' + q.max : (n ? t('selectedN', { n: n }) : '');
    if (q.type === 'rank') return n + ' / ' + q.max;
    if (q.type === 'likert') return t('answeredN', { n: likertCount(q), total: q.statements.length });
    return '';
  }

  // ── Language select ─────────────────────────────────

  function renderLang() {
    var card = function (lang, key, name, cta) {
      return '<button type="button" class="lang-card" data-action="lang" data-lang="' + lang + '"' + (lang === 'ko' ? ' lang="ko"' : '') + '>' +
        '<span class="lang-card-top"><span class="key" aria-hidden="true">' + key + '</span>' + ICON.arrow + '</span>' +
        '<span class="lang-card-text"><span class="lang-card-name">' + name + '</span><span class="lang-card-cta">' + cta + '</span></span>' +
        '</button>';
    };
    return '<div class="lang-screen">' +
      '<div class="lang-top"><div class="brand"><span class="brand-ai">AI</span><span class="brand-word">WORKSHOP</span></div>' +
      '<span>' + esc(STR.langTerm) + '</span></div>' +
      '<div class="lang-center">' +
      '<div class="lang-heading"><h1 class="lang-title" id="qTitle" tabindex="-1" lang="en">' + esc(STR.langTitle.en) + '</h1>' +
      '<p class="lang-sub" lang="ko">' + esc(STR.langTitle.ko) + '</p></div>' +
      '<div class="lang-cards">' + card('en', 'E', 'English', esc(STR.langCta.en)) + card('ko', 'K', '한국어', esc(STR.langCta.ko)) + '</div>' +
      '<p class="lang-note">' + esc(STR.langNote.en) + '<span class="dot">·</span><span class="ko" lang="ko">' + esc(STR.langNote.ko) + '</span></p>' +
      '</div>' +
      '<div class="lang-bottom"><span>≈ 9 MIN · ' + SECTIONS.length + ' SECTIONS · ' + QUESTIONS.length + ' QUESTIONS</span>' +
      '<span class="kb-only">' + esc(STR.langPress) + '</span></div>' +
      '</div>';
  }

  // ── Welcome ─────────────────────────────────────────

  function renderWelcome() {
    var title = cleanName()
      ? t('welcomeTitleNamed', { firstName: firstName(), name: koName() })
      : t('welcomeTitle');
    var rows = SECTIONS.map(function (s) {
      var n = countableQuestions().filter(function (q) { return q.sectionNo === s.section; }).length;
      return '<div class="cover-row"><span class="n">' + pad(s.section) + '</span><span class="t">' + esc(L(s.title)) +
        '</span><span class="c">' + n + '</span></div>';
    }).join('');
    return '<div class="welcome">' +
      '<div class="welcome-main">' +
      '<span class="eyebrow">' + esc(t('welcomeEyebrow')) + '</span>' +
      '<h1 class="welcome-title" id="qTitle" tabindex="-1">' + rich(title) + '</h1>' +
      '<p class="welcome-body">' + esc(t('welcomeBody')) + '</p>' +
      '<div class="cta-row"><button type="button" class="btn btn-primary btn-lg" data-action="start">' + esc(stripArrow(t('start'))) + ICON.arrow + '</button>' +
      '<span class="enter-hint kb-only">' + enterHintHtml() + '</span></div>' +
      '<div class="welcome-meta"><span>' + ICON.clock + esc(t('welcomeTime')) + '</span><span>' + ICON.save + esc(t('welcomeSaved')) + '</span></div>' +
      '</div>' +
      '<aside class="cover"><span class="cover-head">' + esc(t('cover')) + '</span>' + rows + '</aside>' +
      '</div>';
  }

  // ── Step (intro / question) ─────────────────────────

  function renderStep(step) {
    if (step.type === 'intro') return { html: renderIntro(step) };
    return renderQuestion(step);
  }

  function renderIntro(step) {
    var n = countableQuestions().filter(function (q) { return q.sectionNo === step.section; }).length;
    var m = Math.max(1, Math.round(n * SECONDS_PER_QUESTION / 60));
    var meta = n === 1 ? t('introMetaOne', { m: m }) : t('introMeta', { n: n, m: m });
    return '<div class="intro">' +
      '<span class="intro-num" aria-hidden="true">' + pad(step.section) + '</span>' +
      '<div class="intro-rule" aria-hidden="true"></div>' +
      '<div class="intro-text">' +
      '<span class="intro-meta">' + esc(meta) + '</span>' +
      '<h1 class="intro-title" id="qTitle" tabindex="-1">' + esc(L(step.title)) + '</h1>' +
      '<div class="cta-row"><button type="button" class="btn btn-primary btn-lg" data-action="next">' + esc(stripArrow(t('continue'))) + ICON.arrow + '</button>' +
      '<span class="enter-hint kb-only">' + enterHintHtml() + '</span></div>' +
      '</div></div>';
  }

  function railHtml(q) {
    var qs = countableQuestions();
    var sec = SECTIONS.find(function (s) { return s.section === q.sectionNo; });
    return '<div class="q-rail"><span class="q-num">Q · ' + pad(qs.indexOf(q) + 1) + '</span>' +
      '<span class="q-sec">' + esc(sec ? L(sec.title) : '') + '</span></div>';
  }
  function titleHtml(q) {
    return '<h1 class="q-title" id="qTitle" tabindex="-1">' + esc(L(q.title)) + '</h1>';
  }
  function toReviewInline() {
    return state.returnToReview
      ? '<button type="button" class="btn-outline to-review to-review-inline" data-action="to-review">' + esc(t('backToReview')) + '</button>'
      : '';
  }

  function actionsHtml(q) {
    var parts = [];
    if (!isAutoAdvance(q)) {
      parts.push('<button type="button" class="btn btn-primary" data-action="next">' + esc(t('ok')) + ICON.ok + '</button>' +
        '<span class="enter-hint kb-only">' + enterHintHtml() + '</span>');
    }
    if (!q.required) parts.push('<button type="button" class="btn-text" data-action="skip">' + esc(t('skip')) + '</button>');
    if (state.returnToReview) parts.push('<button type="button" class="btn-outline to-review" data-action="to-review">' + esc(t('backToReview')) + '</button>');
    var counter = counterText(q);
    if (!parts.length && !counter) return '';
    return '<div class="actions">' + parts.join('') + '<span class="counter" id="counter">' + esc(counter) + '</span></div>';
  }

  function renderQuestion(q) {
    if (q.type === 'schedule') return { html: renderSchedule(q) };
    var body = RENDER[q.type](q);
    return {
      centered: !q.groups,
      html: '<div class="stage' + (q.groups ? ' stage-wide' : '') + '"><div class="q-block">' + railHtml(q) +
        '<div class="q-body">' + titleHtml(q) + body +
        '<p class="form-msg" id="formMsg" role="status" aria-live="polite"></p>' +
        toReviewInline() + actionsHtml(q) +
        '</div></div></div>'
    };
  }

  function cardHtml(q, o, i, on, role, extra) {
    extra = extra || {};
    var key = i < 26 ? '<span class="key" aria-hidden="true">' + LETTERS[i] + '</span>' : '';
    var main = o.desc
      ? '<span class="card-label card-title">' + esc(optLabel(o)) + '</span><span class="card-desc">' + esc(L(o.desc)) + '</span>'
      : '<span class="card-label">' + esc(optLabel(o)) + '</span>';
    return '<button type="button" class="card choice' + (extra.disabled ? ' is-disabled' : '') + '" role="' + role + '"' +
      ' aria-checked="' + on + '"' + (extra.disabled ? ' aria-disabled="true"' : '') +
      ' data-action="opt" data-opt="' + esc(o.id) + '" data-fid="' + esc(q.id + ':' + o.id) + '">' +
      (extra.lead || '') + key + '<span class="card-main">' + main + (extra.sr ? '<span class="sr-only">' + esc(extra.sr) + '</span>' : '') + '</span>' +
      ICON.check + '</button>';
  }

  function otherInputHtml(q) {
    return '<input class="text-input other-input" type="text" data-field="other" data-fid="' + esc(q.id) + ':other-input"' +
      ' value="' + esc(state.answers[q.id + '_other'] || '') + '" placeholder="' + esc(t('otherPlaceholder')) + '"' +
      ' aria-label="' + esc(t('other')) + '" maxlength="500" autocomplete="off" enterkeyhint="next">';
  }

  var RENDER = {
    text: function (q) {
      return '<input class="text-input" type="text" data-field="answer" data-fid="' + esc(q.id) + ':input"' +
        ' value="' + esc(state.answers[q.id] || '') + '" placeholder="' + esc(L(q.placeholder)) + '"' +
        ' aria-labelledby="qTitle" autocomplete="' + (q.id === 'name' ? 'name' : 'off') + '" maxlength="300" enterkeyhint="next">';
    },

    longtext: function (q) {
      return '<textarea class="text-area" data-field="answer" data-fid="' + esc(q.id) + ':input" rows="4"' +
        ' placeholder="' + esc(L(q.placeholder)) + '" aria-labelledby="qTitle" maxlength="5000">' +
        esc(state.answers[q.id] || '') + '</textarea>';
    },

    single: function (q) {
      var v = state.answers[q.id];
      return '<div class="opts" role="radiogroup" aria-labelledby="qTitle">' +
        q.options.map(function (o, i) { return cardHtml(q, o, i, v === o.id, 'radio'); }).join('') + '</div>';
    },

    multi: function (q) {
      var sel = state.answers[q.id] || [];
      var atMax = !!q.max && sel.length >= q.max;
      var idx = 0;
      var card = function (o) {
        var on = sel.indexOf(o.id) >= 0;
        return cardHtml(q, o, idx++, on, 'checkbox', { disabled: atMax && !on });
      };
      // 키 배지 순서 = optionList 순서이므로 Other는 항상 마지막에 생성
      var otherHtml = function () {
        if (!q.allowOther) return '';
        var otherOn = sel.indexOf('other') >= 0;
        return '<div class="other-wrap">' + card({ id: 'other', other: true }) + (otherOn ? otherInputHtml(q) : '') + '</div>';
      };
      if (q.groups) {
        var groups = q.groups.map(function (g) {
          return '<section class="group" role="group" aria-label="' + esc(L(g)) + '">' +
            '<div class="group-head"><span class="group-title">' + esc(L(g)) + '</span><span class="group-count">' + pad(g.options.length) + '</span></div>' +
            '<div class="group-grid">' + g.options.map(function (o) { return card(o); }).join('') + '</div></section>';
        }).join('');
        var other = otherHtml();
        return '<div class="groups">' + groups + (other ? '<div class="opts">' + other + '</div>' : '') + '</div>';
      }
      var cards = q.options.map(function (o) { return card(o); }).join('');
      return '<div class="opts" role="group" aria-labelledby="qTitle">' + cards + otherHtml() + '</div>';
    },

    rank: function (q) {
      var ranked = state.answers[q.id] || [];
      var atMax = ranked.length >= q.max;
      return '<div class="opts" role="group" aria-labelledby="qTitle">' + rankOptions(q).map(function (o, i) {
        var r = ranked.indexOf(o.id);
        var on = r >= 0;
        return cardHtml(q, o, i, on, 'checkbox', {
          disabled: atMax && !on,
          lead: '<span class="rank-badge" aria-hidden="true">' + (on ? r + 1 : '') + '</span>',
          sr: on ? ' (' + (r + 1) + ')' : ''
        });
      }).join('') + '</div>';
    },

    scale: function (q) {
      var v = state.answers[q.id];
      var btns = '';
      for (var n = q.min; n <= q.max; n++) {
        var aria = n === q.min ? n + ' — ' + L(q.minLabel) : n === q.max ? n + ' — ' + L(q.maxLabel) : String(n);
        btns += '<button type="button" class="scale-btn choice" role="radio" aria-checked="' + (v === n) + '" aria-label="' + esc(aria) + '"' +
          ' data-action="scale" data-val="' + n + '" data-fid="' + esc(q.id) + ':' + n + '">' + n + '</button>';
      }
      return '<div class="scale"><div class="scale-btns" role="radiogroup" aria-labelledby="qTitle">' + btns + '</div>' +
        '<div class="scale-ends" aria-hidden="true"><span>' + esc(L(q.minLabel)) + '</span><span>' + esc(L(q.maxLabel)) + '</span></div></div>';
    },

    likert: function (q) {
      var v = state.answers[q.id] || {};
      var active = state.ui.likertRow;
      var head = '<div class="lm-row lm-head" aria-hidden="true"><span></span>' +
        q.scale.map(function (s) { return '<span>' + esc(L(s)) + '</span>'; }).join('') + '</div>';
      var matrix = q.statements.map(function (st, i) {
        return '<div class="lm-row' + (i === active ? ' is-active' : '') + '" role="radiogroup" aria-label="' + esc(L(st)) + '">' +
          '<span class="lm-text">' + esc(L(st)) + '</span>' +
          q.scale.map(function (s, k) {
            return '<div class="lm-cell"><button type="button" class="lm-dot choice" role="radio" aria-checked="' + (v[st.id] === k + 1) + '"' +
              ' aria-label="' + esc(L(s)) + '" data-action="likert" data-row="' + i + '" data-val="' + (k + 1) + '"' +
              ' data-fid="' + esc(q.id) + ':m:' + i + ':' + (k + 1) + '"><i></i></button></div>';
          }).join('') + '</div>';
      }).join('');
      var cards = q.statements.map(function (st, i) {
        var pills = q.scale.map(function (s, k) {
          return '<button type="button" class="lk-pill choice" role="radio" aria-checked="' + (v[st.id] === k + 1) + '"' +
            ' aria-label="' + (k + 1) + ' — ' + esc(L(s)) + '" data-action="likert" data-row="' + i + '" data-val="' + (k + 1) + '"' +
            ' data-fid="' + esc(q.id) + ':c:' + i + ':' + (k + 1) + '">' + (k + 1) + '</button>';
        }).join('');
        return '<div class="lk-card' + (i === active ? ' is-active' : '') + '" data-card="' + i + '">' +
          '<p class="lk-text">' + esc(L(st)) + '</p>' +
          '<div class="lk-pills" role="radiogroup" aria-label="' + esc(L(st)) + '">' + pills + '</div>' +
          '<div class="lk-ends" aria-hidden="true"><span>← ' + esc(L(q.scale[0])) + '</span><span>' + esc(L(q.scale[q.scale.length - 1])) + ' →</span></div>' +
          '</div>';
      }).join('');
      return '<div class="likert-matrix">' + head + matrix + '</div><div class="likert-cards">' + cards + '</div>';
    }
  };

  // ── 응답 조작 ────────────────────────────────────────

  function setMsg(text, isError) {
    var el = $('#formMsg', $view);
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('is-error', !!isError);
  }
  function clearMsg() { setMsg(''); }

  function flagError(q, err) {
    setMsg(err === 'other' ? t('otherPlaceholder') : t('required'), true);
    $$('.actions .btn-primary, .foot-primary').forEach(function (b) {
      b.classList.remove('shake');
      void b.offsetWidth;
      b.classList.add('shake');
    });
    if (err === 'other') {
      var input = $('.other-input', $view);
      if (input) { input.focus({ preventScroll: true }); input.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }
  }

  function handleOption(q, id, viaKey) {
    if (q.type === 'single') pickSingle(q, id);
    else if (q.type === 'multi') toggleMulti(q, id, viaKey);
    else if (q.type === 'rank') toggleRank(q, id);
  }

  function pickSingle(q, id) {
    state.answers[q.id] = id;
    save();
    refresh();
    clearTimeout(autoTimer);
    autoTimer = setTimeout(next, 400);
  }

  function sortByOptions(q, ids) {
    var order = baseOptions(q).map(function (o) { return o.id; });
    return ids.slice().sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
  }

  function toggleMulti(q, id, viaKey) {
    var opts = baseOptions(q);
    var opt = opts.find(function (o) { return o.id === id; });
    if (!opt) return;
    var sel = (state.answers[q.id] || []).slice();
    var adding = sel.indexOf(id) < 0;
    if (!adding) {
      sel = sel.filter(function (x) { return x !== id; });
    } else {
      if (q.max && sel.length >= q.max) { setMsg(t('maxReached')); return; }
      if (opt.exclusive) {
        sel = [id];
      } else {
        sel = sel.filter(function (x) {
          var o = opts.find(function (p) { return p.id === x; });
          return !(o && o.exclusive);
        }).concat(id);
      }
    }
    state.answers[q.id] = sortByOptions(q, sel);
    syncDependents(q.id);
    save();
    refresh();
    if (q.max && sel.length >= q.max) setMsg(t('maxReached'));
    if (adding && id === 'other') {
      var input = $('.other-input', $view);
      if (input) {
        input.focus({ preventScroll: true });
        input.scrollIntoView({ block: 'center', behavior: viaKey ? 'auto' : 'smooth' });
      }
    }
  }

  // 원본 선택이 바뀌면 순위 질문에서 사라진 항목 제거
  function syncDependents(sourceId) {
    QUESTIONS.forEach(function (q) {
      if (q.type === 'rank' && q.source === sourceId && Array.isArray(state.answers[q.id])) {
        var src = state.answers[sourceId] || [];
        state.answers[q.id] = state.answers[q.id].filter(function (id) { return src.indexOf(id) >= 0; });
      }
    });
  }

  function toggleRank(q, id) {
    var ranked = (state.answers[q.id] || []).slice();
    var i = ranked.indexOf(id);
    if (i >= 0) ranked.splice(i, 1);
    else if (ranked.length >= q.max) { setMsg(t('maxReached')); return; }
    else ranked.push(id);
    state.answers[q.id] = ranked;
    save();
    refresh();
    if (ranked.length >= q.max) setMsg(t('maxReached'));
  }

  function pickScale(q, n) {
    if (n < q.min || n > q.max) return;
    state.answers[q.id] = n;
    save();
    refresh();
    clearTimeout(autoTimer);
    autoTimer = setTimeout(next, 400);
  }

  function pickLikert(q, row, val) {
    var st = q.statements[row];
    if (!st) return;
    var v = Object.assign({}, state.answers[q.id] || {});
    var wasEmpty = !v[st.id];
    v[st.id] = val;
    state.answers[q.id] = v;
    // 다음 미응답 문장으로 활성 행 이동
    var nextRow = row;
    for (var i = 1; i <= q.statements.length; i++) {
      var r = (row + i) % q.statements.length;
      if (!v[q.statements[r].id]) { nextRow = r; break; }
    }
    if (nextRow === row && row < q.statements.length - 1) nextRow = row + 1;
    state.ui.likertRow = nextRow;
    save();
    refresh();
    if (wasEmpty && nextRow !== row && isPhone()) {
      var card = $('.lk-card[data-card="' + nextRow + '"]', $view);
      if (card) card.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
  }

  function setLikertRow(row) {
    state.ui.likertRow = row;
    $$('.lm-row[role="radiogroup"]', $view).forEach(function (el, i) { el.classList.toggle('is-active', i === row); });
    $$('.lk-card', $view).forEach(function (el, i) { el.classList.toggle('is-active', i === row); });
  }

  function skipQuestion() {
    var q = currentQuestion();
    if (!q || q.required) return;
    delete state.answers[q.id];
    if (q.allowOther) delete state.answers[q.id + '_other'];
    syncDependents(q.id);
    save();
    advance(q);
  }

  // ── 이동 ─────────────────────────────────────────────

  function start() {
    if (!state.startedAt) state.startedAt = new Date().toISOString();
    var first = STEPS.find(isVisible);
    go('step', first.key, 1);
  }

  function next() {
    clearTimeout(autoTimer);
    if (state.submitting) return;
    switch (state.screen) {
      case 'welcome': start(); return;
      case 'review':
      case 'error': submit(); return;
      case 'step': break;
      default: return;
    }
    var step = currentStep();
    if (step.type !== 'intro') {
      var err = validate(step);
      if (err) { flagError(step, err); return; }
    }
    advance(step);
  }

  function advance(step) {
    var nk = nextKey(step.key);
    if (!nk) go('review', null, 1);
    else go('step', nk, 1);
  }

  function back() {
    clearTimeout(autoTimer);
    if (state.submitting) return;
    switch (state.screen) {
      case 'welcome': go('lang', null, -1); break;
      case 'step': {
        var p = prevKey(state.step);
        if (p) go('step', p, -1); else go('welcome', null, -1);
        break;
      }
      case 'review': {
        var vs = STEPS.filter(isVisible);
        go('step', vs[vs.length - 1].key, -1);
        break;
      }
      case 'error': go('review', null, -1); break;
    }
  }

  function toReview() {
    var q = currentQuestion();
    if (q) {
      var err = validate(q);
      if (err) { flagError(q, err); return; }
    }
    go('review', null, 1);
  }

  function pickLang(lang) {
    state.lang = lang;
    document.documentElement.lang = lang;
    go('welcome', null, 1);
  }

  function setLang(lang) {
    if (lang === state.lang) return;
    state.lang = lang;
    save();
    if (reducedMotion() || typeof $view.animate !== 'function') { refresh(); return; }
    var out = $view.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 75, fill: 'forwards' });
    out.finished.catch(function () {}).then(function () {
      refresh();
      out.cancel();
      $view.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 75 });
    });
  }

  // ── Review ──────────────────────────────────────────

  function renderReview() {
    var vq = visibleQuestions();
    var sections = SECTIONS.map(function (sec) {
      var qs = vq.filter(function (q) { return q.sectionNo === sec.section; });
      if (!qs.length) return '';
      var rows = qs.map(function (q) {
        var a = answerHtml(q);
        var missing = q.required && !isAnswered(q);
        return '<div class="rv-row"><span class="rv-q">' + esc(L(q.title)) + '</span>' +
          '<div class="rv-a' + (a ? '' : missing ? ' is-missing' : ' is-empty') + '">' + (a || esc(t('noAnswer'))) + '</div>' +
          '<button type="button" class="rv-edit" data-action="edit" data-step="' + esc(q.key) + '" aria-label="' + esc(t('edit') + ': ' + L(q.title)) + '">' +
          esc(t('edit')) + '</button></div>';
      }).join('');
      return '<details class="rv-section" open><summary><span class="n">' + pad(sec.section) + '</span><span class="t">' + esc(L(sec.title)) + '</span>' +
        ICON.chevron + '</summary>' + rows + '</details>';
    }).join('');
    return '<div class="review">' +
      '<div class="review-head"><span class="eyebrow">' + esc(t('reviewEyebrow')) + '</span>' +
      '<h1 class="review-title" id="qTitle" tabindex="-1">' + esc(t('reviewTitle')) + '</h1>' +
      '<p class="review-sub">' + esc(t('reviewSub')) + '</p></div>' +
      '<div class="rv-sections">' + sections + '</div>' +
      '<div class="cta-row">' + submitBtnHtml() + '</div>' +
      '</div>';
  }

  function submittingHtml() { return '<span class="spinner" aria-hidden="true"></span>' + esc(t('submitting')); }
  function submitBtnHtml() {
    return state.submitting
      ? '<button type="button" class="btn btn-primary btn-lg" data-action="submit" disabled>' + submittingHtml() + '</button>'
      : '<button type="button" class="btn btn-primary btn-lg" data-action="submit">' + esc(t('submit')) + ICON.arrow + '</button>';
  }

  function answerHtml(q) {
    var v = state.answers[q.id];
    var label = function (id) {
      var o = baseOptions(q.type === 'rank' ? BY_KEY[q.source] : q).find(function (x) { return x.id === id; });
      if (!o) return id;
      if (o.other) {
        var srcId = q.type === 'rank' ? q.source : q.id;
        var txt = String(state.answers[srcId + '_other'] || '').trim();
        return t('other') + (txt ? ': ' + txt : '');
      }
      return L(o);
    };
    switch (q.type) {
      case 'text':
      case 'longtext':
        return String(v || '').trim() ? esc(String(v).trim()) : '';
      case 'single':
        return v ? esc(label(v)) : '';
      case 'multi':
        return Array.isArray(v) && v.length ? esc(v.map(label).join(', ')) : '';
      case 'scale':
        return v ? esc(v + ' / ' + q.max) : '';
      case 'rank':
        return Array.isArray(v) && v.length
          ? '<ol>' + v.map(function (id) { return '<li>' + esc(label(id)) + '</li>'; }).join('') + '</ol>' : '';
      case 'likert': {
        if (!v) return '';
        var lines = q.statements.filter(function (s) { return v[s.id]; }).map(function (s) {
          return '<li>' + esc(L(s)) + ' — <strong>' + esc(L(q.scale[v[s.id] - 1])) + '</strong></li>';
        });
        return lines.length ? '<ul>' + lines.join('') + '</ul>' : '';
      }
      case 'schedule': {
        if (!v) return '';
        var groups = Sched.groups(Sched.keysFromValue(v), v.timeZone);
        var out = groups.map(function (g) { return '<li>' + esc(g.local) + ' <span class="mono" style="color:var(--accent);font-size:13px">(' + esc(g.kst) + ')</span></li>'; });
        var note = String(v.note || '').trim();
        if (!out.length && !note) return '';
        return (out.length ? '<ul>' + out.join('') + '</ul>' : '') +
          '<div style="font-size:14px;color:var(--ink-muted)">' + esc(Sched.tzLabel(v.timeZone)) + '</div>' +
          (note ? '<div>' + esc(note) + '</div>' : '');
      }
      default: return '';
    }
  }

  // ── Thank you / Error ───────────────────────────────

  function renderThanks() {
    var title = cleanName()
      ? t('thanksTitle', { firstName: firstName(), name: koName() })
      : t('thanksTitleNoName');
    return '<div class="thanks">' +
      '<div class="thanks-icon">' + ICON.big + '</div>' +
      '<h1 class="thanks-title" id="qTitle" tabindex="-1">' + rich(title) + '</h1>' +
      '<p class="thanks-body">' + esc(t('thanksBody')) + '</p>' +
      '</div>';
  }

  function renderError() {
    return '<div class="thanks" role="alert">' +
      '<div class="thanks-icon is-error">' + ICON.alert + '</div>' +
      '<h1 class="thanks-title" id="qTitle" tabindex="-1">' + esc(t('errorTitle')) + '</h1>' +
      '<div class="thanks-actions">' +
      (state.submitting
        ? '<button type="button" class="btn btn-primary" data-action="retry" disabled>' + submittingHtml() + '</button>'
        : '<button type="button" class="btn btn-primary" data-action="retry">' + esc(t('retry')) + '</button>') +
      '<button type="button" class="btn-outline" data-action="download">' + ICON.download + esc(t('download')) + '</button>' +
      '</div>' +
      (state.error ? '<p class="err-detail">' + esc(state.error) + '</p>' : '') +
      '</div>';
  }

  // ── 제출 ─────────────────────────────────────────────

  function buildPayload() {
    var now = new Date();
    var answers = {};
    QUESTIONS.forEach(function (q) {
      var vis = isVisible(q);
      var v = state.answers[q.id];
      switch (q.type) {
        case 'multi':
        case 'rank':
          answers[q.id] = vis && Array.isArray(v) ? v.slice() : [];
          break;
        case 'likert': {
          var o = {};
          q.statements.forEach(function (s) { o[s.id] = vis && v && v[s.id] ? v[s.id] : ''; });
          answers[q.id] = o;
          break;
        }
        case 'schedule':
          answers[q.id] = Sched.value(vis ? v : null);
          break;
        case 'scale':
        case 'single':
          answers[q.id] = vis && v != null ? v : '';
          break;
        default:
          answers[q.id] = vis && v != null ? String(v).trim() : '';
      }
      if (q.allowOther) {
        var picked = Array.isArray(answers[q.id]) && answers[q.id].indexOf('other') >= 0;
        answers[q.id + '_other'] = picked ? String(state.answers[q.id + '_other'] || '').trim() : '';
      }
    });
    var started = state.startedAt ? new Date(state.startedAt) : now;
    return {
      lang: state.lang,
      respondentName: answers.name || '',
      startedAt: started.toISOString(),
      submittedAt: now.toISOString(),
      durationSec: Math.max(0, Math.round((now - started) / 1000)),
      answers: answers,
      userAgent: navigator.userAgent
    };
  }

  function setSubmitting(on) {
    state.submitting = on;
    $$('[data-action="submit"], [data-action="retry"]').forEach(function (b) {
      b.disabled = on;
      if (on) b.innerHTML = submittingHtml();
    });
  }

  function submit() {
    if (state.submitting) return;
    var bad = visibleQuestions().find(function (q) { return validate(q); });
    if (bad) {
      var err = validate(bad);
      state.returnToReview = true;
      go('step', bad.key, -1).then(function () { flagError(bad, err); });
      return;
    }
    setSubmitting(true);
    var payload = buildPayload();
    state.lastPayload = payload;

    var request;
    if (!CFG.SUBMIT_URL) {
      console.log('[survey] SUBMIT_URL is empty — payload not sent:', payload);
      request = new Promise(function (resolve) { setTimeout(resolve, 500); });
    } else {
      request = fetch(CFG.SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({}, payload, { token: CFG.SUBMIT_TOKEN || '' }))
      }).then(function (res) { return res.json(); }).then(function (out) {
        if (!out || !out.ok) throw new Error((out && out.error) || 'submit failed');
      });
    }

    request.then(function () {
      state.submitting = false;
      store.clear();
      go('thanks', null, 1);
    }).catch(function (e) {
      state.submitting = false;
      state.error = String((e && e.message) || e);
      go('error', null, 1);
    });
  }

  function downloadResponses() {
    var payload = state.lastPayload || buildPayload();
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var slug = String(payload.respondentName || 'responses').trim().replace(/[^\w가-힣-]+/g, '-').replace(/^-+|-+$/g, '') || 'responses';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ai-workshop-survey-' + slug + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // ── 일정 (Q19a) ─────────────────────────────────────

  var Sched = (function () {
    var ref = REF_WEEK.split('-').map(Number);
    var LH = CFG.SCHEDULE_LOCAL_HOURS || { start: 7, end: 22 };
    var HA = CFG.HOST_AVAILABLE_KST || { start: 8, end: 24 };
    var HOURS = [];
    for (var h = LH.start; h <= LH.end; h++) HOURS.push(h);

    var dtfs = {};
    function dtf(tz) {
      if (!dtfs[tz]) {
        dtfs[tz] = new Intl.DateTimeFormat('en-US', {
          timeZone: tz, hourCycle: 'h23',
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
      }
      return dtfs[tz];
    }
    // 특정 시각(ms)의 tz 기준 벽시계 시간
    function parts(tz, ms) {
      var o = {};
      dtf(tz).formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
      var y = +o.year, mo = +o.month - 1, d = +o.day;
      var dayMs = Date.UTC(y, mo, d);
      return {
        y: y, mo: mo, d: d, h: (+o.hour) % 24, mi: +o.minute, s: +o.second,
        dow: (new Date(dayMs).getUTCDay() + 6) % 7, // 월=0
        dayNum: dayMs / 864e5
      };
    }
    function offset(tz, ms) {
      var p = parts(tz, ms);
      return Date.UTC(p.y, p.mo, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
    }
    // tz 벽시계 시간 → UTC ms (DST 반영)
    function wallToUtc(tz, y, mo, d, hour) {
      var guess = Date.UTC(y, mo, d, hour);
      var first = guess - offset(tz, guess);
      return guess - offset(tz, first);
    }

    function isValidTz(tz) {
      if (!tz) return false;
      try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; }
    }
    function detectTz() {
      var tz = null;
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { /* noop */ }
      return isValidTz(tz) ? tz : 'America/Chicago';
    }
    function allZones() {
      try { if (Intl.supportedValuesOf) return Intl.supportedValuesOf('timeZone'); } catch (e) { /* noop */ }
      return TZS.map(function (z) { return z.tz; }).concat(['Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney', 'America/Toronto', 'America/Puerto_Rico']);
    }

    var cache = { tz: null, m: null };
    function matrix(tz) {
      if (cache.tz === tz) return cache.m;
      var m = [];
      for (var d = 0; d < 7; d++) {
        m[d] = HOURS.map(function (h) {
          var utc = wallToUtc(tz, ref[0], ref[1] - 1, ref[2] + d, h);
          var lp = parts(tz, utc);
          var kp = parts(HOST_TZ, utc);
          var kMin = kp.h * 60 + kp.mi;
          return {
            d: d, h: h, key: d + '-' + h, utc: utc, kst: kp,
            dayDelta: kp.dayNum - lp.dayNum,
            avail: kMin >= HA.start * 60 && kMin + 60 <= HA.end * 60
          };
        });
      }
      cache = { tz: tz, m: m };
      return m;
    }
    function cellAt(tz, key) {
      var p = key.split('-').map(Number);
      var hi = HOURS.indexOf(p[1]);
      return hi >= 0 && p[0] >= 0 && p[0] < 7 ? matrix(tz)[p[0]][hi] : null;
    }

    // ── 시간 표기 ──
    function hm(h, mi) {
      h = ((h % 24) + 24) % 24;
      return { per: h < 12 ? 0 : 1, num: h % 12 || 12, mi: mi || 0 };
    }
    var PER = { en: ['AM', 'PM'], ko: ['오전', '오후'] };
    function fmtTime(h, mi) {
      var x = hm(h, mi);
      if (state.lang === 'ko') return PER.ko[x.per] + ' ' + x.num + '시' + (x.mi ? ' ' + x.mi + '분' : '');
      return x.num + (x.mi ? ':' + pad(x.mi) : '') + ' ' + PER.en[x.per];
    }
    function fmtFull(h, mi) {
      var x = hm(h, mi);
      if (state.lang === 'ko') return PER.ko[x.per] + ' ' + x.num + ':' + pad(x.mi);
      return x.num + ':' + pad(x.mi) + ' ' + PER.en[x.per];
    }
    function fmtRange(h1, m1, h2, m2) {
      var a = hm(h1, m1);
      var b = hm(h2, m2);
      if (a.per !== b.per) return fmtTime(h1, m1) + '–' + fmtTime(h2, m2);
      if (state.lang === 'ko') {
        if (!a.mi && !b.mi) return PER.ko[a.per] + ' ' + a.num + '–' + b.num + '시';
        return PER.ko[a.per] + ' ' + a.num + ':' + pad(a.mi) + '–' + b.num + ':' + pad(b.mi);
      }
      var f = function (x) { return x.num + (x.mi ? ':' + pad(x.mi) : ''); };
      return f(a) + '–' + f(b) + ' ' + PER.en[a.per];
    }

    function preset(tz) { return TZS.find(function (z) { return z.tz === tz; }); }
    function cityLabel(tz) {
      var p = preset(tz);
      if (p) return L(p.city);
      return String(tz || '').split('/').pop().replace(/_/g, ' ');
    }
    function tzLabel(tz) {
      var p = preset(tz);
      return p ? L(p) : String(tz || '').replace(/_/g, ' ');
    }

    // ── 선택값 ──
    function keysFromValue(v) {
      var set = new Set();
      ((v && v.slots) || []).forEach(function (s) {
        var bits = String(s.local || '').split(' ');
        var d = DOW.indexOf(bits[0]);
        var h = parseInt(bits[1], 10);
        if (d >= 0 && !isNaN(h)) set.add(d + '-' + h);
      });
      return set;
    }
    function current() {
      var v = state.answers.availability;
      if (!v || !isValidTz(v.timeZone)) {
        v = state.answers.availability = { timeZone: detectTz(), referenceWeek: REF_WEEK, slots: [], note: (v && v.note) || '' };
      }
      return v;
    }
    function slotRecord(c) {
      return {
        local: DOW[c.d] + ' ' + pad(c.h) + ':00',
        kst: DOW[c.kst.dow] + ' ' + pad(c.kst.h) + ':' + pad(c.kst.mi),
        utc: new Date(c.utc).toISOString().replace('.000Z', 'Z')
      };
    }
    function setKeys(set, tz) {
      var v = current();
      tz = tz || v.timeZone;
      var slots = [];
      matrix(tz).forEach(function (col) {
        col.forEach(function (c) { if (c.avail && set.has(c.key)) slots.push(slotRecord(c)); });
      });
      state.answers.availability = { timeZone: tz, referenceWeek: REF_WEEK, slots: slots, note: v.note || '' };
      save();
    }
    // 제출용 값 (요일·시간 순으로 정렬된 슬롯)
    function value(v) {
      if (!v) return { timeZone: detectTz(), referenceWeek: REF_WEEK, slots: [], note: '' };
      return {
        timeZone: v.timeZone,
        referenceWeek: REF_WEEK,
        slots: (v.slots || []).slice().sort(function (a, b) { return a.utc < b.utc ? -1 : 1; }),
        note: String(v.note || '').trim()
      };
    }

    // 같은 요일 연속 시간 묶기
    function groups(set, tz) {
      tz = tz || current().timeZone;
      var days = dayNames();
      var out = [];
      var m = matrix(tz);
      for (var d = 0; d < 7; d++) {
        var i = 0;
        while (i < HOURS.length) {
          if (!set.has(d + '-' + HOURS[i])) { i++; continue; }
          var j = i;
          while (j + 1 < HOURS.length && set.has(d + '-' + HOURS[j + 1])) j++;
          var startCell = m[d][i];
          var len = j - i + 1;
          var kEnd = parts(HOST_TZ, startCell.utc + len * 3600e3);
          var keys = [];
          for (var x = i; x <= j; x++) keys.push(d + '-' + HOURS[x]);
          out.push({
            keys: keys,
            local: days[d] + ' · ' + fmtRange(HOURS[i], 0, HOURS[j] + 1, 0),
            kst: days[startCell.kst.dow] + ' ' + fmtRange(startCell.kst.h, startCell.kst.mi, kEnd.h, kEnd.mi) + ' KST'
          });
          i = j + 1;
        }
      }
      return out;
    }

    function cellTip(c) {
      var days = dayNames();
      if (!c.avail) return days[c.d] + ' ' + fmtTime(c.h, 0) + ' — ' + t('cellOff');
      return t('cellTip', {
        local: days[c.d] + ' ' + fmtFull(c.h, 0),
        kst: days[c.kst.dow] + ' ' + fmtFull(c.kst.h, c.kst.mi)
      });
    }

    // ── 렌더 ──
    function clocksHtml(tz) {
      var now = Date.now();
      var locale = state.lang === 'ko' ? 'ko-KR' : 'en-US';
      var lp = parts(tz, now);
      var kp = parts(HOST_TZ, now);
      var sameDay = lp.dayNum === kp.dayNum;
      var diffH = (offset(HOST_TZ, now) - offset(tz, now)) / 3600e3;
      var abs = Math.abs(diffH);
      var n = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
      var badge = diffH === 0 ? '±0 h' : (diffH > 0 ? '+' : '−') + n + ' h';
      var phrase = diffH === 0 ? t('sameAs') : diffH > 0 ? t('aheadOf', { n: n }) : t('behindOf', { n: n });

      var clock = function (zone, label, cls) {
        var tp = {};
        new Intl.DateTimeFormat(locale, { timeZone: zone, hour: 'numeric', minute: '2-digit' })
          .formatToParts(now).forEach(function (p) { tp[p.type] = p.value; });
        var main = esc(tp.hour + ':' + tp.minute);
        var per = tp.dayPeriod ? '<small>' + esc(tp.dayPeriod) + '</small>' : '';
        var time = state.lang === 'ko' ? per + ' ' + main : main + ' ' + per;
        var date = new Intl.DateTimeFormat(locale, { timeZone: zone, weekday: 'long', month: 'short', day: 'numeric' }).format(now);
        return '<div class="clock ' + cls + '"><span class="clk-label">' + esc(label) + '</span>' +
          '<span class="clk-time">' + time + '</span>' +
          '<span class="clk-date' + (sameDay ? '' : ' is-diff') + '">' + esc(date) + '</span></div>';
      };
      return clock(tz, t('you') + ' · ' + cityLabel(tz), 'you') +
        '<div class="clk-divider" aria-hidden="true"><span class="clk-diff">' + esc(badge) + '</span></div>' +
        clock(HOST_TZ, (CFG.HOST_NAME || 'Host') + ' · ' + t('hostCity'), 'host') +
        '<div class="clk-ahead">' + esc(phrase) + '</div>';
    }

    function tzPickerHtml(tz) {
      if (!state.ui.tzOpen) return '';
      var opts = TZS.slice();
      if (!preset(tz)) opts.unshift({ tz: tz, en: tzLabel(tz), ko: tzLabel(tz) });
      var html = '<div class="tz-picker"><select class="tz-select" data-fid="tz-select" aria-label="' + esc(t('tzYour')) + '">' +
        opts.map(function (z) {
          return '<option value="' + esc(z.tz) + '"' + (z.tz === tz && !state.ui.tzOther ? ' selected' : '') + '>' + esc(L(z)) + '</option>';
        }).join('') +
        '<option value="__other"' + (state.ui.tzOther ? ' selected' : '') + '>' + esc(t('tzOther')) + '</option></select>';
      if (state.ui.tzOther) {
        html += '<input class="tz-search" type="text" list="tzList" data-fid="tz-search" placeholder="' + esc(t('tzSearch')) + '"' +
          ' aria-label="' + esc(t('tzSearch')) + '" autocomplete="off" spellcheck="false">' +
          '<datalist id="tzList">' + allZones().map(function (z) { return '<option value="' + esc(z) + '">'; }).join('') + '</datalist>';
      }
      return html + '</div>';
    }

    function gridHtml(tz, set) {
      var m = matrix(tz);
      var days = dayNames();
      var firstAvail = null;
      var focusKey = null;
      m.forEach(function (col) {
        col.forEach(function (c) {
          if (c.avail && !firstAvail) firstAvail = c.key;
          if (set.has(c.key) && !focusKey) focusKey = c.key;
        });
      });
      focusKey = focusKey || firstAvail;
      var head = '<div class="sg-row sg-head" aria-hidden="true"><span class="sg-tz">' + esc(cityLabel(tz)) + '</span>' +
        days.map(function (d) { return '<span>' + esc(d) + '</span>'; }).join('') +
        '<span class="sg-kst-h">' + esc(t('hostCity')) + '</span></div>';
      var rows = HOURS.map(function (h, hi) {
        var c0 = m[0][hi];
        var plus = c0.dayDelta ? '<span class="plus">' + (c0.dayDelta > 0 ? '+' : '−') + Math.abs(c0.dayDelta) + 'd</span>' : '';
        return '<div class="sg-row"><span class="sg-label">' + esc(fmtTime(h, 0)) + '</span>' +
          m.map(function (col) {
            var c = col[hi];
            var on = set.has(c.key);
            return '<button type="button" class="cell choice' + (c.avail ? '' : ' off') + (on ? ' on' : '') + '"' +
              ' data-key="' + c.key + '" data-fid="cell:' + c.key + '" aria-pressed="' + on + '"' +
              (c.avail ? '' : ' aria-disabled="true"') + ' aria-label="' + esc(cellTip(c)) + '"' +
              ' tabindex="' + (c.key === focusKey ? 0 : -1) + '">' + ICON.cellCheck + '</button>';
          }).join('') +
          '<span class="sg-kst" aria-hidden="true">' + esc(fmtTime(c0.kst.h, c0.kst.mi)) + plus + '</span></div>';
      }).join('');
      var legend = '<div class="sg-legend"><span><i></i>' + esc(t('legendFree')) + '</span><span><i class="on"></i>' + esc(t('legendOn')) +
        '</span><span><i class="off"></i>' + esc(t('legendOff')) + '</span></div>';
      return '<div class="sched-grid-wrap"><div class="sched-grid" role="group" aria-label="' + esc(t('weeklyGrid')) + '">' + head + rows + '</div>' +
        legend + '<div class="sched-tip" id="schedTip" hidden></div></div>';
    }

    function listRowsHtml(tz, set, day) {
      var col = matrix(tz)[day];
      var days = dayNames();
      var html = '';
      var i = 0;
      while (i < col.length) {
        var c = col[i];
        if (!c.avail) {
          var j = i;
          while (j + 1 < col.length && !col[j + 1].avail) j++;
          html += '<div class="sl-row"><div class="sl-off"><span>' + esc(fmtTime(col[i].h, 0) + ' – ' + fmtTime(col[j].h + 1, 0) + ' · ' + t('unavailable')) +
            '</span></div></div>';
          i = j + 1;
          continue;
        }
        var on = set.has(c.key);
        var kDay = c.dayDelta ? days[c.kst.dow] + ' ' : '';
        html += '<div class="sl-row"><span class="sl-label">' + esc(fmtTime(c.h, 0)) + '</span>' +
          '<button type="button" class="lcell' + (on ? ' on' : '') + '" data-key="' + c.key + '" data-fid="lcell:' + c.key + '"' +
          ' aria-pressed="' + on + '" aria-label="' + esc(cellTip(c)) + '"><span>' + esc(t('hostCity') + ' · ' + kDay + fmtTime(c.kst.h, c.kst.mi)) +
          '</span>' + ICON.cellCheck + '</button></div>';
        i++;
      }
      return html;
    }

    function tabsHtml(set) {
      var day = state.ui.schedDay;
      return dayNames().map(function (d, i) {
        var has = Array.from(set).some(function (k) { return k.indexOf(i + '-') === 0; });
        return '<button type="button" class="day-tab' + (has ? ' has' : '') + '" role="tab" aria-selected="' + (i === day) + '"' +
          ' data-action="sched-day" data-day="' + i + '" data-fid="tab:' + i + '">' + esc(d) + '<span class="dot" aria-hidden="true"></span></button>';
      }).join('');
    }

    function chipsHtml(set, tz) {
      return groups(set, tz).map(function (g) {
        return '<div class="chip"><span class="chip-text"><span class="chip-local">' + esc(g.local) + '</span>' +
          '<span class="chip-kst">' + esc(g.kst) + '</span></span>' +
          '<button type="button" class="chip-x" data-action="chip-x" data-keys="' + g.keys.join(',') + '" aria-label="' + esc(t('removeSlot') + ': ' + g.local) + '">' +
          ICON.x + '</button></div>';
      }).join('');
    }

    function render(q) {
      var v = current();
      var tz = v.timeZone;
      var set = keysFromValue(v);
      if (state.ui.schedDay == null) state.ui.schedDay = parts(tz, Date.now()).dow;

      var clock = '<div class="sched-clock"><div class="clocks" id="clocks">' + clocksHtml(tz) + '</div>' +
        '<div class="tz-line"><span><span class="tz-label">' + esc(t('tzYour')) + ': </span><b>' + esc(tzLabel(tz)) + '</b></span>' +
        '<button type="button" class="link-btn" data-action="tz-open" data-fid="tz-open" aria-expanded="' + state.ui.tzOpen + '">' + esc(t('tzChange')) + '</button></div>' +
        tzPickerHtml(tz) + '</div>';

      var board = '<div class="sched-board">' + gridHtml(tz, set) +
        '<div class="sched-list"><div class="day-tabs" role="tablist" aria-label="' + esc(t('weeklyGrid')) + '">' + tabsHtml(set) + '</div>' +
        '<div class="sl-rows" role="tabpanel" id="slRows">' + listRowsHtml(tz, set, state.ui.schedDay) + '</div></div></div>';

      var summary = '<div class="sched-summary">' +
        '<div class="summary-top"><span class="slot-count" id="slotCount">' + esc(t('slotsSelected', { n: (v.slots || []).length })) + '</span>' +
        '<div class="chips" id="chips">' + chipsHtml(set, tz) + '</div></div>' +
        '<label class="note-field">' + esc(t('schedNote')) +
        '<input class="note-input" type="text" data-field="note" data-fid="sched-note" value="' + esc(v.note || '') + '"' +
        ' placeholder="' + esc(t('schedNotePh')) + '" maxlength="300" autocomplete="off" enterkeyhint="done"></label>' +
        '<p class="form-msg" id="formMsg" role="status" aria-live="polite"></p>' +
        toReviewInline() + actionsHtml(q) + '</div>';

      return '<div class="stage stage-sched"><div class="q-block">' + railHtml(q) +
        '<div class="q-body"><div class="q-head">' + titleHtml(q) + '</div>' +
        '<div class="sched">' + clock + board + summary + '</div>' +
        '</div></div></div>';
    }

    // 선택 변경 후 부분 갱신 (드래그 중 전체 재렌더 방지)
    function updateUI() {
      var v = current();
      var set = keysFromValue(v);
      $$('[data-key]', $view).forEach(function (el) {
        var on = set.has(el.dataset.key);
        el.classList.toggle('on', on);
        el.setAttribute('aria-pressed', on);
      });
      $$('.day-tab', $view).forEach(function (el, i) {
        el.classList.toggle('has', Array.from(set).some(function (k) { return k.indexOf(i + '-') === 0; }));
      });
      var count = $('#slotCount', $view);
      if (count) count.textContent = t('slotsSelected', { n: v.slots.length });
      var chips = $('#chips', $view);
      if (chips) chips.innerHTML = chipsHtml(set, v.timeZone);
      clearMsg();
      renderFooter();
    }

    function setCell(key, on) {
      var v = current();
      var c = cellAt(v.timeZone, key);
      if (!c || !c.avail) return;
      var set = keysFromValue(v);
      if (on) set.add(key); else set.delete(key);
      setKeys(set);
      updateUI();
    }
    function toggle(key) { setCell(key, !keysFromValue(current()).has(key)); }
    function removeKeys(keys) {
      var set = keysFromValue(current());
      keys.forEach(function (k) { set.delete(k); });
      setKeys(set);
      updateUI();
    }
    function applyTz(tz) {
      if (!isValidTz(tz)) return false;
      var set = keysFromValue(current());
      setKeys(set, tz);
      state.ui.tzOpen = false;
      state.ui.tzOther = false;
      refresh();
      var btn = $('[data-fid="tz-open"]', $view);
      if (btn) btn.focus({ preventScroll: true });
      return true;
    }
    function setNote(text) {
      current().note = text;
      save();
    }
    function showDay(day) {
      state.ui.schedDay = day;
      var v = current();
      var set = keysFromValue(v);
      var rows = $('#slRows', $view);
      if (rows) rows.innerHTML = listRowsHtml(v.timeZone, set, day);
      $$('.day-tab', $view).forEach(function (el, i) { el.setAttribute('aria-selected', i === day); });
    }
    function updateClocks() {
      var el = $('#clocks', $view);
      if (el) el.innerHTML = clocksHtml(current().timeZone);
    }

    return {
      HOURS: HOURS,
      render: render, toggle: toggle, setCell: setCell, removeKeys: removeKeys, applyTz: applyTz, setNote: setNote,
      showDay: showDay, updateClocks: updateClocks, keysFromValue: keysFromValue, groups: groups, value: value,
      tzLabel: tzLabel, cellTip: cellTip, cellAt: cellAt, current: current, isValidTz: isValidTz
    };
  })();

  function renderSchedule(q) { return Sched.render(q); }
  function updateClocks() { Sched.updateClocks(); }

  // 데스크톱 그리드: 마우스 드래그로 연속 선택/해제
  var drag = null;
  var lastPointer = 'mouse';
  document.addEventListener('pointerdown', function (e) {
    lastPointer = e.pointerType || 'mouse';
    var cell = e.target.closest('.sched-grid .cell');
    if (!cell || e.pointerType !== 'mouse' || e.button !== 0) return;
    e.preventDefault();
    cell.focus({ preventScroll: true });
    if (cell.classList.contains('off')) return;
    var on = !cell.classList.contains('on');
    drag = { on: on };
    Sched.setCell(cell.dataset.key, on);
  });
  document.addEventListener('pointerover', function (e) {
    var cell = e.target.closest && e.target.closest('.sched-grid .cell');
    if (cell && e.pointerType === 'mouse') showTip(cell);
    if (!drag || !cell || cell.classList.contains('off')) return;
    if (cell.classList.contains('on') !== drag.on) Sched.setCell(cell.dataset.key, drag.on);
  });
  document.addEventListener('pointerout', function (e) {
    if (e.target.closest && e.target.closest('.sched-grid') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.sched-grid .cell'))) hideTip();
  });
  window.addEventListener('pointerup', function () { drag = null; });
  window.addEventListener('pointercancel', function () { drag = null; });

  function showTip(cell) {
    var tip = $('#schedTip', $view);
    var wrap = cell.closest('.sched-grid-wrap');
    if (!tip || !wrap) return;
    var c = Sched.cellAt(Sched.current().timeZone, cell.dataset.key);
    if (!c) return;
    tip.textContent = Sched.cellTip(c);
    tip.hidden = false;
    var wr = wrap.getBoundingClientRect();
    var cr = cell.getBoundingClientRect();
    var half = tip.offsetWidth / 2;
    var x = Math.min(Math.max(cr.left - wr.left + cr.width / 2, half), wr.width - half);
    tip.style.left = x + 'px';
    tip.style.top = (cr.top - wr.top) + 'px';
  }
  function hideTip() {
    var tip = $('#schedTip', $view);
    if (tip) tip.hidden = true;
  }

  function moveCell(cell, key) {
    var p = cell.dataset.key.split('-').map(Number);
    var hi = Sched.HOURS.indexOf(p[1]);
    var d = p[0];
    if (key === 'ArrowLeft') d--;
    else if (key === 'ArrowRight') d++;
    else if (key === 'ArrowUp') hi--;
    else if (key === 'ArrowDown') hi++;
    if (d < 0 || d > 6 || hi < 0 || hi >= Sched.HOURS.length) return;
    var target = $('.sched-grid .cell[data-key="' + d + '-' + Sched.HOURS[hi] + '"]', $view);
    if (!target) return;
    cell.tabIndex = -1;
    target.tabIndex = 0;
    target.focus();
    showTip(target);
  }

  // ── 텍스트 입력 ─────────────────────────────────────

  function autosize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 2 + 'px';
  }

  document.addEventListener('input', function (e) {
    var el = e.target;
    var field = el.dataset && el.dataset.field;
    if (!field) return;
    var q = currentQuestion();
    if (!q) return;
    if (field === 'answer') state.answers[q.id] = el.value;
    else if (field === 'other') state.answers[q.id + '_other'] = el.value;
    else if (field === 'note') Sched.setNote(el.value);
    if (el.tagName === 'TEXTAREA') autosize(el);
    clearMsg();
    save();
    renderFooter();
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.classList.contains('tz-select')) {
      if (el.value === '__other') {
        state.ui.tzOther = true;
        refresh();
        var search = $('.tz-search', $view);
        if (search) search.focus();
      } else {
        Sched.applyTz(el.value);
      }
    } else if (el.classList.contains('tz-search')) {
      Sched.applyTz(el.value.trim());
    }
  });

  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.row != null && el.dataset.action === 'likert') {
      var row = +el.dataset.row;
      if (row !== state.ui.likertRow) setLikertRow(row);
    }
    if (el.classList && el.classList.contains('cell') && !isTouch()) showTip(el);
    // 휴대폰에서 키보드가 올라올 때 입력란이 가려지지 않게
    if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && isTouch()) {
      setTimeout(function () { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 300);
    }
  });
  document.addEventListener('focusout', function (e) {
    if (e.target.classList && e.target.classList.contains('cell')) hideTip();
  });

  // ── 클릭 ─────────────────────────────────────────────

  document.addEventListener('click', function (e) {
    var cell = e.target.closest('.cell, .lcell');
    if (cell) {
      // 마우스는 pointerdown(드래그)에서 처리, 키보드(Space)·터치는 여기서
      if (cell.classList.contains('cell') && e.detail !== 0 && lastPointer === 'mouse') return;
      if (cell.classList.contains('off')) return;
      Sched.toggle(cell.dataset.key);
      return;
    }

    var a = e.target.closest('[data-action]');
    if (!a || a.disabled) return;
    var act = a.dataset.action;
    var q = currentQuestion();

    switch (act) {
      case 'lang': pickLang(a.dataset.lang); break;
      case 'set-lang': setLang(a.dataset.lang); break;
      case 'start': start(); break;
      case 'next': next(); break;
      case 'back': back(); break;
      case 'skip': skipQuestion(); break;
      case 'to-review': toReview(); break;
      case 'opt':
        if (!q) break;
        if (a.getAttribute('aria-disabled') === 'true') { setMsg(t('maxReached')); break; }
        handleOption(q, a.dataset.opt, false);
        break;
      case 'scale': if (q) pickScale(q, +a.dataset.val); break;
      case 'likert': if (q) pickLikert(q, +a.dataset.row, +a.dataset.val); break;
      case 'edit':
        state.returnToReview = true;
        go('step', a.dataset.step, -1);
        break;
      case 'submit':
      case 'retry': submit(); break;
      case 'download': downloadResponses(); break;
      case 'tz-open':
        state.ui.tzOpen = !state.ui.tzOpen;
        state.ui.tzOther = false;
        refresh();
        if (state.ui.tzOpen) { var sel = $('.tz-select', $view); if (sel) sel.focus(); }
        break;
      case 'chip-x': Sched.removeKeys(a.dataset.keys.split(',')); break;
      case 'sched-day': Sched.showDay(+a.dataset.day); break;
    }
  });

  // ── 키보드 ───────────────────────────────────────────

  document.addEventListener('keydown', function (e) {
    if (e.isComposing || e.keyCode === 229) return; // 한글 IME 조합 중
    var el = e.target;
    var tag = el.tagName;
    var inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    var mod = e.ctrlKey || e.metaKey || e.altKey;
    var key = e.key;

    if (state.screen === 'lang') {
      if (mod || inField) return;
      if (key === 'e' || key === 'E') { e.preventDefault(); pickLang('en'); }
      else if (key === 'k' || key === 'K') { e.preventDefault(); pickLang('ko'); }
      return;
    }
    if (state.submitting || state.screen === 'thanks') return;

    if (key === 'Escape') {
      if (state.ui.tzOpen) {
        state.ui.tzOpen = false;
        state.ui.tzOther = false;
        refresh();
        var btn = $('[data-fid="tz-open"]', $view);
        if (btn) btn.focus();
        return;
      }
      e.preventDefault();
      back();
      return;
    }

    if (key === 'Enter') {
      if (mod) return;
      if (tag === 'TEXTAREA') { if (e.shiftKey) return; e.preventDefault(); next(); return; }
      if (tag === 'SELECT') return;
      if (el.classList.contains('tz-search')) {
        e.preventDefault();
        Sched.applyTz(el.value.trim());
        return;
      }
      if (tag === 'INPUT') { e.preventDefault(); next(); return; }
      // 일반 버튼·링크는 기본 동작, 선택지(카드·셀)에서는 Enter = 다음
      if ((tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') && !el.classList.contains('choice')) return;
      e.preventDefault();
      next();
      return;
    }

    if (inField || mod) return;
    var q = currentQuestion();
    if (!q) return;

    if (el.classList.contains('cell') && key.indexOf('Arrow') === 0) {
      e.preventDefault();
      moveCell(el, key);
      return;
    }
    if (key === 'ArrowUp' && !el.closest('.sched')) {
      e.preventDefault();
      back();
      return;
    }
    if (/^[1-9]$/.test(key)) {
      if (q.type === 'scale') { e.preventDefault(); pickScale(q, +key); }
      else if (q.type === 'likert' && +key <= q.scale.length) { e.preventDefault(); pickLikert(q, state.ui.likertRow, +key); }
      return;
    }
    if (/^[a-z]$/i.test(key)) {
      var opts = optionList(q);
      var i = LETTERS.indexOf(key.toUpperCase());
      if (i < 0 || i >= opts.length) return;
      e.preventDefault();
      var card = $('[data-opt="' + CSS.escape(opts[i].id) + '"]', $view);
      if (card && card.getAttribute('aria-disabled') === 'true') { setMsg(t('maxReached')); return; }
      handleOption(q, opts[i].id, true);
    }
  });

  // ── iOS 키보드: 보이는 영역에 맞춰 높이 조정 ──────────

  if (window.visualViewport) {
    var vv = window.visualViewport;
    var onViewport = function () {
      var shrunk = window.innerHeight - vv.height > 80;
      if (shrunk) {
        document.documentElement.style.setProperty('--app-h', vv.height + 'px');
        window.scrollTo(0, 0);
      } else {
        document.documentElement.style.removeProperty('--app-h');
      }
    };
    vv.addEventListener('resize', onViewport);
  }

  // ── 시작 ─────────────────────────────────────────────

  function init() {
    var params = new URLSearchParams(window.location.search);
    var saved = store.get();
    if (saved && typeof saved === 'object') {
      state.lang = saved.lang === 'ko' || saved.lang === 'en' ? saved.lang : null;
      state.answers = saved.answers && typeof saved.answers === 'object' ? saved.answers : {};
      state.startedAt = saved.startedAt || null;
      state.returnToReview = !!saved.returnToReview;
      state.screen = saved.screen || 'lang';
      state.step = saved.step || null;
    }

    var pl = params.get('lang');
    if (pl === 'en' || pl === 'ko') {
      state.lang = pl;
      if (state.screen === 'lang') state.screen = 'welcome';
    }
    var pn = (params.get('name') || '').trim();
    if (pn && !String(state.answers.name || '').trim()) state.answers.name = pn;

    // 복원 상태 점검
    if (!state.lang) state.screen = 'lang';
    if (['lang', 'welcome', 'step', 'review'].indexOf(state.screen) < 0) state.screen = state.lang ? 'welcome' : 'lang';
    if (state.screen === 'step' && (!BY_KEY[state.step] || !isVisible(BY_KEY[state.step]))) state.screen = 'welcome';

    save();
    renderAll();
    focusInitial();
  }

  init();
})();
