/* 武術大会のバトル（抽象的な演出のコマンドバトル）と BGM
 *
 * 流れ：登場演出 → 「よける」（掛け声どおりに 跳/蹲/左/右）を何回か → 「反撃」（師父の声どおりに 拳/腿/掌）
 *       → ボスの HP が半分を切ると必殺技（速い掛け声の連続）→ どちらかの HP が 0 で決着
 * 中国語の掛け声を聞き取って動くのがゲームの中心。ヒント（日本語）は切り替えられる。
 *
 * App.Battle.start(host, { boss, hint, onWin, onLose, onQuit })
 *   boss: { id, name, zh, py, title, color, color2, look, hp, time, dmg, dodges, special?, lines }
 * App.Bgm.play(kind) / App.Bgm.stop()   WebAudio で作る BGM（音源ファイル不要）
 */
(function (App) {
  'use strict';

  const { esc, shuffle } = App.U;

  /* ====================== BGM ====================== */
  const Bgm = (() => {
    let ac = null;
    let timer = 0;
    let master = null;
    const SONGS = {
      // 五音音階（ペンタトニック）で中国風に
      practice: { bpm: 100, root: 220, scale: [0, 2, 4, 7, 9], melody: [0, 2, 4, 2, 7, 4, 2, 0], wave: 'triangle' },
      bossA: { bpm: 148, root: 293.66, scale: [0, 2, 4, 7, 9, 12], melody: [0, 4, 5, 4, 2, 4, 1, 0, 2, 3, 4, 5, 4, 2, 1, 2], wave: 'square' },
      bossB: { bpm: 112, root: 196, scale: [0, 3, 5, 7, 10, 12], melody: [0, 0, 2, 1, 0, 3, 2, 0, 4, 3, 2, 1, 2, 1, 0, 0], wave: 'sawtooth' },
      win: { bpm: 132, root: 261.63, scale: [0, 2, 4, 7, 9, 12], melody: [0, 2, 4, 5, 4, 5, 5, 5], wave: 'triangle', once: true },
    };
    const note = (f, t, d, type, vol) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + d + 0.02);
    };
    const drum = (t, low) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.setValueAtTime(low ? 120 : 220, t);
      o.frequency.exponentialRampToValueAtTime(low ? 45 : 90, t + 0.12);
      g.gain.setValueAtTime(low ? 0.5 : 0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.2);
    };
    function play(kind) {
      stop();
      if (!App.Store.state.settings.sfx) return;
      const song = SONGS[kind];
      if (!song) return;
      if (App.Music) App.Music.hold(true); // ふだんの BGM はお休み
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === 'suspended') ac.resume();
      } catch (e) { return; }
      master = ac.createGain();
      master.gain.value = 0.22;
      master.connect(ac.destination);
      const beat = 60 / song.bpm / 2;
      let step = 0;
      let next = ac.currentTime + 0.05;
      const tick = () => {
        while (next < ac.currentTime + 0.25) {
          const m = song.melody[step % song.melody.length];
          const semi = song.scale[m % song.scale.length] + (m >= song.scale.length ? 12 : 0);
          note(song.root * Math.pow(2, semi / 12), next, beat * 0.9, song.wave, 0.09);
          if (step % 4 === 0) note(song.root / 2, next, beat * 3, 'triangle', 0.12);
          if (step % 2 === 0) drum(next, step % 4 === 0);
          step++;
          next += beat;
          if (song.once && step >= song.melody.length) return;
        }
        timer = setTimeout(tick, 60);
      };
      tick();
    }
    function stop() {
      clearTimeout(timer);
      if (App.Music) App.Music.hold(false);
      if (master) {
        try { master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.3); } catch (e) { /* noop */ }
        const m = master;
        setTimeout(() => { try { m.disconnect(); } catch (e) { /* noop */ } }, 400);
        master = null;
      }
    }
    return { play, stop };
  })();
  App.Bgm = Bgm;

  /* ====================== キャラクターの絵（オリジナル） ====================== */
  function portrait(b) {
    const L = b.look || {};
    const hair = L.bald
      ? `<ellipse cx="60" cy="40" rx="26" ry="24" fill="${L.skin || '#F1CBA5'}"/>
         <g fill="#C9A27A">${[0, 1, 2].map((k) => `<circle cx="${50 + k * 10}" cy="24" r="2"/>`).join('')}</g>`
      : `<path d="M32 44 Q30 12 60 12 Q90 12 88 44 Q84 26 60 26 Q38 26 32 44 Z" fill="${L.hair || '#1E1A18'}"/>
         ${L.tail ? `<path d="M84 32 Q104 50 96 92" stroke="${L.hair || '#1E1A18'}" stroke-width="7" fill="none" stroke-linecap="round"/>` : ''}`;
    return `
      <svg class="bt-art" viewBox="0 0 120 140" aria-hidden="true">
        <path d="M14 140 Q18 92 60 86 Q102 92 106 140 Z" fill="${b.color}"/>
        <path d="M48 88 L60 112 L72 88" fill="${b.color2}"/>
        ${L.belt ? `<rect x="22" y="118" width="76" height="8" fill="${L.belt}"/>` : ''}
        <ellipse cx="60" cy="46" rx="26" ry="28" fill="${L.skin || '#F1CBA5'}"/>
        ${hair}
        <path d="M44 48 L54 46" stroke="#2A1E16" stroke-width="3" stroke-linecap="round"/>
        <path d="M66 46 L76 48" stroke="#2A1E16" stroke-width="3" stroke-linecap="round"/>
        <circle cx="50" cy="52" r="2.6" fill="#2A1E16"/><circle cx="70" cy="52" r="2.6" fill="#2A1E16"/>
        <path d="M54 64 Q60 ${L.smile ? 69 : 64} 66 64" stroke="#8A4A3A" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        ${L.scar ? '<path d="M74 36 L80 44" stroke="#B5655A" stroke-width="2"/>' : ''}
      </svg>`;
  }
  App.BattleArt = portrait;

  /* ====================== バトル ====================== */
  const DODGE = [
    { zh: '跳', py: 'tiào', ja: 'ジャンプ', icon: '⬆️' },
    { zh: '蹲', py: 'dūn', ja: 'しゃがむ', icon: '⬇️' },
    { zh: '左', py: 'zuǒ', ja: '左へ', icon: '⬅️' },
    { zh: '右', py: 'yòu', ja: '右へ', icon: '➡️' },
  ];
  const STRIKE = [
    { zh: '拳', py: 'quán', ja: 'パンチ', icon: '👊' },
    { zh: '腿', py: 'tuǐ', ja: 'キック', icon: '🦵' },
    { zh: '掌', py: 'zhǎng', ja: '掌打', icon: '🖐️' },
  ];

  function start(host, opts) {
    const b = opts.boss;
    let hint = !!opts.hint;
    let bossHp = b.hp;
    let myHp = 100;
    let specialDone = !b.special;
    let timer = 0;
    let rafT = 0;
    let ended = false;
    let busy = false;

    const wrap = document.createElement('div');
    wrap.className = `bt bt-${b.id}`;
    wrap.style.setProperty('--bc', b.color);
    wrap.style.setProperty('--bc2', b.color2);
    host.appendChild(wrap);

    const cleanup = () => { ended = true; clearTimeout(timer); cancelAnimationFrame(rafT); Bgm.stop(); wrap.remove(); };

    /* ---------- 登場演出 ---------- */
    function intro() {
      wrap.innerHTML = `
        <div class="bt-intro">
          <div class="bt-stripes"></div>
          <div class="bt-intro-art">${portrait(b)}</div>
          <div class="bt-intro-name">
            <small>${esc(b.title)}</small>
            <b class="zh">${esc(b.zh)}</b>
            <span>${esc(b.py)}・${esc(b.name)}</span>
          </div>
          <div class="bt-intro-line"><span class="zh">「${esc(b.lines.intro.zh)}」</span>
            ${App.UI.pinyin(b.lines.intro.py, { force: true })}<small>${esc(b.lines.intro.ja)}</small></div>
          <button class="btn btn-primary btn-lg bt-go" data-fight>⚔️ 勝負！</button>
          ${App.Dev.skipBtn('この試合に勝ったことにする', 'data-dev-win')}
        </div>`;
      Bgm.play(b.bgm || 'bossA');
      setTimeout(() => { if (!ended) App.Speech.speak(b.lines.intro.zh); }, 700);
      wrap.querySelector('[data-fight]').onclick = () => { App.Sfx.play('tap'); arena(); };
      const dw = wrap.querySelector('[data-dev-win]');
      if (dw) dw.onclick = () => win();
    }

    /* ---------- 試合画面 ---------- */
    function arena() {
      wrap.innerHTML = `
        <div class="bt-arena">
          <div class="bt-top">
            <div class="bt-name"><b class="zh">${esc(b.zh)}</b><small>${esc(b.title)}</small></div>
            <div class="bt-hp is-boss"><i></i></div>
          </div>
          <div class="bt-stage">
            <div class="bt-fx"></div>
            <div class="bt-boss">${portrait(b)}</div>
            <div class="bt-call"></div>
          </div>
          <div class="bt-timer"><i></i></div>
          <div class="bt-pad"></div>
          <div class="bt-bottom">
            ${App.Hamster.figure({ mood: 'happy', size: 'xs' })}
            <div class="bt-hp is-me"><i></i></div>
            <label class="bt-hint"><input type="checkbox" data-hint ${hint ? 'checked' : ''}> ヒント</label>
            ${App.Dev.skipBtn('勝利', 'data-dev-win')}
          </div>
        </div>`;
      wrap.querySelector('[data-hint]').onchange = (e) => { hint = e.target.checked; };
      const dw = wrap.querySelector('[data-dev-win]');
      if (dw) dw.onclick = () => win();
      bars();
      say('「比赛开始！」', '試合開始！', 'Bǐsài kāishǐ!', '比赛开始！');
      timer = setTimeout(round, 1300);
    }

    const $w = (s) => wrap.querySelector(s);
    function bars() {
      $w('.bt-hp.is-boss i').style.width = `${Math.max(0, (bossHp / b.hp) * 100)}%`;
      $w('.bt-hp.is-me i').style.width = `${Math.max(0, myHp)}%`;
    }
    function say(zhHtml, ja, py, speak) {
      $w('.bt-call').innerHTML = `<b class="zh">${zhHtml}</b>${hint && ja ? `<small>${esc(py || '')}　${esc(ja)}</small>` : (py ? `<small>${esc(py)}</small>` : '')}`;
      if (speak) App.Speech.speak(speak);
    }
    function fx(cls, text = '') {
      const f = $w('.bt-fx');
      f.className = `bt-fx ${cls}`;
      f.textContent = text;
      void f.offsetWidth;
      f.classList.add('is-on');
    }

    // 1 回の「掛け声 → ボタン」。ok(true/false) を返す
    function ask(list, cmd, ms, label) {
      return new Promise((resolve) => {
        const pad = $w('.bt-pad');
        pad.innerHTML = `<div class="bt-label">${label}</div>` + shuffle(list).map((c) => `
          <button class="bt-btn" data-c="${c.zh}"><span class="zh">${c.zh}</span><small>${hint ? `${c.py}・${c.ja}` : c.py}</small></button>`).join('');
        const bar = $w('.bt-timer i');
        const t0 = performance.now();
        let done = false;
        const finish = (ok) => {
          if (done) return;
          done = true;
          cancelAnimationFrame(rafT);
          pad.querySelectorAll('.bt-btn').forEach((x) => { x.disabled = true; if (x.dataset.c === cmd.zh) x.classList.add('is-right'); });
          resolve(ok);
        };
        const tick = () => {
          if (ended || done) return;
          const r = 1 - (performance.now() - t0) / ms;
          bar.style.width = `${Math.max(0, r) * 100}%`;
          if (r <= 0) { finish(false); return; }
          rafT = requestAnimationFrame(tick);
        };
        tick();
        pad.querySelectorAll('.bt-btn').forEach((x) => {
          x.onclick = () => { if (x.dataset.c !== cmd.zh) x.classList.add('is-wrong'); finish(x.dataset.c === cmd.zh); };
        });
      });
    }

    const pause = (ms) => new Promise((r) => { timer = setTimeout(r, ms); });

    async function round() {
      if (ended) return;
      busy = true;
      // ① ボスの攻撃をよける
      for (let k = 0; k < b.dodges && !ended; k++) {
        const c = DODGE[Math.floor(Math.random() * DODGE.length)];
        say(`${c.zh}！`, c.ja, c.py, c.zh);
        const ok = await ask(DODGE, c, b.time * (hint ? 1.35 : 1), '掛け声どおりに動け！');
        if (ended) return;
        if (ok) { App.Sfx.play('correct'); fx('is-dodge', 'かわした！'); } else { hurt(b.dmg, 'くらった…！'); if (ended) return; }
        await pause(700);
      }
      // ② 師父の声どおりに反撃
      const s = STRIKE[Math.floor(Math.random() * STRIKE.length)];
      say(`师父：「用${s.zh}！」`, `${s.ja}を使え！`, `Yòng ${s.py}!`, `用${s.zh}！`);
      const ok = await ask(STRIKE, s, b.time * 1.3 * (hint ? 1.35 : 1), '師父の声どおりに反撃！');
      if (ended) return;
      hit(ok ? 26 : 8, ok);
      if (ended) return;
      await pause(900);
      // ③ HP が半分を切ったら必殺技
      if (!specialDone && bossHp <= b.hp / 2) { specialDone = true; await special(); if (ended) return; }
      busy = false;
      round();
    }

    function hurt(n, text) {
      myHp -= n;
      App.Sfx.play('wrong');
      fx('is-hurt', text);
      wrap.classList.remove('is-shake');
      void wrap.offsetWidth;
      wrap.classList.add('is-shake');
      bars();
      if (myHp <= 0) lose();
    }
    function hit(n, good) {
      bossHp -= n;
      App.Sfx.play(good ? 'clear' : 'tap');
      fx(good ? 'is-hit' : 'is-weak', good ? `会心の一撃！ -${n}` : `浅い… -${n}`);
      $w('.bt-boss').classList.remove('is-hit');
      void $w('.bt-boss').offsetWidth;
      $w('.bt-boss').classList.add('is-hit');
      bars();
      if (bossHp <= 0) win();
    }

    async function special() {
      const sp = b.special;
      const cut = document.createElement('div');
      cut.className = `bt-special is-${sp.style}`;
      cut.innerHTML = `<div class="bt-special-bg"></div>
        <div class="bt-special-text"><small>必殺技</small><b class="zh">${esc(sp.zh)}</b><span>${esc(sp.py)}</span><em>「${esc(sp.name)}」</em></div>`;
      wrap.appendChild(cut);
      App.Speech.speak(sp.zh);
      App.Sfx.play('clear');
      await pause(2200);
      cut.remove();
      say(esc(sp.call.zh), sp.call.ja, sp.call.py, sp.call.zh);
      await pause(1200);
      for (let k = 0; k < sp.hits && !ended; k++) {
        const c = DODGE[Math.floor(Math.random() * DODGE.length)];
        say(`${c.zh}！`, c.ja, c.py, c.zh);
        fx(`is-sp-${sp.style}`, `${k + 1} / ${sp.hits}`);
        const ok = await ask(DODGE, c, b.time * sp.speed * (hint ? 1.35 : 1), `${sp.name}をしのげ！`);
        if (ended) return;
        if (ok) App.Sfx.play('correct'); else { hurt(sp.dmg, '直撃…！'); if (ended) return; }
        await pause(320);
      }
      if (!ended) say(esc(sp.after.zh), sp.after.ja, sp.after.py, sp.after.zh);
      await pause(1300);
    }

    function lose() {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      cancelAnimationFrame(rafT);
      Bgm.stop();
      wrap.innerHTML = `
        <div class="bt-result is-lose">
          <div class="bt-intro-art">${portrait(b)}</div>
          <p class="zh">「${esc(b.lines.win.zh)}」</p><small>${esc(b.lines.win.ja)}</small>
          ${App.UI.hamsterSays('負けちゃった…でも大丈夫！<br>何度でも挑戦できるよ。<b>ヒント</b>をつけると日本語も出るよ', { mood: 'think', size: 'xs', cls: 'is-compact' })}
          <button class="btn btn-primary btn-block" data-retry>もう一度挑戦</button>
          <button class="btn btn-accent btn-block" data-retry-hint>ヒントありで挑戦</button>
          <button class="btn btn-sub btn-block" data-quit>やめる</button>
        </div>`;
      const again = (h) => { cleanup(); start(host, Object.assign({}, opts, { hint: h })); };
      wrap.querySelector('[data-retry]').onclick = () => again(hint);
      wrap.querySelector('[data-retry-hint]').onclick = () => again(true);
      wrap.querySelector('[data-quit]').onclick = () => { cleanup(); if (opts.onQuit) opts.onQuit(); };
      if (opts.onLose) opts.onLose();
    }

    function win() {
      if (wrap.dataset.won) return;
      wrap.dataset.won = '1';
      ended = true;
      clearTimeout(timer);
      cancelAnimationFrame(rafT);
      Bgm.play('win');
      wrap.innerHTML = `
        <div class="bt-result is-win">
          <div class="bt-win-title">勝利！</div>
          <div class="bt-intro-art">${portrait(b)}</div>
          <p class="zh">「${esc(b.lines.lose.zh)}」</p>
          ${App.UI.pinyin(b.lines.lose.py, { force: true })}<small>${esc(b.lines.lose.ja)}</small>
          <button class="btn btn-primary btn-lg btn-block" data-next>つぎへ ▶</button>
        </div>`;
      App.Speech.speak(b.lines.lose.zh);
      wrap.querySelector('[data-next]').onclick = () => { App.Sfx.play('tap'); cleanup(); opts.onWin(); };
    }

    intro();
    return { stop: cleanup, get busy() { return busy; } };
  }

  App.Battle = { start, DODGE, STRIKE };
})(window.App = window.App || {});
