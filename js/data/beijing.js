/* 旅行先：北京
 *
 * spots は旅の順番（おすすめ順）。requires: '<unit id>' の 2D コースのユニットをクリアすると行ける。
 * x, y はマップ上の位置（x: 0〜100, y: 0〜125）。
 * scene3d があるスポットは 3D でも遊べる（shop は 3D 屋台通りで最初に案内するお店）。
 *
 * intro / scene の書き方:
 *   { who: 'hamster', text: '...', mood: 'happy' }       ハムスターのセリフ
 *   { who: '<npcs のキー>', zh, py, ja }                   NPC のセリフ（自動で読み上げ）
 *   { type: 'say', prompt: '...', answer: '<phraseId>' }   ユーザーが中国語で返す
 *   { type: 'understand', who, zh, py, ja, prompt,
 *     options: ['正解', '不正解', ...], answer: 0, hint }  NPC の言葉を聞き取る
 *
 * 新しい都市を追加するときは、このファイルをコピーして App.CITIES.<id> に登録する。
 */
(function (App) {
  'use strict';

  const beijing = {
    id: 'beijing',
    name: '北京',
    nameZh: '北京 Běijīng',
    spots: [
      /* ================= DAY 1：到着 ================= */
      {
        id: 'airport', name: '空港', emoji: '✈️', day: 1, x: 86, y: 30, requires: 'u4',
        scene3d: 'airport3d',
        theme: 'あいさつ・入国',
        mission: 'あいさつで北京に入国しよう！',
        phrases: ['nihao', 'xiexie', 'zaijian'],
        exp: 30,
        npcs: { officer: { name: '入国審査の係員', emoji: '👮' } },
        intro: [
          { who: 'hamster', mood: 'happy', text: '北京首都国際空港に着いたよ！✈️' },
          { who: 'hamster', text: 'まずは入国審査。2D で覚えた<b>あいさつ</b>を使ってみよう！' },
        ],
        scene: [
          { who: 'hamster', text: '係員さんの番だ。ドキドキ…' },
          { who: 'officer', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！' },
          { type: 'say', prompt: 'あいさつを返そう！', answer: 'nihao' },
          { who: 'officer', zh: '欢迎来到北京！', py: 'Huānyíng lái dào Běijīng!', ja: '北京へようこそ！' },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
          { who: 'officer', zh: '好了，再见！', py: 'Hǎo le, zàijiàn!', ja: 'はい、OKです。さようなら！' },
          { type: 'say', prompt: 'お別れのあいさつをしよう', answer: 'zaijian' },
          { who: 'hamster', mood: 'happy', text: '入国できた！北京の旅、スタートだよ〜！' },
        ],
        clear: { title: '北京に入国！', hamster: '最初の一歩、かんぺき！ホテルへ向かおう🏨' },
      },
      {
        id: 'hotel', name: 'ホテル', emoji: '🏨', day: 1, x: 70, y: 86, requires: 'u4',
        scene3d: 'hotel3d',
        theme: 'チェックイン',
        mission: 'ホテルにチェックインしよう！',
        phrases: ['ruzhu', 'huzhao', 'haode'],
        exp: 30,
        npcs: { staff: { name: 'フロントの王さん', emoji: '🧑‍💼' } },
        intro: [
          { who: 'hamster', mood: 'happy', text: 'ホテルに着いたよ！大きいね〜🏨' },
          { who: 'hamster', text: '「旅の準備」で覚えたチェックインの言葉を使おう！' },
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
        clear: { title: 'ホテル チェックイン成功！', hamster: 'やったね！荷物を置いたら、王府井の屋台に行ってみよう🥟' },
      },
      {
        id: 'stall', name: '小籠包の屋台', emoji: '🥟', day: 1, x: 66, y: 64, requires: 'u5',
        scene3d: 'stall3d', shop: 'xlb',
        theme: '数字・番号',
        mission: '値段と番号を聞き取って小籠包を買おう！',
        phrases: ['n3', 'n5', 'kuai', 'haonum'],
        exp: 30,
        npcs: { vendor: { name: '屋台のおばちゃん', emoji: '👩‍🍳' } },
        intro: [
          { who: 'hamster', mood: 'happy', text: 'ここは<b>王府井（ワンフージン）</b>の屋台通り！いいにおい〜🥟' },
          { who: 'hamster', text: '値段や番号を聞き取るには<b>数字</b>が大事。聞き取りに挑戦しよう！' },
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

      /* ================= DAY 2：北京グルメ ================= */
      {
        id: 'zhajiang', name: '炸酱面の店', emoji: '🍜', day: 2, x: 28, y: 72, requires: 'u7',
        scene3d: 'stall3d', shop: 'zhajiang',
        theme: '注文する',
        mission: 'ジャージャー麺を注文しよう！',
        phrases: ['zhajiangmian', 'yiwan', 'buyaola', 'haochi'],
        exp: 35,
        npcs: { waiter: { name: '麺屋のお兄さん', emoji: '🧑‍🍳' } },
        intro: [
          { who: 'hamster', mood: 'happy', text: 'お昼は北京の家庭の味、<b>炸酱面（ジャージャー麺）</b>！🍜' },
          { who: 'hamster', text: '「一碗（1杯）」と「辛くしないで」を使ってみよう' },
        ],
        scene: [
          { who: 'waiter', zh: '您好！想吃什么？', py: 'Nín hǎo! Xiǎng chī shénme?', ja: 'いらっしゃい！何を食べますか？' },
          { type: 'say', prompt: 'ジャージャー麺を1杯たのもう', answer: 'yiwan' },
          {
            type: 'understand', who: 'waiter',
            zh: '要辣的吗？', py: 'Yào là de ma?', ja: '辛いのにしますか？',
            prompt: '何を聞かれた？', options: ['辛くするか', '大盛りにするか', '持ち帰りか'], answer: 0,
            hint: '「辣（là）」＝辛い',
          },
          { type: 'say', prompt: '辛くしないでもらおう', answer: 'buyaola' },
          { who: 'waiter', zh: '好的，请稍等。', py: 'Hǎo de, qǐng shāo děng.', ja: 'かしこまりました。少々お待ちください。' },
          { who: 'hamster', mood: 'happy', text: 'きたきた！麺と味噌と野菜をよーくまぜて食べるんだって' },
          { who: 'waiter', zh: '怎么样？', py: 'Zěnmeyàng?', ja: 'どうですか？' },
          { type: 'say', prompt: '感想を伝えよう', answer: 'haochi' },
          { type: 'say', prompt: 'お会計をお願いしよう', answer: 'maidan' },
          {
            type: 'understand', who: 'waiter',
            zh: '一共十八块。', py: 'Yígòng shíbā kuài.', ja: '全部で18元です。',
            prompt: '全部でいくら？', options: ['18元', '8元', '80元'], answer: 0,
            hint: '十（10）＋八（8）＝十八',
          },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
        ],
        clear: { title: 'ジャージャー麺 完食！', hamster: '「一碗」「不要辣」、もうバッチリだね！' },
      },
      {
        id: 'shuan', name: '涮羊肉の店', emoji: '🍲', day: 2, x: 30, y: 94, requires: 'u7',
        scene3d: 'stall3d', shop: 'shuan',
        theme: 'メニュー・値段',
        mission: '銅鍋のしゃぶしゃぶを食べよう！',
        phrases: ['shuanyangrou', 'caidan', 'yaozhege', 'yigong'],
        exp: 35,
        npcs: { waiter: { name: 'お店のおばさん', emoji: '👩‍🍳' } },
        intro: [
          { who: 'hamster', mood: 'wow', text: '真ん中に煙突がついた<b>銅の鍋</b>！これが北京の<b>涮羊肉</b>だよ🍲' },
          { who: 'hamster', text: 'メニューをもらって、指さしで注文しよう' },
        ],
        scene: [
          { who: 'waiter', zh: '欢迎光临！', py: 'Huānyíng guānglín!', ja: 'いらっしゃいませ！' },
          { type: 'say', prompt: 'メニューをもらおう', answer: 'caidan' },
          { who: 'waiter', zh: '给您菜单。', py: 'Gěi nín càidān.', ja: 'メニューをどうぞ。' },
          { type: 'say', prompt: '羊肉の写真を指さして注文しよう', answer: 'yaozhege' },
          {
            type: 'understand', who: 'waiter',
            zh: '羊肉一盘四十块。', py: 'Yángròu yì pán sìshí kuài.', ja: '羊肉は1皿40元です。',
            prompt: '1皿いくら？', options: ['40元', '14元', '4元'], answer: 0,
            hint: '四（4）×十（10）＝四十',
          },
          { who: 'hamster', mood: 'happy', text: 'うすい羊肉をさっと鍋にくぐらせて、ごまだれで…おいしい〜！' },
          { who: 'waiter', zh: '好吃吗？', py: 'Hǎochī ma?', ja: 'おいしい？' },
          { type: 'say', prompt: '感想を伝えよう', answer: 'haochi' },
          { type: 'say', prompt: '全部でいくらか聞こう', answer: 'yigong' },
          {
            type: 'understand', who: 'waiter',
            zh: '一共九十块。', py: 'Yígòng jiǔshí kuài.', ja: '全部で90元です。',
            prompt: '全部でいくら？', options: ['90元', '19元', '9元'], answer: 0,
            hint: '九（9）×十（10）＝九十',
          },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
        ],
        clear: { title: '涮羊肉 ごちそうさま！', hamster: '指さし注文と「一共多少钱？」で、どこでも食べられるね！' },
      },
      {
        id: 'duck', name: '北京ダックの店', emoji: '🦆', day: 2, x: 52, y: 100, requires: 'u7',
        scene3d: 'stall3d', shop: 'duck',
        theme: '量詞・会計',
        mission: '北京ダックを1人前たのもう！',
        phrases: ['kaoya', 'yifen', 'caidan', 'maidan'],
        exp: 35,
        npcs: { waiter: { name: '北京ダック店の店員さん', emoji: '🧑‍🍳' } },
        intro: [
          { who: 'hamster', mood: 'wow', text: '北京に来たら、やっぱり<b>北京烤鸭（北京ダック）</b>！🦆' },
          { who: 'hamster', text: '料理の数え方「<b>一份</b>（1人前）」を使ってみよう' },
        ],
        scene: [
          {
            type: 'understand', who: 'waiter',
            zh: '欢迎光临！几位？', py: 'Huānyíng guānglín! Jǐ wèi?', ja: 'いらっしゃいませ！何名様ですか？',
            prompt: '何を聞かれた？', options: ['何人か', '何を食べるか', 'どこから来たか'], answer: 0,
            hint: '「几（jǐ）」＝いくつ、「位（wèi）」＝人をていねいに数える言葉',
          },
          { who: 'hamster', text: '「1人です」は<b>一位</b>（yí wèi）。指を1本立てればOK！☝️' },
          { type: 'say', prompt: 'メニューをもらおう', answer: 'caidan' },
          { type: 'say', prompt: '北京ダックを1人前たのもう', answer: 'yifen' },
          {
            type: 'understand', who: 'waiter',
            zh: '好的。一份烤鸭九十八块。', py: 'Hǎo de. Yí fèn kǎoyā jiǔshíbā kuài.', ja: 'かしこまりました。北京ダック1人前98元です。',
            prompt: 'いくら？', options: ['98元', '89元', '18元'], answer: 0,
            hint: '九十（90）＋八（8）＝九十八',
          },
          { who: 'hamster', mood: 'wow', text: '料理人さんが目の前で切ってくれる！パリパリの皮を、うすい皮でくるんで…' },
          { type: 'say', prompt: '感想を伝えよう', answer: 'haochi' },
          { type: 'say', prompt: 'お会計をお願いしよう', answer: 'maidan' },
          { who: 'waiter', zh: '谢谢光临！', py: 'Xièxie guānglín!', ja: 'ありがとうございました！' },
          { type: 'say', prompt: 'お別れのあいさつをしよう', answer: 'zaijian' },
        ],
        clear: { title: '北京ダック 制覇！', hamster: '「一份」「一碗」「一笼」…数え方もばっちりだね！' },
      },
      {
        id: 'subway', name: '地下鉄', emoji: '🚇', day: 2, x: 76, y: 104, requires: 'u8',
        theme: '道をたずねる',
        mission: '地下鉄で天安門を目指そう！',
        phrases: ['ditie', 'qu', 'cesuo'],
        exp: 35,
        npcs: {
          passer: { name: '通りがかりのお兄さん', emoji: '🧑‍🦱' },
          staff: { name: '駅員さん', emoji: '🧑‍✈️' },
        },
        intro: [
          { who: 'hamster', text: '明日は北京のまんなか、<b>天安門</b>へ行きたいな🏛️' },
          { who: 'hamster', text: '「どこですか？」「〜へ行きたい」で、地下鉄に乗ってみよう！' },
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
          { type: 'say', prompt: '天安門へ行きたいと伝えよう', answer: 'qu' },
          {
            type: 'understand', who: 'staff',
            zh: '坐一号线。', py: 'Zuò yī hào xiàn.', ja: '1号線に乗ってください。',
            prompt: '何号線に乗ればいい？', options: ['1号線', '2号線', '10号線'], answer: 0,
          },
          { who: 'hamster', mood: 'wow', text: 'あっ…乗る前にトイレ行きたい！' },
          { type: 'say', prompt: 'トイレの場所を聞こう', answer: 'cesuo' },
          { who: 'staff', zh: '就在后面。', py: 'Jiù zài hòumiàn.', ja: 'すぐ後ろですよ。' },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
        ],
        clear: { title: '地下鉄マスター！', hamster: 'これで北京のどこへでも行けるね！' },
      },

      /* ================= DAY 3：北京の名所 ================= */
      {
        id: 'tiananmen', name: '天安門広場', emoji: '🏛️', day: 3, x: 50, y: 78, requires: 'u8',
        theme: '道案内',
        mission: '道を聞いて天安門広場へ行こう！',
        phrases: ['tiananmen', 'yizhizou', 'zuo', 'you'],
        exp: 35,
        npcs: { uncle: { name: '散歩中のおじさん', emoji: '👴' } },
        intro: [
          { who: 'hamster', text: '地下鉄を降りたよ。天安門はどっちだろう？' },
          { who: 'hamster', text: '「<b>一直走</b>（まっすぐ）」「<b>左・右</b>」を聞き取ろう！' },
        ],
        scene: [
          { type: 'say', prompt: 'まずは話しかけよう', answer: 'buhaoyisi' },
          { type: 'say', prompt: '天安門へ行きたいと伝えよう', answer: 'qu' },
          {
            type: 'understand', who: 'uncle',
            zh: '一直走，然后往左拐。', py: 'Yìzhí zǒu, ránhòu wǎng zuǒ guǎi.', ja: 'まっすぐ行って、それから左に曲がるんだよ。',
            prompt: 'どう行けばいい？', options: ['まっすぐ行って左', 'まっすぐ行って右', '戻って左'], answer: 0,
            hint: '「一直走」＝まっすぐ、「左（zuǒ）」＝左',
          },
          { type: 'say', prompt: 'お礼を言おう', answer: 'xiexie' },
          { who: 'hamster', mood: 'wow', text: '着いた〜！広い！！ここが<b>天安門広場</b>。世界でいちばん大きい広場のひとつなんだって' },
          {
            type: 'understand', who: 'uncle',
            zh: '天安门很漂亮吧？', py: 'Tiān’ānmén hěn piàoliang ba?', ja: '天安門、きれいでしょ？',
            prompt: 'なんて言った？', options: ['天安門きれいでしょ？', '天安門は遠いよ', '天安門は閉まってるよ'], answer: 0,
            hint: '「漂亮（piàoliang）」＝きれい',
          },
          { type: 'say', prompt: '「はい」と答えよう', answer: 'shide' },
        ],
        clear: { title: '天安門広場に到着！', hamster: '道を聞けたね！次は奥の<b>故宮</b>へ行ってみよう🏯' },
      },
      {
        id: 'gugong', name: '故宮', emoji: '🏯', day: 3, x: 50, y: 58, requires: 'u9',
        theme: 'チケット・写真',
        mission: 'チケットを買って故宮に入ろう！',
        phrases: ['gugong', 'yizhangpiao', 'paizhao', 'taimei'],
        exp: 40,
        npcs: {
          ticket: { name: 'チケット売り場の人', emoji: '🎫' },
          guide: { name: 'ガイドさん', emoji: '🧑‍🏫' },
        },
        intro: [
          { who: 'hamster', mood: 'wow', text: '天安門の奥にあるのが<b>故宮</b>。昔の皇帝が住んでいた宮殿だよ🏯' },
          { who: 'hamster', text: 'チケットを買って、写真のマナーも聞いてみよう' },
        ],
        scene: [
          { type: 'say', prompt: 'チケットを1枚買おう', answer: 'yizhangpiao' },
          {
            type: 'understand', who: 'ticket',
            zh: '六十块。请出示护照。', py: 'Liùshí kuài. Qǐng chūshì hùzhào.', ja: '60元です。パスポートを見せてください。',
            prompt: 'いくら？', options: ['60元', '16元', '6元'], answer: 0,
            hint: '六（6）×十（10）＝六十',
          },
          { type: 'say', prompt: 'パスポートを渡そう', answer: 'huzhao' },
          { who: 'hamster', mood: 'wow', text: '門をくぐると…赤い壁と金色の屋根がずーっと続いてる！' },
          { type: 'say', prompt: 'ガイドさんに写真を撮ってもいいか聞こう', answer: 'paizhao' },
          {
            type: 'understand', who: 'guide',
            zh: '可以，但是不能用闪光灯。', py: 'Kěyǐ, dànshì bù néng yòng shǎnguāngdēng.', ja: 'いいですよ。でもフラッシュは使えません。',
            prompt: 'なんて言われた？', options: ['撮っていいけどフラッシュはだめ', '写真は全部だめ', 'フラッシュを使って'], answer: 0,
            hint: '「可以」＝いいよ、「但是」＝でも',
          },
          { type: 'say', prompt: '景色の感想を言おう', answer: 'taimei' },
        ],
        clear: { title: '故宮 見学完了！', hamster: 'いよいよ明日は、旅のクライマックス…<b>万里の長城</b>！🧱' },
      },

      /* ================= DAY 4：万里の長城 ================= */
      {
        id: 'greatwall', name: '万里の長城', emoji: '🧱', day: 4, x: 34, y: 14, requires: 'u9',
        scene3d: 'greatwall3d',
        theme: '旅のクライマックス',
        mission: '万里の長城のてっぺんまで登ろう！',
        phrases: ['changcheng', 'haolei', 'haohan', 'taimei'],
        exp: 50,
        npcs: {
          ticket: { name: 'チケット売り場の人', emoji: '🎫' },
          hiker: { name: '登山中のお兄さん', emoji: '🧗' },
        },
        intro: [
          { who: 'hamster', mood: 'wow', text: '見て！山の上をどこまでも続く壁…これが<b>万里の長城</b>！🧱' },
          { who: 'hamster', text: '全長は2万km以上。今日はいちばん上の見張り台を目指そう！' },
        ],
        scene: [
          { type: 'say', prompt: '入場券を1枚買おう', answer: 'yizhangpiao' },
          {
            type: 'understand', who: 'ticket',
            zh: '四十块。', py: 'Sìshí kuài.', ja: '40元です。',
            prompt: 'いくら？', options: ['40元', '14元', '4元'], answer: 0,
          },
          { type: 'say', prompt: 'お金を渡そう', answer: 'geini' },
          { who: 'hamster', text: '急な階段だ…よいしょ、よいしょ…' },
          { type: 'say', prompt: '思わずひとこと…', answer: 'haolei' },
          {
            type: 'understand', who: 'hiker',
            zh: '加油！快到了！', py: 'Jiāyóu! Kuài dào le!', ja: 'がんばれ！もうすぐだよ！',
            prompt: 'なんて言われた？', options: ['がんばれ、もうすぐだよ', '危ないから戻って', 'ここで休もう'], answer: 0,
            hint: '「加油（jiāyóu）」＝がんばれ！',
          },
          { who: 'hamster', mood: 'wow', text: 'てっぺんに着いた〜！！山の向こうまで長城が続いてる…' },
          { type: 'say', prompt: '景色の感想を言おう', answer: 'taimei' },
          { who: 'hiker', zh: '不到长城非好汉！', py: 'Bú dào Chángchéng fēi hǎohàn!', ja: '長城に登らずして好漢にあらず！' },
          { type: 'say', prompt: '一緒に言おう！', answer: 'haohan' },
        ],
        clear: { title: '万里の長城 登頂！', hamster: 'これでぼくたちも<b>好汉</b>（りっぱな人）だね！北京の旅、ほんとうにおつかれさま🎉' },
      },
    ],
  };

  App.CITIES = App.CITIES || {};
  App.CITIES.beijing = beijing;
  App.currentCityId = 'beijing';
  App.currentCity = () => App.CITIES[App.currentCityId];

  // フレーズ → スポット の逆引き（2D の旅のクイズで選択肢づくりに使う）
  App.PHRASE_SPOT = App.PHRASE_SPOT || {};
  beijing.spots.forEach((s) => (s.phrases || []).forEach((id) => { App.PHRASE_SPOT[id] = s; }));
})(window.App = window.App || {});
