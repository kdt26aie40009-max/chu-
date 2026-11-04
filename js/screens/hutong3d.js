/* 3D 胡同さんぽ（寄り道ステージ）
 * 北京の古い路地を歩いて、地元の人とおしゃべりする。3 人と話すとクリア。
 * レイアウトと人の会話は js/world3d/hutong.js、共通の動きは js/world3d/engine.js。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const GOAL = 3;
  const CLEAR_EXP = 15;

  App.screens.hutong3d = (root) => App.World3D.mount(root, {
    id: 'hutong',
    loading: '🏘️ 胡同へ移動中…',
    helpText: 'ここは北京の古い路地、<b>胡同</b>だよ🏘️<br>のんびり歩いて、地元の人と<b>おしゃべり</b>しよう！<br>左の赤い門の奥には<b>四合院</b>もあるよ',
    build: (THREE, scene) => App.World3D.buildHutong(THREE, scene),

    guide(ctx) {
      const n = ctx.game.talked.size;
      const all = ctx.game.totals.people;
      if (n < GOAL) {
        return { goal: `💬 路地の人と話そう（${n}/${GOAL}）`, say: n === 0 ? '鳥かごを持ったおじいさんや、遊んでいる子どもに<br>話しかけてみよう！' : `いい感じ！あと <b>${GOAL - n}人</b>と話してみよう` };
      }
      return { goal: `🎉 胡同さんぽ クリア！（話した人 ${n}/${all}・発見 ${ctx.game.found.size}/${ctx.game.totals.found}）`, say: '四合院の中ものぞいてみよう！' };
    },
    interactLabel: () => null,
    onInteract: {},

    onTalked(def, ctx) {
      if (ctx.game.talked.size >= GOAL && !ctx.game.flags.cleared) {
        ctx.game.flags.cleared = true;
        const first = !ctx.saved.done;
        if (first) { ctx.saved.done = true; ctx.reward(CLEAR_EXP); }
        App.Trip.clear('hutong');
        ctx.toast(`🏘️ 胡同さんぽ クリア！${first ? `（+${CLEAR_EXP} EXP）` : ''}`);
      }
    },
  });
})(window.App = window.App || {});
