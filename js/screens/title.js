/* ① タイトル画面：2D（学ぶ）と 3D（旅する）はどちらからでも始められる */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  App.screens.title = (root) => {
    root.innerHTML = `
      <div class="title-screen">
        <div class="clouds" aria-hidden="true"><span>☁️</span><span>☁️</span><span>☁️</span></div>
        <div class="title-logo">
          <span class="title-tag" data-devtap>${App.Dev.on ? '🛠 開発者モード' : '仮タイトル'}</span>
          <h1>ハムスターと行く<br><span>中国旅行</span></h1>
          <p class="title-zh">和仓鼠一起去中国旅行</p>
        </div>
        <div class="title-hero">
          <div class="bubble bubble-up">${App.Progress.welcomeMessage()}</div>
          ${App.Hamster.figure({ mood: 'happy', size: 'xl', bounce: true })}
        </div>
        <nav class="menu">
          <button class="btn btn-primary btn-lg btn-block" data-go="course">📘 中国語を学ぶ<small class="btn-sub-label">2D・1回5分</small></button>
          <button class="btn btn-accent btn-lg btn-block" data-go="map">🗺️ 中国を旅する<small class="btn-sub-label">3D・冒険</small></button>
          <div class="menu-grid">
            <button class="btn btn-sub" data-go="dictionary"><span>📖</span>中国語図鑑</button>
            <button class="btn btn-sub" data-go="journal"><span>📔</span>記録</button>
            <button class="btn btn-sub" data-go="settings"><span>⚙️</span>設定</button>
          </div>
        </nav>
      </div>`;

    // 開発者モードの切り替え（「仮タイトル」を 7 回タップ）
    let taps = 0;
    let timer = 0;
    root.querySelector('[data-devtap]').onclick = () => {
      taps++;
      clearTimeout(timer);
      timer = setTimeout(() => { taps = 0; }, 1500);
      if (taps >= 7) { taps = 0; App.Dev.toggle(); }
    };
  };
})(window.App = window.App || {});
