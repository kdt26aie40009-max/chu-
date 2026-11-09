/* ① タイトル画面：2D（学ぶ）と 3D（旅する）はどちらからでも始められる */
(function (App) {
  'use strict';
  App.screens = App.screens || {};
  let titleCall = null;

  App.screens.title = (root) => {
    root.innerHTML = `
      <div class="title-screen">
        <div class="clouds" aria-hidden="true"><span>☁️</span><span>☁️</span><span>☁️</span></div>
        <div class="title-logo">
          <span class="title-tag" data-devtap>${App.Dev.on ? '🛠 開発者モード' : '中国語で旅するゲーム'}</span>
          <h1>ハムコシと征く<br><span>中国旅行</span></h1>
          <p class="title-zh">和仓鼠一起去中国旅行</p>
          ${App.TITLE_CALL ? '<button class="title-call" data-title-call aria-label="タイトルコールを聞く">🔊 タイトルコール</button>' : ''}
        </div>
        <div class="title-hero">
          <div class="bubble bubble-up">${App.Progress.welcomeMessage()}</div>
          <button class="title-ham" data-go="pet" aria-label="おうちへ">${App.Hamster.figure({ mood: 'happy', size: 'xl', bounce: true })}</button>
        </div>
        <nav class="menu">
          <button class="btn btn-primary btn-lg btn-block" data-go="course">📘 中国語を学ぶ<small class="btn-sub-label">2D・1回5分</small></button>
          <button class="btn btn-accent btn-lg btn-block" data-go="map">🗺️ 中国を旅する<small class="btn-sub-label">3D・冒険</small></button>
          <div class="menu-grid">
            <button class="btn btn-sub" data-go="pet"><span>🏠</span>おうち${App.Pet.total() ? `<i class="menu-badge">${App.Pet.total()}</i>` : ''}</button>
            <button class="btn btn-sub" data-go="dictionary"><span>📖</span>中国語図鑑</button>
            <button class="btn btn-sub" data-go="journal"><span>📔</span>記録</button>
            <button class="btn btn-sub" data-go="settings"><span>⚙️</span>設定</button>
          </div>
        </nav>
      </div>`;

    // タイトルコール（録音した声。js/data/title-call.js）
    const callBtn = root.querySelector('[data-title-call]');
    if (callBtn) {
      callBtn.onclick = () => {
        App.Speech.stop();
        App.MochiVoice.stop();
        if (!titleCall) {
          titleCall = new Audio(App.TITLE_CALL);
          titleCall.addEventListener('ended', () => App.Music.duck(0));
        }
        titleCall.currentTime = 0;
        App.Music.duck(Number.isFinite(titleCall.duration) ? titleCall.duration + 0.3 : 6); // BGM を小さくして声をはっきり
        titleCall.play().catch(() => App.Music.duck(0));
        callBtn.classList.remove('is-playing');
        void callBtn.offsetWidth;
        callBtn.classList.add('is-playing');
      };
    }

    // 開発者モードの切り替え（タイトル上の小さなラベルを 7 回タップ）
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
