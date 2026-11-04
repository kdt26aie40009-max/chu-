/* ② 3D 旅行マップ
 * 北京の本線（上から下へ番号順）＋寄り道、少し離れて「高速鉄道で行く河南省（少林寺）」。
 * 行き先をタップ → 概要と「出発する」 → （任意）単語チェック → 3D へ。
 * 2D 学習の進み具合は関係なく、3D の中でクリアした順に行き先が開く。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, $, toast } = App.U;
  const UI = App.UI;

  const stars = (n) => `<span class="tm-level" aria-label="難しさ ${n}">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;

  // 北京の街並み（かわいい背景イラスト）
  const SKYLINE = `
    <svg class="tm-sky" viewBox="0 0 400 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 70 L30 52 L58 66 L92 40 L128 62 L160 48 L196 66 L232 44 L270 64 L304 50 L340 66 L372 46 L400 60 L400 90 L0 90 Z" fill="#DCE8C8"/>
      <path d="M40 58 L58 50 L76 58 L94 47 L112 58" stroke="#B58A5A" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <g fill="#E8B4A0"><rect x="170" y="56" width="60" height="20" rx="2"/><path d="M162 58 L200 44 L238 58 Z" fill="#C0504D"/></g>
      <g fill="#F3D9C4"><rect x="260" y="60" width="16" height="18"/><rect x="282" y="52" width="14" height="26"/><rect x="300" y="64" width="20" height="14"/></g>
      <g fill="#F0503C"><circle cx="120" cy="74" r="4"/><circle cx="136" cy="74" r="4"/><circle cx="152" cy="74" r="4"/></g>
      <rect y="78" width="400" height="12" fill="#EFE3CA"/>
    </svg>`;
  const MOUNTAIN = `
    <svg class="tm-sky" viewBox="0 0 400 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 74 L50 30 L90 60 L140 18 L190 58 L240 26 L290 62 L340 32 L400 66 L400 90 L0 90 Z" fill="#B9CFA0"/>
      <path d="M0 80 L70 56 L130 74 L200 50 L260 76 L330 58 L400 78 L400 90 L0 90 Z" fill="#9DB985"/>
      <g fill="#C0504D"><rect x="186" y="58" width="28" height="14"/><path d="M180 60 L200 50 L220 60 Z" fill="#6B4A3A"/></g>
    </svg>`;

  App.screens.map = (root) => {
    const T = App.Trip;
    const P = App.Progress;
    const lv = P.level();
    const next = T.next();
    const all = T.stages();

    const stateOf = (s) => {
      if (!T.ready(s)) return 'soon';
      if (T.isCleared(s.id)) return 'cleared';
      if (!T.isUnlocked(s)) return 'locked';
      return s === next ? 'next' : 'open';
    };
    const chip = {
      cleared: '<span class="tm-chip is-cleared">✓ クリア</span>',
      next: '<span class="tm-chip is-next">▶ いまここ</span>',
      open: '<span class="tm-chip is-open">行ける！</span>',
      locked: '<span class="tm-chip is-locked">🔒 まだ</span>',
      soon: '<span class="tm-chip is-soon">準備中</span>',
    };
    const node = (s, extra = '') => {
      const st = stateOf(s);
      return `
        <button class="tm-stop is-${st} ${extra}" data-stage="${s.id}">
          <span class="tm-pin">${s.emoji}${s.no ? `<i class="tm-no">${s.no}</i>` : ''}
            ${st === 'next' ? `<span class="tm-here">${App.Hamster.figure({ mood: 'happy', size: 'xs', bounce: true })}</span>` : ''}</span>
          <span class="tm-text">
            <span class="tm-name">${esc(s.name)} ${stars(s.level)}</span>
            <span class="tm-desc">${esc(s.desc)}</span>
          </span>
          ${chip[st]}
        </button>`;
    };

    // 北京：本線を上から順に。寄り道は分かれ道として、元になるステージの下に出す
    const bj = all.filter((s) => s.region === 'beijing');
    const route = bj.filter((s) => s.kind === 'main').map((s) => {
      const sides = bj.filter((x) => x.kind === 'side' && x.after === s.id);
      return `<li class="tm-step">${node(s)}</li>${sides.map((x) => `
        <li class="tm-branch"><span class="tm-branch-label">↪ 寄り道</span>${node(x, 'is-side')}</li>`).join('')}`;
    }).join('');
    const henan = all.filter((s) => s.region === 'henan');
    const hn = T.region('henan');

    const msg = next
      ? `次の行き先は <b>${next.emoji} ${esc(next.name)}</b>！<br><small>${esc(next.goal)}</small>`
      : all.filter(T.ready).every((s) => T.isCleared(s.id))
        ? '行ける場所はぜんぶ旅したね！🎉<br>好きな場所にもう一度行ってみよう'
        : '寄り道や、少林寺にも行ってみよう！';

    root.innerHTML = `
      ${UI.topbar({ title: '🗺️ 中国を旅する', back: 'title', right: UI.levelChip() })}
      <section class="stats-strip">
        <div class="stat-exp">
          <div class="stat-row"><span>Lv.${lv.level}</span><span class="muted">${lv.cur} / ${lv.need} EXP</span></div>
          ${UI.expBar(lv)}
        </div>
        <div class="stat-mini"><b>${T.percent()}%</b><span>旅の達成率</span></div>
        <div class="stat-mini"><b>${all.filter((s) => T.isCleared(s.id)).length}</b><span>行った場所</span></div>
      </section>

      ${UI.hamsterSays(msg, { mood: 'happy', size: 'sm' })}
      ${next ? `<button class="btn btn-primary btn-lg btn-block tm-go" data-stage="${next.id}">${next.emoji} ${esc(next.name)}へ出発</button>` : ''}

      <section class="tm-region">
        <header class="tm-region-head">${SKYLINE}<div><h2>📍 ${esc(T.region('beijing').zh)}</h2><p>${esc(T.region('beijing').desc)}</p></div></header>
        <ol class="tm-route">${route}</ol>
      </section>

      <div class="tm-rail" aria-hidden="true"><span>🚄</span>${esc(hn.how)}<small>北京から南西へ約 700km</small></div>

      <section class="tm-region is-henan">
        <header class="tm-region-head">${MOUNTAIN}<div><h2>📍 ${esc(hn.zh)}・嵩山</h2><p>${esc(hn.desc)}</p></div></header>
        <ol class="tm-route is-special">${henan.map((s) => `<li class="tm-step">${node(s, 'is-special')}
          <p class="tm-note">⭐ 特別な旅先・高難度。空港に着いたら、いつでも行けるよ</p></li>`).join('')}</ol>
      </section>

      <div class="cs-sheet-wrap" hidden><div class="cs-sheet card"></div></div>
      ${UI.tabbar('map')}`;

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

    const here = $('.tm-stop.is-next', root);
    if (here && Object.keys(App.Store.state.trip.cleared).length) requestAnimationFrame(() => here.scrollIntoView({ block: 'center' }));
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
