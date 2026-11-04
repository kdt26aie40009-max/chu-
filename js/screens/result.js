/* ⑥ 結果画面 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc } = App.U;
  const UI = App.UI;

  const confetti = () => {
    const items = ['🎉', '✨', '🌟', '🧧', '🥟', '🎊'];
    return `<div class="confetti" aria-hidden="true">${Array.from({ length: 18 }, (_, k) =>
      `<span style="left:${(k * 37) % 100}%;animation-delay:${(k % 6) * 0.18}s;animation-duration:${2.2 + (k % 4) * 0.4}s">${items[k % items.length]}</span>`
    ).join('')}</div>`;
  };

  App.screens.result = (root, { spotId, result }) => {
    const city = App.currentCity();
    const spot = city.spots.find((s) => s.id === spotId);
    if (!spot || !result) { App.go('map'); return; }
    const lv = result.after;
    const next = result.next;

    root.innerHTML = `
      ${confetti()}
      <div class="result">
        <div class="result-head pop-in">
          <div class="result-emoji">${spot.emoji}</div>
          <h2>${esc(spot.clear.title)}</h2>
          ${result.first ? '<span class="chip chip-new">NEW スポット達成！</span>' : '<span class="chip">おさらい完了</span>'}
        </div>

        ${UI.hamsterSays(spot.clear.hamster, { mood: 'happy', size: 'md' })}

        <section class="card result-card">
          <h3>今日覚えた中国語</h3>
          <ul class="learned-list">
            ${spot.phrases.map((id) => {
              const p = App.PHRASES[id];
              return `<li><div><span class="zh">${esc(p.zh)}</span>${UI.pinyin(p.py, { force: true })}</div>
                <span class="ja">${esc(p.ja)}</span>${UI.speakBtn(p.zh, { cls: 'speak-sm' })}</li>`;
            }).join('')}
          </ul>
        </section>

        <section class="card result-card result-stats">
          <div class="exp-gain">
            <span class="exp-big">+${result.gained}</span><span>EXP</span>
          </div>
          <div class="exp-detail muted">
            ${result.first ? 'クリア' : 'おさらい'} +${result.base}${result.bonus ? `　ノーミスボーナス +${result.bonus} ✨` : ''}
          </div>
          ${result.levelUp ? `<div class="levelup">⬆️ レベルアップ！ Lv.${result.before.level} → <b>Lv.${lv.level}</b></div>` : ''}
          <div class="stat-row"><span>Lv.${lv.level}</span><span class="muted">${lv.cur} / ${lv.need}</span></div>
          ${UI.expBar(lv)}
          <div class="trip-progress">
            <span>🗺️ ${esc(city.name)}旅行 達成率</span><b>${result.pct}%</b>
          </div>
          <div class="progress"><div class="progress-fill" style="width:${result.pct}%"></div></div>
        </section>

        <div class="result-actions">
          ${next ? `
            <p class="soft-note">今日はここまででもOK！続けるなら次は <b>${next.emoji} ${esc(next.name)}</b></p>
            <button class="btn btn-primary btn-lg btn-block" data-next-spot>🗺️ ${next.emoji} ${esc(next.name)}へ（3D / 2D を選ぶ）</button>` : `
            <p class="soft-note">${esc(city.name)}のスポットは全部クリア！🎉</p>`}
          <button class="btn btn-sub btn-block" data-go="map">🗺️ マップへ戻る</button>
        </div>
      </div>`;

    App.Sfx.play('clear');
    const nb = root.querySelector('[data-next-spot]');
    if (nb) nb.onclick = () => App.go('map');
  };
})(window.App = window.App || {});
