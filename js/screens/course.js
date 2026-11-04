/* 2D 学習コース：カテゴリ（基礎・単語・文法と文章・会話）を選んで、一本道のマップで進む */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, $, toast } = App.U;
  const UI = App.UI;
  const ZIG = [0, 42, 62, 42, 0, -42, -62, -42]; // ノードの左右のずれ（px）

  App.screens.course = (root, params = {}) => {
    const C = App.Course;
    const P = App.Progress;
    const st = App.Store.state;
    const lv = P.level();
    const due = P.dueCount();
    const cat = C.cat(params.cat) || C.cat(st.course.lastCat) || C.cats()[0];
    const cur = C.current(cat);

    const nodeIcon = (l) => (l.review ? '🏆' : C.isDone(l.id) ? '✓' : l.dialogue ? '💬' : l.unit.emoji);

    const tabs = C.cats().map((c) => {
      const pr = C.catProgress(c);
      return `<button class="cs-cat${c === cat ? ' is-cur' : ''}" data-cat="${c.id}">
        <span>${c.emoji}</span>${esc(c.title)}<small>${pr.done}/${pr.total}</small></button>`;
    }).join('');

    const units = cat.units.map((u) => {
      const pr = C.unitProgress(u);
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
              <h2>${u.emoji} ${esc(u.title)}</h2>
              <p>${esc(u.desc)}</p>
            </div>
            <div class="cs-banner-pr"><b>${pr.done}</b>/${pr.total}</div>
          </header>
          <div class="cs-path">${nodes}</div>
        </section>`;
    }).join('');

    const first = !Object.keys(st.course.lessons).length;
    const hamsterMsg = first
      ? `はじめまして！ぼくは<b>${App.Hamster.name}</b>。<br>どのカテゴリからでも始められるよ。迷ったら<b>「基礎」</b>の「はじめての中国語」から！`
      : cur
        ? `<b>${esc(cat.title)}</b>の次は <b>${esc(cur.title)}</b>！<br><small>1レッスン約5分。今日はひとつだけでもOKだよ</small>`
        : `<b>${esc(cat.title)}</b>はぜんぶクリア！🎉<br>ほかのカテゴリや復習もやってみよう`;

    root.innerHTML = `
      ${UI.topbar({ title: '📘 中国語を学ぶ', back: 'title', right: UI.levelChip() })}
      <section class="stats-strip">
        <div class="stat-exp">
          <div class="stat-row"><span>Lv.${lv.level}</span><span class="muted">${lv.cur} / ${lv.need} EXP</span></div>
          ${UI.expBar(lv)}
        </div>
        <div class="stat-mini"><b>${C.percent()}%</b><span>コース</span></div>
        <div class="stat-mini"><b>${P.learnedCount()}</b><span>覚えた言葉</span></div>
      </section>

      <nav class="cs-cats">${tabs}</nav>
      <p class="cs-cat-desc">${esc(cat.desc)}</p>

      ${UI.hamsterSays(hamsterMsg, { mood: 'happy', size: 'sm' })}

      <div class="cs-quick">
        ${cur ? `<button class="btn btn-primary btn-lg btn-block" data-lesson="${cur.id}">▶ ${esc(cur.title)} をはじめる</button>` : ''}
        ${due > 0 && P.learnedCount() >= 3 ? `<button class="btn btn-accent btn-block" data-go="review">📚 復習する（${Math.min(due, 10)}問）</button>` : ''}
      </div>

      <div class="cs-units">${units}</div>
      <p class="soft-note">毎日じゃなくても大丈夫。続きはいつでもここから🐹</p>

      <div class="cs-sheet-wrap" hidden><div class="cs-sheet card"></div></div>
      ${UI.tabbar('course')}`;

    root.querySelectorAll('[data-cat]').forEach((b) => {
      b.onclick = () => {
        App.Sfx.play('tap');
        st.course.lastCat = b.dataset.cat;
        App.Store.save();
        App.go('course', { cat: b.dataset.cat });
      };
    });

    const sheetWrap = $('.cs-sheet-wrap', root);
    const sheet = $('.cs-sheet', root);
    const closeSheet = () => { sheetWrap.hidden = true; };
    sheetWrap.onclick = (e) => { if (e.target === sheetWrap) closeSheet(); };

    function openSheet(l) {
      const words = l.review ? [] : l.ids.map((id) => App.PHRASES[id]).filter(Boolean);
      const rec = st.course.lessons[l.id];
      const kind = l.review ? 'このユニットの言葉から、覚えが弱いものを中心に出題するよ'
        : l.dialogue ? '言葉をおさらいしてから、チャット形式の会話に挑戦！'
          : l.reads ? '短い中国語の文章を読んで、質問に答えよう' : '';
      sheet.innerHTML = `
        <div class="cs-sheet-head" style="--c:${l.unit.color}">
          <span>${l.unit.cat.emoji} ${esc(l.unit.cat.title)}・${esc(l.unit.title)}</span>
          <h3>${l.review ? '🏆 ' : ''}${esc(l.title)}</h3>
          <small>約5分${rec ? `・クリア ${rec.count}回・最高 ${rec.best}%` : ''}</small>
        </div>
        ${kind ? `<p class="muted small">${kind}</p>` : ''}
        ${words.length ? `<ul class="cs-words">${words.map((p) => `<li><span class="zh">${esc(p.zh)}</span><span class="muted">${esc(p.ja)}</span></li>`).join('')}</ul>` : ''}
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

    const here = $('.cs-node.is-cur', root);
    if (here && C.catProgress(cat).done > 0) requestAnimationFrame(() => here.scrollIntoView({ block: 'center' }));
  };
})(window.App = window.App || {});
