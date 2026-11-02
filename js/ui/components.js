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

    // 設定でピンイン非表示にできる（学習カードでは force で常に表示）
    pinyin(py, { force = false, cls = '' } = {}) {
      if (!py || (!force && !App.Store.state.settings.showPinyin)) return '';
      return `<div class="py ${cls}">${esc(py)}</div>`;
    },

    hamsterSays(text, { mood = 'normal', size = 'sm', cls = '' } = {}) {
      return `
        <div class="hamster-says ${cls}">
          ${App.Hamster.figure({ mood, size })}
          <div class="bubble">${text}</div>
        </div>`;
    },

    stars(n, max = 5) {
      return `<span class="stars" aria-label="覚え度 ${n}/${max}">${'★'.repeat(n)}<i>${'★'.repeat(max - n)}</i></span>`;
    },
  };

  App.UI = UI;
})(window.App = window.App || {});
