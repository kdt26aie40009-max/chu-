/* 3D 天安門広場〜故宮（旅のステージ 4・5。1 つのつながったフィールド）
 *   ステージ 4 天安門広場：案内人さんと話して記念写真 → 天安門の扉が開く
 *   ステージ 5 故宮：售票处で入場券（六十块）→ 检票口 → 太和殿の前でガイドさんの説明
 * マップから area: 'square'（広場の南から）/ 'palace'（天安門をくぐった先から）で入る。
 * レイアウトと人の会話は js/world3d/capital.js、共通の動きは js/world3d/engine.js。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const PHOTO_EXP = 15;
  const TICKET_EXP = 10;
  const HALL_EXP = 20;

  const GUIDE = { name: '広場の案内人さん', emoji: '🚩' };
  const SELLER = { name: '售票处の係員', emoji: '🎫' };
  const PGUIDE = { name: '故宮のガイドさん', emoji: '🧑‍🏫' };

  const PHOTO_SCRIPT = [
    { type: 'hamster', text: '旗を持った<b>案内人さん</b>だ！話しかけてみよう' },
    { type: 'say', zh: '你好！欢迎来到天安门广场！', py: 'Nǐ hǎo! Huānyíng lái dào Tiān’ānmén Guǎngchǎng!', ja: 'こんにちは！天安門広場へようこそ！',
      hamster: 'あいさつを返そう', options: ['nihao', 'zaijian', 'maidan'], answer: 0 },
    { type: 'understand', zh: '这里是北京的中心。', py: 'Zhèlǐ shì Běijīng de zhōngxīn.', ja: 'ここは北京の中心です。',
      q: 'ここはどんな場所？', options: ['北京の中心', '北京の空港', '北京の駅'], answer: 0, hint: '「中心（zhōngxīn）」は日本語と同じ！' },
    { type: 'say', hamster: '写真を撮ってもらえるか聞いてみよう', options: ['bangwo', 'paizhao', 'cesuo'], answer: 0 },
    { type: 'understand', zh: '当然可以！站在金水桥前面吧。', py: 'Dāngrán kěyǐ! Zhàn zài Jīnshuǐ Qiáo qiánmiàn ba.', ja: 'もちろん！金水橋の前に立ってね。',
      q: 'どこに立つ？', options: ['金水橋の前', '記念碑の上', '天安門の中'], answer: 0, hint: '「前面（qiánmiàn）」＝前' },
    { type: 'line', zh: '好，看这里！一、二、三，茄子！', py: 'Hǎo, kàn zhèlǐ! Yī, èr, sān, qiézi!', ja: 'はい、こっち見て！いち、に、さん、チーズ！', next: '📸 撮ってもらう' },
    { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', 'duibuqi', 'wei'], answer: 0 },
  ];

  const TICKET_SCRIPT = [
    { type: 'say', zh: '您好！', py: 'Nín hǎo!', ja: 'こんにちは！', hamster: 'あいさつしよう', options: ['nihao', 'zaijian', 'jiayou'], answer: 0 },
    { type: 'say', hamster: '入場券を1枚ください', options: ['yizhangpiao', 'yifen', 'yiwan'], answer: 0 },
    { type: 'understand', zh: '六十块。请出示护照。', py: 'Liùshí kuài. Qǐng chūshì hùzhào.', ja: '60元です。パスポートを見せてください。',
      q: 'いくら？', options: ['60元', '16元', '6元'], answer: 0, hint: '六（6）×十（10）＝六十' },
    { type: 'say', hamster: 'パスポートを渡そう', options: ['huzhao', 'xingli', 'dengjipai'], answer: 0 },
    { type: 'line', zh: '这是您的门票。请往前走。', py: 'Zhè shì nín de ménpiào. Qǐng wǎng qián zǒu.', ja: 'こちらが入場券です。どうぞ前へお進みください。', hamster: '入場券（门票）ゲット！🎫' },
    { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', 'meiwenti', 'shoudao'], answer: 0 },
  ];

  const HALL_SCRIPT = [
    { type: 'hamster', text: '大きい…！ここが<b>太和殿</b>だ。ガイドさんが説明してくれるみたい' },
    { type: 'line', zh: '这就是太和殿，故宫最大的宫殿。', py: 'Zhè jiù shì Tàihé Diàn, Gùgōng zuì dà de gōngdiàn.', ja: 'これが太和殿、故宮でいちばん大きな宮殿です。' },
    { type: 'understand', zh: '以前，皇帝在这里举行大典。', py: 'Yǐqián, huángdì zài zhèlǐ jǔxíng dàdiǎn.', ja: '昔、皇帝はここで大切な儀式を行いました。',
      q: '太和殿は何をした場所？', options: ['皇帝の大切な儀式', '皇帝の台所', '皇帝の寝室'], answer: 0, hint: '「大典」＝大きな儀式' },
    { type: 'say', hamster: '写真を撮っていいか聞いてみよう', options: ['paizhao', 'bangwo', 'dache'], answer: 0 },
    { type: 'understand', zh: '可以，但是不能用闪光灯。', py: 'Kěyǐ, dànshì bù néng yòng shǎnguāngdēng.', ja: 'いいですよ。でもフラッシュは使えません。',
      q: 'なんて言われた？', options: ['撮っていいけどフラッシュはだめ', '写真は全部だめ', 'フラッシュを使って'], answer: 0, hint: '「但是」＝でも、「不能」＝できない' },
    { type: 'say', hamster: '景色の感想を言おう', options: ['taimei', 'taigui', 'haolei'], answer: 0 },
  ];

  // 写真のフラッシュ演出
  function flash(ctx) {
    const f = document.createElement('div');
    f.className = 'w3d-flash';
    ctx.el.wrap.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }

  function takePhoto(ctx) {
    ctx.runTalk(GUIDE, PHOTO_SCRIPT, () => {
      const first = !ctx.saved.photo;
      if (first) { ctx.saved.photo = true; ctx.reward(PHOTO_EXP); }
      flash(ctx);
      App.Trip.clear('tiananmen');
      ctx.game.flags.photo = true;
      ctx.world.gate.open = true;
      ctx.world.gate.collider.off = true;
      ctx.successCard({
        emoji: '📸',
        title: '天安門で記念写真！',
        sub: '天安門の扉が開いたよ',
        exp: first ? PHOTO_EXP : 0,
        body: `<div class="w3d-photo"><span>🏛️</span><span>🐹🧳</span><small>天安门广场 · ${App.U.todayKey()}</small></div>`
          + App.Fields3D.usedList([
            ['可以帮我拍照吗？', 'Kěyǐ bāng wǒ pāizhào ma?', '写真を撮ってもらえますか？'],
            ['一、二、三，茄子！', 'Yī, èr, sān, qiézi!', 'いち、に、さん、チーズ！'],
          ])
          + ctx.hamsterLine('いい写真！<br>天安門の真ん中の門をくぐると、<b>故宮</b>に行けるよ🏯', 'happy'),
        buttons: [
          { label: '🏯 天安門をくぐって故宮へ', onClick: () => { ctx.closeTalk(); ctx.hamsterSay('金水橋の真ん中を渡って、<b>天安門</b>の中へ！', 6); } },
          { label: '🗺️ 旅のマップへ戻る', primary: false, onClick: () => App.go('map') },
        ],
      });
    });
  }

  function buyTicket(ctx) {
    ctx.runTalk(SELLER, TICKET_SCRIPT, () => {
      const first = !ctx.saved.ticket;
      if (first) { ctx.saved.ticket = true; ctx.reward(TICKET_EXP); }
      ctx.game.flags.ticket = true;
      ctx.world.ticket.open = true;
      ctx.world.ticket.collider.off = true;
      ctx.successCard({
        emoji: '🎫',
        title: '故宮の入場券ゲット！',
        sub: '检票口（入場口）を通れるよ',
        exp: first ? TICKET_EXP : 0,
        body: App.Fields3D.usedList([
          ['我要一张门票', 'Wǒ yào yì zhāng ménpiào', '入場券を1枚ください'],
          ['六十块', 'liùshí kuài', '60元'],
        ]) + ctx.hamsterLine('まっすぐ北へ。いちばん奥の大きな建物が<b>太和殿</b>だよ', 'happy'),
        buttons: [{ label: '🏯 中へ進む', onClick: () => { ctx.closeTalk(); ctx.hamsterSay('<b>检票口</b>を通って、奥の<b>太和殿</b>へ！', 6); } }],
      });
    });
  }

  function hallTour(ctx) {
    if (ctx.game.busy) return;
    ctx.runTalk(PGUIDE, HALL_SCRIPT, () => {
      const first = !ctx.saved.done;
      if (first) { ctx.saved.done = true; ctx.reward(HALL_EXP); }
      App.Trip.clear('gugong');
      ctx.game.flags.hall = true;
      ctx.successCard({
        emoji: '🏯',
        title: '故宮・太和殿に到着！',
        sub: '故宮のステージ クリア',
        exp: first ? HALL_EXP : 0,
        body: App.Fields3D.usedList([
          ['太和殿', 'Tàihé Diàn', '太和殿'],
          ['可以拍照吗？', 'Kěyǐ pāizhào ma?', '写真を撮ってもいいですか？'],
          ['太美了！', 'Tài měi le!', 'きれい！'],
        ]) + ctx.hamsterLine('皇帝になった気分…！<br>次はいよいよ<b>万里の長城</b>だね🧱', 'happy'),
        buttons: [
          { label: '🧭 故宮を見てまわる' },
          { label: '🗺️ 旅のマップへ戻る', primary: false, onClick: () => App.go('map') },
        ],
      });
    });
  }

  App.screens.capital3d = (root, params = {}) => {
    const area = params.area === 'palace' ? 'palace' : 'square';
    App.World3D.mount(root, {
      id: 'capital',
      loading: area === 'palace' ? '🏯 故宮へ移動中…' : '🏛️ 天安門広場へ移動中…',
      helpText: area === 'palace'
        ? 'ここは<b>故宮</b>の入口！🏯<br>左の<b>售票处</b>で入場券を買って、<br>いちばん奥の<b>太和殿</b>を目指そう！'
        : 'ここは<b>天安門広場</b>！🏛️<br>北（前）へ歩いて、<b>案内人さん</b>に話しかけよう。<br>記念写真を撮ると、天安門をくぐれるよ',
      build(THREE, scene) {
        const w = App.World3D.buildCapital(THREE, scene, area);
        const base = w.update;
        let init = false;
        w.update = (dt, t, ctx) => {
          if (!init) {
            init = true;
            // 前に写真を撮っていれば天安門は開いたまま。故宮から入るときも開けておく
            if (ctx.saved.photo || App.Trip.isCleared('tiananmen') || area === 'palace') {
              ctx.game.flags.photo = !!ctx.saved.photo || App.Trip.isCleared('tiananmen');
              w.gate.open = true;
              w.gate.collider.off = true;
            }
            ctx.game.phase = area;
          }
          if (base) base.call(w, dt, t, ctx);
        };
        return w;
      },

      guide(ctx) {
        const f = ctx.game.flags;
        const talked = `話した人 ${ctx.game.talked.size}/${ctx.game.totals.people}`;
        const inPalace = ctx.player.z < -3;
        if (!inPalace) {
          if (!f.photo) {
            return ctx.near === 'guide'
              ? { goal: '🎯 案内人さんに話しかけよう', say: '旗を持った<b>案内人さん</b>だ！' }
              : { goal: '🎯 北へ進んで、案内人さんと記念写真', say: '天安門の前、<b>金水橋</b>のそばに<br>旗を持った案内人さんがいるよ' };
          }
          return { goal: `🏯 天安門をくぐって故宮へ・${talked}`, say: '金水橋の真ん中を渡って、<b>天安門</b>の中へ！' };
        }
        if (!f.ticket && !ctx.saved.ticket) {
          return ctx.near === 'ticket'
            ? { goal: '🎯 入場券を買おう', say: '係員さんに<b>話しかけて</b>みよう' }
            : { goal: '🎯 售票处で入場券を買おう', say: '左の<b>售票处</b>（チケット売り場）で入場券を買おう' };
        }
        if (!f.hall) return { goal: '🎯 いちばん奥の太和殿へ', say: '<b>检票口</b>を通って、まっすぐ北へ！' };
        return { goal: `🎉 故宮クリア！（発見 ${ctx.game.found.size}/${ctx.game.totals.found}・${talked}）`, say: '故宮の中を見てまわろう！' };
      },

      interactLabel(id, ctx) {
        const f = ctx.game.flags;
        if (id === 'guide') return f.photo ? '💬 案内人さんに話しかける' : '📸 案内人さんに話しかける';
        if (id === 'gate') return ctx.world.gate.open ? null : '🚪 天安門の扉を調べる';
        if (id === 'ticket') return f.ticket ? '💬 係員さんに話しかける' : '🎫 入場券を買う';
        if (id === 'check') return ctx.world.ticket.open ? null : '🚧 检票口を調べる';
        if (id === 'palaceGuide') return f.ticket ? '💬 ガイドさんに話しかける' : null;
        return null;
      },

      onInteract: {
        guide(ctx) {
          if (!ctx.game.flags.photo) { takePhoto(ctx); return; }
          App.Speech.speak('故宫就在前面！');
          ctx.toast('🚩 故宫就在前面！<br><small>Gùgōng jiù zài qiánmiàn!（故宮はこの先だよ！）</small>');
        },
        gate(ctx) {
          ctx.hamsterSay('扉が閉まってる…<br>先に<b>案内人さん</b>と記念写真を撮ろう！', 6);
        },
        ticket(ctx) {
          if (!ctx.game.flags.ticket) {
            if (ctx.saved.ticket) {
              // 前に買ったことがあっても、来るたびに入場券は必要
              ctx.hamsterSay('今日の入場券も買おう！', 3);
            }
            buyTicket(ctx);
            return;
          }
          App.Speech.speak('请往前走。');
          ctx.toast('🎫 请往前走。<br><small>Qǐng wǎng qián zǒu.（どうぞ前へ）</small>');
        },
        check(ctx) {
          App.Speech.speak('请出示门票。');
          ctx.hamsterSay('「<b>请出示门票</b>」＝入場券を見せてください。<br>左の<b>售票处</b>で買ってこよう', 6);
        },
        palaceGuide(ctx) { hallTour(ctx); },
      },

      onZone: {
        hall(ctx) { if (ctx.game.flags.ticket && !ctx.game.flags.hall) hallTour(ctx); },
      },
    });
  };
})(window.App = window.App || {});
