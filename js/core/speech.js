/* 音声（読み上げ・音声認識）と効果音
 * - 読み上げ: Web Speech API (speechSynthesis) の中国語音声
 * - 音声認識: 対応ブラウザ（Chrome / Edge など）のみ。発音判定はここを強化していく
 */
(function (App) {
  'use strict';

  const Speech = {};
  let voice = null;
  let warned = false;

  Speech.supported = 'speechSynthesis' in window;

  function pickVoice() {
    const vs = window.speechSynthesis.getVoices();
    voice = vs.find((v) => /zh[-_]CN/i.test(v.lang)) || vs.find((v) => /^zh/i.test(v.lang)) || null;
    return vs.length;
  }

  if (Speech.supported) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }

  Speech.hasChineseVoice = () => !!voice;
  Speech.voiceName = () => (voice ? voice.name : null);

  Speech.speak = (text, { slow = false } = {}) => {
    if (!Speech.supported || !text) return false;
    const synth = window.speechSynthesis;
    synth.cancel();
    const loaded = pickVoice();
    if (!voice && loaded > 0 && !warned) {
      warned = true;
      App.U.toast('中国語の音声が見つからないみたい…<br>Chrome か Edge がおすすめだよ');
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    if (voice) u.voice = voice;
    const rate = App.Store.state.settings.rate || 0.85;
    u.rate = slow ? rate * 0.6 : rate;
    synth.speak(u);
    return true;
  };

  Speech.stop = () => { if (Speech.supported) window.speechSynthesis.cancel(); };

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
