/* 復習：覚えが弱い言葉から 5 つだけ */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { $ } = App.U;
  const UI = App.UI;
  const COUNT = 5;

  App.screens.review = (root) => {
    const P = App.Progress;
    const ids = P.reviewCandidates(COUNT);

    root.innerHTML = `
      ${UI.topbar({ title: '📚 ちょっと復習', back: 'map', right: UI.levelChip() })}
      <main class="stage-body"></main>`;
    const body = $('.stage-body', root);

    if (!ids.length) {
      body.innerHTML = `
        ${UI.hamsterSays('まだ覚えた言葉がないよ。まずは空港へ行ってみよう！✈️', { size: 'lg' })}
        <button class="btn btn-primary btn-block" data-go="map">マップへ</button>`;
      return;
    }

    body.innerHTML = `
      <div class="interlude pop-in">
        ${UI.hamsterSays(`覚えた言葉、覚えてる？<br><b>${ids.length}問だけ</b>やってみよう！`, { mood: 'happy', size: 'lg' })}
        <button class="btn btn-primary btn-lg btn-block" data-start>はじめる ▶</button>
      </div>`;

    $('[data-start]', body).onclick = () => {
      App.Sfx.play('tap');
      App.Quiz.run(body, App.Quiz.build(ids.map(App.phrase)), {
        label: '復習',
        onAnswer: (id, ok, retry) => { if (!retry) P.recordAnswer(id, ok); },
        onDone: ({ correct, total }) => {
          const r = P.completeReview(correct);
          App.Sfx.play('clear');
          const msg = correct === total
            ? '全問正解！しっかり覚えてるね〜！'
            : correct >= total / 2 ? 'いい感じ！少しずつ定着してるよ' : '大丈夫、何回も会えば覚えられるよ。また一緒にやろう！';
          body.innerHTML = `
            <div class="interlude pop-in">
              ${UI.hamsterSays(msg, { mood: 'happy', size: 'lg' })}
              <section class="card result-card result-stats">
                <div class="exp-gain"><span class="exp-big">+${r.gained}</span><span>EXP</span></div>
                <div class="exp-detail muted">${total}問中 ${correct}問 一発正解</div>
                ${r.levelUp ? `<div class="levelup">⬆️ レベルアップ！ <b>Lv.${r.after.level}</b></div>` : ''}
                ${UI.expBar(r.after)}
              </section>
              <button class="btn btn-primary btn-block" data-go="map">🗺️ マップへ戻る</button>
              <button class="btn btn-sub btn-block" data-go="review">もう1セット</button>
            </div>`;
        },
      });
    };
  };
})(window.App = window.App || {});
