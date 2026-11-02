/* クイズ
 * 出題タイプ:
 *   ja2zh  日本語 → 中国語を選ぶ
 *   zh2ja  中国語 → 意味を選ぶ
 *   listen 音声を聞いて意味を選ぶ
 * 間違えた問題は最後にもう一度だけ出る（ゲームオーバーなし）
 */
(function (App) {
  'use strict';

  const { esc, shuffle, $ } = App.U;
  const UI = App.UI;

  function pickDistractors(id, n, field) {
    const answer = App.PHRASES[id];
    const group = App.PHRASE_SPOT[id];
    const all = Object.keys(App.PHRASES).filter((k) => k !== id);
    const same = shuffle(all.filter((k) => App.PHRASE_SPOT[k] === group));
    const other = shuffle(all.filter((k) => App.PHRASE_SPOT[k] !== group));
    const seen = new Set([answer[field]]);
    const out = [];
    for (const k of same.concat(other)) {
      const text = App.PHRASES[k][field];
      if (seen.has(text)) continue;
      seen.add(text);
      out.push(k);
      if (out.length >= n) break;
    }
    return out;
  }

  const Quiz = {
    build(phrases) {
      const cycle = App.Speech.supported ? ['ja2zh', 'listen', 'zh2ja'] : ['ja2zh', 'zh2ja'];
      return shuffle(phrases.map((p, k) => {
        const type = cycle[k % cycle.length];
        const field = type === 'ja2zh' ? 'zh' : 'ja';
        return { id: p.id, type, options: shuffle([p.id, ...pickDistractors(p.id, 3, field)]) };
      }));
    },

    run(root, questions, { onAnswer = () => {}, onDone, label = 'クイズ' }) {
      const queue = questions.map((q) => Object.assign({ retry: false }, q));
      const total = questions.length;
      let finished = 0;
      let firstTry = 0;

      const promptHtml = (q, p) => {
        if (q.type === 'ja2zh') {
          return `<div class="q-label">「<b>${esc(p.ja)}</b>」は中国語でどれ？</div>`;
        }
        if (q.type === 'zh2ja') {
          return `<div class="q-label">この中国語の意味は？</div>
            <div class="q-zh"><span class="zh zh-lg">${esc(p.zh)}</span>${UI.speakBtn(p.zh)}</div>
            ${UI.pinyin(p.py)}`;
        }
        return `<div class="q-label">音声を聞いて、意味を選ぼう</div>
          <div class="q-listen">
            ${UI.speakBtn(p.zh, { label: '🔊', cls: 'speak-big' })}
            ${UI.speakBtn(p.zh, { slow: true, label: '🐢 ゆっくり', cls: 'speak-pill is-sub' })}
          </div>`;
      };

      const next = () => {
        if (!root.isConnected) return;
        if (!queue.length) { onDone({ correct: firstTry, total }); return; }
        const q = queue.shift();
        const p = App.PHRASES[q.id];
        const zhOpts = q.type === 'ja2zh';

        root.innerHTML = `
          <div class="quiz">
            <div class="quiz-head">
              <span class="chip">${label} ${Math.min(finished + 1, total)} / ${total}</span>
              ${q.retry ? '<span class="chip chip-retry">もう一回！</span>' : ''}
            </div>
            <div class="card q-card pop-in">${promptHtml(q, p)}</div>
            <div class="options ${zhOpts ? 'options-zh' : ''}">
              ${q.options.map((oid, k) => {
                const o = App.PHRASES[oid];
                const body = zhOpts ? `<span class="zh">${esc(o.zh)}</span>${UI.pinyin(o.py)}` : esc(o.ja);
                return `<button class="option" data-oid="${oid}"><span class="opt-key">${'ABCD'[k]}</span><span class="opt-body">${body}</span></button>`;
              }).join('')}
            </div>
            <div class="feedback"></div>
          </div>`;

        if (q.type === 'listen') setTimeout(() => { if (root.isConnected) App.Speech.speak(p.zh); }, 300);

        root.querySelectorAll('.option').forEach((btn) => {
          btn.onclick = () => {
            const ok = btn.dataset.oid === q.id;
            root.querySelectorAll('.option').forEach((b) => {
              b.disabled = true;
              if (b.dataset.oid === q.id) b.classList.add('is-correct');
            });
            if (!ok) btn.classList.add('is-wrong', 'shake');
            App.Sfx.play(ok ? 'correct' : 'wrong');
            onAnswer(q.id, ok, q.retry);

            if (!q.retry && ok) firstTry++;
            if (!q.retry && !ok) queue.push(Object.assign({}, q, { retry: true, options: shuffle(q.options) }));
            if (ok || q.retry) finished++;

            const msg = ok
              ? ['正解！その調子！', 'すごい！ばっちり！', '正解〜！覚えてきたね！'][Math.floor(Math.random() * 3)]
              : (q.retry ? 'おしい！正解はこれだよ。旅の中でまた出てくるからね' : 'おしい！正解はこれ。あとでもう一回出るよ！');

            $('.feedback', root).innerHTML = `
              ${UI.hamsterSays(msg, { mood: ok ? 'happy' : 'think', size: 'xs', cls: 'is-compact' })}
              <div class="fb-phrase ${ok ? 'is-ok' : 'is-ng'}">
                <div><span class="zh">${esc(p.zh)}</span> ${UI.speakBtn(p.zh, { cls: 'speak-sm' })}</div>
                ${UI.pinyin(p.py, { force: true })}
                <div class="fb-ja">${esc(p.ja)}</div>
              </div>
              <button class="btn btn-primary btn-block" data-next>次へ ▶</button>`;
            App.Speech.speak(p.zh);
            $('[data-next]', root).onclick = () => { App.Sfx.play('tap'); next(); };
            $('.feedback', root).scrollIntoView({ behavior: 'smooth', block: 'end' });
          };
        });
      };

      next();
    },
  };

  App.Quiz = Quiz;
})(window.App = window.App || {});
