/* 設定 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { $, toast } = App.U;
  const UI = App.UI;

  App.screens.settings = (root) => {
    const s = App.Store.state.settings;
    const voiceStatus = () => {
      if (!App.Speech.supported) return '⚠️ このブラウザは音声読み上げに対応していません';
      return App.Speech.hasChineseVoice()
        ? `✅ 中国語音声：${App.Speech.voiceName()}`
        : '⚠️ 中国語音声が見つかりません（Chrome / Edge 推奨）';
    };

    root.innerHTML = `
      ${UI.topbar({ title: '⚙️ 設定', back: 'title' })}
      <main class="page">
        <section class="card setting">
          <h3>🔊 音声</h3>
          <div class="setting-row switch-row">
            <span>読み上げの速さ<small class="muted">（会話・覚える画面でも切り替えられます）</small></span>
            ${UI.rateToggle()}
          </div>
          <button class="btn btn-sub btn-block" data-test>🔊 テスト再生（你好！）</button>
          <p class="muted small" data-voice>${voiceStatus()}</p>
          <p class="muted small">🎙️ 声に出す練習：${App.Speech.canRecognize ? '使えます' : 'このブラウザでは使えません（Chrome 推奨）'}</p>
        </section>

        <section class="card setting">
          <h3>🎮 表示・サウンド</h3>
          <label class="setting-row switch-row">
            <span>ピンインを表示<small class="muted">（覚えるカードでは常に表示）</small></span>
            <input type="checkbox" class="switch" data-pinyin ${s.showPinyin ? 'checked' : ''}>
          </label>
          <label class="setting-row switch-row">
            <span>モチの声<small class="muted">（ハムスターの案内を読み上げる）</small></span>
            <input type="checkbox" class="switch" data-hvoice ${s.hamsterVoice !== false ? 'checked' : ''}>
          </label>
          <label class="setting-row switch-row">
            <span>効果音</span>
            <input type="checkbox" class="switch" data-sfx ${s.sfx ? 'checked' : ''}>
          </label>
          <label class="setting-row switch-row">
            <span>3D の出発前に単語チェック<small class="muted">（オフにすると、いきなり本番で力試し）</small></span>
            <input type="checkbox" class="switch" data-wordcheck ${s.wordCheck !== false ? 'checked' : ''}>
          </label>
        </section>

        <section class="card setting">
          <h3>💾 データ</h3>
          <p class="muted small">進み具合はこのブラウザに保存されます。</p>
          <button class="btn btn-danger btn-block" data-reset>データをリセット</button>
        </section>
      </main>
      ${UI.tabbar('settings')}`;

    const save = () => App.Store.save();
    $('[data-test]', root).onclick = () => {
      App.Speech.speak('你好！');
      setTimeout(() => { const v = $('[data-voice]', root); if (v) v.textContent = voiceStatus(); }, 400);
    };
    $('[data-pinyin]', root).onchange = (e) => { s.showPinyin = e.target.checked; save(); };
    $('[data-hvoice]', root).onchange = (e) => {
      s.hamsterVoice = e.target.checked;
      save();
      if (s.hamsterVoice) App.MochiVoice.speak('ぼくの声だよ！');
      else App.MochiVoice.stop();
    };
    $('[data-wordcheck]', root).onchange = (e) => { s.wordCheck = e.target.checked; save(); };
    $('[data-sfx]', root).onchange = (e) => { s.sfx = e.target.checked; save(); if (s.sfx) App.Sfx.play('correct'); };
    $('[data-reset]', root).onclick = () => {
      if (!confirm('本当にリセットする？（経験値・覚えた言葉がすべて消えます）')) return;
      App.Store.reset();
      toast('リセットしました。また最初から旅しよう！');
      App.go('title');
    };
  };
})(window.App = window.App || {});
