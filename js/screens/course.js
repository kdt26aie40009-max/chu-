/* 2D 学習コースのマップ（Duolingo 風の一本道） */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, $, toast } = App.U;
  const UI = App.UI;
  const ZIG = [0, 42, 62, 42, 0, -42, -62, -42]; // ノードの左右のずれ（px）

  App.screens.course = (root) => {
    const C = App.Course;
    const P = App.Progress;
    const lv = P.level();
    const cur = C.current();
    const due = P.dueCount();
    const city = App.currentCity();
    const travel = C.travelUnlocked();

    const nodeIcon = (l) => (l.review ? '🏆' : C.isDone(l.id) ? '✓' : l.unit.emoji);
    const spotsFor = (u) => city.spots.filter((s) => s.requires === u.id && !s.comingSoon);

    const units = C.units().map((u) => {
      const pr = C.unitProgress(u);
      const spots = spotsFor(u);
      const nodes = u.lessons.map((l, k) => {
        const state = C.isDone(l.id) ? 'done' : l === cur ? 'cur' : C.isUnlocked(l) ? 'open' : 'locked';
        return `
          <div class="cs-node-wrap" style="--x:${ZIG[k % ZIG.length]}px">
            ${state === 'cur' ? `<div class="cs-here">${App.Hamster.figure({ mood: 'happy', size: 'xs', bounce: true })}<span>ここから！</span></div>` : ''}
            <button class="cs-node is-${state}${l.review ? ' is-review' : ''}" data-lesson="${l.id}" style="--c:${u.color}" aria-label="${esc(l.title)}">
              ${state === 'locked' ? '🔒' : nodeIcon(l)}
            </button>
            <span class="cs-node-label">${esc(l.title)}</span>
          </div>`;
      }).join('');
      return `
        <section class="cs-unit" id="unit-${u.id}">
          <header class="cs-banner" style="--c:${u.color}">
            <div class="cs-banner-main">
              <small>UNIT ${u.id.slice(1)}</small>
              <h2>${u.emoji} ${esc(u.title)}</h2>
              <p>${esc(u.desc)}</p>
            </div>
            <div class="cs-banner-pr"><b>${pr.done}</b>/${pr.total}</div>
          </header>
          ${spots.length ? `<div class="cs-spots">🗺️ クリアで行ける：${spots.map((s) => `${s.emoji}${esc(s.name)}`).join('・')}</div>` : ''}
          <div class="cs-path">${nodes}</div>
        </section>`;
    }).join('');

    const hamsterMsg = cur
      ? (C.isDone(C.lessons()[0].id)
        ? `次は <b>${esc(cur.unit.emoji)} ${esc(cur.title)}</b>！<br><small>1レッスン約5分。今日はひとつだけでもOKだよ</small>`
        : `はじめまして！ぼくは<b>${App.Hamster.name}</b>。<br>まずは<b>「はじめての中国語」</b>から行ってみよう！`)
      : '全レッスン クリア！🎉<br>復習しながら北京旅行を楽しもう！';

    root.innerHTML = `
      ${UI.topbar({ title: '📘 中国語コース', back: 'title', right: UI.levelChip() })}
      <section class="stats-strip">
        <div class="stat-exp">
          <div class="stat-row"><span>Lv.${lv.level}</span><span class="muted">${lv.cur} / ${lv.need} EXP</span></div>
          ${UI.expBar(lv)}
        </div>
        <div class="stat-mini"><b>${C.percent()}%</b><span>コース</span></div>
        <div class="stat-mini"><b>${P.learnedCount()}</b><span>覚えた言葉</span></div>
      </section>

      ${UI.hamsterSays(hamsterMsg, { mood: 'happy', size: 'sm' })}

      <div class="cs-quick">
        ${cur ? `<button class="btn btn-primary btn-lg btn-block" data-lesson="${cur.id}">▶ ${esc(cur.title)} をはじめる</button>` : ''}
        ${due > 0 && P.learnedCount() >= 3 ? `<button class="btn btn-accent btn-block" data-go="review">📚 復習する（${Math.min(due, 10)}問）</button>` : ''}
        ${travel
          ? '<button class="btn btn-sub btn-block" data-go="map">🗺️ 北京を旅する（覚えた言葉を使おう）</button>'
          : `<div class="cs-lock card">✈️ <b>UNIT 4「旅の準備」</b>をクリアすると<br><b>北京旅行（3D）</b>が解放されるよ！</div>`}
      </div>

      <div class="cs-units">${units}</div>
      <p class="soft-note">毎日じゃなくても大丈夫。続きはいつでもここから🐹</p>

      <div class="cs-sheet-wrap" hidden><div class="cs-sheet card"></div></div>
      ${UI.tabbar('course')}`;

    const sheetWrap = $('.cs-sheet-wrap', root);
    const sheet = $('.cs-sheet', root);
    const closeSheet = () => { sheetWrap.hidden = true; };
    sheetWrap.onclick = (e) => { if (e.target === sheetWrap) closeSheet(); };

    function openSheet(l) {
      const words = l.review ? [] : l.ids.map((id) => App.PHRASES[id]).filter(Boolean);
      const rec = App.Store.state.course.lessons[l.id];
      sheet.innerHTML = `
        <div class="cs-sheet-head" style="--c:${l.unit.color}">
          <span>${l.unit.emoji} UNIT ${l.unit.id.slice(1)}・${esc(l.unit.title)}</span>
          <h3>${l.review ? '🏆 ' : ''}${esc(l.title)}</h3>
          <small>約5分${rec ? `・クリア ${rec.count}回・最高 ${rec.best}%` : ''}</small>
        </div>
        ${l.review
          ? `<p class="muted small">このユニットの言葉から、覚えが弱いものを中心に出題するよ</p>`
          : `<ul class="cs-words">${words.map((p) => `<li><span class="zh">${esc(p.zh)}</span><span class="muted">${esc(p.ja)}</span></li>`).join('')}</ul>`}
        <button class="btn btn-primary btn-lg btn-block" data-start>${rec ? 'もう一回やる' : 'はじめる'} ▶</button>
        <button class="btn btn-sub btn-block" data-close>とじる</button>`;
      $('[data-start]', sheet).onclick = () => { App.Sfx.play('tap'); App.go('lesson', { lessonId: l.id }); };
      $('[data-close]', sheet).onclick = () => { App.Sfx.play('tap'); closeSheet(); };
      sheetWrap.hidden = false;
    }

    root.querySelectorAll('[data-lesson]').forEach((btn) => {
      btn.onclick = () => {
        const l = C.find(btn.dataset.lesson);
        if (!C.isUnlocked(l)) { toast('前のレッスンをクリアすると開くよ🔒'); return; }
        App.Sfx.play('tap');
        if (btn.classList.contains('cs-node')) openSheet(l);
        else App.go('lesson', { lessonId: l.id });
      };
    });

    // 今のレッスンが見える位置までスクロール
    const here = $('.cs-node.is-cur', root);
    if (here && C.isDone(C.lessons()[0].id)) {
      requestAnimationFrame(() => here.scrollIntoView({ block: 'center' }));
    }
  };
})(window.App = window.App || {});
