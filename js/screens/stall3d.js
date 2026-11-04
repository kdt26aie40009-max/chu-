/* 3D 屋台通り（北京・王府井小吃街）
 * 4 つのお店で、2D コースで覚えた言葉を使って注文する：
 *   🥟 小笼包   点餐で注文 → 番号札「三号」→ 番号が順に呼ばれる → 「三号」が聞こえたら取餐へ（UNIT 5 数字）
 *   🍲 涮羊肉   メニュー・指さし注文・一共多少钱（UNIT 7 食事）
 *   🍜 炸酱面   一碗・不要辣（UNIT 7）
 *   🦆 北京烤鸭 几位・一份・买单（UNIT 7）
 * お店は北京マップの対応するスポット（spot）が解放されていると注文できる。
 * マップで選んだスポットのお店（params.shop）を最初に案内する。
 * レイアウトと人の会話は js/world3d/stall.js、共通の動きは js/world3d/engine.js。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const ORDER_EXP = 10;
  const PICKUP_EXP = 15;
  const DISH_EXP = 15;

  const AUNTIE = { name: '屋台のおばちゃん', emoji: '👩‍🍳' };
  const CHEF = { name: '取餐の店員さん', emoji: '🧑‍🍳' };

  /* ---------- 🥟 小笼包（番号の呼び出しつき） ---------- */
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

  /* ---------- 🍲🍜🦆 お店（その場で注文 → 食べる → 会計） ---------- */
  const SHOPS = {
    xlb: { spot: 'stall', name: '小籠包の屋台', emoji: '🥟', where: '左の奥、湯気の出ている<b>小笼包</b>の屋台' },
    shuan: {
      spot: 'shuan', name: '涮羊肉の店', emoji: '🍲', where: '右側の<b>涮羊肉</b>（銅の鍋）のお店',
      who: { name: '涮羊肉のおばさん', emoji: '👩‍🍳' },
      script: [
        { type: 'hamster', text: '銅の鍋の<b>涮羊肉</b>！<br>メニューをもらって注文しよう' },
        { type: 'say', zh: '欢迎光临！', py: 'Huānyíng guānglín!', ja: 'いらっしゃいませ！', hamster: 'メニューをもらおう', options: ['caidan', 'maidan', 'cesuo'], answer: 0 },
        { type: 'understand', zh: '给您菜单。羊肉一盘四十块。', py: 'Gěi nín càidān. Yángròu yì pán sìshí kuài.', ja: 'メニューをどうぞ。羊肉は1皿40元です。',
          q: '羊肉1皿いくら？', options: ['40元', '14元', '4元'], answer: 0, hint: '四（4）×十（10）＝四十' },
        { type: 'say', hamster: '羊肉の写真を指さして注文！', options: ['yaozhege', 'buyao', 'zaijian'], answer: 0 },
        { type: 'line', zh: '好的，马上来！', py: 'Hǎo de, mǎshàng lái!', ja: 'はい、すぐお持ちします！',
          hamster: 'うすい羊肉をさっと鍋にくぐらせて、ごまだれで…はふはふ', next: '🍲 しゃぶしゃぶする' },
        { type: 'say', zh: '好吃吗？', py: 'Hǎochī ma?', ja: 'おいしい？', hamster: '感想を伝えよう', options: ['haochi', 'taigui', 'buyaola'], answer: 0 },
        { type: 'say', hamster: '全部でいくらか聞こう', options: ['yigong', 'jidian', 'nijiao'], answer: 0 },
        { type: 'understand', zh: '一共四十五块。', py: 'Yígòng sìshíwǔ kuài.', ja: '全部で45元です。',
          q: '全部でいくら？', options: ['45元', '54元', '40元'], answer: 0, hint: '四十（40）＋五（5）＝四十五' },
      ],
      used: [['我要这个', 'Wǒ yào zhège', 'これください'], ['好吃！', 'Hǎochī!', 'おいしい！'], ['一共多少钱？', 'Yígòng duōshao qián?', '全部でいくら？']],
      done: '銅鍋の涮羊肉、ごちそうさま！',
    },
    zhajiang: {
      spot: 'zhajiang', name: '炸酱面の店', emoji: '🍜', where: '右側の<b>炸酱面</b>のお店',
      who: { name: '麺屋のお兄さん', emoji: '🧑‍🍳' },
      script: [
        { type: 'hamster', text: '北京の家庭の味、<b>炸酱面</b>（ジャージャー麺）！' },
        { type: 'say', zh: '您好！想吃什么？', py: 'Nín hǎo! Xiǎng chī shénme?', ja: 'いらっしゃい！何を食べますか？',
          hamster: 'ジャージャー麺を1杯たのもう', options: ['yiwan', 'yifen', 'yilong'], answer: 0 },
        { type: 'understand', zh: '要辣的吗？', py: 'Yào là de ma?', ja: '辛いのにしますか？',
          q: '何を聞かれた？', options: ['辛くするか', '大盛りにするか', '持ち帰りか'], answer: 0, hint: '「辣（là）」＝辛い' },
        { type: 'say', hamster: '辛くしないでもらおう', options: ['buyaola', 'haochi', 'maidan'], answer: 0 },
        { type: 'line', zh: '好的！一碗炸酱面，十八块。', py: 'Hǎo de! Yì wǎn zhájiàngmiàn, shíbā kuài.', ja: 'はい！ジャージャー麺1杯、18元ね。',
          hamster: 'お金をわたそう 💴', next: '💴 18元わたす' },
        { type: 'say', hamster: '麺と味噌をよくまぜて…ひとくち！感想は？', options: ['haochi', 'taigui', 'buyao'], answer: 0 },
        { type: 'say', hamster: 'お店を出るとき、お礼を言おう', options: ['xiexie', 'duibuqi', 'nihao'], answer: 0 },
      ],
      used: [['我要一碗炸酱面', 'Wǒ yào yì wǎn zhájiàngmiàn', 'ジャージャー麺を1杯ください'], ['不要辣', 'Bú yào là', '辛くしないで'], ['十八块', 'shíbā kuài', '18元']],
      done: 'ジャージャー麺、完食！',
    },
    duck: {
      spot: 'duck', name: '北京ダックの店', emoji: '🦆', where: '通りのいちばん奥、右の<b>北京烤鸭</b>のお店',
      who: { name: '北京ダックの料理人', emoji: '🧑‍🍳' },
      script: [
        { type: 'understand', zh: '欢迎光临！几位？', py: 'Huānyíng guānglín! Jǐ wèi?', ja: 'いらっしゃいませ！何名様ですか？',
          q: '何を聞かれた？', options: ['何人か', '何を食べるか', 'どこから来たか'], answer: 0, hint: '「几（jǐ）」＝いくつ、「位（wèi）」＝人をていねいに数える言葉' },
        { type: 'say', hamster: '「1人です」と答えよう', options: [{ zh: '一位。', py: 'Yí wèi.', ja: '1人です' }, { zh: '三位。', py: 'Sān wèi.', ja: '3人です' }, 'buyao'], answer: 0 },
        { type: 'say', zh: '吃点儿什么？', py: 'Chī diǎnr shénme?', ja: '何を召し上がりますか？', hamster: '北京ダックを1人前！', options: ['yifen', 'yiwan', 'shui'], answer: 0 },
        { type: 'understand', zh: '好的，一份烤鸭九十八块。', py: 'Hǎo de, yí fèn kǎoyā jiǔshíbā kuài.', ja: 'かしこまりました。北京ダック1人前98元です。',
          q: 'いくら？', options: ['98元', '89元', '18元'], answer: 0, hint: '九十（90）＋八（8）＝九十八' },
        { type: 'line', zh: '我给您片鸭子。', py: 'Wǒ gěi nín piàn yāzi.', ja: '目の前で切り分けますね。',
          hamster: 'パリパリの皮を、うすい皮でネギと一緒にくるんで…', next: '🦆 食べる' },
        { type: 'say', hamster: '感想を伝えよう', options: ['haochi', 'taigui', 'buyaola'], answer: 0 },
        { type: 'say', hamster: 'お会計をお願いしよう', options: ['maidan', 'caidan', 'qu'], answer: 0 },
      ],
      used: [['我要一份烤鸭', 'Wǒ yào yí fèn kǎoyā', '北京ダックを1人前ください'], ['九十八块', 'jiǔshíbā kuài', '98元'], ['买单', 'Mǎidān', 'お会計お願いします']],
      done: '北京ダック、制覇！',
    },
  };
  const ORDER = ['xlb', 'shuan', 'zhajiang', 'duck'];

  const spotOf = (id) => App.currentCity().spots.find((s) => s.id === SHOPS[id].spot);
  const shopOpen = (id) => { const s = spotOf(id); return !!s && App.Progress.isUnlocked(App.currentCity(), s); };
  const dishDone = (ctx, id) => !!ctx.saved.dishes[id];
  const lockMsg = (id) => {
    const u = App.Course.unit(spotOf(id).requires);
    return `このお店の注文の言葉は、📘<b>UNIT ${u.id.slice(1)}「${App.U.esc(u.title)}」</b>で覚えられるよ。<br>覚えてからまた来よう！`;
  };

  function finishDish(ctx, id) {
    ctx.saved.dishes[id] = true;
    App.Progress.markSpotCleared(SHOPS[id].spot);
    const next = ORDER.find((k) => !dishDone(ctx, k) && shopOpen(k));
    ctx.game.focus = next || null;
    ctx.save();
    return next;
  }
  const nextHint = (next) => (next
    ? `次は <b>${SHOPS[next].emoji} ${SHOPS[next].name}</b> に行ってみる？<br><small>${SHOPS[next].where}</small>`
    : '行けるお店は全部まわったね！北京グルメ、おいしかった〜🎉');

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
      const next = finishDish(ctx, 'xlb');
      ctx.successCard({
        emoji: '🥟',
        title: '小籠包ゲット！',
        sub: '小籠包の屋台 クリア',
        exp: first ? PICKUP_EXP : 0,
        body: App.Fields3D.usedList([
          ['三号', 'sān hào', '3番'],
          ['小心烫', 'xiǎoxīn tàng', '熱いから気をつけて'],
          ['谢谢', 'xièxie', 'ありがとう'],
        ]) + ctx.hamsterLine(`あつあつ…はふはふ…おいしい〜！🥟<br>${nextHint(next)}`, 'happy'),
        buttons: [
          { label: '🧭 屋台通りを見てまわる' },
          { label: `🗺️ ${App.currentCity().name}マップへ戻る`, primary: false, onClick: () => App.go('map') },
        ],
      });
    });
  }

  function eatAt(ctx, id) {
    const shop = SHOPS[id];
    ctx.runTalk(shop.who, shop.script, () => {
      const first = !dishDone(ctx, id);
      if (first) ctx.reward(DISH_EXP);
      const next = finishDish(ctx, id);
      ctx.successCard({
        emoji: shop.emoji,
        title: shop.done,
        sub: `${shop.name} クリア`,
        exp: first ? DISH_EXP : 0,
        body: App.Fields3D.usedList(shop.used) + ctx.hamsterLine(nextHint(next), 'happy'),
        buttons: [
          { label: '🧭 屋台通りを見てまわる' },
          { label: `🗺️ ${App.currentCity().name}マップへ戻る`, primary: false, onClick: () => App.go('map') },
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

  // 料理のお店に話しかけたとき
  const shopInteract = (id) => (ctx) => {
    if (!shopOpen(id)) { ctx.hamsterSay(lockMsg(id), 7); return; }
    if (dishDone(ctx, id) && ctx.game.focus !== id) {
      App.Speech.speak('欢迎再来！');
      ctx.toast(`${SHOPS[id].emoji} 欢迎再来！<br><small>Huānyíng zài lái!（また来てね！）</small>`);
      return;
    }
    eatAt(ctx, id);
  };

  App.screens.stall3d = (root, params = {}) => App.World3D.mount(root, {
    id: 'stall',
    loading: '🥢 王府井の屋台通りへ移動中…',
    helpText: 'いいにおい〜！ここは北京・<b>王府井の屋台通り</b>だよ🥢<br>小籠包・涮羊肉・炸酱面・北京ダック…<br>覚えた中国語で<b>注文</b>してみよう！',
    build(THREE, scene) {
      const w = App.World3D.buildStall(THREE, scene);
      const base = w.update;
      let init = false;
      w.update = (dt, t, ctx) => {
        if (!init) {
          init = true;
          // 以前のセーブ（小籠包だけの版）から移行
          if (!ctx.saved.dishes) ctx.saved.dishes = { xlb: !!ctx.saved.done };
          const want = SHOPS[params.shop] ? params.shop : 'xlb';
          ctx.game.focus = !dishDone(ctx, want) || params.shop ? want : ORDER.find((k) => !dishDone(ctx, k) && shopOpen(k)) || null;
        }
        if (base) base(dt, t, ctx);
        tickCalls(dt, ctx);
      };
      return w;
    },

    guide(ctx) {
      const g = ctx.game;
      const dishes = ctx.saved.dishes || {};
      if (g.phase === 'wait') {
        return { goal: `⏳ 番号を待とう（あなたは三号）`, say: '<b>三号</b>（sān hào）が呼ばれるまで、<br>まわりを見たり、ほかのお店に行ったりしよう' };
      }
      if (g.phase === 'pickup') {
        return ctx.near === 'pickup'
          ? { goal: '🎯 取餐（受け取り口）で受け取ろう', say: '店員さんに<b>話しかけて</b>受け取ろう！' }
          : { goal: '🎯 取餐（受け取り口）へ行こう', say: '呼ばれたのは<b>三号</b>！<br>小笼包の屋台の<b>取餐</b>へ急ごう' };
      }
      const f = g.focus && SHOPS[g.focus];
      if (f) {
        const here = ctx.near === (g.focus === 'xlb' ? 'order' : g.focus);
        if (!shopOpen(g.focus)) return { goal: `🔒 ${f.emoji} ${f.name}`, say: lockMsg(g.focus) };
        return here
          ? { goal: `🎯 ${f.emoji} ${f.name}で注文しよう`, say: 'お店の人に<b>話しかけて</b>みよう！' }
          : { goal: `🎯 ${f.emoji} ${f.name}を探そう`, say: `${f.where}を探そう！` };
      }
      const n = ORDER.filter((k) => dishes[k]).length;
      return {
        goal: `🍽️ 北京グルメ ${n}/4・発見 ${g.found.size}/${g.totals.found}`,
        say: n >= 4 ? '北京グルメ制覇！🎉<br>通りの人とも話してみよう' : 'ほかのお店でも注文してみよう！<br>看板の値段も読んでみてね',
      };
    },

    interactLabel(id, ctx) {
      const p = ctx.game.phase;
      if (id === 'order') return p === 'find' || p === 'done' ? '🥟 小籠包を注文する' : '💬 おばちゃんに話しかける';
      if (id === 'pickup') return p === 'pickup' ? '🥟 小籠包を受け取る' : '💬 取餐の店員さんに話しかける';
      if (SHOPS[id]) {
        if (!shopOpen(id)) return `🔒 ${SHOPS[id].emoji} ${SHOPS[id].name}`;
        return `${SHOPS[id].emoji} 注文する`;
      }
      return null;
    },

    onInteract: {
      order(ctx) {
        if (!shopOpen('xlb')) { ctx.hamsterSay(lockMsg('xlb'), 7); return; }
        if (ctx.game.phase === 'find' || ctx.game.phase === 'done') { order(ctx); return; }
        App.Speech.speak('请等一下。');
        ctx.toast('👩‍🍳 请等一下。<br><small>Qǐng děng yíxià.（ちょっと待ってね）</small>');
      },
      pickup(ctx) {
        const g = ctx.game;
        if (g.phase === 'pickup') { pickup(ctx); return; }
        if (g.phase === 'wait') {
          const now = g.callIdx > 0 ? CALLS[g.callIdx - 1] : null;
          App.Speech.speak('请等一下。');
          ctx.hamsterSay(now
            ? `今は<b>${now.board}</b>（${now.n}番）の番。<br>ぼくたちは<b>三号</b>だから、もう少し待とう`
            : '「请等一下」＝ちょっと待ってね。<br><b>三号</b>が呼ばれるまで待とう', 6);
          return;
        }
        ctx.hamsterSay('ここは<b>取餐</b>＝受け取り口。<br>手前の<b>点餐</b>（注文）で注文してね', 6);
      },
      shuan: shopInteract('shuan'),
      zhajiang: shopInteract('zhajiang'),
      duck: shopInteract('duck'),
    },
  });
})(window.App = window.App || {});
