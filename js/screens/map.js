/* ② 3D 旅行マップ（ステージ選択画面）
 * 明るい絵地図（草原・川・池・木）の上で、名所のイラストが道路でつながる。通った道は黄色に。
 *   第一章「北京」：上から番号順に進む一本道＋寄り道（胡同）
 *   第二章「上海」：制作中。章は開けるが、ステージはまだ遊べない
 *   特別章「嵩山・少林寺」：高速鉄道で行く別の旅先（空港に着いたら行ける・高難度）
 * 名所をタップ → 概要と「出発する」 → （任意）単語チェック → 3D へ。
 * 2D 学習の進み具合は関係なく、3D の中でクリアした順に行き先が開く。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, $ } = App.U;
  const UI = App.UI;

  const stars = (n) => `<span class="tm-level" aria-label="難しさ ${n}">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;

  // マップの見た目（ボードは 360×600 の座標）。章ごとに、名所の位置と道
  const CHAPTERS = [
    {
      id: 'beijing', no: '第1章', title: '北京の旅', region: 'beijing',
      nodes: { airport: [92, 138], hutong: [292, 120], hotel: [258, 232], market: [96, 318], tiananmen: [266, 404], gugong: [96, 484], greatwall: [262, 548] },
      route: ['airport', 'hotel', 'market', 'tiananmen', 'gugong', 'greatwall'],
      branches: [['hotel', 'hutong']],
      deco: 'beijing',
    },
    {
      id: 'shanghai', no: '第2章', title: '上海の旅', region: 'shanghai', wip: true,
      start: [92, 96], startLabel: '🚄 北京から高速鉄道',
      nodes: { bund: [256, 190], yuyuan: [96, 300], pearl: [256, 520] },
      route: ['@start', 'bund', 'yuyuan', 'pearl'],
      branches: [],
      deco: 'shanghai',
    },
    {
      id: 'henan', no: '特別章', title: '嵩山・少林寺', region: 'henan',
      start: [92, 96], startLabel: '🚄 北京から高速鉄道',
      nodes: { shaolin: [196, 392] },
      route: ['@start', 'shaolin'],
      branches: [],
      deco: 'henan',
    },
  ];

  // 2 点を S 字のカーブでつなぐ
  const curve = (a, b) => {
    const my = (a[1] + b[1]) / 2;
    return `M${a[0]} ${a[1]} C${a[0]} ${my} ${b[0]} ${my} ${b[0]} ${b[1]}`;
  };

  // 絵地図の飾り（川・池・木・雲・山）。道より下に描く
  const tree = (x, y, r = 11, c = '#5DBB4F') => `<g class="tm-tree"><rect x="${x - 2}" y="${y}" width="4" height="${r}" rx="2" fill="#9A6A3E"/><circle cx="${x}" cy="${y - r * 0.3}" r="${r}" fill="${c}" stroke="#2F6E34" stroke-width="2.4"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.65}" r="${r * 0.3}" fill="#fff" opacity=".35"/></g>`;
  const cloud = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 14 a10 10 0 0 1 12 -12 a13 13 0 0 1 24 2 a9 9 0 0 1 10 10 z" fill="#fff" stroke="#9CC6E4" stroke-width="2"/></g>`;
  const hill = (x, y, w, h, c = '#8FCF6A') => `<path d="M${x - w / 2} ${y} Q${x} ${y - h * 2} ${x + w / 2} ${y} Z" fill="${c}" stroke="#2F6E34" stroke-width="2.4" stroke-linejoin="round"/>`;
  const DECO = {
    beijing: `
      <g opacity=".55" fill="#D3F0A8">${[[60, 60, 50], [300, 330, 60], [60, 420, 46], [200, 580, 70], [180, 200, 40]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
      <path class="tm-river" d="M-10 352 Q60 322 128 350 T250 352 T370 330"/>
      <path class="tm-river-line" d="M-10 352 Q60 322 128 350 T250 352 T370 330"/>
      <g stroke="#8A5A2E" stroke-width="3.5" stroke-linecap="round"><path d="M164 342 L204 353 M157 369 L197 380"/></g>
      <g fill="#8A5A2E"><circle cx="164" cy="342" r="3.5"/><circle cx="204" cy="353" r="3.5"/><circle cx="157" cy="369" r="3.5"/><circle cx="197" cy="380" r="3.5"/></g>
      <ellipse cx="322" cy="296" rx="32" ry="20" fill="#7CCBF2" stroke="#3E8DC4" stroke-width="2.4"/>
      <path d="M306 294 q4 -3 8 0 M322 302 q4 -3 8 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${hill(312, 600, 120, 34)}${hill(220, 600, 90, 22, '#A6DB7E')}
      ${tree(28, 220)}${tree(48, 238, 9, '#7ACB55')}${tree(176, 98, 10)}${tree(340, 470, 12)}${tree(322, 486, 9, '#7ACB55')}${tree(170, 470, 10, '#7ACB55')}${tree(24, 560, 10)}${tree(178, 270, 8, '#7ACB55')}
      ${cloud(150, 16, 0.9)}${cloud(300, 40, 0.7)}`,
    shanghai: `
      <g opacity=".55" fill="#D3F0A8">${[[60, 470, 50], [300, 330, 46], [190, 150, 40]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
      <path class="tm-river" d="M370 120 Q300 280 340 360 T300 610"/>
      <path class="tm-river-line" d="M370 120 Q300 280 340 360 T300 610"/>
      ${[[20, 18], [36, 30], [52, 22]].map(([x, h]) => `<rect x="${x}" y="${600 - h * 2}" width="14" height="${h * 2}" fill="#B9C7D6" stroke="#4A3426" stroke-width="2"/>`).join('')}
      ${tree(40, 250)}${tree(180, 280, 9, '#7ACB55')}${tree(30, 400, 10)}${tree(170, 560, 10, '#7ACB55')}
      ${cloud(200, 30, 0.9)}${cloud(30, 180, 0.7)}`,
    henan: `
      ${hill(60, 250, 170, 90, '#8FCF6A')}${hill(190, 260, 200, 120, '#7CC35A')}${hill(320, 250, 160, 80, '#8FCF6A')}
      <rect x="0" y="250" width="360" height="350" fill="#B7E08A"/>
      <path class="tm-river" d="M300 250 Q330 360 290 450 T330 610"/>
      <path class="tm-river-line" d="M300 250 Q330 360 290 450 T330 610"/>
      ${[[70, 520], [96, 540], [122, 520]].map(([x, y]) => `<path d="M${x - 6} ${y} h12 l-2 -6 h-8 z M${x - 4} ${y - 6} h8 v-10 h-8 z M${x - 6} ${y - 16} h12 l-6 -9 z" fill="#E4DCCB" stroke="#5A4A3A" stroke-width="1.8" stroke-linejoin="round"/>`).join('')}
      ${tree(40, 300)}${tree(330, 520, 12)}${tree(240, 540, 10, '#7ACB55')}${tree(30, 430, 10, '#7ACB55')}${tree(150, 300, 9)}
      ${cloud(230, 30, 0.9)}${cloud(30, 160, 0.7)}`,
  };
  // にっこり太陽と方位マーク
  const SUN = `<svg class="tm-sun" viewBox="0 0 60 60" aria-hidden="true">
    <g stroke="#F59E1B" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="30" y1="5" x2="30" y2="11" transform="rotate(${a} 30 30)"/>`).join('')}</g>
    <circle cx="30" cy="30" r="15" fill="#FFD84A" stroke="#E0891B" stroke-width="2.5"/>
    <circle cx="25" cy="28" r="1.8" fill="#5A3A22"/><circle cx="35" cy="28" r="1.8" fill="#5A3A22"/>
    <path d="M25 34 q5 5 10 0" stroke="#5A3A22" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="21" cy="33" r="2.4" fill="#FF9EAA" opacity=".8"/><circle cx="39" cy="33" r="2.4" fill="#FF9EAA" opacity=".8"/></svg>`;
  const COMPASS = `<svg class="tm-compass" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="26" r="16" fill="#fff" stroke="#4A3426" stroke-width="2.5"/>
    <path d="M24 13 L29 26 L24 39 L19 26 Z" fill="#E5533D" stroke="#4A3426" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M24 26 L29 26 L24 39 L19 26 Z" fill="#DDD3C3" stroke="#4A3426" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="15" y="0" width="18" height="11" rx="5.5" fill="#4A3426"/><text x="24" y="8.6" text-anchor="middle" font-size="8.5" fill="#fff" font-weight="800">北</text></svg>`;

  App.screens.map = (root, params = {}) => {
    const T = App.Trip;
    const P = App.Progress;
    const st = App.Store.state;
    const lv = P.level();
    const next = T.next();
    const all = T.stages().filter(T.ready);
    const shaolinOpen = T.isUnlocked(T.find('shaolin'));

    const stateOf = (s) => {
      if (!T.ready(s)) return 'soon';
      if (T.isCleared(s.id)) return 'cleared';
      if (!T.isUnlocked(s)) return 'locked';
      return s === next || (s.kind === 'special' && !next) ? 'next' : 'open';
    };
    const starTotal = all.reduce((n, s) => n + T.stars(s), 0);
    const chId = params.chapter || st.trip.chapter || 'beijing';
    const ch = CHAPTERS.find((c) => c.id === chId) || CHAPTERS[0];
    const W = 360;
    const H = 600;
    const pct = (p) => `left:${(p[0] / W) * 100}%;top:${(p[1] / H) * 100}%`;
    const posOf = (id) => (id === '@start' ? ch.start : ch.nodes[id]);
    // 道：区間ごとに「通った道」と「これからの道」を分ける
    const segs = [];
    for (let i = 0; i < ch.route.length - 1; i++) {
      const a = ch.route[i];
      const b = ch.route[i + 1];
      const done = a === '@start' ? (ch.wip ? false : shaolinOpen) : T.isCleared(a);
      segs.push({ d: curve(posOf(a), posOf(b)), done, side: false, rail: a === '@start' });
    }
    ch.branches.forEach(([a, b]) => segs.push({ d: curve(posOf(a), posOf(b)), done: T.isCleared(a), side: true }));

    const node = (id) => {
      const s = T.find(id);
      const state = stateOf(s);
      const n = T.stars(s);
      const badge = s.no ? `<b>${s.no}</b>` : s.kind === 'side' ? '<b>寄</b>' : '<b>★</b>';
      return `
        <button class="lm lm-${state}${s.kind === 'side' ? ' is-side' : ''}${s.kind === 'special' ? ' is-special' : ''}" style="${pct(ch.nodes[id])}" data-stage="${s.id}" aria-label="${esc(s.name)}">
          ${state === 'next' ? '<span class="lm-here" aria-hidden="true">いまここ！</span>' : ''}
          <span class="lm-pic">${App.Landmarks.svg(s.id)}
            ${state === 'locked' ? '<i class="lm-lock">🔒</i>' : ''}${state === 'soon' ? '<i class="lm-lock">🛠</i>' : ''}
            ${state === 'cleared' ? '<i class="lm-done" aria-label="クリア">✓</i>' : ''}
            ${state === 'next' ? `<span class="lm-mochi">${App.Hamster.figure({ mood: 'happy', size: 'xs', bounce: true })}</span>` : ''}</span>
          <span class="lm-name">${badge}${esc(s.name)}</span>
          ${state === 'cleared' ? `<span class="lm-stars">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'is-on' : ''}">★</i>`).join('')}</span>` : ''}
        </button>`;
    };

    const msg = next
      ? `次の行き先は <b>${next.emoji} ${esc(next.name)}</b>！<small>${esc(next.goal)}</small>`
      : all.every((s) => T.isCleared(s.id))
        ? '行ける場所はぜんぶ旅したね！🎉<small>★3 を目指して、街の人とたくさん話そう</small>'
        : '寄り道や、少林寺にも行ってみよう！';

    root.innerHTML = `
      <header class="tm-hud">
        <button class="tm-hud-back" data-go="title" aria-label="もどる">◀</button>
        <span class="tm-pill"><b>Lv.${lv.level}</b><i class="tm-pill-bar"><i style="width:${(lv.cur / lv.need) * 100}%"></i></i></span>
        <span class="tm-pill">⭐ <b>${starTotal}</b>/${all.length * 3}</span>
        <span class="tm-pill">📍 <b>${all.filter((s) => T.isCleared(s.id)).length}</b>/${all.length}</span>
      </header>

      <nav class="tm-chapters">
        ${CHAPTERS.map((c) => {
          const locked = c.id === 'henan' && !shaolinOpen;
          return `<button class="tm-chapter${c === ch ? ' is-cur' : ''}${locked ? ' is-locked' : ''}" data-chapter="${c.id}">
            <small>${c.no}</small>${locked ? '🔒 ' : ''}${esc(c.title)}</button>`;
        }).join('')}
      </nav>

      <section class="tm-board tm-board-${ch.id}">
        <svg class="tm-paths" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          ${DECO[ch.deco]}
          ${segs.map((g) => `<path class="tm-road-edge${g.side ? ' is-side' : ''}${g.rail ? ' is-rail' : ''}" d="${g.d}"/>`).join('')}
          ${segs.map((g) => `<path class="tm-road${g.done ? ' is-done' : ''}${g.side ? ' is-side' : ''}${g.rail ? ' is-rail' : ''}" d="${g.d}"/>`).join('')}
          ${segs.filter((g) => !g.side).map((g) => `<path class="tm-road-line${g.rail ? ' is-rail' : ''}" d="${g.d}"/>`).join('')}
        </svg>
        <div class="tm-title"><small>${ch.no}</small>${esc(ch.title)}</div>
        ${SUN}
        ${ch.start ? `<span class="tm-start" style="${pct(ch.start)}">${ch.startLabel}</span>` : ''}
        ${Object.keys(ch.nodes).map(node).join('')}
        ${COMPASS}
        ${ch.wip ? '<div class="tm-board-lock tm-board-wip">🛠 <b>上海ステージは制作中！</b><br><small>もうちょっと待っててね🐹</small></div>' : ''}
        ${ch.id === 'henan' && !shaolinOpen ? '<div class="tm-board-lock">🔒 北京の<b>空港</b>に着いたら行けるよ</div>' : ''}
      </section>

      <div class="tm-next">
        ${App.Hamster.figure({ mood: 'happy', size: 'xs' })}
        <p>${msg}</p>
        ${next ? `<button class="btn btn-primary tm-go" data-stage="${next.id}">出発 ▶</button>` : ''}
      </div>

      <div class="cs-sheet-wrap" hidden><div class="cs-sheet card"></div></div>
      ${UI.tabbar('map')}`;

    root.querySelectorAll('[data-chapter]').forEach((b) => {
      b.onclick = () => {
        App.Sfx.play('tap');
        st.trip.chapter = b.dataset.chapter;
        App.Store.save();
        App.go('map', { chapter: b.dataset.chapter });
      };
    });

    const sheetWrap = $('.cs-sheet-wrap', root);
    const sheet = $('.cs-sheet', root);
    sheetWrap.onclick = (e) => { if (e.target === sheetWrap) sheetWrap.hidden = true; };
    const close = () => { sheetWrap.hidden = true; };

    function openStage(s) {
      const st = stateOf(s);
      const before = s.after && T.find(s.after);
      const words = s.words.map((id) => App.PHRASES[id]).filter(Boolean);
      const rec = App.Store.state.trip.cleared[s.id];
      const cul = App.Culture.byStage(s.id);
      sheet.innerHTML = `
        <div class="cs-sheet-head" style="--c:${s.region === 'henan' ? '#7A3A12' : '#2BB5A0'}">
          <span>${esc(T.region(s.region).name)}・${s.kind === 'main' ? `ステージ ${s.no}` : s.kind === 'side' ? '寄り道' : '特別な旅先'}</span>
          <h3>${s.emoji} ${esc(s.name)} ${stars(s.level)}</h3>
          <small>${esc(s.desc)}</small>
        </div>
        <p class="tm-goal">🎯 目的：<b>${esc(s.goal)}</b>${rec ? `<br><small class="muted">クリア ${rec.count}回</small>` : ''}</p>
        ${words.length ? `<p class="muted small">ここで役立つ言葉</p><ul class="cs-words">${words.map((p) => `<li><span class="zh">${esc(p.zh)}</span><span class="muted">${esc(p.ja)}</span></li>`).join('')}</ul>` : ''}
        ${cul.length ? `<p class="muted small">📖 この場所の文化メモ（タップで読めるよ）</p><div class="cul-chips">${cul.map(App.Culture.chip).join('')}</div>` : ''}
        ${st === 'locked' ? `<p class="tm-lock">🔒 <b>${esc(before.emoji + ' ' + before.name)}</b> をクリアすると行けるよ</p>` : ''}
        ${st === 'soon' ? '<p class="tm-lock">🛠 この場所はいま制作中だよ。もうちょっと待っててね</p>' : ''}
        ${st !== 'locked' && st !== 'soon' ? '<button class="btn btn-primary btn-lg btn-block" data-depart>🌏 出発する</button>' : ''}
        <button class="btn btn-sub btn-block" data-close>とじる</button>`;
      const dep = $('[data-depart]', sheet);
      if (dep) dep.onclick = () => { App.Sfx.play('tap'); beforeDepart(s); };
      $('[data-close]', sheet).onclick = () => { App.Sfx.play('tap'); close(); };
      sheet.querySelectorAll('[data-culture]').forEach((b) => {
        b.onclick = () => App.Culture.open(b.dataset.culture, { onClose: () => openStage(s) });
      });
      sheetWrap.hidden = false;
    }

    App.MochiVoice.speak(msg);

    // 出発前の「単語チェック」（挑戦・スキップ・次から出さない を選べる。どれを選んでも不利にならない）
    function beforeDepart(s) {
      const settings = App.Store.state.settings;
      if (!settings.wordCheck || !s.words.length) { T.go(s); return; }
      const words = s.words.map((id) => App.phrase(id)).filter((p) => p.zh);
      sheet.innerHTML = `
        <div class="cs-sheet-head" style="--c:#F5B92E"><span>出発前の単語チェック（任意）</span><h3>📝 ${esc(s.name)}で役立つ言葉</h3></div>
        <ul class="tm-words">${words.map((p) => `<li><span class="zh">${esc(p.zh)}</span><span class="py">${esc(p.py)}</span>
          <span class="muted">${esc(p.ja)}</span>${UI.speakBtn(p.zh, { cls: 'speak-sm' })}</li>`).join('')}</ul>
        ${UI.hamsterSays(`${words.length}問だけ、ちょっと確認してみる？<br><small>スキップしても大丈夫。いきなり本番で力試しもアリ！</small>`, { size: 'xs', cls: 'is-compact' })}
        <button class="btn btn-accent btn-lg btn-block" data-try>📝 挑戦する（${Math.min(words.length, 5)}問）</button>
        <button class="btn btn-primary btn-block" data-skip>⏭ スキップして出発</button>
        <label class="tm-optout"><input type="checkbox" data-optout> 次から単語チェックを出さない（設定で戻せるよ）</label>`;
      const optout = () => {
        if ($('[data-optout]', sheet).checked) { settings.wordCheck = false; App.Store.save(); }
      };
      $('[data-try]', sheet).onclick = () => { App.Sfx.play('tap'); optout(); App.go('wordcheck', { stageId: s.id }); };
      $('[data-skip]', sheet).onclick = () => { App.Sfx.play('tap'); optout(); T.go(s); };
    }

    root.querySelectorAll('[data-stage]').forEach((btn) => {
      btn.onclick = () => {
        const s = T.find(btn.dataset.stage);
        App.Sfx.play('tap');
        if (btn.classList.contains('tm-go')) { beforeDepart(s); sheetWrap.hidden = false; return; }
        openStage(s);
      };
    });

    const here = $('.lm-next', root);
    if (here && Object.keys(st.trip.cleared).length) requestAnimationFrame(() => here.scrollIntoView({ block: 'center' }));
  };

  /* ---------- 出発前の単語チェック（2〜5 問・採点は 2D の記録に入れない） ---------- */
  App.screens.wordcheck = (root, { stageId }) => {
    const s = App.Trip.find(stageId);
    if (!s) { App.go('map'); return; }
    App.Exercise.run(root, App.Course.buildCheck(s.words), {
      onQuit: () => App.Trip.go(s),
      onDone: ({ correct, total }) => {
        const msg = correct === total ? 'ばっちり！これで準備OK🎉' : correct ? 'いい感じ！あとは現地で使ってみよう' : '大丈夫、現地で聞けばきっと覚えられるよ！';
        root.innerHTML = `
          <div class="result">
            <div class="result-head pop-in"><div class="result-emoji">${s.emoji}</div><h2>準備OK！</h2>
              <span class="chip">${total}問中 ${correct}問 正解</span></div>
            ${UI.hamsterSays(msg, { mood: 'happy', size: 'md' })}
            <div class="result-actions">
              <button class="btn btn-primary btn-lg btn-block" data-go3d>🌏 ${esc(s.name)}へ出発！</button>
              <button class="btn btn-sub btn-block" data-go="map">🗺️ マップへ戻る</button>
            </div>
          </div>`;
        App.Sfx.play('clear');
        $('[data-go3d]', root).onclick = () => { App.Sfx.play('tap'); App.Trip.go(s); };
      },
    });
    // 単語チェックは途中でやめても出発できる
    const quit = $('[data-quit]', root);
    if (quit) quit.setAttribute('aria-label', 'やめて出発する');
  };
})(window.App = window.App || {});
