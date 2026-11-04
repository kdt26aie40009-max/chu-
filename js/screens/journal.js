/* 旅行記：学習と旅の記録（連続日数は出さない。自分のペースでOK） */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, formatDate } = App.U;
  const UI = App.UI;

  App.screens.journal = (root) => {
    const city = App.currentCity();
    const P = App.Progress;
    const C = App.Course;
    const st = App.Store.state;
    const lv = P.level();

    const days = {};
    city.spots.forEach((s) => { (days[s.day] = days[s.day] || []).push(s); });

    const footprints = Object.keys(days).map((d) => `
      <div class="jr-day">
        <div class="jr-day-label">DAY ${d}</div>
        <ul>
          ${days[d].map((s) => {
            const c = st.cleared[s.id];
            const status = s.comingSoon ? '<span class="muted">準備中</span>'
              : c ? `<span class="ok">✓ ${formatDate(c.firstClearedAt)} 達成${c.count > 1 ? `（${c.count}回）` : ''}</span>`
              : '<span class="muted">まだ</span>';
            return `<li class="${c ? 'is-done' : ''}"><span>${s.emoji} ${esc(s.name)}</span>${status}</li>`;
          }).join('')}
        </ul>
      </div>`).join('');

    const units = C.units().map((u) => {
      const pr = C.unitProgress(u);
      return `<li class="${pr.done === pr.total ? 'is-done' : ''}"><span>${u.emoji} ${esc(u.title)}</span>
        <span class="${pr.done === pr.total ? 'ok' : 'muted'}">${pr.done === pr.total ? '✓ クリア' : `${pr.done}/${pr.total}`}</span></li>`;
    }).join('');

    const logs = st.log.slice(0, 10).map((l) => {
      let what = '📚 復習';
      if (l.kind === 'spot') {
        const s = city.spots.find((x) => x.id === l.spotId);
        what = `${s ? s.emoji + ' ' + esc(s.name) : '旅'} クリア`;
      } else if (l.kind === 'lesson') {
        const le = C.find(l.lessonId);
        what = `📘 ${le ? esc(le.title) : 'レッスン'}`;
      }
      return `<li><span class="muted">${formatDate(l.date)}</span><span>${what}</span><b>+${l.exp}</b></li>`;
    }).join('');

    root.innerHTML = `
      ${UI.topbar({ title: '📔 旅行記', back: 'title' })}
      <main class="page">
        <div class="jr-stats">
          <div class="card"><b>Lv.${lv.level}</b><span>レベル</span></div>
          <div class="card"><b>${st.exp}</b><span>総EXP</span></div>
          <div class="card"><b>${st.days.length}</b><span>学んだ日</span></div>
          <div class="card"><b>${P.learnedCount()}</b><span>覚えた言葉</span></div>
          <div class="card"><b>${C.percent()}%</b><span>コース</span></div>
          <div class="card"><b>${P.cityProgress(city)}%</b><span>${esc(city.name)}旅行</span></div>
        </div>
        <p class="soft-note">毎日じゃなくても大丈夫。旅は自分のペースで🐹</p>

        <section class="card">
          <h3>📘 コースの進み具合</h3>
          <ul class="jr-log">${units}</ul>
        </section>

        <section class="card">
          <h3>🗺️ ${esc(city.name)}のあしあと</h3>
          ${footprints}
        </section>

        <section class="card">
          <h3>📝 最近の記録</h3>
          ${logs ? `<ul class="jr-log">${logs}</ul>` : '<p class="muted">まだ記録がないよ。レッスンをやってみよう！</p>'}
        </section>
      </main>
      ${UI.tabbar('journal')}`;
  };
})(window.App = window.App || {});
