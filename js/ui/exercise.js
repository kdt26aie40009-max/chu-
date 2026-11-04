/* 2D 学習の問題ランナー（Duolingo 風）
 * items は js/core/course.js の build() がつくる：
 *   { type: 'tutorial' }                         初めての人向けの使い方
 *   { type: 'note', html }                       ハムスターの文法・ポイント説明
 *   { type: 'teach', id }                        新しい言葉のカード
 *   { type: 'choice', id, mode, options }        4 択（mode: ja2zh / zh2ja / listen）
 *   { type: 'match', ids }                       言葉と意味の組み合わせ
 *   { type: 'order', id }                        並べ替え（日本語 → 中国語の文を組み立てる）
 *   { type: 'speak', id }                        声に出す（採点なし・スキップ可）
 *   { type: 'cloze', id, k, options }            穴埋め（文の k 番目の単語を選ぶ）
 *   { type: 'pinyin', id }                       ピンイン入力（声調記号は無くても OK）
 *   { type: 'read', read }                       読解（中国語の短い文章 → 質問に日本語で答える）
 *   { type: 'dialogue', dialogue }               会話ロールプレイ（js/data/dialogues.js・採点なし）
 * 採点する問題（choice / match / order）で間違えたら、最後にもう一回だけ出る。
 */
