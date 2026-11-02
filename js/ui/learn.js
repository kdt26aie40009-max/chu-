/* 学習カード：日本語 / 中国語 / ピンイン / 発音ボタン / 声に出して練習 */
(function (App) {
  'use strict';

  const { esc, $ } = App.U;
  const UI = App.UI;

  async function practice(p, btn, out) {
    btn.disabled = true;
    btn.textContent = '👂 聞いてるよ…話してみて！';
    try {
      const alts = await App.Speech.listen();
      if (!alts.length) {
        out.innerHTML = '<span class="ng">聞き取れなかったみたい。もう一回！</span>';
      } else if (App.Speech.matches(p.zh, alts)) {
        App.Sfx.play('correct');
        out.innerHTML = '<span class="ok">ばっちり通じるよ！🎉</span>';
      } else {
        App.Sfx.play('wrong');
        out.innerHTML = `<span class="ng">「${esc(alts[0])}」に聞こえたよ。お手本をもう一回聞いてみよう！</span>`;
      }
    } catch (e) {
      out.innerHTML = '<span class="ng">マイクが使えないみたい…（ブラウザの許可を確認してね）</span>';
    }
    btn.disabled = false;
    btn.textContent = '🎙️ もう一回言ってみる';
  }

  const Learn = {
    run(root, phrases, { onDone }) {
      let i = 0;

      const render = () => {
        const p = phrases[i];
        const last = i === phrases.length - 1;
        root.innerHTML = `
          <div class="learn">
            <div class="dots">${phrases.map((_, k) => `<span class="dot${k < i ? ' is-done' : ''}${k === i ? ' is-cur' : ''}"></span>`).join('')}</div>
            <div class="card phrase-card pop-in">
              <div class="phrase-ja">${esc(p.ja)}</div>
              <div class="zh zh-xl">${esc(p.zh)}</div>
              ${UI.pinyin(p.py, { force: true, cls: 'py-lg' })}
              <div class="speak-row">
                ${UI.speakBtn(p.zh, { label: '🔊 聞く', cls: 'speak-pill' })}
                ${UI.speakBtn(p.zh, { slow: true, label: '🐢 ゆっくり', cls: 'speak-pill is-sub' })}
              </div>
              <div class="practice">
                ${App.Speech.canRecognize
                  ? '<button class="btn btn-mic" data-mic>🎙️ 声に出して言ってみる</button><div class="mic-result"></div>'
                  : '<p class="practice-note">🗣️ 音声のあとに、まねして声に出してみよう！</p>'}
              </div>
            </div>
            ${UI.hamsterSays(p.tip || 'この言葉を覚えよう！', { size: 'sm' })}
            <div class="bottom-actions">
              <button class="btn btn-primary btn-block" data-next>${last ? '覚えた！クイズへ ▶' : `次の言葉へ ▶（${i + 1}/${phrases.length}）`}</button>
            </div>
          </div>`;

        setTimeout(() => { if (root.isConnected) App.Speech.speak(p.zh); }, 350);

        $('[data-next]', root).onclick = () => {
          App.Sfx.play('tap');
          if (last) onDone();
          else { i++; render(); window.scrollTo({ top: 0 }); }
        };
        const mic = $('[data-mic]', root);
        if (mic) mic.onclick = () => practice(p, mic, $('.mic-result', root));
      };

      render();
    },
  };

  App.Learn = Learn;
})(window.App = window.App || {});
