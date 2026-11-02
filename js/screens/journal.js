/* 旅行記：記録・訪れた場所 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, formatDate } = App.U;
  const UI = App.UI;

  App.screens.journal = (root) => {
    const city = App.currentCity();
    const P = App.Progress;
    const st = App.Store.state;
    const lv = P.level();
    const streak = P.streak();

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

    const logs = st.log.slice(0, 10).map((l) => {
      const s = l.spotId && city.spots.find((x) => x.id === l.spotId);
      const what = l.kind === 'review' ? '📚 復習' : `${s ? s.emoji + ' ' + esc(s.name) : ''} クリア`;
      return `<li><span class="muted">${formatDate(l.date)}</span><span>${what}</span><b>+${l.exp}</b></li>`;
    }).join('');

    root.innerHTML = `
      ${UI.topbar({ title: '📔 旅行記', back: 'title' })}
      <main class="page">
        <div class="jr-stats">
          <div class="card"><b>Lv.${lv.level}</b><span>レベル</span></div>
          <div class="card"><b>${st.exp}</b><span>総EXP</span></div>
          <div class="card"><b>${st.days.length}</b><span>旅した日</span></div>
          <div class="card"><b>${streak}</b><span>連続日数</span></div>
          <div class="card"><b>${P.learnedCount()}</b><span>覚えた言葉</span></div>
          <div class="card"><b>${P.cityProgress(city)}%</b><span>上海達成率</span></div>
        </div>
        <p class="soft-note">連続じゃなくても大丈夫。旅は自分のペースで🐹</p>

        <section class="card">
          <h3>🗺️ 上海のあしあと</h3>
          ${footprints}
        </section>

        <section class="card">
          <h3>📝 最近の記録</h3>
          ${logs ? `<ul class="jr-log">${logs}</ul>` : '<p class="muted">まだ記録がないよ。旅に出よう！</p>'}
        </section>
      </main>`;
  };
})(window.App = window.App || {});
