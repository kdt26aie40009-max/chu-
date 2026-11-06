/* バックで流す BGM（WebAudio で作る・音源ファイル不要）
 *   App.Music.start()        最初のタップ・キー操作で呼ぶ（ブラウザは操作の前に音を出せない）
 *   App.Music.setScreen(n)   画面が変わったら呼ぶ（タイトル・2D は「home」、旅のマップ・3D は「trip」の曲）
 *   App.Music.duck(sec)      声（タイトルコール・中国語の読み上げ・ハムスターの声）の間だけ小さくする。0 で戻す
 *   App.Music.hold(on)       武術大会など、別の BGM が鳴る間は止める
 *   App.Music.refresh()      設定（settings.music）のオン・オフを反映
 * 音量は控えめ（タイトルコールや読み上げがしっかり聞こえるくらい）。
 */
(function (App) {
  'use strict';

  const VOLUME = 0.05;      // ふだんの音量
  const DUCK = 0.3;         // 声の間はこの割合まで下げる
  const PENTA = [0, 2, 4, 7, 9]; // 中国っぽい 5 音（ド レ ミ ソ ラ）

  /* 曲：melody は PENTA の番号（5 以上は 1 オクターブ上、-1 は休み）。8 個で 1 小節。
   * bass は小節ごとの低音（root からの半音）。 */
  const SONGS = {
    // タイトル・2D：ゆったり、のんびり
    home: {
      bpm: 76, root: 293.66, // D
      melody: [
        4, -1, 5, 6, 5, -1, 4, 2,   3, -1, 2, 1, 2, -1, -1, -1,
        2, -1, 3, 4, 6, -1, 5, 4,   3, 4, 2, -1, 1, -1, -1, -1,
        4, -1, 5, 6, 7, -1, 6, 5,   6, -1, 5, 4, 3, -1, 2, -1,
        1, 2, 3, -1, 2, 1, 0, -1,   2, 1, 0, -1, -1, -1, -1, -1,
      ],
      bass: [0, -3, 5, 7, 0, -3, 5, 0],
    },
    // 旅のマップ・3D：すこし明るく、てくてく歩く感じ
    trip: {
      bpm: 92, root: 392.0, // G
      melody: [
        0, 2, 4, -1, 4, 5, 4, 2,    3, -1, 2, -1, 0, 1, 2, -1,
        5, -1, 4, 5, 6, 5, 4, 2,    3, 4, 3, 2, 1, -1, -1, -1,
        0, 2, 4, -1, 4, 5, 6, 7,    6, -1, 5, 4, 5, -1, 4, -1,
        2, 3, 4, 2, 1, -1, 2, 1,    0, -1, -1, 2, 0, -1, -1, -1,
      ],
      bass: [0, 5, -3, 7, 0, 5, 7, 0],
    },
  };
  const songFor = (screen) => (/3d$/.test(screen || '') || screen === 'map' ? 'trip' : 'home');

  let ctx = null;
  let master = null;   // 全体の音量（オン・オフ・ダック）
  let bus = null;      // 曲ごとの出口（曲の切り替えでフェード）
  let timer = 0;
  let song = null;
  let songName = null;
  let step = 0;
  let next = 0;
  let started = false;
  let held = false;
  let duckTimer = 0;
  let ducked = false;
  let want = 'home';

  const enabled = () => App.Store.state.settings.music !== false;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return false; }
    master = ctx.createGain();
    master.gain.value = 0;
    // ふんわり響かせる（短いエコー）
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.32;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    master.connect(lp).connect(ctx.destination);
    master.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(lp);
    return true;
  }

  // ポロンとはじく音（琴っぽく：三角波＋倍音のサイン波、すぐ減衰）
  function pluck(freq, t, dur, vol) {
    [[ 'triangle', 1, vol ], [ 'sine', 2, vol * 0.35 ]].forEach(([type, mul, v]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq * mul, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }
  // やわらかい低音（サイン波、ゆっくり立ち上がる）
  function pad(freq, t, dur, vol) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function tick() {
    timer = 0;
    if (!song || !bus) return;
    const beat = 60 / song.bpm / 2; // 8 分音符
    if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
    while (next < ctx.currentTime + 0.3) {
      const len = song.melody.length;
      const m = song.melody[step % len];
      if (m >= 0) {
        const semi = PENTA[m % 5] + Math.floor(m / 5) * 12;
        pluck(song.root * Math.pow(2, semi / 12), next, beat * 3.2, 0.5);
      }
      if (step % 8 === 0) {
        const b = song.bass[Math.floor(step / 8) % song.bass.length];
        const f = (song.root / 2) * Math.pow(2, b / 12);
        pad(f, next, beat * 8, 0.32);
        pad(f * 1.5, next, beat * 8, 0.12); // 5 度上をうすく重ねる
      }
      step++;
      next += beat;
    }
    timer = setTimeout(tick, 80);
  }

  function level() {
    if (!ctx || !master) return;
    const on = started && enabled() && !held && !document.hidden;
    const v = on ? VOLUME * (ducked ? DUCK : 1) : 0;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(v, ctx.currentTime, ducked ? 0.08 : 0.4);
  }

  function play(name) {
    if (songName === name && song) return;
    if (bus) {
      const old = bus;
      old.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
      setTimeout(() => { try { old.disconnect(); } catch (e) { /* noop */ } }, 1500);
    }
    clearTimeout(timer);
    songName = name;
    song = SONGS[name];
    bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    step = 0;
    next = ctx.currentTime + 0.4;
    tick();
  }

  function run() {
    const on = started && enabled() && !held;
    if (!on) {
      clearTimeout(timer);
      timer = 0;
      level();
      return;
    }
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (songName !== want || !song) play(want);
    else if (!timer) tick();
    level();
  }

  const Music = {
    start() {
      if (started) return;
      started = true;
      run();
    },
    setScreen(name) {
      want = songFor(name);
      if (started) run();
    },
    duck(sec) {
      clearTimeout(duckTimer);
      ducked = sec > 0;
      if (ducked) duckTimer = setTimeout(() => { ducked = false; level(); }, sec * 1000);
      level();
    },
    hold(on) {
      held = !!on;
      run();
    },
    refresh: run,
  };

  // タブが裏に回ったら止め、戻ったら続きから
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) {
      clearTimeout(timer);
      timer = 0;
      ctx.suspend();
    } else if (started && enabled() && !held) {
      ctx.resume();
      run();
    }
  });

  App.Music = Music;
})(window.App = window.App || {});
