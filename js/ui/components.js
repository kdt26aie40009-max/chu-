/* 共通 UI パーツ（HTML 文字列を返す） */
(function (App) {
  'use strict';

  const { esc } = App.U;

  const UI = {
    topbar({ title, back = 'map', confirmMsg = '', right = '' }) {
      const conf = confirmMsg ? ` data-confirm="${esc(confirmMsg)}"` : '';
      return `
        <header class="topbar">
          <button class="icon-btn" data-go="${back}"${conf} aria-label="もどる">‹</button>
          <div class="topbar-title">${title}</div>
          <div class="topbar-right">${right}</div>
        </header>`;
    },

    levelChip() {
      return `<span class="chip chip-level">Lv.${App.Progress.level().level}</span>`;
    },

    expBar(lv = App.Progress.level()) {
      return `<div class="exp" role="progressbar" aria-valuenow="${lv.cur}" aria-valuemax="${lv.need}">
        <div class="exp-fill" style="width:${(lv.cur / lv.need) * 100}%"></div></div>`;
    },

    speakBtn(zh, { slow = false, label = '🔊', cls = '' } = {}) {
      return `<button class="speak-btn ${cls}" data-speak="${esc(zh)}"${slow ? ' data-slow="1"' : ''} aria-label="音声を聞く">${label}</button>`;
    },

    // 読み上げ速度の切り替え（押すと main.js が設定を保存して、画面上のすべての切り替えを更新する）
    rateToggle({ cls = '' } = {}) {
      const cur = App.Speech.rate();
      return `<div class="rate-toggle ${cls}" role="group" aria-label="読み上げの速さ">
        <span class="rate-toggle-label">🔊 速さ</span>
        ${App.Speech.RATES.map((r) => `<button class="rate-btn" data-rate-set="${r}" aria-pressed="${r === cur}">${r.toFixed(1)}x</button>`).join('')}
      </div>`;
    },

    // 中国語音声が端末にないときのお知らせ（状態は Speech.refreshNotices で更新）
    voiceNotice() {
      const text = App.Speech.noticeText();
      return `<p class="voice-notice" data-voice-notice role="status"${text ? '' : ' hidden'}>${esc(text)}</p>`;
    },

    // 設定でピンイン非表示にできる（学習カードでは force で常に表示）
    pinyin(py, { force = false, cls = '' } = {}) {
      if (!py || (!force && !App.Store.state.settings.showPinyin)) return '';
      return `<div class="py ${cls}">${esc(py)}</div>`;
    },

    // モチの声で聞くボタン（押すと main.js が App.MochiVoice で読む。設定で声をオフにしていても聞ける）
    mochiBtn(text) {
      if (!App.MOCHI_VOICE || !/[ぁ-ゖ]/.test(App.MochiVoice.toKana(text))) return '';
      return `<button class="mochi-btn" data-mochi="${esc(text)}" aria-label="モチの声で聞く">🔊</button>`;
    },

    hamsterSays(text, { mood = 'normal', size = 'sm', cls = '' } = {}) {
      return `
        <div class="hamster-says ${cls}">
          ${App.Hamster.figure({ mood, size })}
          <div class="bubble">${text}${UI.mochiBtn(text)}</div>
        </div>`;
    },

    // 画面下のタブ（学ぶ ⇄ 旅する をすぐ切り替えられる）
    tabbar(active) {
      const tabs = [
        ['course', '📘', '学ぶ'],
        ['map', '🗺️', '旅する'],
        ['dictionary', '📖', '図鑑'],
        ['journal', '📔', '記録'],
        ['settings', '⚙️', '設定'],
      ];
      return `<nav class="tabbar">${tabs.map(([go, icon, label]) =>
        `<button class="tab${go === active ? ' is-cur' : ''}" data-go="${go}"${go === active ? ' aria-current="page"' : ''}>
          <span>${icon}</span>${label}${go === 'course' && App.Progress.needsReview() ? '<i class="tab-dot"></i>' : ''}</button>`).join('')}</nav>`;
    },

    stars(n, max = 5) {
      return `<span class="stars" aria-label="覚え度 ${n}/${max}">${'★'.repeat(n)}<i>${'★'.repeat(max - n)}</i></span>`;
    },
  };

  App.UI = UI;
})(window.App = window.App || {});
