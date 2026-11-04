/* 2D レッスン：問題ランナー → 結果 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, $ } = App.U;
  const UI = App.UI;

  App.screens.lesson = (root, { lessonId }) => {
    const C = App.Course;
    const P = App.Progress;
    const lesson = C.find(lessonId);
    if (!lesson || !C.isUnlocked(lesson)) { App.go('course'); return; }

    App.Exercise.run(root, C.build(lesson), {
      onAnswer: (id, ok, retry) => { if (!retry) P.recordAnswer(id, ok); },
      onQuit: () => App.go('course', { cat: lesson.unit.cat.id }),
      onDone: (score) => showResult(C.complete(lesson, score)),
    });

    function showResult(r) {
      const pct = r.total ? Math.round((r.correct / r.total) * 100) : 100;
      const msg = r.unitCleared
          ? `<b>${esc(lesson.unit.title)}</b> ユニット クリア！🎉<br>覚えた言葉は旅先でも使えるよ`
          : pct === 100 ? 'ノーミス！すごい〜！' : pct >= 60 ? 'いい感じ！少しずつ覚えていこう' : '大丈夫、何回も会えば覚えられるよ！';
      const words = lesson.review ? [] : lesson.ids.map((id) => App.phrase(id)).filter((p) => p.zh);

      root.innerHTML = `
        <div class="result">
          <div class="result-head pop-in">
            <div class="result-emoji">${r.unitCleared ? '🏆' : lesson.unit.emoji}</div>
            <h2>${lesson.review ? 'まとめ' : esc(lesson.title)} クリア！</h2>
            ${r.first ? '<span class="chip chip-new">NEW</span>' : '<span class="chip">おさらい完了</span>'}
          </div>
          ${UI.hamsterSays(msg, { mood: 'happy', size: 'md' })}

          <section class="card result-card result-stats">
            <div class="ls-score">
              <div><b>${pct}%</b><span>正解率</span></div>
              <div><b>+${r.gained}</b><span>EXP</span></div>
              <div><b>${P.learnedCount()}</b><span>覚えた言葉</span></div>
            </div>
            ${r.bonus ? '<div class="exp-detail muted">ノーミスボーナス +' + r.bonus + ' ✨</div>' : ''}
            ${r.levelUp ? `<div class="levelup">⬆️ レベルアップ！ Lv.${r.before.level} → <b>Lv.${r.after.level}</b></div>` : ''}
            ${UI.expBar(r.after)}
          </section>

          ${words.length ? `
            <section class="card result-card">
              <h3>このレッスンの言葉</h3>
              <ul class="learned-list">
                ${words.map((p) => `<li><div><span class="zh">${esc(p.zh)}</span>${UI.pinyin(p.py, { force: true })}</div>
                  <span class="ja">${esc(p.ja)}</span>${UI.speakBtn(p.zh, { cls: 'speak-sm' })}</li>`).join('')}
              </ul>
            </section>` : ''}

          <div class="result-actions">
            ${r.next ? `
              <p class="soft-note">今日はここまででもOK！続けるなら次は <b>${esc(r.next.title)}</b></p>
              <button class="btn btn-primary btn-lg btn-block" data-next>▶ ${esc(r.next.title)}</button>` : ''}
            <button class="btn btn-sub btn-block" data-course>📘 コースへ戻る</button>
          </div>
        </div>`;
      App.Sfx.play('clear');
      const nb = $('[data-next]', root);
      if (nb) nb.onclick = () => { App.Sfx.play('tap'); App.go('lesson', { lessonId: r.next.id }); };
      $('[data-course]', root).onclick = () => { App.Sfx.play('tap'); App.go('course', { cat: lesson.unit.cat.id }); };
    }
  };
})(window.App = window.App || {});
