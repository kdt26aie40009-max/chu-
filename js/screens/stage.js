/* ステージ進行：案内 → 覚える → クイズ → 本番（会話） → 結果 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { $ } = App.U;
  const UI = App.UI;

  const STEPS = [
    { icon: '🐹', label: '案内' },
    { icon: '📝', label: '覚える' },
    { icon: '❓', label: 'クイズ' },
    { icon: '💬', label: '本番' },
  ];

  App.screens.stage = (root, { spotId }) => {
    const city = App.currentCity();
    const spot = city.spots.find((s) => s.id === spotId);
    if (!spot || !App.Progress.isUnlocked(city, spot)) { App.go('map'); return; }

    const P = App.Progress;
    const phrases = spot.phrases.map(App.phrase);
    const ctx = { mistakes: 0 };

    root.innerHTML = `
      ${UI.topbar({ title: `${spot.emoji} ${spot.name}`, back: 'map', confirmMsg: '旅を中断してマップに戻る？' })}
      <ol class="stage-steps">
        ${STEPS.map((s, k) => `<li class="stage-step" data-k="${k}"><span>${s.icon}</span>${s.label}</li>`).join('')}
      </ol>
      <main class="stage-body"></main>`;

    const body = $('.stage-body', root);

    const setStep = (k) => {
      root.querySelectorAll('.stage-step').forEach((el) => {
        const n = Number(el.dataset.k);
        el.classList.toggle('is-done', n < k);
        el.classList.toggle('is-cur', n === k);
      });
      window.scrollTo({ top: 0 });
      [intro, learn, quiz, scene][k]();
    };

    function intro() {
      App.Dialogue.run(body, spot.intro, {
        npcs: spot.npcs,
        doneLabel: '📝 中国語を覚える ▶',
        onDone: () => setStep(1),
      });
    }

    function learn() {
      App.Learn.run(body, phrases, {
        onDone: () => { P.learn(spot.phrases); setStep(2); },
      });
    }

    function quiz() {
      App.Quiz.run(body, App.Quiz.build(phrases), {
        onAnswer: (id, ok, retry) => {
          if (!retry) P.recordAnswer(id, ok);
          if (!ok) ctx.mistakes++;
        },
        onDone: () => {
          body.innerHTML = `
            <div class="interlude pop-in">
              ${UI.hamsterSays(`クイズおつかれさま！<br>じゃあ本番。<b>覚えた中国語を実際に使ってみよう！</b>`, { mood: 'happy', size: 'lg' })}
              <button class="btn btn-primary btn-lg btn-block" data-go-scene>💬 ${spot.name}へ入る ▶</button>
            </div>`;
          $('[data-go-scene]', body).onclick = () => { App.Sfx.play('tap'); setStep(3); };
        },
      });
    }

    function scene() {
      App.Dialogue.run(body, spot.scene, {
        npcs: spot.npcs,
        pool: spot.phrases,
        doneLabel: '🎉 クリア！結果を見る',
        onMistake: () => { ctx.mistakes++; },
        onDone: () => {
          const result = P.completeSpot(city, spot, ctx);
          App.go('result', { spotId: spot.id, result });
        },
      });
    }

    setStep(0);
  };
})(window.App = window.App || {});
