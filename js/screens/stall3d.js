/* 3D 北京の商店街（王府井）— 旅のステージ 3
 * 好きなお店に入って、メニューを見て注文する（どこか 1 店でごはんを食べるとステージクリア）：
 *   🥟 小笼包   点餐で注文 → 番号札「三号」→ 番号が順に呼ばれる → 「三号」が聞こえたら取餐へ
 *   🍲 涮羊肉 / 🍜 炸酱面 / 🦆 北京烤鸭  メニューを見る → 選ぶ → 指さし注文 → 値段を聞く → 食べる → 会計
 *   🎁 お土産   値段を聞いて「太贵了！」「便宜一点吧」で値切る
 *   🍡 糖葫芦   1 本買ってみる
 * メニューの料理は engine.js の { type: 'menu' } で選び、後のセリフの {zh} {price} などに入る。
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

  /* ---------- 🍲🍜🦆 お店：メニューを見る → 選ぶ → 注文 → 値段を聞く → 食べる → 会計 ---------- */
  // メニューの料理（priceZh/pricePy は値段の中国語の読み）
  const M = (emoji, zh, py, ja, price, priceZh, pricePy) => ({ emoji, zh, py, ja, price, priceZh, pricePy });
  const SHOPS = {
    xlb: { name: '小籠包の屋台', emoji: '🥟', where: '左の奥、湯気の出ている<b>小笼包</b>の屋台' },
    shuan: {
      name: '涮羊肉の店', emoji: '🍲', where: '右側の<b>涮羊肉</b>（銅の鍋）のお店',
      who: { name: '涮羊肉のおばさん', emoji: '👩‍🍳' },
      script: [
        { type: 'hamster', text: '銅の鍋の<b>涮羊肉</b>！<br>メニューを見て、食べたいものを選ぼう' },
        { type: 'say', zh: '欢迎光临！', py: 'Huānyíng guānglín!', ja: 'いらっしゃいませ！', hamster: 'メニューをもらおう', options: ['caidan', 'maidan', 'cesuo'], answer: 0 },
        { type: 'menu', title: '涮羊肉 菜单', hamster: '何をしゃぶしゃぶする？',
          items: [
            M('🐑', '羊肉', 'yángròu', '羊肉（1皿）', 40, '四十块', 'sìshí kuài'),
            M('🐄', '牛肉', 'niúròu', '牛肉（1皿）', 45, '四十五块', 'sìshíwǔ kuài'),
            M('🥬', '白菜', 'báicài', '白菜', 8, '八块', 'bā kuài'),
          ] },
        { type: 'say', hamster: 'メニューの<b>{zh}</b>を指さして注文！', options: ['yaozhege', 'buyao', 'zaijian'], answer: 0 },
        { type: 'say', hamster: '値段も聞いてみよう', options: ['duoshao', 'jidian', 'nijiao'], answer: 0 },
        { type: 'understand', zh: '{zh}一盘{priceZh}。', py: '{py} yì pán {pricePy}.', ja: '{ja}は{price}元です。', q: 'いくら？', options: 'price' },
        { type: 'line', zh: '好的，马上来！', py: 'Hǎo de, mǎshàng lái!', ja: 'はい、すぐお持ちします！',
          hamster: 'うすく切った{ja}をさっと鍋にくぐらせて、ごまだれで…はふはふ', next: '🍲 しゃぶしゃぶする' },
        { type: 'say', zh: '好吃吗？', py: 'Hǎochī ma?', ja: 'おいしい？', hamster: '感想を伝えよう', options: ['haochi', 'taigui', 'buyaola'], answer: 0 },
        { type: 'say', hamster: '全部でいくらか聞こう', options: ['yigong', 'jidian', 'nijiao'], answer: 0 },
        { type: 'understand', zh: '一共{priceZh}。', py: 'Yígòng {pricePy}.', ja: '全部で{price}元です。', q: '全部でいくら？', options: 'price' },
        { type: 'line', zh: '欢迎下次再来！', py: 'Huānyíng xià cì zài lái!', ja: 'またどうぞ！', hamster: 'ごちそうさまでした〜' },
      ],
      used: (v) => [[v.zh, v.py, v.ja], ['我要这个', 'Wǒ yào zhège', 'これください'], ['一共多少钱？', 'Yígòng duōshao qián?', '全部でいくら？']],
      done: '涮羊肉、ごちそうさま！',
    },
    zhajiang: {
      name: '炸酱面の店', emoji: '🍜', where: '右側の<b>炸酱面</b>のお店',
      who: { name: '麺屋のお兄さん', emoji: '🧑‍🍳' },
      script: [
        { type: 'hamster', text: '北京の家庭の味、<b>炸酱面</b>（ジャージャー麺）のお店！' },
        { type: 'line', zh: '您好！想吃什么？看看菜单吧。', py: 'Nín hǎo! Xiǎng chī shénme? Kànkan càidān ba.', ja: 'いらっしゃい！何にする？メニューを見てね。' },
        { type: 'menu', title: '老北京 菜单', hamster: '何を食べる？',
          items: [
            M('🍜', '炸酱面', 'zhájiàngmiàn', 'ジャージャー麺', 18, '十八块', 'shíbā kuài'),
            M('🥟', '饺子', 'jiǎozi', '水餃子', 20, '二十块', 'èrshí kuài'),
            M('🥛', '豆汁', 'dòuzhī', '豆汁（北京名物の飲みもの）', 3, '三块', 'sān kuài'),
          ] },
        { type: 'say', hamster: '<b>{zh}</b>を指さして「これください」', options: ['yaozhege', 'maidan', 'buyao'], answer: 0 },
        { type: 'understand', zh: '要辣的吗？', py: 'Yào là de ma?', ja: '辛いのにしますか？',
          q: '何を聞かれた？', options: ['辛くするか', '大盛りにするか', '持ち帰りか'], answer: 0, hint: '「辣（là）」＝辛い' },
        { type: 'say', hamster: '辛くしないでもらおう', options: ['buyaola', 'haochi', 'maidan'], answer: 0 },
        { type: 'say', hamster: '値段を聞こう', options: ['duoshao', 'cesuo', 'wei'], answer: 0 },
        { type: 'understand', zh: '{zh}，{priceZh}。', py: '{py}, {pricePy}.', ja: '{ja}は{price}元。', q: 'いくら？', options: 'price' },
        { type: 'line', zh: '来了！慢慢吃！', py: 'Lái le! Mànmàn chī!', ja: 'はいどうぞ！ごゆっくり！', hamster: '{ja}、いただきます！', next: '🥢 食べる' },
        { type: 'say', hamster: 'ひとくち…！感想は？', options: ['haochi', 'taigui', 'buyao'], answer: 0 },
        { type: 'say', hamster: 'お会計をお願いしよう', options: ['maidan', 'caidan', 'qu'], answer: 0 },
        { type: 'say', hamster: 'お店を出るとき、お礼を言おう', options: ['xiexie', 'duibuqi', 'nihao'], answer: 0 },
      ],
      used: (v) => [[v.zh, v.py, v.ja], ['不要辣', 'Bú yào là', '辛くしないで'], [v.priceZh, v.pricePy, `${v.price}元`]],
      done: '老北京の味、完食！',
    },
    duck: {
      name: '北京ダックの店', emoji: '🦆', where: '通りのいちばん奥、右の<b>北京烤鸭</b>のお店',
      who: { name: '北京ダックの料理人', emoji: '🧑‍🍳' },
      script: [
        { type: 'understand', zh: '欢迎光临！几位？', py: 'Huānyíng guānglín! Jǐ wèi?', ja: 'いらっしゃいませ！何名様ですか？',
          q: '何を聞かれた？', options: ['何人か', '何を食べるか', 'どこから来たか'], answer: 0, hint: '「几（jǐ）」＝いくつ、「位（wèi）」＝人をていねいに数える言葉' },
        { type: 'say', hamster: '「1人です」と答えよう', options: [{ zh: '一位。', py: 'Yí wèi.', ja: '1人です' }, { zh: '三位。', py: 'Sān wèi.', ja: '3人です' }, 'buyao'], answer: 0 },
        { type: 'say', hamster: 'メニューをもらおう', options: ['caidan', 'maidan', 'dache'], answer: 0 },
        { type: 'menu', title: '北京烤鸭 菜单', hamster: '北京ダックはもちろん…ほかにも気になる？',
          items: [
            M('🦆', '烤鸭', 'kǎoyā', '北京ダック（1人前）', 98, '九十八块', 'jiǔshíbā kuài'),
            M('🍲', '鸭汤', 'yātāng', 'アヒルのスープ', 15, '十五块', 'shíwǔ kuài'),
            M('🥒', '拍黄瓜', 'pāi huángguā', 'たたききゅうり', 12, '十二块', 'shí’èr kuài'),
          ] },
        { type: 'say', hamster: '<b>{zh}</b>を指さして注文！', options: ['yaozhege', 'xiexie', 'tingbudong'], answer: 0 },
        { type: 'say', hamster: '値段を聞こう', options: ['duoshao', 'jidian', 'yuanma'], answer: 0 },
        { type: 'understand', zh: '{zh}，{priceZh}。', py: '{py}, {pricePy}.', ja: '{ja}は{price}元です。', q: 'いくら？', options: 'price' },
        { type: 'line', zh: '请慢用！', py: 'Qǐng màn yòng!', ja: 'どうぞごゆっくり！',
          hamster: '料理人さんが目の前で切ってくれる！パリパリ…', next: '🦆 食べる' },
        { type: 'say', hamster: '感想を伝えよう', options: ['haochi', 'taigui', 'buyaola'], answer: 0 },
        { type: 'say', hamster: 'お会計をお願いしよう', options: ['maidan', 'caidan', 'qu'], answer: 0 },
        { type: 'line', zh: '谢谢光临！', py: 'Xièxie guānglín!', ja: 'ありがとうございました！' },
      ],
      used: (v) => [[v.zh, v.py, v.ja], ['我要这个', 'Wǒ yào zhège', 'これください'], ['买单', 'Mǎidān', 'お会計お願いします']],
      done: '北京ダックの店、ごちそうさま！',
    },
    // お土産：値段交渉（太贵了 → 便宜一点）
    souvenir: {
      name: 'お土産の店', emoji: '🎁', where: '入口すぐ左の<b>纪念品</b>（お土産）の店', extra: true,
      who: { name: 'お土産屋のお兄さん', emoji: '🎁' },
      script: [
        { type: 'say', zh: '你好！看看吧！', py: 'Nǐ hǎo! Kànkan ba!', ja: 'いらっしゃい！見ていって！', hamster: 'あいさつしよう', options: ['nihao', 'zaijian', 'maidan'], answer: 0 },
        { type: 'menu', title: '纪念品（お土産）', hamster: 'どれにする？',
          items: [
            Object.assign(M('🐼', '熊猫玩偶', 'xióngmāo wán’ǒu', 'パンダのぬいぐるみ', 80, '八十块', 'bāshí kuài'), { sale: 60, saleZh: '六十块', salePy: 'liùshí kuài' }),
            Object.assign(M('🪭', '扇子', 'shànzi', '扇子', 30, '三十块', 'sānshí kuài'), { sale: 20, saleZh: '二十块', salePy: 'èrshí kuài' }),
            Object.assign(M('🎭', '京剧面具', 'jīngjù miànjù', '京劇のお面', 50, '五十块', 'wǔshí kuài'), { sale: 40, saleZh: '四十块', salePy: 'sìshí kuài' }),
          ] },
        { type: 'say', hamster: '値段を聞こう', options: ['duoshao', 'cesuo', 'jidian'], answer: 0 },
        { type: 'understand', zh: '{zh}，{priceZh}。', py: '{py}, {pricePy}.', ja: '{ja}は{price}元だよ。', q: 'いくら？', options: 'price' },
        { type: 'say', hamster: 'ちょっと高い…？ 値切ってみよう！', options: ['taigui', 'haochi', 'shide'], answer: 0 },
        { type: 'say', hamster: '「少し安くして」とお願い！', options: ['pianyi', 'buyaola', 'manyidian'], answer: 0 },
        { type: 'understand', zh: '好吧好吧，{saleZh}！', py: 'Hǎo ba hǎo ba, {salePy}!', ja: 'しょうがないなあ、{sale}元！', q: 'いくらになった？', options: 'sale' },
        { type: 'say', hamster: 'お金をわたそう', options: ['geini', 'buyao', 'zaijian'], answer: 0 },
        { type: 'line', zh: '谢谢！欢迎再来！', py: 'Xièxie! Huānyíng zài lái!', ja: 'ありがとう！また来てね！', hamster: '値切れた！やったね🎉' },
      ],
      used: (v) => [['太贵了！', 'Tài guì le!', '高すぎる！'], ['便宜一点吧', 'Piányi yìdiǎn ba', '少し安くして'], [v.saleZh, v.salePy, `${v.sale}元`]],
      done: '{ja}をゲット！',
    },
    tanghulu: {
      name: '糖葫芦の屋台', emoji: '🍡', where: '左の<b>糖葫芦</b>の屋台', extra: true,
      who: { name: '糖葫芦のおばさん', emoji: '🍡' },
      script: [
        { type: 'line', zh: '糖葫芦！又酸又甜！', py: 'Tánghúlu! Yòu suān yòu tián!', ja: '糖葫芦！甘酸っぱいよ！', hamster: '果物のあめがけ！1本買ってみよう' },
        { type: 'say', hamster: '値段を聞こう', options: ['duoshao', 'zainali', 'wei'], answer: 0 },
        { type: 'understand', zh: '三块一串。', py: 'Sān kuài yí chuàn.', ja: '1本3元だよ。', q: '1本いくら？', options: ['3元', '13元', '30元'], answer: 0 },
        { type: 'say', hamster: '「これください」', options: ['yaozhege', 'taigui', 'buyao'], answer: 0 },
        { type: 'say', hamster: 'お金をわたそう', options: ['geini', 'xiexie', 'maidan'], answer: 0 },
        { type: 'say', hamster: 'パリッ…あまずっぱい！感想は？', options: ['haochi', 'tingbudong', 'taigui'], answer: 0 },
      ],
      used: () => [['糖葫芦', 'tánghúlu', '糖葫芦（果物のあめがけ）'], ['三块', 'sān kuài', '3元'], ['给你', 'gěi nǐ', 'はい、どうぞ']],
      done: '糖葫芦をゲット！',
    },
  };
  const MEALS = ['xlb', 'shuan', 'zhajiang', 'duck'];
  const fillText = (str, v) => String(str).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? v[k] : m));

  const done = (ctx, id) => !!ctx.saved.dishes[id];
  function finishDish(ctx, id) {
    const first = !done(ctx, id);
    ctx.saved.dishes[id] = true;
    if (!SHOPS[id].extra) App.Trip.clear('market');
    const next = MEALS.find((k) => !done(ctx, k));
    if (ctx.game.focus === id) ctx.game.focus = null;
    ctx.save();
    return { first, next };
  }
  const mealCount = (ctx) => MEALS.filter((k) => done(ctx, k)).length;
  const nextHint = (next, ctx) => (next
    ? `ごはん ${mealCount(ctx)}/4。次は <b>${SHOPS[next].emoji} ${SHOPS[next].name}</b> はどう？<br><small>${SHOPS[next].where}</small>`
    : '4 つのお店ぜんぶ制覇！北京グルメ、おいしかった〜🎉');

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
      const r = finishDish(ctx, 'xlb');
      ctx.successCard({
        emoji: '🥟',
        title: '小籠包ゲット！',
        sub: '小籠包の屋台 クリア',
        exp: first ? PICKUP_EXP : 0,
        body: App.Fields3D.usedList([
          ['三号', 'sān hào', '3番'],
          ['小心烫', 'xiǎoxīn tàng', '熱いから気をつけて'],
          ['谢谢', 'xièxie', 'ありがとう'],
        ]) + ctx.hamsterLine(`あつあつ…はふはふ…おいしい〜！🥟<br>${nextHint(r.next, ctx)}`, 'happy'),
        buttons: [
          { label: '🧭 商店街を見てまわる' },
          { label: '🗺️ 旅のマップへ戻る', primary: false, onClick: () => App.go('map') },
        ],
      });
    });
  }

  function visit(ctx, id) {
    const shop = SHOPS[id];
    ctx.runTalk(shop.who, shop.script, (v) => {
      const r = finishDish(ctx, id);
      if (r.first) ctx.reward(DISH_EXP);
      const menu = shop.script.find((s) => s.type === 'menu');
      const item = v || (menu ? menu.items[0] : {});
      ctx.successCard({
        emoji: item.emoji || shop.emoji,
        title: fillText(shop.done, item),
        sub: `${shop.name}`,
        exp: r.first ? DISH_EXP : 0,
        body: App.Fields3D.usedList(shop.used(item)) + ctx.hamsterLine(shop.extra ? 'いい買い物だったね！🎉' : nextHint(r.next, ctx), 'happy'),
        buttons: [
          { label: '🧭 商店街を見てまわる' },
          { label: '🗺️ 旅のマップへ戻る', primary: false, onClick: () => App.go('map') },
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
    loading: '🏮 北京の商店街へ移動中…',
    helpText: 'ここは北京・<b>王府井の商店街</b>だよ🏮<br>北京ダック・涮羊肉・炸酱面・小籠包…<br>好きなお店に入って、<b>メニューを見て注文</b>してみよう！<br>お土産屋さんでは<b>値切り</b>もできるよ',
    build(THREE, scene) {
      const w = App.World3D.buildStall(THREE, scene);
      const base = w.update;
      let init = false;
      w.update = (dt, t, ctx) => {
        if (!init) {
          init = true;
          // 以前のセーブ（小籠包だけの版）から移行
          if (!ctx.saved.dishes) ctx.saved.dishes = { xlb: !!ctx.saved.done };
          if (ctx.saved.done) ctx.saved.dishes.xlb = true;
        }
        if (base) base(dt, t, ctx);
        tickCalls(dt, ctx);
      };
      return w;
    },

    guide(ctx) {
      const g = ctx.game;
      if (g.phase === 'wait') {
        return { goal: '⏳ 小籠包の番号を待とう（あなたは三号）', say: '<b>三号</b>（sān hào）が呼ばれるまで、<br>ほかのお店も見てまわろう' };
      }
      if (g.phase === 'pickup') {
        return ctx.near === 'pickup'
          ? { goal: '🎯 取餐（受け取り口）で受け取ろう', say: '店員さんに<b>話しかけて</b>受け取ろう！' }
          : { goal: '🎯 取餐（受け取り口）へ行こう', say: '呼ばれたのは<b>三号</b>！<br>小笼包の屋台の<b>取餐</b>へ急ごう' };
      }
      const n = ctx.saved.dishes ? mealCount(ctx) : 0;
      const shop = ctx.near && SHOPS[ctx.near === 'order' ? 'xlb' : ctx.near];
      if (shop) return { goal: `🍽️ ごはん ${n}/4・${shop.emoji} ${shop.name}`, say: 'お店の人に<b>話しかけて</b>みよう！' };
      if (n === 0) return { goal: '🎯 好きなお店でごはんを食べよう（ごはん 0/4）', say: '北京ダック・涮羊肉・炸酱面・小籠包…<br>どのお店に入る？看板を見てみよう！' };
      const next = MEALS.find((k) => !ctx.saved.dishes[k]);
      return {
        goal: `🍽️ ごはん ${n}/4・話した人 ${g.talked.size}/${g.totals.people}`,
        say: next ? `次は ${SHOPS[next].where}はどう？<br><small>お土産屋さんで値切りもできるよ</small>` : '北京グルメ制覇！🎉<br>街の人ともおしゃべりしてみよう',
      };
    },

    interactLabel(id, ctx) {
      const p = ctx.game.phase;
      if (id === 'order') return p === 'find' || p === 'done' ? '🥟 小籠包を注文する' : '💬 おばちゃんに話しかける';
      if (id === 'pickup') return p === 'pickup' ? '🥟 小籠包を受け取る' : '💬 取餐の店員さんに話しかける';
      if (id === 'souvenir') return '🎁 お土産を見る';
      if (id === 'tanghulu') return '🍡 糖葫芦を買う';
      if (SHOPS[id]) return `${SHOPS[id].emoji} お店に入る`;
      return null;
    },

    onInteract: {
      order(ctx) {
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
      shuan: (ctx) => visit(ctx, 'shuan'),
      zhajiang: (ctx) => visit(ctx, 'zhajiang'),
      duck: (ctx) => visit(ctx, 'duck'),
      souvenir: (ctx) => visit(ctx, 'souvenir'),
      tanghulu: (ctx) => visit(ctx, 'tanghulu'),
    },
  });
})(window.App = window.App || {});
