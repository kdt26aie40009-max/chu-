/* ② 3D 旅行マップ（ステージ選択画面）
 * 古い地図の上に、名所のイラストが曲がりくねった道でつながる。道には小さな飛び石。
 *   第一章「北京」：上から番号順に進む一本道＋寄り道（胡同）
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

  // マップの見た目（ボードは 360×560 の座標）。章ごとに、名所の位置と道
  const CHAPTERS = [
    {
      id: 'beijing', no: '第一章', title: '北京の旅', region: 'beijing',
      nodes: { airport: [88, 124], hutong: [296, 108], hotel: [252, 208], market: [92, 290], tiananmen: [262, 370], gugong: [96, 446], greatwall: [252, 514] },
      route: ['airport', 'hotel', 'market', 'tiananmen', 'gugong', 'greatwall'],
      branches: [['hotel', 'hutong']],
      deco: 'beijing',
    },
    {
      id: 'henan', no: '特別章', title: '嵩山・少林寺', region: 'henan',
      start: [70, 92], startLabel: '🚄 北京から高速鉄道',
      nodes: { shaolin: [210, 330] },
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

  // 古い地図の飾り（山・川・雲・方位）
  const DECO = {
    beijing: `
      <path d="M8 520 Q60 470 30 400 Q0 330 40 270" stroke="#9CC3D6" stroke-width="10" fill="none" opacity=".55" stroke-linecap="round"/>
      <g fill="none" stroke="#8C7350" stroke-width="2" opacity=".45">
        <path d="M200 40 l14 -18 l14 18 M222 40 l12 -14 l12 14"/>
        <path d="M300 420 l12 -16 l12 16 M318 420 l10 -12 l10 12"/>
        <path d="M150 300 q10 -8 20 0 q10 -8 20 0"/>
        <path d="M30 160 q8 -6 16 0 q8 -6 16 0"/>
      </g>
      <g opacity=".5" fill="#8C7350"><circle cx="160" cy="110" r="2"/><circle cx="330" cy="60" r="2"/><circle cx="40" cy="350" r="2"/><circle cx="180" cy="520" r="2"/></g>`,
    henan: `
      <g fill="#A9B88E" opacity=".55" stroke="#6E7A55" stroke-width="2">
        <path d="M0 250 L60 170 L110 230 L170 140 L240 230 L300 160 L360 240 L360 300 L0 300 Z"/>
      </g>
      <g fill="none" stroke="#8C7350" stroke-width="2" opacity=".45"><path d="M40 470 q10 -8 20 0 q10 -8 20 0"/><path d="M280 460 q10 -8 20 0 q10 -8 20 0"/></g>`,
  };
  const COMPASS = `<svg class="tm-compass" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="17" fill="none" stroke="#8C7350" stroke-width="2"/>
    <path d="M20 4 L24 20 L20 36 L16 20 Z" fill="#B8332A" opacity=".8"/><path d="M20 20 L24 20 L20 36 Z" fill="#6E6150"/>
    <text x="20" y="3.5" text-anchor="middle" font-size="7" fill="#6E5A3A" font-weight="700">北</text></svg>`;

  App.screens.map = (root, params = {}) => {
    const T = App.Trip;
    const P = App.Progress;
    const st = App.Store.state;
    const lv = P.level();
    const next = T.next();
    const all = T.stages();
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
    const H = 560;
    const pct = (p) => `left:${(p[0] / W) * 100}%;top:${(p[1] / H) * 100}%`;
    const posOf = (id) => (id === '@start' ? ch.start : ch.nodes[id]);
    // 道：区間ごとに「通った道」と「これからの道」を分ける
    const segs = [];
    for (let i = 0; i < ch.route.length - 1; i++) {
      const a = ch.route[i];
      const b = ch.route[i + 1];
      const done = a === '@start' ? shaolinOpen : T.isCleared(a);
      segs.push({ d: curve(posOf(a), posOf(b)), done, side: false });
    }
    ch.branches.forEach(([a, b]) => segs.push({ d: curve(posOf(a), posOf(b)), done: T.isCleared(a), side: true }));

    const node = (id) => {
      const s = T.find(id);
      const state = stateOf(s);
      const n = T.stars(s);
      return `
        <button class="lm lm-${state}${s.kind === 'side' ? ' is-side' : ''}${s.kind === 'special' ? ' is-special' : ''}" style="${pct(ch.nodes[id])}" data-stage="${s.id}" aria-label="${esc(s.name)}">
          ${state === 'next' ? '<span class="lm-arrow" aria-hidden="true">▼</span>' : ''}
          <span class="lm-pic">${App.Landmarks.svg(s.id)}
            ${state === 'locked' ? '<i class="lm-lock">🔒</i>' : ''}${state === 'soon' ? '<i class="lm-lock">🛠</i>' : ''}</span>
          <span class="lm-name">${s.no ? `<b>${s.no}</b>` : s.kind === 'side' ? '<b>寄</b>' : '<b>★</b>'}${esc(s.name)}</span>
          ${state === 'cleared' ? `<span class="lm-stars">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'is-on' : ''}">★</i>`).join('')}</span>` : ''}
        </button>`;
    };

    const msg = next
      ? `次の行き先は <b>${next.emoji} ${esc(next.name)}</b>！<small>${esc(next.goal)}</small>`
      : all.filter(T.ready).every((s) => T.isCleared(s.id))
        ? '行ける場所はぜんぶ旅したね！🎉<small>★3 を目指して、街の人とたくさん話そう</small>'
        : '寄り道や、少林寺にも行ってみよう！';

    root.innerHTML = `
      <header class="tm-hud">
        <button class="tm-hud-back" data-go="title" aria-label="もどる">◀</button>
        <span class="tm-pill"><b>Lv.${lv.level}</b><i class="tm-pill-bar"><i style="width:${(lv.cur / lv.need) * 100}%"></i></i></span>
        <span class="tm-pill">⭐ <b>${starTotal}</b>/${all.length * 3}</span>
        <span class="tm-pill">🗺️ <b>${all.filter((s) => T.isCleared(s.id)).length}</b>/${all.length}</span>
      </header>

      <nav class="tm-chapters">
        ${CHAPTERS.map((c) => {
          const locked = c.id === 'henan' && !shaolinOpen;
          return `<button class="tm-chapter${c === ch ? ' is-cur' : ''}${locked ? ' is-locked' : ''}" data-chapter="${c.id}">
            <small>${c.no}</small>${locked ? '🔒 ' : ''}${esc(c.title)}</button>`;
        }).join('')}
      </nav>

      <section class="tm-board tm-board-${ch.id}">
        <div class="tm-ribbon"><b>${ch.no}</b><span>${esc(ch.title)}</span></div>
        <svg class="tm-paths" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          ${DECO[ch.deco]}
          ${segs.map((g) => `<path class="tm-road${g.done ? ' is-done' : ''}${g.side ? ' is-side' : ''}" d="${g.d}"/>`).join('')}
        </svg>
        <div class="tm-steps"></div>
        ${ch.start ? `<span class="tm-start" style="${pct(ch.start)}">${ch.startLabel}</span>` : ''}
        ${Object.keys(ch.nodes).map(node).join('')}
        ${COMPASS}
        ${ch.id === 'henan' && !shaolinOpen ? '<div class="tm-board-lock">🔒 北京の<b>空港</b>に着いたら行けるよ</div>' : ''}
      </section>

      <div class="tm-next">
        ${App.Hamster.figure({ mood: 'happy', size: 'xs' })}
        <p>${msg}</p>
        ${next ? `<button class="btn btn-primary tm-go" data-stage="${next.id}">出発 ▶</button>` : ''}
      </div>

      <div class="cs-sheet-wrap" hidden><div class="cs-sheet card"></div></div>
      ${UI.tabbar('map')}`;

    // 道の上に小さな飛び石を並べる（道の長さに合わせて等間隔）
    const steps = $('.tm-steps', root);
    root.querySelectorAll('.tm-road').forEach((path) => {
      const len = path.getTotalLength();
      const gap = 30;
      for (let d = 40; d < len - 36; d += gap) {
        const p = path.getPointAtLength(d);
        const dot = document.createElement('i');
        dot.className = `tm-step${path.classList.contains('is-done') ? ' is-done' : ''}${path.classList.contains('is-side') ? ' is-side' : ''}`;
        dot.style.left = `${(p.x / W) * 100}%`;
        dot.style.top = `${(p.y / H) * 100}%`;
        steps.appendChild(dot);
      }
    });

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
      sheet.innerHTML = `
        <div class="cs-sheet-head" style="--c:${s.region === 'henan' ? '#7A3A12' : '#2BB5A0'}">
          <span>${esc(T.region(s.region).name)}・${s.kind === 'main' ? `ステージ ${s.no}` : s.kind === 'side' ? '寄り道' : '特別な旅先'}</span>
          <h3>${s.emoji} ${esc(s.name)} ${stars(s.level)}</h3>
          <small>${esc(s.desc)}</small>
        </div>
        <p class="tm-goal">🎯 目的：<b>${esc(s.goal)}</b>${rec ? `<br><small class="muted">クリア ${rec.count}回</small>` : ''}</p>
        ${words.length ? `<p class="muted small">ここで役立つ言葉</p><ul class="cs-words">${words.map((p) => `<li><span class="zh">${esc(p.zh)}</span><span class="muted">${esc(p.ja)}</span></li>`).join('')}</ul>` : ''}
        ${st === 'locked' ? `<p class="tm-lock">🔒 <b>${esc(before.emoji + ' ' + before.name)}</b> をクリアすると行けるよ</p>` : ''}
        ${st === 'soon' ? '<p class="tm-lock">🛠 この場所はいま準備中だよ</p>' : ''}
        ${st !== 'locked' && st !== 'soon' ? '<button class="btn btn-primary btn-lg btn-block" data-depart>🌏 出発する</button>' : ''}
        <button class="btn btn-sub btn-block" data-close>とじる</button>`;
      const dep = $('[data-depart]', sheet);
      if (dep) dep.onclick = () => { App.Sfx.play('tap'); beforeDepart(s); };
      $('[data-close]', sheet).onclick = () => { App.Sfx.play('tap'); close(); };
      sheetWrap.hidden = false;
    }

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
