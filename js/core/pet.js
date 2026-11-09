/* ハムスターを育てる（おうち画面 js/screens/pet.js）
 * state.pet = { food: { foodId: 個数 }, growth, love, fed, lvGiven, petDay, petLove }
 *   レベルが 1 上がるごとに、ごはんが 1 つもらえる（2D・3D どちらの EXP でも）。
 *   ごはんをあげると「そだち」と「なかよし度」が増えて、ハムスターが大きくなる。
 *   なでると「なかよし度」が増える（1 日 NADE_MAX まで。なでるのはいつでもできる）。
 *   おなかが減る・元気がなくなる、のような「放っておくと悪くなる」しくみは入れない。
 */
(function (App) {
  'use strict';

  const S = () => App.Store.state;
  const NADE_MAX = 10; // なでて増える、1 日のなかよし度の上限

  // ごはん（grow: そだち、love: なかよし度）
  const FOODS = [
    { id: 'seed', name: 'ひまわりの種', zh: '葵花子', emoji: '🌻', grow: 1, love: 1, say: 'カリカリ…おいしい〜！' },
    { id: 'carrot', name: 'にんじん', zh: '胡萝卜', emoji: '🥕', grow: 2, love: 1, say: 'シャキシャキだね！' },
    { id: 'apple', name: 'りんご', zh: '苹果', emoji: '🍎', grow: 2, love: 2, say: 'あま〜い！しあわせ〜' },
    { id: 'broccoli', name: 'ブロッコリー', zh: '西兰花', emoji: '🥦', grow: 3, love: 1, say: '野菜で元気もりもり！' },
    { id: 'strawberry', name: 'いちご', zh: '草莓', emoji: '🍓', grow: 2, love: 3, say: 'いちご大好き！ありがとう！' },
    { id: 'mooncake', name: '月餅', zh: '月饼', emoji: '🥮', grow: 5, love: 5, say: '特別なおやつだ〜！！' },
  ];
  // レベル L になったときにもらえるごはん（5 の倍数は特別な月餅）
  const foodForLevel = (L) => (L % 5 === 0 ? FOODS[5] : FOODS[(L - 2) % 5]);

  // 育ちぐあい（growth がこの値以上で次の段階）
  const STAGES = [
    { min: 0, name: 'ちびハム', scale: 0.72 },
    { min: 5, name: 'こどもハム', scale: 0.86 },
    { min: 15, name: 'おとなハム', scale: 1 },
    { min: 30, name: 'もちもちハム', scale: 1.1 },
    { min: 60, name: 'でっかいハム', scale: 1.2 },
  ];
  // なかよし度（love がこの値以上で次の段階）
  const BONDS = [
    { min: 0, name: 'はじめまして' },
    { min: 10, name: 'なかよし' },
    { min: 30, name: 'だいすき' },
    { min: 60, name: 'ずっといっしょ' },
    { min: 100, name: 'さいこうの相棒' },
  ];

  const step = (list, v) => {
    let i = 0;
    while (i + 1 < list.length && v >= list[i + 1].min) i++;
    const cur = list[i];
    const nx = list[i + 1];
    return { i, name: cur.name, scale: cur.scale, next: nx || null, cur: v - cur.min, need: nx ? nx.min - cur.min : 0 };
  };

  const pet = () => {
    const p = S().pet;
    if (!p.food) p.food = {};
    return p;
  };

  const Pet = {
    FOODS,
    NADE_MAX,
    food: (id) => FOODS.find((f) => f.id === id),
    stage: () => step(STAGES, pet().growth),
    bond: () => step(BONDS, pet().love),
    count: (id) => pet().food[id] || 0,
    total: () => FOODS.reduce((n, f) => n + Pet.count(f.id), 0),

    // いまのレベルまでの分のごはんを渡す（前の版のセーブで上がっていたレベルの分も）。もらったごはんの一覧を返す
    sync() {
      const p = pet();
      const lv = App.Progress.level().level;
      const got = [];
      if (!p.lvGiven) p.lvGiven = 1;
      while (p.lvGiven < lv) {
        p.lvGiven++;
        const f = foodForLevel(p.lvGiven);
        p.food[f.id] = (p.food[f.id] || 0) + 1;
        got.push(f);
      }
      if (got.length) App.Store.save();
      return got;
    },

    // ごはんをあげる。あげられたら { food, grew }（grew: 育ちの段階が上がった）
    feed(id) {
      const p = pet();
      const f = Pet.food(id);
      if (!f || !Pet.count(id)) return null;
      const before = Pet.stage().i;
      p.food[id]--;
      p.growth += f.grow;
      p.love += f.love;
      p.fed++;
      App.Store.save();
      return { food: f, grew: Pet.stage().i > before };
    },

    // なでる。なかよし度が増えたら true（1 日 NADE_MAX まで）
    nade() {
      const p = pet();
      const today = App.U.todayKey();
      if (p.petDay !== today) { p.petDay = today; p.petLove = 0; }
      if (p.petLove >= NADE_MAX) return false;
      p.petLove++;
      p.love++;
      App.Store.save();
      return true;
    },
    nadeLeft: () => {
      const p = pet();
      return p.petDay === App.U.todayKey() ? NADE_MAX - p.petLove : NADE_MAX;
    },
  };

  App.Pet = Pet;
})(window.App = window.App || {});
