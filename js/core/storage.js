/* セーブデータ（localStorage）。バックエンドを作るときはここを差し替える
 * 2D 学習（course・learned・stats）と 3D 旅行（trip・world3d）の進み具合は別々に持つ。
 * 開発者モード（js/core/dev.js）では別のキーに保存して、ふつうのセーブデータを壊さない。
 */
(function (App) {
  'use strict';

  const MAIN_KEY = 'hamster-china-trip/v1';
  const DEV_KEY = 'hamster-china-trip/dev';
  let KEY = MAIN_KEY;

  const defaults = () => ({
    version: 1,
    exp: 0,
    cleared: {},   // （旧版の 2D スポット。今は使わない・旧セーブの記録用に残す）
    learned: {},   // phraseId -> { strength(0-5), correct, wrong, learnedAt, lastReviewed }
    days: [],      // 遊んだ日 'YYYY-MM-DD'
    lastPlayed: null,
    log: [],       // { date, kind: 'lesson'|'review'|'trip', lessonId?, stageId?, exp }
    // ---- 2D 学習 ----
    course: { lessons: {}, lastCat: null }, // lessonId -> { count, best, firstAt, lastAt }
    stats: { answered: 0, correct: 0, byDay: {} }, // 答えた数・正解数（日ごと { a, c }）
    // ---- 3D 旅行 ----
    trip: { cleared: {}, last: null, unlockAll: false }, // cleared: stageId -> { count, firstAt, lastAt }／unlockAll: チートで全ステージ解放
    world3d: {},   // 3D フィールドごとの細かい進み具合 world3d[fieldId] = { done, talked, ... }
    culture: {},   // 読んだ文化メモ cultureId -> 初めて読んだ日 'YYYY-MM-DD'
    settings: { rate: 1.0, showPinyin: true, sfx: true, wordCheck: true, hamsterVoice: true, hamsterName: 'ハムコシ' },
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
    // 開発者モード：ふつうのセーブをコピーした「テスト用セーブ」に切り替える
    useDevSlot(on, { fresh = false } = {}) {
      Store.save();
      KEY = on ? DEV_KEY : MAIN_KEY;
      if (on && fresh) {
        try { localStorage.setItem(DEV_KEY, localStorage.getItem(MAIN_KEY) || JSON.stringify(defaults())); } catch (e) { /* noop */ }
      }
      Store.state = defaults();
      Store.load();
    },
    isDevSlot: () => KEY === DEV_KEY,
  };

  App.Store = Store;
})(window.App = window.App || {});
