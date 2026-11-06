/* モチ（ハムスター）の声
 * セリフをひらがなにして、録音した 50 音（js/data/voice-mochi.js）を 1 音ずつつなげて再生する。
 * 漢字の読みは js/data/kana-dict.js。濁音・半濁音は録音が無いので清音で代用（が→か、ぱ→は）。
 */
(function (App) {
  'use strict';

  const Voice = {};
  const RATE = 1.08;   // 再生速度＝声の高さ（1 より大きいほど高い。テンポは STEP で決まる）
  const STEP = 0.2;    // 1 音ごとに進める秒数（前の音と少し重ねて、なめらかにつなぐ）
  const FADE_IN = 0.03;   // 音の出だしをふわっと立ち上げる秒数
  const CROSS = 0.09;     // 次の音と重ねながら前の音を消していく秒数
  const PAUSE = { '、': 0.18, '，': 0.18, '。': 0.32, '！': 0.32, '？': 0.32, '!': 0.32, '?': 0.32, '…': 0.3, ' ': 0.12, '　': 0.12 };
  const PLAIN = {
    が: 'か', ぎ: 'き', ぐ: 'く', げ: 'け', ご: 'こ', ざ: 'さ', じ: 'し', ず: 'す', ぜ: 'せ', ぞ: 'そ',
    だ: 'た', ぢ: 'ち', づ: 'つ', で: 'て', ど: 'と', ば: 'は', び: 'ひ', ぶ: 'ふ', べ: 'へ', ぼ: 'ほ',
    ぱ: 'は', ぴ: 'ひ', ぷ: 'ふ', ぺ: 'へ', ぽ: 'ほ', ゔ: 'う',
    ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お', ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', ゎ: 'わ',
  };
  const SMALL = 'ぁぃぅぇぉゃゅょゎ';
  const DIGITS = ['ぜろ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
  const TSU = ['', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ'];
  const LATIN = { OK: 'おーけー', EXP: 'いーえっくすぴー', Lv: 'れべる', NEXT: 'ねくすと' };

  let ctx = null;
  let out = null;
  let buffers = null;
  let loading = null;
  let playing = [];
  let dictMax = 0;
  let chinese = null;

  const enabled = () => App.Store.state.settings.hamsterVoice !== false;

  function readNumber(s) {
    const n = Number(s);
    if (!Number.isInteger(n) || n >= 100) return s.split('').map((d) => DIGITS[d]).join('');
    const t = Math.floor(n / 10);
    const o = n % 10;
    if (!t) return DIGITS[o];
    return `${t > 1 ? DIGITS[t] : ''}じゅう${o ? DIGITS[o] : ''}`;
  }

  // セリフに混ざっている中国語（フレーズ・看板）は日本語の声では読まないので外す
  // （「北京」のように日本語でも読める言葉は、読みの辞書にあれば日本語で読む）
  function chineseWords() {
    if (!chinese) {
      const dict = App.KANA_DICT || {};
      const list = [];
      Object.values(App.PHRASES || {}).forEach((p) => list.push(p.zh));
      Object.values(App.SIGNS || {}).forEach((s) => list.push(s.zh));
      chinese = Array.from(new Set(list.map((z) => z.replace(/[？！，。?!,.\s]/g, '')).filter((z) => z.length > 0 && !dict[z])))
        .sort((a, b) => b.length - a.length);
    }
    return chinese;
  }

  // 表示用のセリフ（HTML）→ ひらがな
  Voice.toKana = (html) => {
    const dict = App.KANA_DICT || {};
    if (!dictMax) dictMax = Math.max(1, ...Object.keys(dict).map((k) => k.length));
    let text = String(html)
      .replace(/<br\s*\/?>/gi, '、')
      .replace(/<[^>]*>/g, '')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/[（(][ァ-ヶー・]+[）)]/g, '')          // 浦東（プードン）の読みがなは読まない
      .replace(/([0-9]+)\s*[〜~]\s*([0-9]+)/g, '$1から$2')
      .replace(/([1-9])つ/g, (_, d) => TSU[d])
      .replace(/[A-Za-z]+/g, (w) => LATIN[w] || ' ')
      .replace(/[〜~]/g, 'ー');
    chineseWords().forEach((z) => { if (z.length > 1) text = text.split(z).join('、'); });

    let out = '';
    for (let i = 0; i < text.length;) {
      const c = text[i];
      if (/[0-9]/.test(c)) {
        const m = text.slice(i).match(/^[0-9]+/)[0];
        out += readNumber(m);
        i += m.length;
        continue;
      }
      // 辞書の言葉（「お腹」のように、かなで始まる言葉もある）
      let hit = '';
      for (let n = Math.min(dictMax, text.length - i); n > 0 && !hit; n--) {
        if (dict[text.substr(i, n)]) hit = text.substr(i, n);
      }
      if (hit) { out += dict[hit]; i += hit.length; continue; }
      if (/[一-鿿々]/.test(c)) { i++; continue; }
      if (c >= 'ァ' && c <= 'ヶ') out += String.fromCharCode(c.charCodeAt(0) - 0x60);
      else if ((c >= 'ぁ' && c <= 'ゖ') || c === 'ー' || PAUSE[c]) out += c;
      else if (/[「」『』（）()〜~・…]/.test(c)) out += '、';
      i++;
    }
    return out;
  };

  // ひらがな → 再生する音の並び [{ ch, step } | { pause }]
  function units(kana) {
    const list = [];
    for (const c of kana) {
      if (PAUSE[c] !== undefined) { list.push({ pause: PAUSE[c] }); continue; }
      if (c === 'っ') { list.push({ pause: 0.08 }); continue; }
      if (c === 'ー') { list.push({ pause: 0.12, hold: true }); continue; }
      const base = PLAIN[c] || c;
      if (!App.MOCHI_VOICE || !App.MOCHI_VOICE[base]) continue;
      // 小さい「ゃゅょ」などは前の音と短くつなげる（きゃ → き＋や）
      if (SMALL.includes(c) && list.length && list[list.length - 1].ch) list[list.length - 1].step = STEP * 0.5;
      list.push({ ch: base, step: STEP });
    }
    return list;
  }

  function audioCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // 高い音のザラつきを少し抑え（ローパス）、音量の差をならして（コンプレッサー）なめらかに聞こえるようにする
      const soften = ctx.createBiquadFilter();
      soften.type = 'lowpass';
      soften.frequency.value = 5200;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 4;
      comp.attack.value = 0.005;
      comp.release.value = 0.12;
      soften.connect(comp).connect(ctx.destination);
      out = soften;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function load() {
    if (buffers) return Promise.resolve(buffers);
    if (!loading) {
      const c = audioCtx();
      const entries = Object.entries(App.MOCHI_VOICE || {});
      loading = Promise.all(entries.map(([ch, uri]) => {
        const bin = atob(uri.split(',')[1]);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Promise((res, rej) => c.decodeAudioData(bytes.buffer, res, rej)).then((b) => [ch, b]);
      })).then((pairs) => { buffers = Object.fromEntries(pairs); return buffers; });
    }
    return loading;
  }

  // 声のデータを先に読み込んでおく（読み込めた音の数を返す）
  Voice.preload = () => load().then((b) => Object.keys(b).length);

  Voice.stop = () => {
    if (!ctx) return;
    const t = ctx.currentTime;
    playing.forEach(({ src, gain }) => {
      try {
        gain.gain.cancelScheduledValues(t);
        gain.gain.setTargetAtTime(0, t, 0.015);
        src.stop(t + 0.06);
      } catch (e) { /* もう止まっている */ }
    });
    playing = [];
  };

  // セリフを読む（設定でオフなら何もしない。🔊 ボタンからは force で読む）。読む内容が無ければ false
  Voice.speak = (html, { force = false } = {}) => {
    if ((!enabled() && !force) || !App.MOCHI_VOICE || !(window.AudioContext || window.webkitAudioContext)) return false;
    const list = units(Voice.toKana(html));
    if (!list.some((u) => u.ch)) return false;
    Voice.stop();
    if (App.Speech) App.Speech.stop();
    const token = {};
    Voice.current = token;
    load().then((buf) => {
      if (Voice.current !== token) return;
      const c = audioCtx();
      let t = c.currentTime + 0.05;
      let prev = null;
      list.forEach((u) => {
        if (u.pause) { t += u.pause; if (!u.hold) prev = null; return; }
        const b = buf[u.ch];
        if (!b) return;
        const src = c.createBufferSource();
        src.buffer = b;
        src.playbackRate.value = RATE;
        const gain = c.createGain();
        src.connect(gain).connect(out);
        // 出だしはふわっと立ち上げる
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(1, t + FADE_IN);
        // 前の音は、次の音と重ねながらゆっくり消す（クロスフェード）
        if (prev) {
          prev.gain.gain.setValueAtTime(1, t);
          prev.gain.gain.linearRampToValueAtTime(0, t + CROSS);
          prev.src.stop(t + CROSS + 0.01);
        }
        src.start(t);
        const item = { src, gain };
        playing.push(item);
        prev = item;
        t += Math.min(u.step, b.duration / RATE);
      });
      if (App.Music) App.Music.duck(t - c.currentTime + 0.3); // しゃべっている間は BGM を小さく
    }).catch(() => { /* 声が出せなくてもゲームは続ける */ });
    return true;
  };

  App.MochiVoice = Voice;
})(window.App = window.App || {});
