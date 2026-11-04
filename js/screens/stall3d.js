/* 3D 小籠包の屋台（美食街）
 * 通りを歩いて小籠包の屋台を探す → 点餐（注文）で数字を聞き取って注文 → 番号札「三号」をもらう
 * → 屋台のまわりを見ている間に番号が順に呼ばれる → 「三号」が聞こえたら取餐（受け取り口）へ。
 * 2D の屋台レッスンと同じ中国語（数字 1〜5・号・块）を使う。
 * レイアウトと人の会話は js/world3d/stall.js、共通の動きは js/world3d/engine.js。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const ORDER_EXP = 10;
  const PICKUP_EXP = 15;

  const AUNTIE = { name: '屋台のおばちゃん', emoji: '👩‍🍳' };
  const CHEF = { name: '取餐の店員さん', emoji: '🧑‍🍳' };

  const ORDER_SCRIPT = [
    { type: 'hamster', text: '<b>点餐</b>（注文）の窓口だ！<br>小籠包を注文してみよう' },
    { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'いらっしゃい！', hamster: 'あいさつしよう', options: ['nihao', 'xiexie', 'zaijian'], answer: 0 },
    { type: 'understand', zh: '小笼包，一笼五块。', py: 'Xiǎolóngbāo, yì lóng wǔ kuài.', ja: '小籠包、1せいろ5元だよ。',
      q: '1せいろ、いくらって言った？', options: ['5元', '3元', '1元'], answer: 0, hint: '「五（wǔ）」が聞こえたかな？低く下げてから上げる音だよ' },
    { type: 'say', zh: '要几笼？', py: 'Yào jǐ lóng?', ja: '何せいろにする？', hamster: '1せいろ頼もう！「笼（lóng）」＝せいろ', answer: 0,
      options: [{ zh: '一笼', py: 'yì lóng', ja: '1せいろ' }, { zh: '五笼', py: 'wǔ lóng', ja: '5せいろ' }, { zh: '三笼', py: 'sān lóng', ja: '3せいろ' }] },
    { type: 'line', zh: '好的，五块。', py: 'Hǎo de, wǔ kuài.', ja: 'はい、5元ね。', hamster: 'お金をわたそう 💴', next: '💴 5元わたす' },
    { type: 'understand', zh: '你是三号。请等一下。', py: 'Nǐ shì sān hào. Qǐng děng yíxià.', ja: 'あなたは3番ね。ちょっと待っててね。',
      q: '何番って言われた？', options: ['3番', '4番', '2番'], answer: 0, hint: '「三（sān）」は高く平らな音だよ' },
  ];

  const PICKUP_SCRIPT = [
    { type: 'understand', zh: '三号！你的小笼包好了！', py: 'Sān hào! Nǐ de xiǎolóngbāo hǎo le!', ja: '3番さん！小籠包できたよ！',
      q: '何番って呼ばれた？', options: ['3番', '4番', '2番'], answer: 0, hint: 'ぼくたちの番号札は「三号」だったね' },
    { type: 'line', zh: '小心烫！', py: 'Xiǎoxīn tàng!', ja: '熱いから気をつけてね！', hamster: '「烫（tàng）」＝熱い！' },
    { type: 'say', hamster: '受け取ってお礼を言おう', options: ['xiexie', 'nihao', 'zaijian'], answer: 0 },
  ];

  // 順番に呼ばれる番号（最後が自分の三号）
  const CALLS = [
    { n: 1, zh: '一号！一号好了！', py: 'Yī hào! Yī hào hǎo le!', board: '一号' },
    { n: 2, zh: '二号！二号好了！', py: 'Èr hào! Èr hào hǎo le!', board: '二号' },
    { n: 3, zh: '三号！三号好了！', py: 'Sān hào! Sān hào hǎo le!', board: '三号' },
  ];
  const FIRST_CALL = 6;   // 注文してから最初に呼ばれるまで（秒）
  const CALL_EVERY = 9;   // 次の番号までの間隔（秒）

  function order(ctx) {
    ctx.runTalk(AUNTIE, ORDER_SCRIPT, () => {
      const first = !ctx.saved.ordered;
      if (first) {
        ctx.saved.ordered = true;
        ctx.reward(ORDER_EXP);
      }
      const g = ctx.game;
      g.flags.ordered = true;
      g.phase = 'wait';
      g.callIdx = 0;
      g.callTimer = 0;
      ctx.world.drawBoard('— 号');
      ctx.successCard({
        emoji: '🎫',
        title: '注文できた！',
        sub: '番号札：<b>三号</b>（3番）',
        exp: first ? ORDER_EXP : 0,
        body: App.Fields3D.usedList([
          ['五块', 'wǔ kuài', '5元'],
          ['一笼', 'yì lóng', '1せいろ'],
          ['三号', 'sān hào', '3番'],
        ]) + ctx.hamsterLine('番号が呼ばれるまで、通りを見てまわろう！<br><b>三号</b>って聞こえたら、<b>取餐</b>（受け取り口）へ行こうね', 'happy'),
        buttons: [{ label: '🧭 待っている間に探索する', onClick: () => { ctx.closeTalk(); ctx.hamsterSay('<b>三号</b>（sān hào）が呼ばれるまで、耳をすませてね👂', 6); } }],
      });
    });
  }

  function pickup(ctx) {
    ctx.runTalk(CHEF, PICKUP_SCRIPT, () => {
      const first = !ctx.saved.done;
      if (first) {
        ctx.saved.done = true;
        ctx.reward(PICKUP_EXP);
      }
      ctx.game.phase = 'done';
      ctx.successCard({
        emoji: '🥟',
        title: '小籠包ゲット！',
        sub: '屋台のミッション クリア',
        exp: first ? PICKUP_EXP : 0,
        body: App.Fields3D.usedList([
          ['三号', 'sān hào', '3番'],
          ['小心烫', 'xiǎoxīn tàng', '熱いから気をつけて'],
          ['谢谢', 'xièxie', 'ありがとう'],
        ]) + ctx.hamsterLine('あつあつ…はふはふ…おいしい〜！🥟<br>中のスープでやけどしないようにね', 'happy'),
        buttons: [
          { label: '🧭 屋台通りを見てまわる' },
          { label: '🗺️ 上海マップへ戻る', primary: false, onClick: () => App.go('map') },
          { label: '📝 屋台の中国語レッスン（2D）へ', primary: false, onClick: () => App.go('stage', { spotId: 'stall' }) },
        ],
      });
    });
  }

  // 番号の呼び出し（会話中は止まる）
  function tickCalls(dt, ctx) {
    const g = ctx.game;
    if (g.phase !== 'wait' || g.busy) return;
    g.callTimer += dt;
    if (g.callTimer < (g.callIdx === 0 ? FIRST_CALL : CALL_EVERY)) return;
    g.callTimer = 0;
    const c = CALLS[g.callIdx++];
    App.Speech.speak(c.zh);
    App.Sfx.play('tap');
    ctx.world.drawBoard(c.board);
    ctx.toast(`🔔 ${c.zh}<br><small>${c.py}</small>`);
    if (c.n === 3) {
      g.phase = 'pickup';
      ctx.hamsterSay('今の番号…ぼくたちかも！？<br><b>取餐</b>（受け取り口）へ行ってみよう！', 8);
    } else {
      ctx.hamsterSay(`<b>${c.board}</b>（${c.n}番）だって。<br>ぼくたちは<b>三号</b>だから、まだだね`, 6);
    }
  }

  App.screens.stall3d = (root) => App.World3D.mount(root, {
    id: 'stall',
    loading: '🥟 屋台通りへ移動中…',
    helpText: 'いいにおい〜！ここは上海の<b>屋台通り</b>だよ🥟<br><b>小笼包</b>の屋台を探して、注文してみよう！<br>通りの人にも話しかけてみてね',
    build(THREE, scene) {
      const w = App.World3D.buildStall(THREE, scene);
      const base = w.update;
      w.update = (dt, t, ctx) => {
        if (base) base(dt, t, ctx);
        tickCalls(dt, ctx);
      };
      return w;
    },

    guide(ctx) {
      const g = ctx.game;
      const talked = `話した人 ${g.talked.size}/${g.totals.people}`;
      if (g.phase === 'find') {
        return ctx.near === 'order'
          ? { goal: '🎯 点餐（注文）の窓口で注文しよう', say: '屋台のおばちゃんに<b>話しかけて</b>みよう！' }
          : { goal: '🎯 小籠包（小笼包）の屋台を探そう', say: '<b>小笼包</b>の看板を探そう！<br><small>通りの奥の方から湯気が見えるよ</small>' };
      }
      if (g.phase === 'wait') {
        return { goal: `⏳ 番号を待とう（あなたは三号）・発見 ${g.found.size}/${g.totals.found}`, say: '<b>三号</b>（sān hào）が呼ばれるまで、<br>まわりを見たり、人と話したりしよう' };
      }
      if (g.phase === 'pickup') {
        return ctx.near === 'pickup'
          ? { goal: '🎯 取餐（受け取り口）で受け取ろう', say: '店員さんに<b>話しかけて</b>受け取ろう！' }
          : { goal: '🎯 取餐（受け取り口）へ行こう', say: '呼ばれたのは<b>三号</b>！<br>小笼包の屋台の<b>取餐</b>へ急ごう' };
      }
      return { goal: `🎉 屋台クリア！（発見 ${g.found.size}/${g.totals.found}・${talked}）`, say: '屋台通りを探検してみよう！<br>看板の値段も読んでみてね' };
    },

    interactLabel(id, ctx) {
      const p = ctx.game.phase;
      if (id === 'order') return p === 'find' ? '🥟 小籠包を注文する' : '💬 おばちゃんに話しかける';
      if (id === 'pickup') return p === 'pickup' ? '🥟 小籠包を受け取る' : '💬 取餐の店員さんに話しかける';
      return null;
    },

    onInteract: {
      order(ctx) {
        if (ctx.game.phase === 'find') { order(ctx); return; }
        App.Speech.speak('再来一笼吗？');
        ctx.toast('👩‍🍳 再来一笼吗？<br><small>Zài lái yì lóng ma?（もう1せいろいかが？）</small>');
      },
      pickup(ctx) {
        const g = ctx.game;
        if (g.phase === 'pickup') { pickup(ctx); return; }
        if (g.phase === 'find') {
          ctx.hamsterSay('ここは<b>取餐</b>＝受け取り口。<br>先に手前の<b>点餐</b>（注文）で注文しよう！', 6);
          return;
        }
        if (g.phase === 'wait') {
          const now = g.callIdx > 0 ? CALLS[g.callIdx - 1] : null;
          App.Speech.speak('请等一下。');
          ctx.hamsterSay(now
            ? `今は<b>${now.board}</b>（${now.n}番）の番。<br>ぼくたちは<b>三号</b>だから、もう少し待とう`
            : '「请等一下」＝ちょっと待ってね。<br><b>三号</b>が呼ばれるまで待とう', 6);
          return;
        }
        App.Speech.speak('好吃吗？');
        ctx.toast('🧑‍🍳 好吃吗？<br><small>Hǎochī ma?（おいしい？）</small>');
      },
    },
  });
})(window.App = window.App || {});
