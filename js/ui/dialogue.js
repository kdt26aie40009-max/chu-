/* 会話画面（チャット形式）
 * ハムスター・NPC のセリフを順番に表示し、
 * 'say' ではユーザーが中国語を選んで話し、'understand' では NPC の言葉を聞き取る。
 */
(function (App) {
  'use strict';

  const { esc, shuffle, $ } = App.U;
  const UI = App.UI;

  const hamsterMsg = (s) => `
    <div class="msg msg-hamster pop-in">
      ${App.Hamster.figure({ mood: s.mood || 'normal', size: 'xs' })}
      <div class="msg-bubble">${s.text}${UI.mochiBtn(s.text)}</div>
    </div>`;

  const npcMsg = (s, npc, hideJa) => `
    <div class="msg msg-npc pop-in">
      <div class="avatar">${npc.emoji}</div>
      <div class="msg-bubble">
        <div class="msg-name">${esc(npc.name)}</div>
        <div class="msg-zh"><span class="zh">${esc(s.zh)}</span>${UI.speakBtn(s.zh, { cls: 'speak-sm' })}</div>
        ${UI.pinyin(s.py)}
        <div class="msg-ja${hideJa ? ' is-hidden' : ''}">${esc(s.ja)}</div>
      </div>
    </div>`;

  const meMsg = (p) => `
    <div class="msg msg-me pop-in">
      <div class="msg-bubble">
        <div class="msg-name">あなた</div>
        <div class="msg-zh"><span class="zh">${esc(p.zh)}</span>${UI.speakBtn(p.zh, { cls: 'speak-sm' })}</div>
        ${UI.pinyin(p.py)}
        <div class="msg-ja">${esc(p.ja)}</div>
      </div>
      <div class="avatar avatar-me">🧳</div>
    </div>`;

  // 'say' の選択肢：正解 + 覚えた言葉 / 同じスポットの言葉から 2 つ
  function sayOptions(answerId, extraPool) {
    const answer = App.PHRASES[answerId];
    const learned = Object.keys(App.Store.state.learned);
    const pool = Array.from(new Set([...extraPool, ...learned]))
      .filter((id) => id !== answerId && App.PHRASES[id] && App.PHRASES[id].zh !== answer.zh);
    let picks = shuffle(pool).slice(0, 2);
    if (picks.length < 2) {
      const rest = shuffle(Object.keys(App.PHRASES).filter((id) => id !== answerId && !picks.includes(id)));
      picks = picks.concat(rest.slice(0, 2 - picks.length));
    }
    return shuffle([answerId, ...picks]);
  }

  // 選択肢パネル（sticky）に最新セリフが隠れないよう、ページ最下部までスクロール
  const scrollBottom = () => requestAnimationFrame(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  });

  const Dialogue = {
    run(root, steps, { npcs = {}, pool = [], onDone, onMistake = () => {}, doneLabel = 'つづける ▶' }) {
      root.innerHTML = `<div class="chat">
        <div class="chat-tools">${UI.rateToggle()}${UI.voiceNotice()}</div>
        <div class="chat-log"></div><div class="chat-actions"></div></div>`;
      const log = $('.chat-log', root);
      const actions = $('.chat-actions', root);
      let i = 0;

      const npcOf = (key) => npcs[key] || Object.values(npcs)[0] || { name: '', emoji: '🙂' };
      const isInteractive = (s) => s && s.type === 'say';

      const push = (html) => {
        log.insertAdjacentHTML('beforeend', html);
        scrollBottom();
        return log.lastElementChild;
      };

      const showNext = (label = '▶ つぎへ') => {
        if (i >= steps.length) {
          actions.innerHTML = `<button class="btn btn-primary btn-block" data-act>${doneLabel}</button>`;
          $('[data-act]', actions).onclick = () => { App.Sfx.play('tap'); onDone(); };
        } else {
          actions.innerHTML = `<button class="btn btn-next btn-block" data-act>${label}</button>`;
          $('[data-act]', actions).onclick = () => { App.Sfx.play('tap'); step(); };
        }
        scrollBottom();
      };

      // ユーザーの行動が成功したあと：少し待って自動で次へ
      const afterAction = () => {
        actions.innerHTML = '';
        setTimeout(() => { if (log.isConnected) step(); }, 900);
      };

      const wrongFeedback = (btn, text) => {
        btn.classList.add('is-wrong', 'shake');
        btn.disabled = true;
        App.Sfx.play('wrong');
        onMistake();
        const fb = $('.say-feedback', actions);
        if (fb) fb.innerHTML = UI.hamsterSays(text, { mood: 'think', size: 'xs', cls: 'is-compact' });
      };

      function step() {
        if (!log.isConnected) return;
        if (i >= steps.length) { showNext(); return; }
        const s = steps[i++];
        if (s.type === 'say') return say(s);
        if (s.type === 'understand') return understand(s);

        if (s.who === 'hamster') { push(hamsterMsg(s)); App.MochiVoice.speak(s.text); }
        else { push(npcMsg(s, npcOf(s.who), false)); App.Speech.speak(s.zh); }

        if (isInteractive(steps[i])) setTimeout(() => { if (log.isConnected) step(); }, 500);
        else showNext();
      }

      function say(s) {
        const opts = sayOptions(s.answer, pool);
        actions.innerHTML = `
          <div class="say-box pop-in">
            <div class="say-prompt">💬 ${s.prompt}</div>
            <div class="options options-zh">
              ${opts.map((id) => {
                const p = App.PHRASES[id];
                return `<div class="opt-wrap"><button class="option" data-id="${id}">
                  <span class="opt-body"><span class="zh">${esc(p.zh)}</span>${UI.pinyin(p.py)}
                  <span class="opt-hint">${esc(p.ja)}</span></span></button>
                  ${UI.speakBtn(p.zh, { cls: 'speak-sm opt-speak' })}</div>`;
              }).join('')}
            </div>
            <button class="link-btn" data-hint>💡 ヒント（日本語を見る）</button>
            <div class="say-feedback"></div>
          </div>`;
        $('[data-hint]', actions).onclick = (e) => {
          $('.options', actions).classList.add('show-hint');
          e.currentTarget.remove();
        };
        actions.querySelectorAll('.option').forEach((btn) => {
          btn.onclick = () => {
            const id = btn.dataset.id;
            if (id === s.answer) {
              App.Sfx.play('correct');
              const p = App.PHRASES[id];
              push(meMsg(p));
              App.Speech.speak(p.zh);
              afterAction();
            } else {
              wrongFeedback(btn, `おしい！それは「${esc(App.PHRASES[id].ja)}」って意味だよ`);
            }
          };
        });
        scrollBottom();
      }

      function understand(s) {
        const el = push(npcMsg(s, npcOf(s.who), true));
        App.Speech.speak(s.zh);
        const order = shuffle(s.options.map((text, k) => ({ text, k })));
        actions.innerHTML = `
          <div class="say-box pop-in">
            <div class="say-prompt">👂 ${s.prompt}</div>
            <div class="options">
              ${order.map((o) => `<button class="option" data-k="${o.k}"><span class="opt-body">${esc(o.text)}</span></button>`).join('')}
            </div>
            ${s.hint ? '<button class="link-btn" data-hint>💡 ヒント</button>' : ''}
            <div class="say-feedback"></div>
          </div>`;
        const hintBtn = $('[data-hint]', actions);
        if (hintBtn) {
          hintBtn.onclick = () => {
            $('.say-feedback', actions).innerHTML = UI.hamsterSays(s.hint, { size: 'xs', cls: 'is-compact' });
            hintBtn.remove();
          };
        }
        actions.querySelectorAll('.option').forEach((btn) => {
          btn.onclick = () => {
            if (Number(btn.dataset.k) === s.answer) {
              App.Sfx.play('correct');
              btn.classList.add('is-correct');
              $('.msg-ja', el).classList.remove('is-hidden');
              setTimeout(afterAction, 300);
            } else {
              wrongFeedback(btn, 'もう一回聞いてみよう！🔊ボタンで何度でも聞けるよ');
            }
          };
        });
        scrollBottom();
      }

      step();
    },
  };

  App.Dialogue = Dialogue;
})(window.App = window.App || {});
