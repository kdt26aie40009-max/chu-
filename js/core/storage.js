/* セーブデータ（localStorage）。バックエンドを作るときはここを差し替える */
(function (App) {
  'use strict';

  const KEY = 'hamster-china-trip/v1';

  const defaults = () => ({
    version: 1,
    exp: 0,
    cleared: {},   // spotId -> { count, firstClearedAt, lastClearedAt, bestMistakes }
    learned: {},   // phraseId -> { strength(0-5), correct, wrong, learnedAt, lastReviewed }
    days: [],      // 遊んだ日 'YYYY-MM-DD'
    lastPlayed: null,
    log: [],       // { date, kind: 'spot'|'review', spotId?, exp }
    settings: { rate: 1.0, showPinyin: true, sfx: true },
    world3d: {},   // 3D 探索の進み具合（例: airportCheckedIn）
  });

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

  // 保存データに新しい項目が無くても動くよう、デフォルトに上書きマージする
  function merge(base, saved) {
    Object.keys(saved || {}).forEach((k) => {
      if (isObj(base[k]) && isObj(saved[k])) merge(base[k], saved[k]);
      else base[k] = saved[k];
    });
    return base;
  }

  const Store = {
    state: defaults(),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) Store.state = merge(defaults(), JSON.parse(raw));
      } catch (e) {
        console.warn('セーブデータを読み込めませんでした', e);
      }
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(Store.state)); } catch (e) { /* 保存できない環境でも遊べる */ }
    },
    reset() {
      Store.state = defaults();
      try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
    },
  };

  App.Store = Store;
})(window.App = window.App || {});
