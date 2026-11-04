/* 3D 少林寺・武術大会（特別な旅先・高難度）
 * 境内を歩いて、お坊さんや観光客と話す → 擂台の受付で大会に参加 → 2 人の達人と連戦。
 *   ボス A 林小飞（Lín Xiǎofēi）  若き少林の武術家。素早く華麗。必殺技「流星連華」
 *   ボス B 沈岳（Shěn Yuè）        孤高の武術家。冷静で誇り高い。必殺技「十重封陣」
 * どちらもこのゲームのオリジナルキャラクター。バトルは js/ui/battle.js（中国語の掛け声で動く）。
 * 練功場の木人桩で練習試合もできる。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const WIN_A_EXP = 40;
  const WIN_B_EXP = 60;
  const PRACTICE_EXP = 10;

  const REFEREE = { name: '武術大会の受付', emoji: '🏯' };
  const XIAOFEI = { name: '林小飞', emoji: '🔥' };
  const SHENYUE = { name: '沈岳', emoji: '🌑' };

  /* ---------- ボス ---------- */
  const BOSS_A = {
    id: 'a', zh: '林小飞', py: 'Lín Xiǎofēi', name: 'リン・シャオフェイ', title: '疾風の少林拳士',
    color: '#F08A24', color2: '#FFD27A', look: { bald: true, smile: true, belt: '#C0392B' },
    hp: 100, time: 2400, dmg: 13, dodges: 2, bgm: 'bossA',
    special: {
      zh: '流星连华', py: 'liúxīng liánhuá', name: '流星連華', style: 'star', hits: 5, speed: 0.62, dmg: 10,
      call: { zh: '看好了——流星连华！', py: 'Kàn hǎo le — liúxīng liánhuá!', ja: 'よく見てろ——流星連華！' },
      after: { zh: '什么？！全都躲开了？！', py: 'Shénme?! Quán dōu duǒ kāi le?!', ja: 'なに！？全部よけただと！？' },
    },
    lines: {
      intro: { zh: '我是林小飞！我的速度，你跟得上吗？', py: 'Wǒ shì Lín Xiǎofēi! Wǒ de sùdù, nǐ gēn de shàng ma?', ja: '俺は林小飞！俺のスピードについてこられるか？' },
      win: { zh: '太慢了！再来吧！', py: 'Tài màn le! Zài lái ba!', ja: '遅い遅い！また来いよ！' },
      lose: { zh: '好厉害……你是我见过最快的人！', py: 'Hǎo lìhai…… nǐ shì wǒ jiàn guo zuì kuài de rén!', ja: 'すげえ……お前は今まで見た中でいちばん速いやつだ！' },
    },
  };
  const BOSS_B = {
    id: 'b', zh: '沈岳', py: 'Shěn Yuè', name: 'シェン・ユエ', title: '孤高の武術家',
    color: '#2F3A4A', color2: '#9AA5B1', look: { hair: '#1E1A18', tail: true, scar: true },
    hp: 130, time: 2200, dmg: 16, dodges: 3, bgm: 'bossB',
    special: {
      zh: '十重封阵', py: 'shí chóng fēng zhèn', name: '十重封陣', style: 'seal', hits: 8, speed: 0.55, dmg: 9,
      call: { zh: '十重封阵。逃不掉的。', py: 'Shí chóng fēng zhèn. Táo bu diào de.', ja: '十重封陣。逃れることはできない。' },
      after: { zh: '……封阵，被破了。', py: '…… Fēng zhèn, bèi pò le.', ja: '……封陣が、破られた。' },
    },
    lines: {
      intro: { zh: '……来吧。让我看看你的武德。', py: '…… Lái ba. Ràng wǒ kànkan nǐ de wǔdé.', ja: '……来い。お前の武徳を見せてもらおう。' },
      win: { zh: '心不静，拳不稳。', py: 'Xīn bú jìng, quán bù wěn.', ja: '心が静かでなければ、拳は定まらない。' },
      lose: { zh: '……好。你的心，很静。', py: '…… Hǎo. Nǐ de xīn, hěn jìng.', ja: '……見事だ。お前の心は、静かだ。' },
    },
  };
  const DUMMY = {
    id: 'dummy', zh: '木人桩', py: 'mùrénzhuāng', name: '練習用の木人形', title: '練功場の練習相手',
    color: '#8A5A3C', color2: '#C9A06A', look: { bald: true, skin: '#B07A4E' },
    hp: 52, time: 4800, dmg: 6, dodges: 1, bgm: 'practice',
    lines: {
      intro: { zh: '（木人桩是练习用的。）', py: '(Mùrénzhuāng shì liànxí yòng de.)', ja: '（木人桩は練習用の人形です）' },
      win: { zh: '（再练习一下吧！）', py: '(Zài liànxí yíxià ba!)', ja: '（もう少し練習しよう！）' },
      lose: { zh: '（练习完成！）', py: '(Liànxí wánchéng!)', ja: '（練習完了！）' },
    },
  };

  const ENTRY_SCRIPT = [
    { type: 'hamster', text: '<b>武術大会</b>の受付だ！<br>高難度の大会…参加してみる？' },
    { type: 'say', zh: '阿弥陀佛。施主，你也想参加比赛吗？', py: 'Ēmítuófó. Shīzhǔ, nǐ yě xiǎng cānjiā bǐsài ma?', ja: '阿弥陀仏。あなたも大会に参加したいのですか？',
      hamster: '「はい、参加したいです！」', options: [{ zh: '是的，我想参加！', py: 'Shì de, wǒ xiǎng cānjiā!', ja: 'はい、参加したいです！' }, 'buyao', 'tingbudong'], answer: 0 },
    { type: 'understand', zh: '比赛有两场。第一场的对手是林小飞。', py: 'Bǐsài yǒu liǎng chǎng. Dì-yī chǎng de duìshǒu shì Lín Xiǎofēi.', ja: '試合は 2 つあります。最初の相手は林小飞です。',
      q: '最初の相手は？', options: ['林小飞', '沈岳', '木人桩'], answer: 0 },
    { type: 'line', zh: '听口令：跳、蹲、左、右！然后听师父的：拳、腿、掌！', py: 'Tīng kǒulìng: tiào, dūn, zuǒ, yòu! Ránhòu tīng shīfu de: quán, tuǐ, zhǎng!', ja: '掛け声を聞くこと：跳・蹲・左・右！それから師父の声：拳・腿・掌！',
      hamster: '掛け声どおりにボタンを押してよけて、<br>師父の声どおりの技で反撃するんだ！' },
    { type: 'say', hamster: '準備OK？', options: ['meiwenti', 'tingbudong', 'buyao'], answer: 0 },
  ];
  const INTERLUDE = [
    { type: 'line', who: SHENYUE, zh: '……小飞输了？', py: '…… Xiǎofēi shū le?', ja: '……小飞が負けた？', hamster: 'もう一人の達人…<b>沈岳</b>が舞台に上がってきた！' },
    { type: 'line', who: XIAOFEI, zh: '沈岳大哥，这个人很强！小心！', py: 'Shěn Yuè dàgē, zhège rén hěn qiáng! Xiǎoxīn!', ja: '沈岳の兄貴、こいつは強いぜ！気をつけて！' },
    { type: 'say', hamster: '武術のあいさつ「抱拳礼」で礼をしよう', options: ['baoquan', 'haochi', 'maidan'], answer: 0 },
  ];

  App.screens.shaolin3d = (root) => App.World3D.mount(root, {
    id: 'shaolin',
    loading: '🚄 高速鉄道で河南省・嵩山へ…',
    helpText: 'ここは河南省・嵩山の<b>少林寺</b>！🥋<br>お坊さんには「<b>阿弥陀佛</b>」とあいさつ。<br>奥の<b>擂台</b>で武術大会に挑戦できるよ（高難度）',
    build: (THREE, scene) => App.World3D.buildShaolin(THREE, scene),

    guide(ctx) {
      const s = ctx.saved;
      const talked = `話した人 ${ctx.game.talked.size}/${ctx.game.totals.people}`;
      if (s.done) return { goal: `🏆 武術大会 優勝！・${talked}`, say: '少林寺を見てまわろう。2 人の達人とも話せるよ' };
      if (ctx.near === 'arena') return { goal: '🎯 受付に話しかけて大会に参加', say: '準備ができたら参加しよう！<br><small>練功場の木人桩で練習もできるよ</small>' };
      if (s.beatA) return { goal: '🎯 擂台で沈岳と勝負（第二試合）', say: '林小飞には勝った！<br>次は孤高の武術家、<b>沈岳</b>…' };
      return { goal: `🎯 奥の擂台で武術大会に挑戦（高難度）・${talked}`, say: 'まずはお寺の人と話したり、<br>左の<b>練功場</b>で練習したりしよう' };
    },

    interactLabel(id, ctx) {
      if (id === 'arena') return ctx.saved.done ? '🏆 受付に話しかける' : '⚔️ 武術大会に参加する';
      if (id === 'dummy') return '🥋 木人桩で練習する';
      if (id === 'bossA') return '💬 🔥 林小飞に話しかける';
      if (id === 'bossB') return '💬 🌑 沈岳に話しかける';
      return null;
    },

    onInteract: {
      arena(ctx) {
        if (ctx.saved.done) {
          App.Speech.speak('恭喜你！你是冠军！');
          ctx.toast('🏯 恭喜你！你是冠军！<br><small>Gōngxǐ nǐ! Nǐ shì guànjūn!（おめでとう！優勝だ！）</small>');
          return;
        }
        if (ctx.saved.beatA) { fight(ctx, BOSS_B); return; }
        ctx.runTalk(REFEREE, ENTRY_SCRIPT, () => { ctx.closeTalk(); fight(ctx, BOSS_A); });
      },
      dummy(ctx) { fight(ctx, DUMMY, { hint: true }); },
      bossA(ctx) {
        ctx.runTalk(XIAOFEI, ctx.saved.beatA ? [
          { type: 'line', zh: '下次我一定赢你！', py: 'Xià cì wǒ yídìng yíng nǐ!', ja: '次は絶対勝つからな！', hamster: 'くやしそう…でも楽しそう！' },
        ] : [
          { type: 'line', zh: '我叫林小飞，十八岁！我的拳，比风还快！', py: 'Wǒ jiào Lín Xiǎofēi, shíbā suì! Wǒ de quán, bǐ fēng hái kuài!', ja: '俺は林小飞、18 歳！俺の拳は風より速い！' },
          { type: 'understand', zh: '你会功夫吗？', py: 'Nǐ huì gōngfu ma?', ja: 'お前、カンフーできるのか？',
            q: '何を聞かれた？', options: ['カンフーができるか', '何歳か', 'どこから来たか'], answer: 0, hint: '「功夫（gōngfu）」＝カンフー' },
          { type: 'say', hamster: '強気に「問題ない！」', options: ['meiwenti', 'duibuqi', 'haolei'], answer: 0 },
          { type: 'line', zh: '哈哈！擂台上见！', py: 'Hāha! Lèitái shàng jiàn!', ja: 'ははっ！舞台で会おうぜ！' },
        ], () => ctx.closeTalk());
      },
      bossB(ctx) {
        ctx.runTalk(SHENYUE, ctx.saved.done ? [
          { type: 'line', zh: '……你的心，很静。继续修行吧。', py: '…… Nǐ de xīn, hěn jìng. Jìxù xiūxíng ba.', ja: '……お前の心は静かだ。修行を続けるといい。' },
        ] : [
          { type: 'line', zh: '…………', py: '……', ja: '…………', hamster: '腕を組んで、目を閉じている…' },
          { type: 'say', hamster: 'ていねいにあいさつしてみよう', options: ['ninhao', 'wei', 'maidan'], answer: 0 },
          { type: 'understand', zh: '武术不是为了赢，是为了修心。', py: 'Wǔshù bú shì wèile yíng, shì wèile xiū xīn.', ja: '武術は勝つためではない。心を修めるためだ。',
            q: '沈岳にとって武術とは？', options: ['心を修めるもの', '勝つためのもの', 'お金をかせぐもの'], answer: 0, hint: '「修心」＝心を修める' },
        ], () => ctx.closeTalk());
      },
    },
  });

  /* ---------- 試合 ---------- */
  function fight(ctx, boss, { hint = false } = {}) {
    ctx.setBusy(true);
    ctx.el.interact.hidden = true;
    App.Battle.start(ctx.el.wrap, {
      boss,
      hint,
      onQuit: () => ctx.setBusy(false),
      onWin: () => {
        if (boss === DUMMY) {
          const first = !ctx.saved.practiced;
          if (first) { ctx.saved.practiced = true; ctx.reward(PRACTICE_EXP); }
          ctx.setBusy(false);
          ctx.hamsterSay(`練習完了！${first ? `（+${PRACTICE_EXP} EXP）` : ''}<br>本番は<b>奥の擂台</b>で！`, 6);
          return;
        }
        if (boss === BOSS_A) {
          const first = !ctx.saved.beatA;
          if (first) { ctx.saved.beatA = true; ctx.reward(WIN_A_EXP); }
          ctx.save();
          // 連戦：沈岳が登場
          ctx.runTalk(SHENYUE, INTERLUDE, () => { ctx.closeTalk(); fight(ctx, BOSS_B); });
          return;
        }
        const first = !ctx.saved.done;
        if (first) { ctx.saved.done = true; ctx.reward(WIN_B_EXP); }
        App.Trip.clear('shaolin');
        ctx.successCard({
          emoji: '🏆',
          title: '少林武術大会 優勝！',
          sub: '2 人の達人に連勝！',
          exp: first ? WIN_A_EXP + WIN_B_EXP : 0,
          body: `<div class="bt-trophy">${App.BattleArt(BOSS_A)}${App.BattleArt(BOSS_B)}</div>`
            + App.Fields3D.usedList([
              ['跳・蹲・左・右', 'tiào・dūn・zuǒ・yòu', 'ジャンプ・しゃがむ・左・右'],
              ['拳・腿・掌', 'quán・tuǐ・zhǎng', 'パンチ・キック・掌打'],
              ['抱拳礼', 'bàoquán lǐ', '武術のあいさつ'],
            ])
            + ctx.hamsterLine('やったー！！林小飞にも沈岳にも勝っちゃった！<br>称号「<b>少林の好敵手</b>」ゲット🥋', 'happy'),
          buttons: [
            { label: '🧭 少林寺を見てまわる' },
            { label: '🗺️ 旅のマップへ戻る', primary: false, onClick: () => App.go('map') },
          ],
        });
      },
    });
  }
})(window.App = window.App || {});
