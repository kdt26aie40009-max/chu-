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
          <label class="setting-row">
            <span>読み上げの速さ <b data-rate-label>${s.rate.toFixed(2)}</b></span>
            <input type="range" min="0.5" max="1.2" step="0.05" value="${s.rate}" data-rate>
          </label>
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
            <span>効果音</span>
            <input type="checkbox" class="switch" data-sfx ${s.sfx ? 'checked' : ''}>
          </label>
        </section>

        <section class="card setting">
          <h3>💾 データ</h3>
          <p class="muted small">進み具合はこのブラウザに保存されます。</p>
          <button class="btn btn-danger btn-block" data-reset>データをリセット</button>
        </section>
      </main>`;

    const save = () => App.Store.save();
    $('[data-rate]', root).oninput = (e) => {
      s.rate = Number(e.target.value);
      $('[data-rate-label]', root).textContent = s.rate.toFixed(2);
      save();
    };
    $('[data-test]', root).onclick = () => {
      App.Speech.speak('你好！');
      setTimeout(() => { const v = $('[data-voice]', root); if (v) v.textContent = voiceStatus(); }, 400);
    };
    $('[data-pinyin]', root).onchange = (e) => { s.showPinyin = e.target.checked; save(); };
    $('[data-sfx]', root).onchange = (e) => { s.sfx = e.target.checked; save(); if (s.sfx) App.Sfx.play('correct'); };
    $('[data-reset]', root).onclick = () => {
      if (!confirm('本当にリセットする？（経験値・覚えた言葉がすべて消えます）')) return;
      App.Store.reset();
      toast('リセットしました。また最初から旅しよう！');
      App.go('title');
    };
  };
})(window.App = window.App || {});
