/* 記録：2D の学習記録と 3D の旅の記録（別々）。連続日数は出さない（自分のペースでOK） */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, formatDate, todayKey } = App.U;
  const UI = App.UI;

  App.screens.journal = (root) => {
    const P = App.Progress;
    const C = App.Course;
    const T = App.Trip;
    const st = App.Store.state;
    const lv = P.level();
    const stats = st.stats;
    const rate = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;

    // 最近 14 日の「答えた数」グラフ
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      days.push({ key, v: (stats.byDay[key] || { a: 0, c: 0 }) });
    }
    const max = Math.max(5, ...days.map((d) => d.v.a));
    const chart = days.map((d) => `
      <div class="jr-bar" title="${formatDate(d.key)}：${d.v.a}問（正解 ${d.v.c}）">
        <span style="height:${(d.v.a / max) * 100}%"><i style="height:${d.v.a ? (d.v.c / d.v.a) * 100 : 0}%"></i></span>
        <small>${Number(d.key.slice(8))}</small>
      </div>`).join('');

    // 覚えが弱い言葉
    const weak = Object.entries(st.learned)
      .filter(([id, e]) => App.PHRASES[id] && e.wrong > 0)
      .sort((a, b) => a[1].strength - b[1].strength || b[1].wrong - a[1].wrong)
      .slice(0, 5);

    const cats = C.cats().map((c) => {
      const pr = C.catProgress(c);
      return `<li><span>${c.emoji} ${esc(c.title)}</span>
        <span class="jr-meter"><i style="width:${(pr.done / pr.total) * 100}%"></i></span><b>${pr.done}/${pr.total}</b></li>`;
    }).join('');

    const trip = T.stages().map((s) => {
      const c = st.trip.cleared[s.id];
      const status = !T.ready(s) ? '<span class="muted">準備中</span>'
        : c ? `<span class="ok">✓ ${formatDate(c.firstAt)}${c.count > 1 ? `（${c.count}回）` : ''}</span>` : '<span class="muted">まだ</span>';
      return `<li class="${c ? 'is-done' : ''}"><span>${s.emoji} ${esc(s.name)}</span>${status}</li>`;
    }).join('');

    const logs = st.log.slice(0, 10).map((l) => {
      let what = '📚 復習';
      if (l.kind === 'lesson') { const le = C.find(l.lessonId); what = `📘 ${le ? esc(le.title) : 'レッスン'}`; }
      if (l.kind === 'trip') { const s = T.find(l.stageId); what = `🗺️ ${s ? s.emoji + ' ' + esc(s.name) : '旅'} クリア`; }
      if (l.kind === 'spot') what = '🗺️ （旧版）スポット';
      return `<li><span class="muted">${formatDate(l.date)}</span><span>${what}</span><b>${l.exp ? '+' + l.exp : ''}</b></li>`;
    }).join('');

    root.innerHTML = `
      ${UI.topbar({ title: '📔 記録', back: 'title' })}
      <main class="page">
        <div class="jr-stats">
          <div class="card"><b>Lv.${lv.level}</b><span>レベル</span></div>
          <div class="card"><b>${st.exp}</b><span>総EXP</span></div>
          <div class="card"><b>${st.days.length}</b><span>遊んだ日</span></div>
        </div>
        <p class="soft-note">毎日じゃなくても大丈夫。自分のペースで🐹</p>

        <section class="card">
          <h3>📘 2D 学習の記録</h3>
          <div class="jr-stats jr-stats-in">
            <div><b>${P.learnedCount()}</b><span>覚えた言葉</span></div>
            <div><b>${stats.answered}</b><span>答えた問題</span></div>
            <div><b>${rate}%</b><span>正解率</span></div>
          </div>
          <p class="muted small">最近 14 日に答えた数（緑＝正解）</p>
          <div class="jr-chart">${chart}</div>
          <ul class="jr-cats">${cats}</ul>
          ${weak.length ? `<p class="muted small">もう少しの言葉</p><ul class="jr-log">${weak.map(([id, e]) => `<li>
            <span class="zh">${esc(App.PHRASES[id].zh)}</span><span>${esc(App.PHRASES[id].ja)}</span>${UI.stars(e.strength)}</li>`).join('')}</ul>` : ''}
        </section>

        <section class="card">
          <h3>🗺️ 3D 旅の記録 <small class="muted">${T.percent()}%</small></h3>
          <ul class="jr-log">${trip}</ul>
        </section>

        <section class="card">
          <h3>📝 最近の記録</h3>
          ${logs ? `<ul class="jr-log">${logs}</ul>` : '<p class="muted">まだ記録がないよ。学ぶ・旅する、どちらからでもどうぞ！</p>'}
        </section>
      </main>
      ${UI.tabbar('journal')}`;
  };
})(window.App = window.App || {});
