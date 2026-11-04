/* 3D 旅行モードの進み具合（2D 学習とは別）
 * state.trip = { cleared: { stageId: { count, firstAt, lastAt } }, last: stageId }
 * ステージは 3D の中でクリアすると、after にそのステージを書いた次の行き先が開く。
 */
(function (App) {
  'use strict';

  const S = () => App.Store.state;
  const T = {};

  T.regions = () => App.TRIP.regions;
  T.region = (id) => App.TRIP.regions.find((r) => r.id === id);
  T.stages = () => App.TRIP.stages;
  T.find = (id) => App.TRIP.stages.find((s) => s.id === id) || null;
  T.byField = (field, params = {}) => App.TRIP.stages.find((s) => s.field === field
    && (!s.params || Object.keys(s.params).every((k) => s.params[k] === params[k]))) || null;

  T.isCleared = (id) => !!S().trip.cleared[id];
  T.ready = (st) => !!App.screens[st.field];
  T.isUnlocked = (st) => {
    if (App.Dev && App.Dev.on && App.Dev.flags.allStages) return true;
    return !st.after || T.isCleared(st.after);
  };
  // 次に行くとよい本線のステージ
  T.next = () => T.stages().find((s) => s.kind === 'main' && !T.isCleared(s.id) && T.isUnlocked(s) && T.ready(s)) || null;
  T.percent = () => {
    const list = T.stages().filter(T.ready);
    return list.length ? Math.round((list.filter((s) => T.isCleared(s.id)).length / list.length) * 100) : 0;
  };

  // 3D の中でステージをクリアしたとき（EXP は各 3D 画面で付与）。初めてなら true
  T.clear = (id) => {
    const today = App.U.todayKey();
    const c = S().trip.cleared[id];
    if (c) { c.count++; c.lastAt = today; App.Store.save(); return false; }
    S().trip.cleared[id] = { count: 1, firstAt: today, lastAt: today };
    App.Progress.markPlayed();
    App.Progress.log({ kind: 'trip', stageId: id, exp: 0 });
    App.Store.save();
    const st = T.find(id);
    const opened = T.stages().filter((s) => s.after === id && T.ready(s));
    if (st && opened.length) App.U.toast(`🗺️ ${opened.map((s) => s.emoji + ' ' + s.name).join('・')} に行けるようになったよ！`);
    return true;
  };

  T.go = (st) => {
    S().trip.last = st.id;
    App.Store.save();
    App.go(st.field, Object.assign({ stageId: st.id }, st.params || {}));
  };

  // 以前の版のセーブ（3D の各フィールドの done）から、旅の進み具合を作る
  T.migrate = () => {
    const w = S().world3d || {};
    const done = (k) => w[k] && (w[k].done || (w[k].dishes && Object.values(w[k].dishes).some(Boolean)));
    const map = { airport: 'airport', hotel: 'hotel', stall: 'market', greatwall: 'greatwall' };
    let changed = false;
    Object.keys(map).forEach((k) => {
      if (done(k) && !S().trip.cleared[map[k]]) {
        S().trip.cleared[map[k]] = { count: 1, firstAt: App.U.todayKey(), lastAt: App.U.todayKey(), migrated: true };
        changed = true;
      }
    });
    if (changed) App.Store.save();
  };

  App.Trip = T;
})(window.App = window.App || {});
