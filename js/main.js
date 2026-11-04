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
    screen(root, params);
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

  App.Store.load();
  App.go('title');
})(window.App = window.App || {});
