/* エントリーポイント：画面切り替えと共通イベント */
(function (App) {
  'use strict';

  App.screens = App.screens || {};

  App.go = (name, params = {}) => {
    const screen = App.screens[name];
    if (!screen) { console.error('unknown screen:', name); return; }
    App.Speech.stop();
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
