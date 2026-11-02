/* 中国語図鑑：覚えた言葉の一覧（未習得はシルエット） */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc } = App.U;
  const UI = App.UI;

  App.screens.dictionary = (root) => {
    const city = App.currentCity();
    const P = App.Progress;
    const learned = App.Store.state.learned;
    const totalIds = P.playableSpots(city).flatMap((s) => s.phrases);
    const count = totalIds.filter((id) => learned[id]).length;

    const groups = P.playableSpots(city).map((s) => `
      <section class="dict-group">
        <h3>${s.emoji} ${esc(s.name)} <small>${esc(s.theme)}</small></h3>
        <ul class="dict-list">
          ${s.phrases.map((id) => {
            const p = App.PHRASES[id];
            const e = learned[id];
            if (!e) {
              return `<li class="is-locked"><span class="zh">？？？</span><span class="muted">${esc(s.name)}で覚えられるよ</span></li>`;
            }
            return `<li>
              <div class="dict-main"><span class="zh">${esc(p.zh)}</span>${UI.pinyin(p.py, { force: true })}</div>
              <div class="dict-sub"><span class="ja">${esc(p.ja)}</span>${UI.stars(e.strength)}</div>
              ${UI.speakBtn(p.zh, { cls: 'speak-sm' })}
            </li>`;
          }).join('')}
        </ul>
      </section>`).join('');

    root.innerHTML = `
      ${UI.topbar({ title: '📖 中国語図鑑', back: 'title' })}
      <main class="page">
        <div class="dict-summary card">
          <div><b class="big-num">${count}</b> / ${totalIds.length} 語</div>
          <div class="progress"><div class="progress-fill" style="width:${totalIds.length ? (count / totalIds.length) * 100 : 0}%"></div></div>
          <p class="muted small">★は覚え度。復習で正解すると増えるよ</p>
        </div>
        ${groups}
      </main>`;
  };
})(window.App = window.App || {});
