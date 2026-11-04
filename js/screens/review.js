/* 復習：復習の時期が来た言葉・覚えが弱い言葉から 10 問だけ（毎日やらなくても不利にならない） */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { $ } = App.U;
  const UI = App.UI;
  const COUNT = 10;

  App.screens.review = (root) => {
    const P = App.Progress;
    const ids = P.reviewCandidates(COUNT);

    if (!ids.length) {
      root.innerHTML = `
        ${UI.topbar({ title: '📚 復習', back: 'course' })}
        <div class="interlude">
          ${UI.hamsterSays('まだ覚えた言葉がないよ。<br>まずはコースのレッスンをやってみよう！', { size: 'lg' })}
          <button class="btn btn-primary btn-block" data-go="course">📘 コースへ</button>
        </div>`;
      return;
    }

    App.Exercise.run(root, App.Course.buildReview(ids, COUNT), {
      onAnswer: (id, ok, retry) => { if (!retry) P.recordAnswer(id, ok); },
      onQuit: () => App.go('course'),
      onDone: ({ correct, total }) => {
        const r = P.completeReview(correct);
        App.Sfx.play('clear');
        const msg = correct === total
          ? '全問正解！しっかり覚えてるね〜！'
          : correct >= total / 2 ? 'いい感じ！少しずつ定着してるよ' : '大丈夫、何回も会えば覚えられるよ。また一緒にやろう！';
        root.innerHTML = `
          <div class="result">
            <div class="result-head pop-in"><div class="result-emoji">📚</div><h2>復習おわり！</h2></div>
            ${UI.hamsterSays(msg, { mood: 'happy', size: 'md' })}
            <section class="card result-card result-stats">
              <div class="exp-gain"><span class="exp-big">+${r.gained}</span><span>EXP</span></div>
              <div class="exp-detail muted">${total}問中 ${correct}問 一発正解</div>
              ${r.levelUp ? `<div class="levelup">⬆️ レベルアップ！ <b>Lv.${r.after.level}</b></div>` : ''}
              ${UI.expBar(r.after)}
            </section>
            <div class="result-actions">
              <button class="btn btn-primary btn-block" data-go="course">📘 コースへ戻る</button>
              ${P.dueCount() > 0 ? '<button class="btn btn-sub btn-block" data-again>もう1セット</button>' : '<p class="soft-note">今日の復習はこれで十分！</p>'}
            </div>
          </div>`;
        const again = $('[data-again]', root);
        if (again) again.onclick = () => App.go('review');
      },
    });
  };
})(window.App = window.App || {});
