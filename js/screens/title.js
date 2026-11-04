/* ① タイトル画面 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, toast } = App.U;

  App.screens.title = (root) => {
    const city = App.currentCity();
    const travel = App.Course.travelUnlocked();
    root.innerHTML = `
      <div class="title-screen">
        <div class="clouds" aria-hidden="true"><span>☁️</span><span>☁️</span><span>☁️</span></div>
        <div class="title-logo">
          <span class="title-tag">仮タイトル</span>
          <h1>ハムスターと行く<br><span>中国旅行</span></h1>
          <p class="title-zh">和仓鼠一起去中国旅行</p>
        </div>
        <div class="title-hero">
          <div class="bubble bubble-up">${App.Progress.welcomeMessage()}</div>
          ${App.Hamster.figure({ mood: 'happy', size: 'xl', bounce: true })}
        </div>
        <nav class="menu">
          <button class="btn btn-primary btn-lg btn-block" data-go="course">📘 中国語を学ぶ<small class="btn-sub-label">2D・1回5分</small></button>
          <button class="btn ${travel ? 'btn-accent' : 'btn-sub'} btn-lg btn-block" data-travel>
            ${travel ? '🗺️' : '🔒'} ${esc(city.name)}を旅する<small class="btn-sub-label">${travel ? '3D・会話' : 'UNIT 4 クリアで解放'}</small></button>
          <div class="menu-grid">
            <button class="btn btn-sub" data-go="dictionary"><span>📖</span>中国語図鑑</button>
            <button class="btn btn-sub" data-go="journal"><span>📔</span>旅行記</button>
            <button class="btn btn-sub" data-go="settings"><span>⚙️</span>設定</button>
          </div>
        </nav>
      </div>`;
    root.querySelector('[data-travel]').onclick = () => {
      if (!travel) {
        toast('まずは📘コースで<b>UNIT 4「旅の準備」</b>までクリアしよう！');
        return;
      }
      App.Sfx.play('tap');
      App.go('map');
    };
  };
})(window.App = window.App || {});
