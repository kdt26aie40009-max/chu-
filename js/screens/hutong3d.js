/* 3D 胡同さんぽ（寄り道ステージ）
 * 北京の古い路地を歩いて、地元の人とおしゃべりする。3 人と話すとクリア。
 * 奥の横の路地の先に ⭐ おすすめスポット（什刹海・茶館・鼓楼）。イベントはなく、見て回るだけ。
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
    helpText: 'ここは北京の古い路地、<b>胡同</b>だよ🏘️<br>のんびり歩いて、地元の人と<b>おしゃべり</b>しよう！<br>左の赤い門の奥には<b>四合院</b>、路地の突き当たりを曲がると<b>⭐ おすすめスポット</b>（湖の什刹海・茶館・鼓楼）もあるよ',
    build: (THREE, scene) => App.World3D.buildHutong(THREE, scene),

    guide(ctx) {
      const n = ctx.game.talked.size;
      const all = ctx.game.totals.people;
      if (n < GOAL) {
        return { goal: `💬 路地の人と話そう（${n}/${GOAL}）`, say: n === 0 ? '鳥かごを持ったおじいさんや、遊んでいる子どもに<br>話しかけてみよう！' : `いい感じ！あと <b>${GOAL - n}人</b>と話してみよう` };
      }
      const spots = ['shichahai', 'chaguan', 'gulou'].filter((id) => ctx.game.found.has(id)).length;
      return {
        goal: `🎉 胡同さんぽ クリア！（話した人 ${n}/${all}・⭐ スポット ${spots}/3）`,
        say: spots < 3 ? '路地の突き当たりを曲がると<b>⭐ おすすめスポット</b>があるよ。<br>湖の什刹海・茶館・鼓楼、ぜんぶ見てみよう！' : 'おすすめスポット、ぜんぶ見たね！のんびり散歩を楽しもう🌿',
      };
    },
    interactLabel: () => null,
    onInteract: {},

    onTalked(def, ctx) {
      if (ctx.game.talked.size >= GOAL && !ctx.game.flags.cleared) {
        ctx.game.flags.cleared = true;
        const first = !ctx.saved.done;
        if (first) ctx.saved.done = true;
        const gained = ctx.earn('done', CLEAR_EXP, first);
        App.Trip.clear('hutong');
        ctx.toast(`🏘️ 胡同さんぽ クリア！${gained ? `（+${gained} EXP）` : ''}`);
      }
    },
  });
})(window.App = window.App || {});