(function (App) {
  'use strict';

  const { esc, shuffle, $, $$ } = App.U;
  const UI = App.UI;
  const GRADED = ['choice', 'match', 'order', 'cloze', 'pinyin', 'read'];

  // ピンインの比較：声調記号・数字・空白・記号を取り、ü は v / u でも OK
  const normPy = (s) => String(s).toLowerCase().normalize('NFD')
    .replace(/u\u0308/g, 'v').replace(/ü/g, 'v')
    .replace(/[\u0300-\u036f]/g, '').replace(/[0-9\s'’·.,!?？！。，-]/g, '');
  const pyMatch = (input, py) => {
    const a = normPy(input);
    const b = normPy(py);
    return !!a && (a === b || a === b.replace(/v/g, 'u'));
  };

  const PRAISE = ['正解！その調子！', 'すごい！ばっちり！', '正解〜！覚えてきたね！', 'いいね！🎉'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  const Exercise = {
    run(root, items, { onAnswer = () => {}, onDone, onQuit }) {
      const queue = items.map((q) => Object.assign({ retry: false }, q));
      const total = items.filter((q) => GRADED.includes(q.type)).length;
      let finished = 0;
      let correct = 0;
      let mistakes = 0;

      root.innerHTML = `
        <div class="ex">
          <div class="ex-top">
            <button class="ex-quit" data-quit aria-label="やめる">×</button>
            <div class="ex-bar"><div class="ex-bar-fill"></div></div>
            <span class="ex-count"></span>
          </div>
          ${App.Dev.skipBtn('このレッスンをスキップ', 'data-dev-skip-all')}
          <div class="ex-body"></div>
          <div class="ex-foot"></div>
        </div>`;
      const body = $('.ex-body', root);
      const foot = $('.ex-foot', root);
      const bar = $('.ex-bar-fill', root);
      const count = $('.ex-count', root);

      $('[data-quit]', root).onclick = () => {
        if ($('.is-quit', foot)) return;
        const kept = Array.from(foot.childNodes); // 「続ける」で元のボタン（イベント付き）に戻す
        foot.innerHTML = `
          <div class="ex-panel is-quit pop-in">
            ${UI.hamsterSays('ここでやめる？<br>覚えた言葉はちゃんと残るから大丈夫だよ', { mood: 'think', size: 'xs', cls: 'is-compact' })}
            <div class="ex-row">
              <button class="btn btn-sub" data-cancel>続ける</button>
              <button class="btn btn-danger" data-yes>やめる</button>
            </div>
          </div>`;
        $('[data-cancel]', foot).onclick = () => { App.Sfx.play('tap'); foot.replaceChildren(...kept); };
        $('[data-yes]', foot).onclick = () => { App.Sfx.play('tap'); onQuit(); };
      };

      // 開発者モード：全問正解したことにして終える
      const devSkip = $('[data-dev-skip-all]', root);
      if (devSkip) devSkip.onclick = () => { queue.length = 0; onDone({ correct: total, total, mistakes: 0 }); };

      const progress = () => {
        bar.style.width = `${total ? (finished / total) * 100 : 100}%`;
        count.textContent = total ? `${Math.min(finished, total)}/${total}` : '';
      };

      // 「次へ」だけのフッター
      const nextFoot = (label = 'つぎへ ▶') => {
        foot.innerHTML = `<button class="btn btn-primary btn-lg btn-block" data-next>${label}</button>`;
        $('[data-next]', foot).onclick = () => { App.Sfx.play('tap'); next(); };
      };

      // 採点結果のフッター
      function judged(q, ok, p, { note = '' } = {}) {
        if (GRADED.includes(q.type)) {
          if (!q.retry) {
            if (ok) correct++;
            else { mistakes++; queue.push(Object.assign({}, q, { retry: true, options: q.options && shuffle(q.options) })); }
          }
          if (ok || q.retry) finished++;
          progress();
        }
        App.Sfx.play(ok ? 'correct' : 'wrong');
        if (p) App.Speech.speak(p.zh);
        const msg = ok ? pick(PRAISE) : (q.retry ? 'おしい！正解はこれ。また会えば覚えられるよ' : 'おしい！正解はこれ。あとでもう一回出るよ');
        foot.innerHTML = `
          <div class="ex-panel ${ok ? 'is-ok' : 'is-ng'} pop-in">
            ${UI.hamsterSays(msg + note, { mood: ok ? 'happy' : 'think', size: 'xs', cls: 'is-compact' })}
            ${p ? `<div class="ex-answer">
              <div><span class="zh">${esc(p.zh)}</span> ${UI.speakBtn(p.zh, { cls: 'speak-sm' })}</div>
              ${UI.pinyin(p.py, { force: true })}
              <div class="ex-answer-ja">${esc(p.ja)}</div>
            </div>` : ''}
            <button class="btn ${ok ? 'btn-accent' : 'btn-primary'} btn-block" data-next>つぎへ ▶</button>
          </div>`;
        $('[data-next]', foot).onclick = () => { App.Sfx.play('tap'); next(); };
      }

      function next() {
        if (!root.isConnected) return;
        const q = queue.shift();
        if (!q) { onDone({ correct, total, mistakes }); return; }
        render(q);
      }

      function render(q) {
        window.scrollTo({ top: 0 });
        foot.innerHTML = '';
        body.innerHTML = '';
        if (q.retry) body.insertAdjacentHTML('beforeend', '<span class="chip chip-retry ex-retry">もう一回！</span>');
        ({ tutorial, note, teach, choice, match, order, speak, cloze, pinyin, read, dialogue })[q.type](q);
      }

      /* ---------- 説明 ---------- */
      function tutorial() {
        const name = App.Hamster.name;
        const pages = [
          `你好！ぼくは<b>${name}</b>。<br>これから中国語を少しずつ覚えていこう！`,
          '1回のレッスンは<b>約5分</b>。<br>🔊を押すと何度でも音声が聞けるよ',
          '間違えても大丈夫！<br>間違えた問題は<b>最後にもう一回</b>出るから、そこで覚えよう',
          '毎日じゃなくてOK。<br>3D の<b>中国旅行</b>でも、覚えた言葉が役に立つよ✈️',
        ];
        let k = 0;
        const show = () => {
          body.innerHTML = `
            <div class="ex-note pop-in">
              ${App.Hamster.figure({ mood: k === 0 ? 'happy' : 'normal', size: 'lg', bounce: true })}
              <div class="bubble bubble-up">${pages[k]}</div>
              <div class="dots">${pages.map((_, j) => `<span class="dot${j < k ? ' is-done' : ''}${j === k ? ' is-cur' : ''}"></span>`).join('')}</div>
            </div>`;
          foot.innerHTML = `<button class="btn btn-primary btn-lg btn-block" data-next>${k < pages.length - 1 ? 'つぎへ ▶' : 'はじめる ▶'}</button>
            ${k < pages.length - 1 ? '<button class="link-btn ex-skip" data-skip>説明をスキップ</button>' : ''}`;
          $('[data-next]', foot).onclick = () => {
            App.Sfx.play('tap');
            if (++k < pages.length) show(); else next();
          };
          const sk = $('[data-skip]', foot);
          if (sk) sk.onclick = () => { App.Sfx.play('tap'); next(); };
        };
        show();
      }

      function note(q) {
        body.insertAdjacentHTML('beforeend', `
          <div class="ex-note pop-in">
            <div class="ex-title">💡 ポイント</div>
            ${UI.hamsterSays(q.html, { mood: 'happy', size: 'md' })}
          </div>`);
        $$('.ex-note .zh', body).forEach((z) => { z.classList.add('ex-tap-speak'); z.onclick = () => App.Speech.speak(z.textContent); });
        nextFoot('わかった ▶');
      }

      /* ---------- 覚えるカード ---------- */
      function teach(q) {
        const p = App.PHRASES[q.id];
        body.insertAdjacentHTML('beforeend', `
          <div class="ex-title">✨ 新しい言葉</div>
          <div class="card phrase-card pop-in">
            <div class="phrase-ja">${esc(p.ja)}</div>
            <div class="zh zh-xl">${esc(p.zh)}</div>
            ${UI.pinyin(p.py, { force: true, cls: 'py-lg' })}
            <div class="speak-row">
              ${UI.speakBtn(p.zh, { label: '🔊 聞く', cls: 'speak-pill' })}
              ${UI.speakBtn(p.zh, { slow: true, label: '🐢 ゆっくり', cls: 'speak-pill is-sub' })}
            </div>
            ${UI.rateToggle({ cls: 'is-center' })}${UI.voiceNotice()}
          </div>
          ${UI.hamsterSays(p.tip || 'この言葉を覚えよう！', { size: 'sm' })}`);
        App.Progress.learn([q.id]);
        setTimeout(() => { if (root.isConnected) App.Speech.speak(p.zh); }, 300);
        nextFoot('覚えた ▶');
      }

      /* ---------- 4 択 ---------- */
      function choice(q) {
        const p = App.PHRASES[q.id];
        const zhOpts = q.mode === 'ja2zh';
        const prompt = {
          ja2zh: `<div class="ex-title">中国語で言うと？</div><div class="ex-q-ja">${esc(p.ja)}</div>`,
          zh2ja: `<div class="ex-title">意味はどれ？</div>
            <div class="q-zh"><span class="zh zh-lg">${esc(p.zh)}</span>${UI.speakBtn(p.zh)}</div>${UI.pinyin(p.py)}`,
          listen: `<div class="ex-title">聞こえた言葉の意味は？</div>
            <div class="q-listen">${UI.speakBtn(p.zh, { label: '🔊', cls: 'speak-big' })}
            ${UI.speakBtn(p.zh, { slow: true, label: '🐢 ゆっくり', cls: 'speak-pill is-sub' })}</div>`,
        }[q.mode];
        body.insertAdjacentHTML('beforeend', `
          <div class="card q-card pop-in">${prompt}</div>
          <div class="options ${zhOpts ? 'options-zh' : 'options-1'}">
            ${q.options.map((oid, k) => {
              const o = App.PHRASES[oid];
              const label = zhOpts ? `<span class="zh">${esc(o.zh)}</span>${UI.pinyin(o.py)}` : esc(o.ja);
              return `<button class="option" data-oid="${oid}"><span class="opt-key">${k + 1}</span><span class="opt-body">${label}</span></button>`;
            }).join('')}
          </div>`);
        if (q.mode === 'listen') setTimeout(() => { if (root.isConnected) App.Speech.speak(p.zh); }, 300);
        $$('.option', body).forEach((btn) => {
          btn.onclick = () => {
            const ok = btn.dataset.oid === q.id;
            $$('.option', body).forEach((b) => {
              b.disabled = true;
              if (b.dataset.oid === q.id) b.classList.add('is-correct');
            });
            if (!ok) btn.classList.add('is-wrong', 'shake');
            onAnswer(q.id, ok, q.retry);
            judged(q, ok, p);
          };
        });
      }

      /* ---------- 組み合わせ ---------- */
      function match(q) {
        const left = shuffle(q.ids);
        const right = shuffle(q.ids);
        body.insertAdjacentHTML('beforeend', `
          <div class="ex-title">同じ意味どうしをタップしてペアにしよう</div>
          <div class="ex-match pop-in">
            <div class="ex-col">${left.map((id) => `<button class="ex-tile" data-side="zh" data-id="${id}">
              <span class="zh">${esc(App.PHRASES[id].zh)}</span>${UI.pinyin(App.PHRASES[id].py)}</button>`).join('')}</div>
            <div class="ex-col">${right.map((id) => `<button class="ex-tile" data-side="ja" data-id="${id}">${esc(App.PHRASES[id].ja)}</button>`).join('')}</div>
          </div>`);
        let sel = null;
        const missed = new Set();
        let left2 = q.ids.length;
        $$('.ex-tile', body).forEach((t) => {
          t.onclick = () => {
            if (t.dataset.side === 'zh') App.Speech.speak(App.PHRASES[t.dataset.id].zh);
            if (!sel || sel.dataset.side === t.dataset.side) {
              if (sel) sel.classList.remove('is-sel');
              sel = t;
              t.classList.add('is-sel');
              return;
            }
            const a = sel;
            sel = null;
            a.classList.remove('is-sel');
            if (a.dataset.id === t.dataset.id) {
              App.Sfx.play('tap');
              [a, t].forEach((x) => { x.classList.add('is-done'); x.disabled = true; });
              if (!missed.has(t.dataset.id)) onAnswer(t.dataset.id, true, q.retry);
              if (--left2 === 0) {
                const ok = missed.size === 0;
                judged(q, ok, null, { note: ok ? '' : '<br>まちがえたペアは「覚え度」に反映したよ' });
              }
            } else {
              App.Sfx.play('wrong');
              [a, t].forEach((x) => { x.classList.remove('shake'); void x.offsetWidth; x.classList.add('is-wrong', 'shake'); });
              setTimeout(() => [a, t].forEach((x) => x.classList.remove('is-wrong')), 500);
              const id = a.dataset.side === 'zh' ? a.dataset.id : t.dataset.id;
              if (!missed.has(id)) { missed.add(id); onAnswer(id, false, q.retry); }
            }
          };
        });
      }

      /* ---------- 並べ替え ---------- */
      function order(q) {
        const p = App.PHRASES[q.id];
        const words = App.phraseWords(q.id);
        // 答えに無い単語を 1〜2 個まぜる（ひっかけ）
        const used = new Set(words.map((w) => w.zh));
        const extra = shuffle(Object.keys(App.PHRASES).filter((k) => App.PHRASES[k].w && k !== q.id))
          .flatMap((k) => App.phraseWords(k))
          .filter((w) => !used.has(w.zh) && used.add(w.zh))
          .slice(0, words.length >= 4 ? 1 : 2);
        const tiles = shuffle(words.concat(extra).map((w, k) => Object.assign({ k }, w)));
        const answer = [];

        body.insertAdjacentHTML('beforeend', `
          <div class="ex-title">中国語の文に並べよう</div>
          <div class="ex-q-ja pop-in">${esc(p.ja)}</div>
          <div class="ex-line" aria-label="答え"></div>
          <div class="ex-bank"></div>`);
        const line = $('.ex-line', body);
        const bank = $('.ex-bank', body);
        const tileHtml = (t) => `<button class="ex-word" data-k="${t.k}"><span class="zh">${esc(t.zh)}</span>${UI.pinyin(t.py)}</button>`;
        const draw = () => {
          line.innerHTML = answer.map(tileHtml).join('') || '<span class="ex-line-ph">↓ 下の言葉をタップ</span>';
          bank.innerHTML = tiles.map((t) => (answer.includes(t) ? tileHtml(t).replace('class="ex-word"', 'class="ex-word is-used" disabled') : tileHtml(t))).join('');
          $$('.ex-word', line).forEach((b) => { b.onclick = () => { answer.splice(answer.findIndex((t) => t.k === Number(b.dataset.k)), 1); draw(); }; });
          $$('.ex-word:not(.is-used)', bank).forEach((b) => {
            b.onclick = () => {
              const t = tiles.find((x) => x.k === Number(b.dataset.k));
              App.Speech.speak(t.zh);
              answer.push(t);
              draw();
            };
          });
          const check = $('[data-check]', foot);
          if (check) check.disabled = !answer.length;
        };
        foot.innerHTML = '<button class="btn btn-primary btn-lg btn-block" data-check disabled>チェック</button>';
        $('[data-check]', foot).onclick = () => {
          const ok = answer.map((t) => t.zh).join('') === words.map((w) => w.zh).join('');
          $$('.ex-word', body).forEach((b) => { b.disabled = true; });
          line.classList.add(ok ? 'is-ok' : 'is-ng');
          onAnswer(q.id, ok, q.retry);
          judged(q, ok, p);
        };
        draw();
      }

      /* ---------- 穴埋め ---------- */
      function cloze(q) {
        const p = App.PHRASES[q.id];
        const words = App.phraseWords(q.id);
        const ans = words[q.k];
        body.insertAdjacentHTML('beforeend', `
          <div class="ex-title">空いているところに入る言葉は？</div>
          <div class="card q-card pop-in">
            <div class="ex-cloze">${words.map((w, i) => (i === q.k
              ? '<span class="ex-blank">？</span>'
              : `<span class="ex-cw"><span class="zh">${esc(w.zh)}</span>${UI.pinyin(w.py)}</span>`)).join('')}</div>
            <div class="ex-q-sub">${esc(p.ja)}</div>
          </div>
          <div class="options options-zh">
            ${q.options.map((o, k) => `<button class="option" data-zh="${esc(o.zh)}"><span class="opt-key">${k + 1}</span>
              <span class="opt-body"><span class="zh">${esc(o.zh)}</span>${UI.pinyin(o.py)}</span></button>`).join('')}
          </div>`);
        $$('.option', body).forEach((btn) => {
          btn.onclick = () => {
            const ok = btn.dataset.zh === ans.zh;
            $$('.option', body).forEach((b) => {
              b.disabled = true;
              if (b.dataset.zh === ans.zh) b.classList.add('is-correct');
            });
            if (!ok) btn.classList.add('is-wrong', 'shake');
            $('.ex-blank', body).outerHTML = `<span class="ex-cw is-fill"><span class="zh">${esc(ans.zh)}</span>${UI.pinyin(ans.py)}</span>`;
            onAnswer(q.id, ok, q.retry);
            judged(q, ok, p);
          };
        });
      }

      /* ---------- ピンイン入力 ---------- */
      function pinyin(q) {
        const p = App.PHRASES[q.id];
        body.insertAdjacentHTML('beforeend', `
          <div class="ex-title">ピンインを入力しよう</div>
          <div class="card q-card pop-in">
            <div class="q-zh"><span class="zh zh-lg">${esc(p.zh)}</span>${UI.speakBtn(p.zh)}</div>
            <div class="ex-q-sub">${esc(p.ja)}</div>
          </div>
          <input class="ex-input" type="text" inputmode="latin" autocomplete="off" autocapitalize="off" spellcheck="false"
            placeholder="例：nihao（声調はなくてOK）" aria-label="ピンイン">
          <p class="muted small ex-help">声調記号は入れなくて大丈夫。ü は v で入力できるよ</p>`);
        const input = $('.ex-input', body);
        foot.innerHTML = '<button class="btn btn-primary btn-lg btn-block" data-check disabled>チェック</button>';
        const check = $('[data-check]', foot);
        input.oninput = () => { check.disabled = !input.value.trim(); };
        const submit = () => {
          if (check.disabled) return;
          const ok = pyMatch(input.value, p.py);
          input.disabled = true;
          input.classList.add(ok ? 'is-ok' : 'is-ng');
          onAnswer(q.id, ok, q.retry);
          judged(q, ok, p, { note: ok ? '' : `<br>あなたの答え：${esc(input.value)}` });
        };
        check.onclick = submit;
        input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
        setTimeout(() => { if (root.isConnected) input.focus(); }, 200);
      }

      /* ---------- 読解 ---------- */
      function read(q) {
        const r = q.read;
        const order = shuffle(r.options.map((text, k) => ({ text, k })));
        body.insertAdjacentHTML('beforeend', `
          <div class="ex-title">📖 読んで答えよう</div>
          <div class="card ex-read pop-in">
            <div class="ex-read-zh"><span class="zh">${esc(r.zh)}</span>${UI.speakBtn(r.zh, { cls: 'speak-sm' })}</div>
            ${UI.pinyin(r.py)}
            <div class="ex-read-ja is-hidden">${esc(r.ja)}</div>
          </div>
          <div class="ex-q-ja">${esc(r.q)}</div>
          <div class="options options-1">
            ${order.map((o, i) => `<button class="option" data-k="${o.k}"><span class="opt-key">${i + 1}</span><span class="opt-body">${esc(o.text)}</span></button>`).join('')}
          </div>`);
        $$('.option', body).forEach((btn) => {
          btn.onclick = () => {
            const ok = Number(btn.dataset.k) === (r.answer || 0);
            $$('.option', body).forEach((b) => {
              b.disabled = true;
              if (Number(b.dataset.k) === (r.answer || 0)) b.classList.add('is-correct');
            });
            if (!ok) btn.classList.add('is-wrong', 'shake');
            $('.ex-read-ja', body).classList.remove('is-hidden');
            judged(q, ok, null, { note: `<br><small>${esc(r.ja)}</small>` });
          };
        });
      }

      /* ---------- 会話ロールプレイ ---------- */
      function dialogue(q) {
        const d = App.DIALOGUES[q.dialogue];
        body.insertAdjacentHTML('beforeend', `<div class="ex-title">💬 ${esc(d.name)}で会話してみよう</div><div class="ex-chat"></div>`);
        App.Dialogue.run($('.ex-chat', body), (d.intro || []).concat(d.scene), {
          npcs: d.npcs,
          pool: d.phrases || [],
          doneLabel: 'できた！ つぎへ ▶',
          onMistake: () => { mistakes++; },
          onDone: () => next(),
        });
      }

      /* ---------- 声に出す ---------- */
      function speak(q) {
        const p = App.PHRASES[q.id];
        body.insertAdjacentHTML('beforeend', `
          <div class="ex-title">🎙️ 声に出して言ってみよう</div>
          <div class="card phrase-card pop-in">
            <div class="phrase-ja">${esc(p.ja)}</div>
            <div class="zh zh-xl">${esc(p.zh)}</div>
            ${UI.pinyin(p.py, { force: true, cls: 'py-lg' })}
            <div class="speak-row">${UI.speakBtn(p.zh, { label: '🔊 お手本', cls: 'speak-pill is-sub' })}</div>
            <button class="btn btn-mic" data-mic>🎙️ 話す</button>
            <div class="mic-result"></div>
          </div>`);
        foot.innerHTML = `
          <button class="btn btn-primary btn-lg btn-block" data-next>つぎへ ▶</button>
          <button class="link-btn ex-skip" data-skip>今は話せない（スキップ）</button>`;
        $('[data-next]', foot).onclick = () => { App.Sfx.play('tap'); next(); };
        $('[data-skip]', foot).onclick = () => { App.Sfx.play('tap'); next(); };
        const mic = $('[data-mic]', body);
        const out = $('.mic-result', body);
        mic.onclick = async () => {
          mic.disabled = true;
          mic.textContent = '👂 聞いてるよ…';
          try {
            const alts = await App.Speech.listen();
            if (!alts.length) out.innerHTML = '<span class="ng">聞き取れなかったみたい。もう一回！</span>';
            else if (App.Speech.matches(p.zh, alts)) { App.Sfx.play('correct'); out.innerHTML = '<span class="ok">ばっちり通じるよ！🎉</span>'; }
            else out.innerHTML = `<span class="ng">「${esc(alts[0])}」に聞こえたよ。お手本をもう一回聞いてみよう</span>`;
          } catch (e) {
            out.innerHTML = '<span class="ng">マイクが使えないみたい…（ブラウザの許可を確認してね）</span>';
          }
          mic.disabled = false;
          mic.textContent = '🎙️ もう一回';
        };
      }

      progress();
      next();
    },
  };

  App.Exercise = Exercise;
})(window.App = window.App || {});
