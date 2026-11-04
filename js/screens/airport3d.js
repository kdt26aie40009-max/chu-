/* 3D 空港
 * 旅行マップの ✈️ → 「3Dで歩く」 → この画面。歩いてチェックインカウンターを探し、中国語でチェックインする。
 * 空港にいる一般の人にも話しかけられる（会話は js/world3d/airport.js の PEOPLE）。
 * 共通の動き（歩く・会話など）は js/world3d/engine.js。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc } = App.U;
  const UI = App.UI;
  const CHECKIN_EXP = 10;

  // チェックインカウンターの会話
  const CHECKIN_SCRIPT = [
    { type: 'hamster', text: 'チェックインしてみよう！<br>まずは係員さんの言葉を聞いてね' },
    { type: 'understand', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', q: '「<b class="zh">你好</b>」の意味は？',
      options: ['こんにちは', 'ありがとう', 'さようなら'], answer: 0 },
    { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: '正解！「你好」は<b>こんにちは</b>。<br>あいさつを返そう！',
      options: ['nihao', 'xiexie', 'zaijian'], answer: 0 },
    { type: 'line', zh: '请出示您的护照。', py: 'Qǐng chūshì nín de hùzhào.', ja: 'パスポートを見せてください。',
      hamster: 'パスポートをわたそう 🛂', next: '🛂 パスポートをわたす' },
    { type: 'say', zh: '好了！这是您的登机牌。', py: 'Hǎo le! Zhè shì nín de dēngjīpái.', ja: 'はい、こちらが搭乗券です。',
      hamster: '搭乗券をもらったよ！<b>お礼</b>を言おう', options: ['xiexie', 'nihao', 'zaijian'], answer: 0 },
  ];

  const usedList = (items) => `
    <ul class="w3d-used">
      ${items.map(([zh, py, ja]) => `<li><span class="zh">${esc(zh)}</span><span class="py">${esc(py)}</span><span>${esc(ja)}</span>${UI.speakBtn(zh, { cls: 'speak-sm' })}</li>`).join('')}
    </ul>`;

  function checkin(ctx) {
    const who = { name: 'チェックインの係員さん', emoji: '🧑‍✈️' };
    ctx.runTalk(who, CHECKIN_SCRIPT, () => {
      const first = !ctx.saved.done;
      if (first) {
        ctx.saved.done = true;
        ctx.reward(CHECKIN_EXP);
      }
      ctx.game.flags.checkedIn = true;
      App.Progress.markSpotCleared('airport');
      ctx.game.phase = ctx.game.found.size >= ctx.game.totals.found ? 'done' : 'explore';
      ctx.successCard({
        emoji: '🎫',
        title: 'チェックイン成功！',
        exp: first ? CHECKIN_EXP : 0,
        body: usedList([['你好', 'Nǐ hǎo', 'こんにちは'], ['谢谢', 'Xièxie', 'ありがとう']])
          + ctx.hamsterLine('やったね！せっかくだから、<b>空港を探索</b>してみよう。<br>空港にいる<b>人にも話しかけて</b>みてね！', 'happy'),
        buttons: [
          { label: '🧭 空港探索を続ける', onClick: () => { ctx.closeTalk(); ctx.hamsterSay('いろんな人に<b>話しかけて</b>みよう！<br><b>登机口</b>（搭乗口）も探してね', 6); } },
          { label: '📝 空港の中国語レッスン（2D）へ', primary: false, onClick: () => App.go('stage', { spotId: 'airport' }) },
        ],
      });
    });
  }

  App.screens.airport3d = (root) => App.World3D.mount(root, {
    id: 'airport',
    loading: '✈️ 空港へ移動中…',
    helpText: 'ここは<b>北京首都国際空港</b>だよ！<br>自由に歩いて、<b>チェックインカウンター</b>を探してみよう！<br>空港にいる人にも話しかけてみてね',
    build: (THREE, scene) => App.World3D.buildAirport(THREE, scene),

    guide(ctx) {
      const g = ctx.game;
      const talked = `話した人 ${g.talked.size}/${g.totals.people}`;
      if (g.phase === 'find') {
        return ctx.near === 'desk'
          ? { goal: '🎯 カウンターで話しかけよう', say: 'カウンターに着いた！<br><b>話しかけて</b>みよう' }
          : { goal: '🎯 チェックインカウンターを探そう', say: 'まずは<b>チェックインカウンター</b>を探してみよう！<br><small>黄色い線をたどってね</small>' };
      }
      if (g.phase === 'explore') {
        return { goal: `🧭 探索しよう（発見 ${g.found.size}/${g.totals.found}・${talked}）`, say: 'チェックイン完了！🎫<br>空港の<b>人に話しかけたり</b>、看板を見てみよう' };
      }
      return { goal: `🎉 空港探索コンプリート！（${talked}）`, say: '空港マスターだね！<br>マップに戻って旅を続けよう' };
    },

    interactLabel(id, ctx) {
      if (id === 'desk') return ctx.game.flags.checkedIn ? '💬 係員さんに話しかける' : '🛄 チェックインする';
      return null;
    },

    onInteract: {
      desk(ctx) {
        if (!ctx.game.flags.checkedIn) { checkin(ctx); return; }
        App.Speech.speak('祝您旅途愉快！');
        ctx.toast('🧑‍✈️ 祝您旅途愉快！<br><small>Zhù nín lǚtú yúkuài!（よい旅を！）</small>');
      },
    },

    onDiscover(d, ctx) {
      const g = ctx.game;
      if (g.flags.checkedIn && g.found.size >= g.totals.found && g.phase !== 'done') {
        g.phase = 'done';
        ctx.toast('🎉 空港探索コンプリート！');
      }
    },
  });

  App.Fields3D = App.Fields3D || {};
  App.Fields3D.usedList = usedList;
})(window.App = window.App || {});
