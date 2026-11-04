/* 3D ホテル
 * ロビー → フロントでチェックイン → エレベーターで 3 階へ → 302 号室を探して入る。
 * 2D のホテルレッスンと同じ中国語（我想办理入住・这是我的护照・好的）＋ 数字（三楼・三零二）を使う。
 * レイアウトと人の会話は js/world3d/hotel.js、共通の動きは js/world3d/engine.js。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const CHECKIN_EXP = 10;
  const ROOM_EXP = 15;

  const STAFF = { name: 'フロントの王さん', emoji: '🧑‍💼' };
  const LIFT = { name: 'エレベーターの音声', emoji: '🛗' };

  const CHECKIN_SCRIPT = [
    { type: 'hamster', text: 'フロントの<b>王さん</b>だ！<br>チェックインしてみよう' },
    { type: 'say', zh: '您好！欢迎光临。', py: 'Nín hǎo! Huānyíng guānglín.', ja: 'こんにちは！いらっしゃいませ。',
      hamster: 'まずはあいさつ！', options: ['nihao', 'zaijian', 'maidan'], answer: 0 },
    { type: 'say', zh: '请问，有什么可以帮您？', py: 'Qǐngwèn, yǒu shénme kěyǐ bāng nín?', ja: '何かお手伝いしましょうか？',
      hamster: 'チェックインしたいと伝えよう', options: ['ruzhu', 'yaozhege', 'ditie'], answer: 0 },
    { type: 'say', zh: '好的，请出示您的护照。', py: 'Hǎo de, qǐng chūshì nín de hùzhào.', ja: 'かしこまりました。パスポートを見せてください。',
      hamster: 'パスポートを渡そう', options: ['huzhao', 'duoshao', 'cesuo'], answer: 0 },
    { type: 'say', zh: '请在这里签字。', py: 'Qǐng zài zhèlǐ qiānzì.', ja: 'こちらにサインをお願いします。',
      hamster: '「わかりました」と返事しよう', options: ['haode', 'haochi', 'zaijian'], answer: 0 },
    { type: 'understand', zh: '您的房间是三零二。这是您的房卡。', py: 'Nín de fángjiān shì sān líng èr. Zhè shì nín de fángkǎ.',
      ja: 'お部屋は302号室です。こちらがルームキーです。', q: '部屋は何号室？', options: ['302号室', '203号室', '320号室'], answer: 0,
      hint: '三（3）・零（0）・二（2）の順番だよ' },
    { type: 'say', hamster: 'ルームキーをもらった！お礼を言おう', options: ['xiexie', 'nihao', 'haode'], answer: 0 },
  ];

  const UP_SCRIPT = [
    { type: 'hamster', text: '部屋は<b>302号室</b>だったね。<br>3階へ行こう！（「〜階」は <b>楼</b> lóu）' },
    { type: 'say', hamster: '「3階」は中国語で？', answer: 0,
      options: [{ zh: '三楼', py: 'sān lóu', ja: '3階' }, { zh: '二楼', py: 'èr lóu', ja: '2階' }, { zh: '五楼', py: 'wǔ lóu', ja: '5階' }] },
    { type: 'line', who: LIFT, zh: '三楼到了。', py: 'Sān lóu dào le.', ja: '3階に到着しました。', next: '🛗 降りる' },
  ];

  const DOWN_SCRIPT = [
    { type: 'say', hamster: 'ロビー（1階）へ戻る？「1階」は？', answer: 0,
      options: [{ zh: '一楼', py: 'yī lóu', ja: '1階' }, { zh: '三楼', py: 'sān lóu', ja: '3階' }, { zh: '十楼', py: 'shí lóu', ja: '10階' }] },
    { type: 'line', who: LIFT, zh: '一楼到了。', py: 'Yī lóu dào le.', ja: '1階に到着しました。', next: '🛗 降りる' },
  ];

  const DOOR_ZH = { 301: '三零一', 303: '三零三', 304: '三零四', 305: '三零五' };

  function checkin(ctx) {
    ctx.runTalk(STAFF, CHECKIN_SCRIPT, () => {
      const first = !ctx.saved.checkedIn;
      if (first) {
        ctx.saved.checkedIn = true;
        ctx.reward(CHECKIN_EXP);
      }
      ctx.game.flags.checkedIn = true;
      ctx.game.phase = 'toRoom';
      ctx.successCard({
        emoji: '🔑',
        title: 'チェックイン成功！',
        sub: 'ルームキーをもらった（302号室）',
        exp: first ? CHECKIN_EXP : 0,
        body: App.Fields3D.usedList([
          ['我想办理入住', 'Wǒ xiǎng bànlǐ rùzhù', 'チェックインしたいです'],
          ['这是我的护照', 'Zhè shì wǒ de hùzhào', 'これは私のパスポートです'],
          ['好的', 'Hǎo de', 'わかりました'],
        ]) + ctx.hamsterLine('部屋は <b>302号室</b>！<br>左の <b>电梯</b>（エレベーター）で3階へ行こう', 'happy'),
        buttons: [{ label: '🛗 エレベーターへ向かう', onClick: () => { ctx.closeTalk(); ctx.hamsterSay('左の壁の<b>电梯</b>（エレベーター）へ行こう！', 6); } }],
      });
    });
  }

  function arriveRoom(ctx) {
    const first = !ctx.saved.done;
    if (first) {
      ctx.saved.done = true;
      ctx.reward(ROOM_EXP);
    }
    ctx.game.phase = 'done';
    App.Trip.clear('hotel');
    ctx.successCard({
      emoji: '🛏️',
      title: '302号室に到着！',
      sub: 'ホテルのミッション クリア',
      exp: first ? ROOM_EXP : 0,
      body: App.Fields3D.usedList([
        ['三楼', 'sān lóu', '3階'],
        ['三零二', 'sān líng èr', '302'],
      ]) + ctx.hamsterLine('ふかふかのベッドだ〜！<br>今日はよく頑張ったね。ゆっくり休もう🌙', 'happy'),
      buttons: [
        { label: '🧭 部屋を見てまわる' },
        { label: '🗺️ 旅のマップへ戻る', primary: false, onClick: () => App.go('map') },
      ],
    });
  }

  const doorLabel = (ctx) => (ctx.game.flags.checkedIn ? '🚪 部屋番号を確認' : null);
  const wrongDoor = (n) => (ctx) => {
    App.Speech.speak(DOOR_ZH[n]);
    ctx.hamsterSay(`ここは <b>${n}</b>（${DOOR_ZH[n]}）号室。<br>ぼくたちの部屋は <b>302</b> だよ`, 5);
  };

  App.screens.hotel3d = (root) => App.World3D.mount(root, {
    id: 'hotel',
    loading: '🏨 ホテルへ移動中…',
    helpText: 'ホテルに着いたよ！🏨<br>奥の<b>フロント</b>でチェックインして、<b>自分の部屋</b>まで行ってみよう！<br>ロビーの人にも話しかけてみてね',
    build: (THREE, scene) => App.World3D.buildHotel(THREE, scene),

    guide(ctx) {
      const g = ctx.game;
      const talked = `話した人 ${g.talked.size}/${g.totals.people}`;
      if (g.phase === 'find') {
        return ctx.near === 'desk'
          ? { goal: '🎯 フロントでチェックインしよう', say: 'フロントの<b>王さん</b>に話しかけてみよう！' }
          : { goal: '🎯 フロント（前台）を探そう', say: 'まずは奥の<b>フロント（前台）</b>でチェックイン！' };
      }
      if (g.phase === 'toRoom') {
        if (ctx.player.x > 80) {
          return { goal: '🎯 302号室を探そう', say: 'ドアの番号を見て、<b>302</b>号室を探そう！' };
        }
        return { goal: '🎯 エレベーター（电梯）で3階へ', say: '左の壁の<b>电梯</b>（エレベーター）で<b>3階</b>へ！' };
      }
      return { goal: `🎉 ホテル クリア！（発見 ${g.found.size}/${g.totals.found}・${talked}）`, say: 'ホテル探検もしてみよう！<br>ロビーの人とも話せるよ' };
    },

    interactLabel(id, ctx) {
      const f = ctx.game.flags;
      if (id === 'desk') return f.checkedIn ? '💬 王さんに話しかける' : '🛎️ チェックインする';
      if (id === 'elevator') return '🛗 エレベーターに乗る';
      if (id === 'elevator3') return '🛗 1階へ戻る';
      if (id === 'door302') return f.doorOpen ? null : (f.checkedIn ? '🔑 302号室を開ける' : '🚪 部屋番号を確認');
      if (id.startsWith('door')) return doorLabel(ctx) || '🚪 部屋番号を確認';
      return null;
    },

    onInteract: {
      desk(ctx) {
        if (!ctx.game.flags.checkedIn) { checkin(ctx); return; }
        App.Speech.speak('祝您入住愉快！');
        ctx.toast('🧑‍💼 祝您入住愉快！<br><small>Zhù nín rùzhù yúkuài!（ごゆっくりどうぞ！）</small>');
      },
      elevator(ctx) {
        if (!ctx.game.flags.checkedIn) {
          ctx.hamsterSay('先に<b>フロント</b>でチェックインしよう！<br>ルームキーがないと部屋に入れないよ', 5);
          return;
        }
        ctx.runTalk(LIFT, UP_SCRIPT, () => {
          ctx.closeTalk();
          ctx.teleport(ctx.world.places.corridor);
          ctx.hamsterSay('3階に着いた！<br>ドアの番号を見て <b>302</b> を探そう', 6);
        });
      },
      elevator3(ctx) {
        ctx.runTalk(LIFT, DOWN_SCRIPT, () => {
          ctx.closeTalk();
          ctx.teleport(ctx.world.places.lobby);
          ctx.hamsterSay('ロビーに戻ってきたよ！', 4);
        });
      },
      door302(ctx) {
        if (!ctx.game.flags.checkedIn) { ctx.hamsterSay('302号室…でも鍵がないよ', 4); return; }
        const d = ctx.world.door302;
        d.open = true;
        d.collider.off = true;
        ctx.game.flags.doorOpen = true;
        App.Sfx.play('correct');
        App.Speech.speak('三零二');
        ctx.hamsterSay('<b>302</b>（三零二）号室、ここだ！<br>カチャ…開いたよ！入ってみよう', 6);
      },
      door301: wrongDoor(301),
      door303: wrongDoor(303),
      door304: wrongDoor(304),
      door305: wrongDoor(305),
    },

    onZone: {
      room(ctx) { arriveRoom(ctx); },
    },
  });
})(window.App = window.App || {});
