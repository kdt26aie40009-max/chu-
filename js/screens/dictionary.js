/* 中国語図鑑：コースのユニットごとに、覚えた言葉の一覧（未習得はシルエット） */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc } = App.U;
  const UI = App.UI;

  App.screens.dictionary = (root) => {
    const learned = App.Store.state.learned;
    const units = App.Course.units();
    const ids = units.flatMap((u) => u.lessons.filter((l) => !l.review).flatMap((l) => l.ids));
    const count = ids.filter((id) => learned[id]).length;

    const groups = units.map((u) => {
      const uIds = u.lessons.filter((l) => !l.review).flatMap((l) => l.ids);
      const n = uIds.filter((id) => learned[id]).length;
      return `
        <section class="dict-group">
          <h3>${u.emoji} ${esc(u.title)} <small>${n} / ${uIds.length}</small></h3>
          <ul class="dict-list">
            ${uIds.map((id) => {
              const p = App.PHRASES[id];
              const e = learned[id];
              if (!e) return `<li class="is-locked"><span class="zh">？？？</span><span class="muted">${esc(App.PHRASE_LESSON[id].title)}で覚えるよ</span></li>`;
              return `<li>
                <div class="dict-main"><span class="zh">${esc(p.zh)}</span>${UI.pinyin(p.py, { force: true })}</div>
                <div class="dict-sub"><span class="ja">${esc(p.ja)}</span>${UI.stars(e.strength)}</div>
                ${UI.speakBtn(p.zh, { cls: 'speak-sm' })}
              </li>`;
            }).join('')}
          </ul>
        </section>`;
    }).join('');

    root.innerHTML = `
      ${UI.topbar({ title: '📖 中国語図鑑', back: 'title' })}
      <main class="page">
        <div class="dict-summary card">
          <div><b class="big-num">${count}</b> / ${ids.length} 語</div>
          <div class="progress"><div class="progress-fill" style="width:${ids.length ? (count / ids.length) * 100 : 0}%"></div></div>
          <p class="muted small">★は覚え度。レッスンや復習で正解すると増えるよ</p>
        </div>
        ${groups}
      </main>
      ${UI.tabbar('dictionary')}`;
  };
})(window.App = window.App || {});
