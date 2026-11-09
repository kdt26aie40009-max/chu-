/* エントリーポイント：画面切り替えと共通イベント */
(function (App) {
  'use strict';

  App.screens = App.screens || {};

  // 画面を離れるときの後始末（3D 画面のループ停止・イベント解除など）
  let leaveHandlers = [];
  App.onLeave = (fn) => { leaveHandlers.push(fn); };

  App.go = (name, params = {}) => {
    const screen = App.screens[name];
    if (!screen) { console.error('unknown screen:', name); return; }
    const handlers = leaveHandlers;
    leaveHandlers = [];
    handlers.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    App.Speech.stop();
    App.MochiVoice.stop();
    const root = document.getElementById('app');
    root.innerHTML = '';
    root.className = `app screen-${name}`;
    window.scrollTo(0, 0);
    App.currentScreen = name;
    App.currentParams = params;
    App.Music.setScreen(name);
    screen(root, params);
    App.Dev.decorate(root);
  };

  document.addEventListener('click', (e) => {
    const sp = e.target.closest('[data-speak]');
    if (sp) {
      App.Speech.speak(sp.dataset.speak, { slow: sp.dataset.slow === '1' });
      sp.classList.remove('is-playing');
      void sp.offsetWidth;
      sp.classList.add('is-playing');
      return;
    }
    const mochi = e.target.closest('[data-mochi]');
    if (mochi) {
      App.MochiVoice.speak(mochi.dataset.mochi, { force: true });
      mochi.classList.remove('is-playing');
      void mochi.offsetWidth;
      mochi.classList.add('is-playing');
      return;
    }
    // 町の表示（js/data/signs.js）：読み上げて、意味をトーストで出す
    const sign = e.target.closest('[data-sign]');
    if (sign && App.SIGNS[sign.dataset.sign]) {
      const s = App.SIGNS[sign.dataset.sign];
      const { esc } = App.U;
      App.Speech.speak(s.say || s.zh);
      App.U.toast(`<span class="zh">${esc(s.zh)}</span>　${esc(s.py)}<br>${esc(s.ja)}`);
      return;
    }
    const rate = e.target.closest('[data-rate-set]');
    if (rate) {
      App.Speech.setRate(rate.dataset.rateSet);
      const cur = App.Speech.rate();
      document.querySelectorAll('[data-rate-set]').forEach((b) => {
        b.setAttribute('aria-pressed', String(Number(b.dataset.rateSet) === cur));
      });
      App.Sfx.play('tap');
      return;
    }
    const go = e.target.closest('[data-go]');
    if (go) {
      if (go.dataset.confirm && !window.confirm(go.dataset.confirm)) return;
      App.Sfx.play('tap');
      App.go(go.dataset.go);
    }
  });

  // BGM はブラウザの決まりで、最初のタップ・キー操作のあとから鳴らせる
  {
    const kick = () => {
      App.Music.start();
      ['pointerdown', 'keydown', 'touchstart'].forEach((t) => document.removeEventListener(t, kick, true));
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((t) => document.addEventListener(t, kick, true));
  }

  // チート：Ctrl をすばやく 3 回押すと、全部解放（もう一度 3 回で元に戻す）
  //   3D の旅の全ステージ・2D の全レッスン・図鑑の全部の言葉（App.cheat() で確認できる）
  App.cheat = () => !!App.Store.state.trip.unlockAll;
  {
    let presses = [];
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Control' || e.repeat) return;
      const now = performance.now();
      presses = presses.filter((t) => now - t < 1000).concat(now);
      if (presses.length < 3) return;
      presses = [];
      const trip = App.Store.state.trip;
      trip.unlockAll = !trip.unlockAll;
      App.Store.save();
      App.Sfx.play(trip.unlockAll ? 'clear' : 'tap');
      App.U.toast(trip.unlockAll
        ? '🔓 チート発動！<b>全部解放</b>だ！<br><small>旅の全ステージ・2D の全レッスン・図鑑の全部の言葉<br>もう一度 Ctrl を 3 回で元に戻るよ</small>'
        : '🔒 チート解除。ステージやレッスンはクリアした順に開くよ');
      const cur = App.currentScreen;
      if (cur === 'map') App.go('map', { chapter: trip.chapter });
      else if (cur === 'course' || cur === 'dictionary') App.go(cur, App.currentParams || {});
    });
  }

  App.Store.load();
  App.Dev.init();      // 開発者モードならテスト用セーブに切り替える
  App.Trip.migrate();  // 以前の版の 3D の進み具合を、旅のステージに引き継ぐ
  App.Pet.sync();      // いままでに上がったレベルの分のごはんを渡す
  App.go('title');
})(window.App = window.App || {});
