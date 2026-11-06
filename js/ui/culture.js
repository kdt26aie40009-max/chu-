/* 文化メモのカード（建物・食べ物の説明と歴史）
 * App.Culture.card(id)      … カードの HTML（3D の会話モーダルや、2D のシートの中に入れる）
 * App.Culture.open(id)      … 2D 画面の上にシートで開く（マップ・図鑑から）
 * App.Culture.markRead(id)  … 読んだ記録（図鑑の「読んだ数」に使う）
 * App.Culture.byStage(id)   … そのステージの文化メモ一覧
 * データは js/data/culture.js
 */
(function (App) {
  'use strict';

  const { esc } = App.U;
  const KIND = { place: '🏛️ 建物・場所', food: '🍽️ 食べ物', thing: '🔎 もの' };

  const C = {
    get: (id) => App.CULTURE[id] || null,
    list: () => Object.keys(App.CULTURE).map((id) => Object.assign({ id }, App.CULTURE[id])),
    byStage: (stageId) => C.list().filter((c) => c.stage === stageId),
    isRead: (id) => !!(App.Store.state.culture || {})[id],
    readCount: () => C.list().filter((c) => C.isRead(c.id)).length,
    markRead(id) {
      const st = App.Store.state;
      if (!st.culture) st.culture = {};
      if (st.culture[id]) return false;
      st.culture[id] = App.U.todayKey();
      App.Store.save();
      return true;
    },

    card(id) {
      const c = C.get(id);
      if (!c) return '';
      const UI = App.UI;
      return `
        <article class="cul-card cul-${c.kind}">
          <header class="cul-head">
            <span class="cul-emoji" aria-hidden="true">${c.emoji}</span>
            <div class="cul-title">
              <small>${KIND[c.kind] || ''}</small>
              <h3>${esc(c.name)}</h3>
              <div class="cul-zh"><span class="zh">${esc(c.zh)}</span>${UI.speakBtn(c.zh, { cls: 'speak-sm' })}</div>
              ${UI.pinyin(c.py, { force: true })}
            </div>
          </header>
          <p class="cul-lead">${esc(c.lead)}</p>
          <section class="cul-sec">
            <h4>📖 どんなもの？</h4>
            ${c.body.map((t) => `<p>${esc(t)}</p>`).join('')}
          </section>
          ${c.history && c.history.length ? `
          <section class="cul-sec">
            <h4>⏳ 歴史</h4>
            <ol class="cul-history">${c.history.map(([when, what]) => `
              <li class="${when === '伝説' ? 'is-legend' : ''}"><b>${esc(when)}</b><span>${esc(what)}</span></li>`).join('')}
            </ol>
          </section>` : ''}
          ${c.mochi ? UI.hamsterSays(esc(c.mochi), { mood: 'happy', size: 'xs', cls: 'is-compact cul-mochi' }) : ''}
        </article>`;
    },

    // 2D の画面の上にシートで開く
    open(id, { onClose } = {}) {
      if (!C.get(id)) return;
      C.markRead(id);
      const wrap = document.createElement('div');
      wrap.className = 'cs-sheet-wrap cul-sheet-wrap';
      wrap.innerHTML = `<div class="cs-sheet card cul-sheet">${C.card(id)}<button class="btn btn-primary btn-block" data-cul-close>とじる</button></div>`;
      const close = () => {
        wrap.remove();
        if (onClose) onClose();
      };
      wrap.onclick = (e) => { if (e.target === wrap) close(); };
      wrap.querySelector('[data-cul-close]').onclick = () => { App.Sfx.play('tap'); close(); };
      document.body.appendChild(wrap);
      App.Sfx.play('tap');
    },

    // 一覧用の小さなボタン（マップのシート・図鑑）
    chip(c) {
      return `<button class="cul-chip${C.isRead(c.id) ? ' is-read' : ''}" data-culture="${c.id}">
        <span aria-hidden="true">${c.emoji}</span>${esc(c.name)}${C.isRead(c.id) ? '' : '<i>NEW</i>'}</button>`;
    },
  };

  App.Culture = C;
})(window.App = window.App || {});
