/* 音声（読み上げ・音声認識）と効果音
 * - 読み上げ: Web Speech API (speechSynthesis) の中国語音声
 * - 音声認識: 対応ブラウザ（Chrome / Edge など）のみ。発音判定はここを強化していく
 */
(function (App) {
  'use strict';

  const Speech = {};
  let voice = null;
  let voiceCount = 0;
  let settled = false; // 音声一覧の読み込みを待ち終えたか（0 件のまま終わる環境もある）
  let warned = false;

  Speech.supported = 'speechSynthesis' in window;

  // 選べる読み上げ速度（設定・会話画面の切り替えボタン）
  Speech.RATES = [0.7, 1.0];

  function pickVoice() {
    const vs = window.speechSynthesis.getVoices();
    // 中国語（普通話）の音声。きれいな声（Natural・Online・Google）を優先する
    const cn = vs.filter((v) => /zh[-_]CN/i.test(v.lang));
    voice = cn.find((v) => /Natural|Online|Google/i.test(v.name)) || cn[0] || vs.find((v) => /^zh/i.test(v.lang)) || null;
    voiceCount = vs.length;
    return vs.length;
  }

  Speech.hasChineseVoice = () => !!voice;
  Speech.voiceName = () => (voice ? voice.name : null);

  // 'unsupported' | 'loading' | 'missing' | 'ok'
  Speech.voiceState = () => {
    if (!Speech.supported) return 'unsupported';
    if (voice) return 'ok';
    return voiceCount > 0 || settled ? 'missing' : 'loading';
  };

  const NOTICE = {
    unsupported: '⚠️ このブラウザは音声読み上げに対応していません。中国語・ピンインを見ながら進めてね（Chrome / Edge 推奨）',
    missing: '⚠️ この端末に中国語（zh-CN）の音声が見つかりません。インターネットの中国語音声で読み上げます（Windows の「設定 → 時刻と言語 → 音声認識（スピーチ）→ 音声を追加」で「中国語（簡体字、中国）」を入れると、オフラインでも聞けます）',
  };
  Speech.noticeText = () => NOTICE[Speech.voiceState()] || '';

  // 画面上の「中国語音声がない」お知らせ（UI.voiceNotice）を最新の状態にする
  Speech.refreshNotices = () => {
    const text = Speech.noticeText();
    document.querySelectorAll('[data-voice-notice]').forEach((el) => {
      el.textContent = text;
      el.hidden = !text;
    });
  };

  if (Speech.supported) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = () => { pickVoice(); Speech.refreshNotices(); };
    setTimeout(() => { settled = true; pickVoice(); Speech.refreshNotices(); }, 2000);
  }

  // 0.7 / 1.0 のどちらか（古いセーブの 0.85 などは近い方に寄せる）
  Speech.rate = () => ((App.Store.state.settings.rate || 1) < 0.85 ? 0.7 : 1.0);
  Speech.setRate = (r) => {
    App.Store.state.settings.rate = Number(r) < 0.85 ? 0.7 : 1.0;
    App.Store.save();
  };

  // 端末に中国語の音声が無いとき：インターネットの中国語音声（Google 翻訳の読み上げ）を <audio> で鳴らす。
  // 日本語の音声のまま読むと漢字が日本語読みになってしまうので、中国語の音声が無ければ端末の読み上げは使わない
  let netAudio = null;
  function speakNet(text, slow) {
    if (netAudio) netAudio.pause();
    const q = encodeURIComponent(String(text).slice(0, 180));
    netAudio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=${q}`);
    netAudio.playbackRate = slow ? 0.6 : Speech.rate();
    if (App.Music) {
      netAudio.onplay = () => App.Music.duck(15);
      netAudio.onended = () => App.Music.duck(0);
    }
    netAudio.onerror = () => {
      if (App.Music) App.Music.duck(0);
      App.U.toast('中国語の音声を読み込めなかった…<br><small>インターネットにつながっているか確かめてね</small>');
    };
    netAudio.play().catch(() => { /* 再生できないときは onerror でお知らせ */ });
    return true;
  }

  Speech.speak = (text, { slow = false } = {}) => {
    if (!text) return false;
    if (Speech.supported) pickVoice();
    const state = Speech.voiceState();
    if (App.MochiVoice) App.MochiVoice.stop();
    if (state !== 'ok') { // 中国語の音声がまだ無い（読み込み中も含む）
      if (state !== 'loading' && !warned) {
        warned = true;
        App.U.toast('この端末には中国語の音声が無いので、<br>インターネットの中国語音声で読むよ');
      }
      if (Speech.supported) window.speechSynthesis.cancel();
      return speakNet(text, slow);
    }
    if (!Speech.supported) return false;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    if (voice) u.voice = voice;
    const rate = Speech.rate();
    u.rate = slow ? Math.max(0.5, rate * 0.6) : rate;
    // 読み上げの間は BGM を小さく
    if (App.Music) {
      u.onstart = () => App.Music.duck(15);
      u.onend = () => App.Music.duck(0);
      u.onerror = () => App.Music.duck(0);
    }
    synth.speak(u);
    return true;
  };

  Speech.stop = () => {
    if (Speech.supported) window.speechSynthesis.cancel();
    if (netAudio) netAudio.pause();
  };

  /* ---------- 音声認識（声に出して練習） ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  Speech.canRecognize = !!SR;

  Speech.listen = () => new Promise((resolve, reject) => {
    if (!SR) { reject(new Error('unsupported')); return; }
    Speech.stop();
    const r = new SR();
    r.lang = 'zh-CN';
    r.interimResults = false;
    r.maxAlternatives = 5;
    let got = [];
    r.onresult = (e) => {
      got = Array.from(e.results[0] || []).map((a) => a.transcript);
    };
    r.onerror = (e) => reject(e);
    r.onend = () => resolve(got);
    r.start();
  });

  const DIGITS = '零一二三四五六七八九';
  const normalize = (s) =>
    String(s)
      .replace(/10/g, '十')
      .replace(/[0-9]/g, (d) => DIGITS[Number(d)])
      .replace(/[\s，。！？、,.!?…~～]/g, '');

  // 最長共通部分列で、ゆるめに一致判定（初心者向けに 7 割で OK）
  function lcs(a, b) {
    const dp = Array(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i++) {
      let prev = 0;
      for (let j = 1; j <= b.length; j++) {
        const tmp = dp[j];
        dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]);
        prev = tmp;
      }
    }
    return dp[b.length];
  }

  Speech.matches = (target, alternatives) => {
    const t = normalize(target);
    return alternatives.some((alt) => {
      const a = normalize(alt);
      if (!a) return false;
      if (a === t || a.includes(t)) return true;
      return lcs(t, a) / t.length >= 0.7;
    });
  };

  App.Speech = Speech;

  /* ---------- 効果音（WebAudio で生成。音源ファイル不要） ---------- */
  let ctx = null;
  function tone(freq, start, dur, type = 'sine', vol = 0.12) {
    const t0 = ctx.currentTime + start;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  const SOUNDS = {
    tap: () => tone(660, 0, 0.06, 'sine', 0.04),
    correct: () => { tone(880, 0, 0.12, 'triangle'); tone(1320, 0.1, 0.2, 'triangle'); },
    wrong: () => { tone(240, 0, 0.16, 'square', 0.05); tone(190, 0.12, 0.2, 'square', 0.05); },
    pet: () => { tone(988, 0, 0.1, 'sine', 0.05); tone(1319, 0.08, 0.14, 'sine', 0.05); },
    eat: () => [0, 0.09, 0.18].forEach((t) => tone(320 + Math.random() * 80, t, 0.05, 'square', 0.03)),
    clear: () => [523, 659, 784, 1047].forEach((f, k) => tone(f, k * 0.11, 0.3, 'triangle', 0.1)),
  };

  App.Sfx = {
    play(name) {
      if (!App.Store.state.settings.sfx || !SOUNDS[name]) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        SOUNDS[name]();
      } catch (e) { /* 音が出なくてもゲームは続ける */ }
    },
  };
})(window.App = window.App || {});
