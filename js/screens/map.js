/* ② マップ画面（上海） */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, $, toast } = App.U;
  const UI = App.UI;

  // 背景の地図（viewBox 0 0 100 125 = スポットの x, y と同じ座標）
  const MAP_SVG = (route, done) => `
    <svg class="map-bg" viewBox="0 0 100 125" aria-hidden="true">
      <rect class="m-land" width="100" height="125" rx="4"/>
      <ellipse class="m-park" cx="14" cy="44" rx="11" ry="7"/>
      <ellipse class="m-park" cx="40" cy="110" rx="12" ry="6"/>
      <ellipse class="m-park" cx="90" cy="64" rx="8" ry="13"/>
      <rect class="m-block" x="28" y="66" width="10" height="7" rx="2"/>
      <rect class="m-block" x="6" y="80" width="9" height="8" rx="2"/>
      <rect class="m-block" x="44" y="26" width="8" height="6" rx="2"/>
      <rect class="m-block" x="64" y="98" width="7" height="9" rx="2"/>
      <path class="m-water" d="M0 33 C18 37 40 28 58 33 C65 35 70 36 74 37"/>
      <path class="m-river" d="M58 125 C66 108 80 96 77 80 C74 62 64 52 73 36 C80 22 90 14 100 10"/>
      <path class="m-river-in" d="M58 125 C66 108 80 96 77 80 C74 62 64 52 73 36 C80 22 90 14 100 10"/>
      <polyline class="m-route" points="${route}"/>
      ${done ? `<polyline class="m-route-done" points="${done}"/>` : ''}
    </svg>`;

  App.screens.map = (root) => {
    const city = App.currentCity();
    const P = App.Progress;
    const lv = P.level();
    const next = P.nextSpot(city);
    const playable = P.playableSpots(city);
    const pct = P.cityProgress(city);

    const route = city.spots.map((s) => `${s.x},${s.y}`).join(' ');
    const doneUntil = next ? playable.indexOf(next) : playable.length - 1;
    const done = doneUntil > 0 ? playable.slice(0, doneUntil + 1).map((s) => `${s.x},${s.y}`).join(' ') : '';

    const spotState = (s) => {
      if (s.comingSoon) return 'soon';
      if (P.isCleared(s.id)) return 'cleared';
      if (P.isUnlocked(city, s)) return 'next';
      return 'locked';
    };

    // 3D フィールドは「ひとつ前のスポットの 3D をクリア」でも入れる（2D レッスンとは別ルート）
    const w3d = App.Store.state.world3d || {};
    const open3d = (s) => {
      if (!s.scene3d || s.comingSoon) return false;
      if (spotState(s) !== 'locked') return true;
      const i = playable.indexOf(s);
      const prev = playable[i - 1];
      return !!(prev && prev.scene3d && w3d[prev.id] && w3d[prev.id].done);
    };

    const spots = city.spots.map((s) => {
      const st = spotState(s);
      return `
        <button class="spot spot-${st}" style="left:${s.x}%;top:${s.y * 0.8}%" data-spot="${s.id}" aria-label="${esc(s.name)}">
          <span class="spot-pin">${s.emoji}${st === 'cleared' ? '<i class="spot-badge">✓</i>' : ''}${st === 'locked' ? '<i class="spot-badge">🔒</i>' : ''}</span>
          <span class="spot-name">${esc(s.name)}</span>
          ${st === 'next' ? '<span class="spot-flag">NEXT</span>' : ''}
          ${st === 'soon' ? '<span class="spot-flag is-soon">準備中</span>' : ''}
          ${open3d(s) ? '<span class="spot-3d">3D</span>' : ''}
        </button>`;
    }).join('');

    const mission = next
      ? `今日のミッションは <b>${next.emoji} ${esc(next.name)}</b>！<br>${esc(next.mission)}<span class="mission-meta">DAY ${next.day}・${esc(next.theme)}・約5分</span>`
      : 'DAY 1・2 コンプリート！🎉<br>DAY 3（外灘・ライブ・ドラマ）は準備中だよ。復習しながら待っててね！';

    root.innerHTML = `
      ${UI.topbar({ title: `📍 ${esc(city.nameZh)}`, back: 'title', right: UI.levelChip() })}
      <section class="stats-strip">
        <div class="stat-exp">
          <div class="stat-row"><span>Lv.${lv.level}</span><span class="muted">${lv.cur} / ${lv.need} EXP</span></div>
          ${UI.expBar(lv)}
        </div>
        <div class="stat-mini"><b>${pct}%</b><span>旅行達成率</span></div>
        <div class="stat-mini"><b>${P.learnedCount()}</b><span>覚えた言葉</span></div>
      </section>

      <section class="map">
        ${MAP_SVG(route, done)}
        ${spots}
        <button class="map-sign" style="left:88%;top:23%" data-sign="huangpu" aria-label="黄浦江を読む"><span class="zh">黄浦江</span>🔍</button>
      </section>

      <section class="map-dock">
        ${UI.hamsterSays(mission, { mood: next ? 'happy' : 'wow', size: 'md' })}
        <div class="dock-actions">
          ${next ? `<button class="btn btn-primary btn-lg btn-block" data-spot="${next.id}">${next.emoji} ${esc(next.name)}へ行く</button>` : ''}
          ${P.learnedCount() > 0
            ? `<button class="btn ${P.needsReview() ? 'btn-accent' : 'btn-sub'} btn-block" data-go="review">📚 覚えた言葉をちょっと復習${P.needsReview() ? '<span class="dot-new"></span>' : ''}</button>`
            : ''}
        </div>
      </section>`;

    App.MochiVoice.speak(mission.replace(/<span class="mission-meta">.*<\/span>/, ''));

    root.querySelectorAll('[data-spot]').forEach((btn) => {
      btn.onclick = () => {
        const s = city.spots.find((x) => x.id === btn.dataset.spot);
        const st = spotState(s);
        if (st === 'soon') { toast(`${s.emoji} ${esc(s.name)}はもうすぐ行けるようになるよ！`); return; }
        const isIcon = btn.classList.contains('spot');
        if (isIcon && open3d(s)) { App.Sfx.play('tap'); App.go(s.scene3d, { spotId: s.id }); return; }
        if (st === 'locked') { toast(`まずは「${esc(next.emoji + ' ' + next.name)}」をクリアしよう！`); return; }
        App.Sfx.play('tap');
        App.go('stage', { spotId: s.id });
      };
    });
  };
})(window.App = window.App || {});
