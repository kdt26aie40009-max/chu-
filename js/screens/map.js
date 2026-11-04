/* ② 旅行マップ（北京）
 * スポットをタップ → 「3D で歩く」か「2D で会話する」を選ぶ。
 * スポットは 2D コースのユニット（spot.requires）をクリアすると行ける。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, $, toast } = App.U;
  const UI = App.UI;

  // 背景の地図（viewBox 0 0 100 125 = スポットの x, y と同じ座標）
  const MAP_SVG = (route, done) => `
    <svg class="map-bg" viewBox="0 0 100 125" aria-hidden="true">
      <rect class="m-land" width="100" height="125" rx="4"/>
      <path class="m-mount" d="M0 26 L10 10 L18 20 L28 4 L38 18 L48 8 L58 22 L66 12 L74 24 L74 30 L0 30 Z"/>
      <path class="m-wall" d="M2 22 L10 14 L18 21 L28 9 L38 19 L48 12 L58 23 L66 16 L72 24"/>
      <text class="m-label" x="52" y="29">长城</text>
      <rect class="m-ring" x="18" y="46" width="66" height="66" rx="10"/>
      <path class="m-axis" d="M50 40 L50 118"/>
      <rect class="m-park" x="42" y="48" width="16" height="22" rx="1.5"/>
      <rect class="m-palace" x="44.5" y="51" width="11" height="17" rx="1"/>
      <rect class="m-square" x="45" y="72" width="10" height="12" rx="1"/>
      <ellipse class="m-lake" cx="36" cy="54" rx="4" ry="6"/>
      <ellipse class="m-park" cx="62" cy="108" rx="7" ry="4"/>
      <rect class="m-block" x="60" y="58" width="9" height="12" rx="2"/>
      <rect class="m-block" x="22" y="64" width="12" height="9" rx="2"/>
      <rect class="m-block" x="24" y="88" width="10" height="9" rx="2"/>
      <path class="m-road" d="M84 34 C80 40 80 44 76 50"/>
      <polyline class="m-route" points="${route}"/>
      ${done ? `<polyline class="m-route-done" points="${done}"/>` : ''}
    </svg>`;

  App.screens.map = (root) => {
    const city = App.currentCity();
    const P = App.Progress;
    const C = App.Course;
    const travel = C.travelUnlocked();
    const lv = P.level();
    const next = P.nextSpot(city);
    const playable = P.playableSpots(city);
    const pct = P.cityProgress(city);

    const route = playable.map((s) => `${s.x},${s.y}`).join(' ');
    const lastDone = playable.reduce((k, s, i) => (P.isCleared(s.id) ? i : k), -1);
    const done = lastDone > 0 ? playable.slice(0, lastDone + 1).map((s) => `${s.x},${s.y}`).join(' ') : '';

    const spotState = (s) => {
      if (s.comingSoon) return 'soon';
      if (P.isCleared(s.id)) return 'cleared';
      if (P.isUnlocked(city, s)) return s === next ? 'next' : 'open';
      return 'locked';
    };
    const unitOf = (s) => C.unit(s.requires);

    const spots = city.spots.map((s) => {
      const st = spotState(s);
      return `
        <button class="spot spot-${st}" style="left:${s.x}%;top:${s.y * 0.8}%" data-spot="${s.id}" aria-label="${esc(s.name)}">
          <span class="spot-pin">${s.emoji}${st === 'cleared' ? '<i class="spot-badge">✓</i>' : ''}${st === 'locked' ? '<i class="spot-badge">🔒</i>' : ''}</span>
          <span class="spot-name">${esc(s.name)}</span>
          ${st === 'next' ? '<span class="spot-flag">NEXT</span>' : ''}
          ${s.scene3d && st !== 'locked' ? '<span class="spot-3d">3D</span>' : ''}
        </button>`;
    }).join('');

    // ハムスターの案内
    let mission;
    if (!travel) {
      mission = `北京旅行は、📘コースの<b>UNIT 4「旅の準備」</b>をクリアすると出発できるよ！<br><small>空港やホテルの言葉を覚えてから行こう✈️</small>`;
    } else if (next) {
      mission = `今日のおすすめは <b>${next.emoji} ${esc(next.name)}</b>！<br>${esc(next.mission)}<span class="mission-meta">DAY ${next.day}・${esc(next.theme)}${next.scene3d ? '・3D あり' : ''}</span>`;
    } else {
      const locked = playable.find((s) => !P.isUnlocked(city, s));
      const u = locked && unitOf(locked);
      mission = locked && u
        ? `次の目的地 <b>${locked.emoji} ${esc(locked.name)}</b> は、📘<b>UNIT ${u.id.slice(1)}「${esc(u.title)}」</b>をクリアすると行けるよ！`
        : `北京のスポット、全部クリア！🎉<br>3D でもう一度歩いたり、復習したりして楽しもう`;
    }

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

      <section class="map${travel ? '' : ' is-locked'}">
        ${MAP_SVG(route, done)}
        ${spots}
      </section>

      <section class="map-dock">
        ${UI.hamsterSays(mission, { mood: next || !travel ? 'happy' : 'wow', size: 'md' })}
        <div class="dock-actions">
          ${travel && next ? `<button class="btn btn-primary btn-lg btn-block" data-spot="${next.id}">${next.emoji} ${esc(next.name)}へ行く</button>` : ''}
          ${!travel || !next ? '<button class="btn btn-accent btn-block" data-go="course">📘 コースで中国語を学ぶ</button>' : ''}
        </div>
      </section>

      <div class="cs-sheet-wrap" hidden><div class="cs-sheet card"></div></div>
      ${UI.tabbar('map')}`;

    const sheetWrap = $('.cs-sheet-wrap', root);
    const sheet = $('.cs-sheet', root);
    sheetWrap.onclick = (e) => { if (e.target === sheetWrap) sheetWrap.hidden = true; };

    // 3D / 2D を選ぶシート
    function openSpot(s) {
      const cleared = P.isCleared(s.id);
      const words = (s.phrases || []).map((id) => App.PHRASES[id]).filter(Boolean);
      sheet.innerHTML = `
        <div class="cs-sheet-head" style="--c:#2BB5A0">
          <span>DAY ${s.day}・${esc(s.theme)}</span>
          <h3>${s.emoji} ${esc(s.name)}${cleared ? ' ✓' : ''}</h3>
          <small>${esc(s.mission)}</small>
        </div>
        <ul class="cs-words">${words.map((p) => `<li><span class="zh">${esc(p.zh)}</span><span class="muted">${esc(p.ja)}</span></li>`).join('')}</ul>
        ${s.scene3d ? `<button class="btn btn-accent btn-lg btn-block" data-mode="3d">🌏 3Dで歩く<small class="btn-sub-label">旅行気分で</small></button>` : ''}
        <button class="btn ${s.scene3d ? 'btn-sub' : 'btn-primary btn-lg'} btn-block" data-mode="2d">💬 2Dで会話する<small class="btn-sub-label">約5分</small></button>
        ${s.scene3d ? '' : '<p class="muted small">🌏 3D は準備中。今は 2D の会話で旅しよう</p>'}
        <button class="btn btn-sub btn-block" data-close>とじる</button>`;
      const go3d = $('[data-mode="3d"]', sheet);
      if (go3d) go3d.onclick = () => { App.Sfx.play('tap'); App.go(s.scene3d, { spotId: s.id, shop: s.shop }); };
      $('[data-mode="2d"]', sheet).onclick = () => { App.Sfx.play('tap'); App.go('stage', { spotId: s.id }); };
      $('[data-close]', sheet).onclick = () => { App.Sfx.play('tap'); sheetWrap.hidden = true; };
      sheetWrap.hidden = false;
    }

    root.querySelectorAll('[data-spot]').forEach((btn) => {
      btn.onclick = () => {
        const s = city.spots.find((x) => x.id === btn.dataset.spot);
        const st = spotState(s);
        if (st === 'soon') { toast(`${s.emoji} ${esc(s.name)}はもうすぐ行けるようになるよ！`); return; }
        if (st === 'locked') {
          const u = unitOf(s);
          toast(travel && u
            ? `📘 UNIT ${u.id.slice(1)}「${esc(u.title)}」をクリアすると行けるよ！`
            : 'まずは📘コースで UNIT 4「旅の準備」をクリアしよう！');
          return;
        }
        App.Sfx.play('tap');
        openSpot(s);
      };
    });
  };
})(window.App = window.App || {});
