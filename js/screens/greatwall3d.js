/* 3D 万里の長城
 * 售票处で入場券を買う（门票・四十块）→ 関門が開く → 城壁を登って、てっぺんの見張り台「好汉坡」へ。
 * 2D コース UNIT 9「旅行会話」の言葉（我要一张门票・太美了・好累啊・不到长城非好汉）を使う。
 * レイアウトと人の会話は js/world3d/greatwall.js、共通の動きは js/world3d/engine.js。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const TICKET_EXP = 10;
  const TOP_EXP = 30;

  const SELLER = { name: 'チケット売り場の人', emoji: '🎫' };
  const CLIMBERS = { name: '登山客のみなさん', emoji: '🧗' };

  const TICKET_SCRIPT = [
    { type: 'hamster', text: '<b>售票处</b>（チケット売り場）だ！<br>入場券を買おう' },
    { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつしよう', options: ['nihao', 'zaijian', 'maidan'], answer: 0 },
    { type: 'say', hamster: '入場券を1枚ください、と言おう', options: ['yizhangpiao', 'yifen', 'shui'], answer: 0 },
    { type: 'understand', zh: '好的，四十块。', py: 'Hǎo de, sìshí kuài.', ja: 'はい、40元です。',
      q: 'いくら？', options: ['40元', '14元', '4元'], answer: 0, hint: '四（4）×十（10）＝四十' },
    { type: 'say', hamster: 'お金を渡そう', options: ['geini', 'buyao', 'taigui'], answer: 0 },
    { type: 'line', zh: '这是您的门票。祝您玩得开心！', py: 'Zhè shì nín de ménpiào. Zhù nín wán de kāixīn!', ja: 'こちらが入場券です。楽しんでください！',
      hamster: '入場券（门票）ゲット！🎫' },
    { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', 'duibuqi', 'nihao'], answer: 0 },
  ];

  const TOP_SCRIPT = [
    { type: 'hamster', text: 'てっぺん…<b>好汉坡</b>に着いた〜！！<br>山の向こうまで長城が続いてる…' },
    { type: 'say', hamster: '景色を見て、ひとこと！', options: ['taimei', 'taigui', 'buyaola'], answer: 0 },
    { type: 'line', who: CLIMBERS, zh: '不到长城非好汉！', py: 'Bú dào Chángchéng fēi hǎohàn!', ja: '長城に登らずして好漢にあらず！',
      hamster: 'まわりのみんなが叫んでる！' },
    { type: 'say', hamster: '一緒に言おう！', options: ['haohan', 'haolei', 'tingbudong'], answer: 0 },
  ];

  function buyTicket(ctx) {
    ctx.runTalk(SELLER, TICKET_SCRIPT, () => {
      const first = !ctx.saved.ticket;
      if (first) {
        ctx.saved.ticket = true;
        ctx.reward(TICKET_EXP);
      }
      const g = ctx.game;
      g.flags.ticket = true;
      g.phase = 'climb';
      const gate = ctx.world.gate;
      gate.open = true;
      gate.collider.off = true;
      ctx.successCard({
        emoji: '🎫',
        title: '入場券ゲット！',
        sub: '関門が開いたよ',
        exp: first ? TICKET_EXP : 0,
        body: App.Fields3D.usedList([
          ['我要一张门票', 'Wǒ yào yì zhāng ménpiào', '入場券を1枚ください'],
          ['四十块', 'sìshí kuài', '40元'],
          ['给你', 'gěi nǐ', 'はい、どうぞ'],
        ]) + ctx.hamsterLine('門をくぐって、いちばん上の見張り台<b>好汉坡</b>を目指そう！<br>途中の人にも話しかけてみてね', 'happy'),
        buttons: [{ label: '🧱 長城を登る', onClick: () => { ctx.closeTalk(); ctx.hamsterSay('いざ、長城へ！<br>奥の階段を登っていこう', 6); } }],
      });
    });
  }

  function reachTop(ctx) {
    ctx.runTalk(CLIMBERS, TOP_SCRIPT, () => {
      const first = !ctx.saved.done;
      if (first) {
        ctx.saved.done = true;
        ctx.reward(TOP_EXP);
      }
      App.Trip.clear('greatwall');
      ctx.game.phase = 'done';
      ctx.successCard({
        emoji: '🏆',
        title: '万里の長城 登頂！',
        sub: 'これであなたも<b>好汉</b>（りっぱな人）！',
        exp: first ? TOP_EXP : 0,
        body: App.Fields3D.usedList([
          ['不到长城非好汉', 'Bú dào Chángchéng fēi hǎohàn', '長城に登らずして好漢にあらず'],
          ['太美了', 'Tài měi le', 'きれい！'],
          ['好累啊', 'Hǎo lèi a', '疲れた〜！'],
        ]) + ctx.hamsterLine('山の向こうまで続く長城…ここまで登ってきたね！<br>北京の旅、ほんとうにおつかれさま🎉', 'happy'),
        buttons: [
          { label: '🧭 景色をながめる' },
          { label: '🗺️ 旅のマップへ戻る', primary: false, onClick: () => App.go('map') },
          { label: '📘 2D で中国語を学ぶ', primary: false, onClick: () => App.go('course') },
        ],
      });
    });
  }

  App.screens.greatwall3d = (root) => App.World3D.mount(root, {
    id: 'greatwall',
    loading: '🧱 万里の長城へ移動中…',
    helpText: 'ここは<b>万里の長城</b>！🧱<br>まずは<b>售票处</b>で入場券を買って、<br>いちばん上の見張り台を目指そう！',
    build: (THREE, scene) => App.World3D.buildGreatWall(THREE, scene),

    guide(ctx) {
      const g = ctx.game;
      const talked = `話した人 ${g.talked.size}/${g.totals.people}`;
      if (g.phase === 'find') {
        return ctx.near === 'ticket'
          ? { goal: '🎯 入場券を買おう', say: '売り場の人に<b>話しかけて</b>みよう！' }
          : { goal: '🎯 售票处（チケット売り場）へ', say: 'まずは左の<b>售票处</b>で入場券（门票）を買おう！' };
      }
      if (g.phase === 'climb') {
        const h = ctx.world.heightAt(ctx.player.x, ctx.player.z);
        const pct = Math.min(100, Math.round((h / 26) * 100));
        return { goal: `🧗 てっぺんを目指そう（高さ ${pct}%）・${talked}`, say: pct > 60 ? 'もう少し…！<b>加油</b>（がんばれ）！' : '城壁の上を、奥へ奥へ登っていこう！' };
      }
      return { goal: `🎉 長城 登頂！（発見 ${g.found.size}/${g.totals.found}・${talked}）`, say: '景色を楽しもう！<br>帰り道の人とも話せるよ' };
    },

    interactLabel(id, ctx) {
      if (id === 'ticket') return ctx.game.flags.ticket ? '💬 売り場の人に話しかける' : '🎫 入場券を買う';
      if (id === 'gate') return ctx.game.flags.ticket ? null : '🚪 門を調べる';
      return null;
    },

    onInteract: {
      ticket(ctx) {
        if (!ctx.game.flags.ticket) { buyTicket(ctx); return; }
        App.Speech.speak('祝您玩得开心！');
        ctx.toast('🎫 祝您玩得开心！<br><small>Zhù nín wán de kāixīn!（楽しんでね！）</small>');
      },
      gate(ctx) {
        App.Speech.speak('请出示门票。');
        ctx.hamsterSay('「<b>请出示门票</b>」＝入場券を見せてください、だって。<br>左の<b>售票处</b>で買ってこよう！', 6);
      },
    },

    onZone: {
      top(ctx) {
        if (!ctx.game.flags.ticket) return;
        reachTop(ctx);
      },
    },
  });
})(window.App = window.App || {});
