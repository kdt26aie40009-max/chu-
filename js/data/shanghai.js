/* 旅行先：上海
 *
 * spots は上から順に解放される（＝学ぶ順番）。
 * x, y はマップ上の位置（x: 0〜100, y: 0〜125）。
 *
 * intro / scene の書き方:
 *   { who: 'hamster', text: '...', mood: 'happy' }       ハムスターのセリフ
 *   { who: '<npcs のキー>', zh, py, ja }                   NPC のセリフ（自動で読み上げ）
 *   { type: 'say', prompt: '...', answer: '<phraseId>' }   ユーザーが中国語で返す
 *   { type: 'understand', who, zh, py, ja, prompt,
 *     options: ['正解', '不正解', ...], answer: 0, hint }  NPC の言葉を聞き取る
 */
(function (App) {
  'use strict';

  const shanghai = {
    id: 'shanghai',
    name: '上海',
    nameZh: '上海 Shànghǎi',
    spots: [
      /* ================= DAY 1 ================= */
      {
        id: 'airport', name: '空港', emoji: '✈️', day: 1, x: 84, y: 106,
        scene3d: 'airport3d', // マップのアイコンをタップすると 3D 空港へ（下の「行く」ボタンは 2D レッスン）
        theme: 'あいさつ',
        mission: '3つのあいさつで入国しよう！',
        phrases: ['nihao', 'xiexie', 'zaijian'],
        exp: 30,
        npcs: { officer: { name: '入国審査の係員', emoji: '👮' } },
        intro: [
          { who: 'hamster', mood: 'happy', text: '上海の浦東（プードン）空港に着いたよ！✈️' },
          { who: 'hamster', text: 'まずは入国審査。<b>あいさつ</b>ができれば大丈夫！' },
          { who: 'hamster', text: '今日のミッション：<b>3つのあいさつを覚えて入国しよう！</b>' },
        ],
        scene: [
          { who: 'hamster', text: '係員さんの番だ。ドキドキ…' },
          { who: 'officer', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！' },
          { type: 'say', prompt: 'あいさつを返そう！', answer: 'nihao' },
          { who: 'officer', zh: '欢迎来到上海！', py: 'Huānyíng lái dào Shànghǎi!', ja: '上海へようこそ！' },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
          { who: 'officer', zh: '好了，再见！', py: 'Hǎo le, zàijiàn!', ja: 'はい、OKです。さようなら！' },
          { type: 'say', prompt: 'お別れのあいさつをしよう', answer: 'zaijian' },
          { who: 'hamster', mood: 'happy', text: '入国できた！上海の旅、スタートだよ〜！' },
        ],
        clear: { title: '上海に入国！', hamster: '最初の一歩、かんぺき！ホテルへ向かおう🏨' },
      },
      {
        id: 'hotel', name: 'ホテル', emoji: '🏨', day: 1, x: 56, y: 86,
        theme: 'チェックイン',
        mission: 'ホテルにチェックインしよう！',
        phrases: ['ruzhu', 'huzhao', 'haode'],
        exp: 30,
        npcs: { staff: { name: 'フロントの王さん', emoji: '🧑‍💼' } },
        intro: [
          { who: 'hamster', mood: 'happy', text: 'ホテルに着いたよ！大きいね〜🏨' },
          { who: 'hamster', text: 'チェックインに使う中国語を<b>3つ</b>覚えよう。空港で覚えたあいさつも使うよ！' },
        ],
        scene: [
          { who: 'staff', zh: '您好！欢迎光临。', py: 'Nín hǎo! Huānyíng guānglín.', ja: 'こんにちは！いらっしゃいませ。' },
          { type: 'say', prompt: 'まずはあいさつ！', answer: 'nihao' },
          { who: 'staff', zh: '请问，有什么可以帮您？', py: 'Qǐngwèn, yǒu shénme kěyǐ bāng nín?', ja: '何かお手伝いしましょうか？' },
          { type: 'say', prompt: 'チェックインしたいと伝えよう', answer: 'ruzhu' },
          { who: 'staff', zh: '好的，请出示您的护照。', py: 'Hǎo de, qǐng chūshì nín de hùzhào.', ja: 'かしこまりました。パスポートを見せてください。' },
          { type: 'say', prompt: 'パスポートを渡そう', answer: 'huzhao' },
          { who: 'staff', zh: '请在这里签字。', py: 'Qǐng zài zhèlǐ qiānzì.', ja: 'こちらにサインをお願いします。' },
          { type: 'say', prompt: '「わかりました」と返事しよう', answer: 'haode' },
          { who: 'staff', zh: '这是您的房卡。', py: 'Zhè shì nín de fángkǎ.', ja: 'こちらがルームキーです。' },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
        ],
        clear: { title: 'ホテル チェックイン成功！', hamster: 'やったね！荷物を置いたら、ちょっとお腹すいたかも…🥟' },
      },
      {
        id: 'stall', name: '小籠包の屋台', emoji: '🥟', day: 1, x: 24, y: 98,
        theme: '数字 1〜5',
        mission: '数字を聞き取って小籠包を買おう！',
        phrases: ['n1', 'n2', 'n3', 'n4', 'n5'],
        exp: 30,
        npcs: { vendor: { name: '屋台のおばちゃん', emoji: '👩‍🍳' } },
        intro: [
          { who: 'hamster', mood: 'happy', text: 'いいにおい〜！小籠包の屋台だ🥟' },
          { who: 'hamster', text: '値段や番号を聞き取るには<b>数字</b>が必要！まずは 1〜5 を覚えよう。' },
          { who: 'hamster', text: '中国語は音の高さ（<b>声調</b>）が大事。でも今は「なんとなく」でOKだよ！' },
        ],
        scene: [
          { who: 'vendor', zh: '你好！', py: 'Nǐ hǎo!', ja: 'いらっしゃい！' },
          { type: 'say', prompt: 'あいさつしよう', answer: 'nihao' },
          {
            type: 'understand', who: 'vendor',
            zh: '小笼包，一笼五块。', py: 'Xiǎolóngbāo, yì lóng wǔ kuài.', ja: '小籠包、1せいろ5元だよ。',
            prompt: '1せいろ、いくらって言った？', options: ['5元', '3元', '1元'], answer: 0,
            hint: '「五（wǔ）」が聞こえたかな？',
          },
          { who: 'hamster', text: '安い！1つ買おう。お金をわたすよ〜' },
          {
            type: 'understand', who: 'vendor',
            zh: '你是三号。', py: 'Nǐ shì sān hào.', ja: 'あなたは3番ね。',
            prompt: '何番って言われた？', options: ['3番', '4番', '2番'], answer: 0,
            hint: '「三（sān）」は高く平らな音だよ',
          },
          { who: 'vendor', zh: '三号！好了！', py: 'Sān hào! Hǎo le!', ja: '3番さん、できたよ！' },
          { type: 'say', prompt: '受け取ってお礼を言おう', answer: 'xiexie' },
          { who: 'hamster', mood: 'happy', text: 'あつあつ…！おいしい〜！DAY 1 おつかれさま！' },
        ],
        clear: { title: '小籠包ゲット！', hamster: 'DAY 1 クリア！今日はここまででも十分えらいよ🌙' },
      },

      /* ================= DAY 2 ================= */
      {
        id: 'store', name: 'コンビニ', emoji: '🏪', day: 2, x: 16, y: 68,
        theme: '数字 6〜10・値段',
        mission: '値段を聞いて買い物しよう！',
        phrases: ['n6', 'n7', 'n8', 'n9', 'n10', 'duoshao'],
        exp: 35,
        npcs: { clerk: { name: '店員さん', emoji: '🧑' } },
        intro: [
          { who: 'hamster', mood: 'happy', text: 'DAY 2 の朝！コンビニでお水を買おう🏪' },
          { who: 'hamster', text: '数字 6〜10 と、<b>「いくらですか？」</b>を覚えよう！' },
        ],
        scene: [
          { who: 'hamster', text: 'お水を見つけた！値段を聞いてみよう' },
          { type: 'say', prompt: '値段を聞こう', answer: 'duoshao' },
          {
            type: 'understand', who: 'clerk',
            zh: '六块。', py: 'Liù kuài.', ja: '6元です。',
            prompt: 'お水はいくら？', options: ['6元', '9元', '7元'], answer: 0,
          },
          { who: 'hamster', text: 'おにぎりも買っちゃおう！これも聞いてみて' },
          { type: 'say', prompt: 'おにぎりの値段を聞こう', answer: 'duoshao' },
          {
            type: 'understand', who: 'clerk',
            zh: '这个八块。', py: 'Zhège bā kuài.', ja: 'これは8元です。',
            prompt: 'おにぎりはいくら？', options: ['8元', '10元', '6元'], answer: 0,
          },
          {
            type: 'understand', who: 'clerk',
            zh: '一共十四块。', py: 'Yígòng shísì kuài.', ja: '全部で14元です。',
            prompt: '全部でいくら？', options: ['14元', '40元', '4元'], answer: 0,
            hint: '十（10）＋四（4）＝十四。数字は組み合わせられるんだ！',
          },
          { who: 'clerk', zh: '谢谢，再见！', py: 'Xièxie, zàijiàn!', ja: 'ありがとうございました！' },
          { type: 'say', prompt: 'お別れのあいさつをしよう', answer: 'zaijian' },
        ],
        clear: { title: 'お買い物成功！', hamster: '値段が聞き取れると、旅がぐっと楽になるね！' },
      },
      {
        id: 'restaurant', name: 'レストラン', emoji: '🍜', day: 2, x: 40, y: 58,
        theme: '注文・お会計',
        mission: 'レストランで注文してみよう！',
        phrases: ['yaozhege', 'haochi', 'maidan'],
        exp: 35,
        npcs: { waiter: { name: 'お店の人', emoji: '🧑‍🍳' } },
        intro: [
          { who: 'hamster', mood: 'happy', text: 'お昼ごはんの時間！🍜' },
          { who: 'hamster', text: 'メニューが読めなくても大丈夫。<b>指さし注文</b>のフレーズを覚えよう！' },
        ],
        scene: [
          { who: 'waiter', zh: '你好！想吃什么？', py: 'Nǐ hǎo! Xiǎng chī shénme?', ja: 'いらっしゃい！何を食べますか？' },
          { type: 'say', prompt: 'メニューの写真を指さして注文しよう', answer: 'yaozhege' },
          { who: 'waiter', zh: '好的，请稍等。', py: 'Hǎo de, qǐng shāo děng.', ja: 'かしこまりました。少々お待ちください。' },
          { who: 'hamster', mood: 'happy', text: 'きたきた！湯気がすごい〜！' },
          { who: 'waiter', zh: '怎么样？', py: 'Zěnmeyàng?', ja: 'どうですか？' },
          { type: 'say', prompt: '感想を伝えよう', answer: 'haochi' },
          { who: 'hamster', text: 'お腹いっぱい…お会計しよう！' },
          { type: 'say', prompt: 'お会計をお願いしよう', answer: 'maidan' },
          {
            type: 'understand', who: 'waiter',
            zh: '一共三十块。', py: 'Yígòng sānshí kuài.', ja: '全部で30元です。',
            prompt: '全部でいくら？', options: ['30元', '13元', '3元'], answer: 0,
            hint: '三（3）×十（10）＝三十。十が後ろに来ると「〜十」になるよ',
          },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
        ],
        clear: { title: 'ごちそうさま！', hamster: '指さし＋「我要这个」で、どこでもごはんが食べられるね！' },
      },
      {
        id: 'subway', name: '地下鉄', emoji: '🚇', day: 2, x: 56, y: 40,
        theme: '道をたずねる',
        mission: '地下鉄で外灘（ワイタン）を目指そう！',
        phrases: ['ditie', 'qu', 'cesuo'],
        exp: 35,
        npcs: {
          passer: { name: '通りがかりのお兄さん', emoji: '🧑‍🦱' },
          staff: { name: '駅員さん', emoji: '🧑‍✈️' },
        },
        intro: [
          { who: 'hamster', text: '次は夜景で有名な<b>外灘（ワイタン）</b>に行きたいな🌃' },
          { who: 'hamster', text: '「どこですか？」「〜へ行きたい」を覚えれば、もう迷わない！' },
        ],
        scene: [
          { who: 'hamster', text: 'まずは駅をさがそう。あのお兄さんに聞いてみて！' },
          { type: 'say', prompt: '地下鉄の駅がどこか聞こう', answer: 'ditie' },
          {
            type: 'understand', who: 'passer',
            zh: '在那边。', py: 'Zài nàbiān.', ja: 'あっちだよ。',
            prompt: 'なんて言った？', options: ['あっちだよ', 'ここだよ', 'わからない'], answer: 0,
            hint: '「那边（nàbiān）」は「あっち」。指もさしてるね！',
          },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
          { who: 'hamster', text: '駅に着いた！駅員さんに行き先を伝えよう' },
          { type: 'say', prompt: '外灘へ行きたいと伝えよう', answer: 'qu' },
          {
            type: 'understand', who: 'staff',
            zh: '坐二号线。', py: 'Zuò èr hào xiàn.', ja: '2号線に乗ってください。',
            prompt: '何号線に乗ればいい？', options: ['2号線', '4号線', '10号線'], answer: 0,
          },
          { who: 'hamster', mood: 'wow', text: 'あっ…乗る前にトイレ行きたい！' },
          { type: 'say', prompt: 'トイレの場所を聞こう', answer: 'cesuo' },
          { who: 'staff', zh: '就在后面。', py: 'Jiù zài hòumiàn.', ja: 'すぐ後ろですよ。' },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
        ],
        clear: { title: '地下鉄マスター！', hamster: 'これで上海のどこへでも行けるね！次はどこへ行こうか？' },
      },

      /* ================= DAY 3（準備中） ================= */
      { id: 'bund', name: '外灘', emoji: '🏙️', day: 3, x: 66, y: 22, comingSoon: true },
      { id: 'live', name: 'ライブ', emoji: '🎤', day: 3, x: 28, y: 30, comingSoon: true },
      { id: 'drama', name: 'ドラマ', emoji: '📺', day: 3, x: 44, y: 14, comingSoon: true },
    ],
  };

  App.CITIES = App.CITIES || {};
  App.CITIES.shanghai = shanghai;
  App.currentCity = () => App.CITIES.shanghai;

  // フレーズ → 覚えるスポット の逆引き（図鑑・クイズの選択肢づくりに使う）
  App.PHRASE_SPOT = App.PHRASE_SPOT || {};
  shanghai.spots.forEach((s) => (s.phrases || []).forEach((id) => { App.PHRASE_SPOT[id] = s; }));
})(window.App = window.App || {});
