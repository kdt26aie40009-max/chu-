/* 図鑑
 *   ことば … コースのユニットごとに、覚えた言葉の一覧（未習得はシルエット。チート中は全部見られる）
 *   文化   … 旅先の建物・食べ物の文化メモ（js/data/culture.js）。いつでも読める。読んだものに ✓
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc } = App.U;
  const UI = App.UI;

  App.screens.dictionary = (root, params = {}) => {
    if (params.tab === 'culture') { cultureTab(root); return; }
    const learned = App.Store.state.learned;
    const all = App.cheat(); // チート（Ctrl を 3 回）中は、まだ覚えていない言葉も見られる
    const units = App.Course.units();
    const ids = Array.from(new Set(units.flatMap((u) => u.lessons.filter((l) => !l.review).flatMap((l) => l.ids))));
    const count = ids.filter((id) => learned[id]).length;

    const groups = units.map((u) => {
      const uIds = Array.from(new Set(u.lessons.filter((l) => !l.review).flatMap((l) => l.ids)));
      const n = uIds.filter((id) => learned[id]).length;
      return `
        <section class="dict-group">
          <h3>${u.emoji} ${esc(u.title)} <small>${n} / ${uIds.length}</small></h3>
          <ul class="dict-list">
            ${uIds.map((id) => {
              const p = App.PHRASES[id];
              const e = learned[id];
              if (!e && !all) return `<li class="is-locked"><span class="zh">？？？</span><span class="muted">${esc((App.PHRASE_LESSON[id] || u).title)}で覚えるよ</span></li>`;
              return `<li>
                <div class="dict-main"><span class="zh">${esc(p.zh)}</span>${UI.pinyin(p.py, { force: true })}</div>
                <div class="dict-sub"><span class="ja">${esc(p.ja)}</span>${e ? UI.stars(e.strength) : '<span class="muted small">まだ覚えていない</span>'}</div>
                ${UI.speakBtn(p.zh, { cls: 'speak-sm' })}
              </li>`;
            }).join('')}
          </ul>
        </section>`;
    }).join('');

    root.innerHTML = `
      ${UI.topbar({ title: '📖 図鑑', back: 'title' })}
      <main class="page">
        ${tabs('words')}
        <div class="dict-summary card">
          <div><b class="big-num">${count}</b> / ${ids.length} 語</div>
          <div class="progress"><div class="progress-fill" style="width:${ids.length ? (count / ids.length) * 100 : 0}%"></div></div>
          <p class="muted small">★は覚え度。レッスンや復習で正解すると増えるよ${all ? '<br>🔓 チート中：まだ覚えていない言葉も全部見られるよ' : ''}</p>
        </div>
        ${groups}
      </main>
      ${UI.tabbar('dictionary')}`;
    bindTabs(root);
  };

  const tabs = (cur) => `
    <nav class="dict-tabs">
      <button class="${cur === 'words' ? 'is-cur' : ''}" data-dict-tab="words">🗣️ ことば</button>
      <button class="${cur === 'culture' ? 'is-cur' : ''}" data-dict-tab="culture">🏯 文化</button>
    </nav>`;
  const bindTabs = (root) => root.querySelectorAll('[data-dict-tab]').forEach((b) => {
    b.onclick = () => { App.Sfx.play('tap'); App.go('dictionary', { tab: b.dataset.dictTab }); };
  });

  // 文化メモ：旅のステージ順に並べる
  function cultureTab(root) {
    const C = App.Culture;
    const all = C.list();
    const read = C.readCount();
    const groups = App.Trip.stages().map((st) => {
      const list = C.byStage(st.id);
      if (!list.length) return '';
      const n = list.filter((c) => C.isRead(c.id)).length;
      return `
        <section class="dict-group">
          <h3>${st.emoji} ${esc(st.name)} <small>${n} / ${list.length}</small></h3>
          <ul class="cul-list">
            ${list.map((c) => `
              <li><button class="cul-item${C.isRead(c.id) ? ' is-read' : ''}" data-culture="${c.id}">
                <span class="cul-item-emoji" aria-hidden="true">${c.emoji}</span>
                <span class="cul-item-text"><b>${esc(c.name)}</b><span class="zh">${esc(c.zh)}</span><small>${esc(c.lead)}</small></span>
                <span class="cul-item-mark">${C.isRead(c.id) ? '✓' : 'NEW'}</span>
              </button></li>`).join('')}
          </ul>
        </section>`;
    }).join('');

    root.innerHTML = `
      ${UI.topbar({ title: '📖 図鑑', back: 'title' })}
      <main class="page">
        ${tabs('culture')}
        <div class="dict-summary card">
          <div><b class="big-num">${read}</b> / ${all.length} 読んだ</div>
          <div class="progress"><div class="progress-fill" style="width:${all.length ? (read / all.length) * 100 : 0}%"></div></div>
          <p class="muted small">旅先の建物や食べ物の説明と歴史。3D で近くに行くと「📖 文化メモ」が出るよ</p>
        </div>
        ${groups}
      </main>
      ${UI.tabbar('dictionary')}`;
    bindTabs(root);
    root.querySelectorAll('[data-culture]').forEach((b) => {
      b.onclick = () => C.open(b.dataset.culture, { onClose: () => {
        const y = window.scrollY;
        cultureTab(root);
        window.scrollTo(0, y);
      } });
    });
  }
})(window.App = window.App || {});
