/* フレーズ辞書
 * id: { zh: 中国語, py: ピンイン, ja: 日本語, tip?: ハムスターのひとこと, w?: 並べ替え用の単語区切り }
 *   w は「中国語|ピンイン」をスペース区切りで並べる（例: '我|wǒ 是|shì 日本人|Rìběn rén'）。
 *   w がある言葉は 2D 学習の「並べ替え問題」に出る。
 * どのレッスンで覚えるかは js/data/course.js、旅行先の会話で使うのは js/data/<都市>.js で決める。
 * id は 3D の会話（js/world3d/*.js）からも参照しているので、変えるときは検索してから。
 */
(function (App) {
  'use strict';

  App.PHRASES = {
    /* ---- 中国語の基本 ---- */
    wo:   { zh: '我', py: 'wǒ', ja: '私', tip: '「ウォ」。自分のことはぜんぶ「我」でOK！' },
    ni:   { zh: '你', py: 'nǐ', ja: 'あなた', tip: '「ニー」。你好の「你」だよ。' },
    ta:   { zh: '他', py: 'tā', ja: '彼', tip: '「ター」。女の人は「她」と書くけど、音は同じ！' },
    hao:  { zh: '好', py: 'hǎo', ja: 'よい', tip: '「女」＋「子」で「好」。いいこと、って覚えよう。' },
    ma1:  { zh: '妈', py: 'mā', ja: 'お母さん', tip: '第1声：高く平らにのばす「マー」。' },
    ma2:  { zh: '麻', py: 'má', ja: 'しびれる', tip: '第2声：下から上へ「マァ↗」。麻婆豆腐の「麻」だよ。' },
    ma3:  { zh: '马', py: 'mǎ', ja: '馬', tip: '第3声：低く下げてから上げる「マ↘↗」。' },
    ma4:  { zh: '骂', py: 'mà', ja: 'しかる', tip: '第4声：上から下へストン「マ↘」。音の高さで意味が変わるんだ！' },
    shi:  { zh: '是', py: 'shì', ja: '〜です', tip: '「A 是 B」で「A は B です」。英語の is みたいなもの。' },
    bu:   { zh: '不', py: 'bù', ja: '〜ない', tip: '前に置くと否定になるよ。後ろが第4声だと「bú」に変わる！' },
    hen:  { zh: '很', py: 'hěn', ja: 'とても', tip: '「我很好」のように、形容詞の前によくつくよ。' },
    nihaoma:  { zh: '你好吗？', py: 'Nǐ hǎo ma?', ja: '元気ですか？', tip: '文の最後に「吗」をつけると質問になるよ！', w: '你|nǐ 好|hǎo 吗|ma' },
    wohenhao: { zh: '我很好。', py: 'Wǒ hěn hǎo.', ja: '私は元気です', tip: '「你好吗？」と聞かれたらこれ！', w: '我|wǒ 很|hěn 好|hǎo' },

    /* ---- あいさつ ---- */
    nihao:   { zh: '你好', py: 'Nǐ hǎo', ja: 'こんにちは', tip: 'いちばん基本のあいさつ！朝でも夜でも使えるよ。' },
    xiexie:  { zh: '谢谢', py: 'Xièxie', ja: 'ありがとう', tip: '2つめの「xie」は軽く短く。これだけで旅がやさしくなるよ〜' },
    zaijian: { zh: '再见', py: 'Zàijiàn', ja: 'さようなら', tip: '「再び見る」＝また会おうね、って意味なんだ。' },
    ninhao:  { zh: '您好', py: 'Nín hǎo', ja: 'こんにちは（ていねい）', tip: '「您」は「你」のていねい版。お店の人がよく使うよ。' },
    zaoshang: { zh: '早上好', py: 'Zǎoshang hǎo', ja: 'おはよう', tip: '「早上」＝朝。ホテルの朝ごはんで使ってみよう！' },
    wanshang: { zh: '晚上好', py: 'Wǎnshang hǎo', ja: 'こんばんは', tip: '「晚上」＝夜。' },
    wanan:   { zh: '晚安', py: 'Wǎn’ān', ja: 'おやすみ', tip: '寝る前のあいさつ。「晚」＋「安らか」だね。' },
    mingtianjian: { zh: '明天见', py: 'Míngtiān jiàn', ja: 'また明日', tip: '「明天」＝明日、「见」＝会う。' },
    duibuqi: { zh: '对不起', py: 'Duìbuqǐ', ja: 'ごめんなさい', tip: 'しっかりあやまるときの言葉。' },
    meiguanxi: { zh: '没关系', py: 'Méi guānxi', ja: '大丈夫です／気にしないで', tip: '「对不起」と言われたらこれで返そう。' },
    bukeqi:  { zh: '不客气', py: 'Bú kèqi', ja: 'どういたしまして', tip: '「谢谢」と言われたらこれ！' },
    buhaoyisi: { zh: '不好意思', py: 'Bù hǎoyìsi', ja: 'すみません', tip: '話しかけるとき・軽くあやまるときに使える万能フレーズ。' },

    /* ---- 自己紹介 ---- */
    wojiao:  { zh: '我叫小林。', py: 'Wǒ jiào Xiǎolín.', ja: '私は小林といいます', tip: '「我叫〜」で名前を言えるよ。小林のところを自分の名前にしてね。', w: '我|wǒ 叫|jiào 小林|Xiǎolín' },
    nijiao:  { zh: '你叫什么名字？', py: 'Nǐ jiào shénme míngzi?', ja: 'お名前は？', tip: '「什么」＝なに。「名字」＝名前。', w: '你|nǐ 叫|jiào 什么|shénme 名字|míngzi' },
    ribenren: { zh: '我是日本人。', py: 'Wǒ shì Rìběn rén.', ja: '私は日本人です', tip: '「A 是 B」の文。国の名前＋「人」で〜人！', w: '我|wǒ 是|shì 日本人|Rìběn rén' },
    zhongguoren: { zh: '中国人', py: 'Zhōngguó rén', ja: '中国人', tip: '「中国」＋「人」。' },
    xuesheng: { zh: '我是学生。', py: 'Wǒ shì xuésheng.', ja: '私は学生です', tip: '「学生」は日本語と同じ漢字だね。', w: '我|wǒ 是|shì 学生|xuésheng' },
    bushi:   { zh: '我不是中国人。', py: 'Wǒ bú shì Zhōngguó rén.', ja: '私は中国人ではありません', tip: '「是」の前に「不」で否定。「不」は bú になるよ。', w: '我|wǒ 不|bú 是|shì 中国人|Zhōngguó rén' },
    renshi:  { zh: '认识你很高兴。', py: 'Rènshi nǐ hěn gāoxìng.', ja: '知り合えてうれしいです', tip: '自己紹介の最後にこれを言うとバッチリ！', w: '认识|rènshi 你|nǐ 很|hěn 高兴|gāoxìng' },
    xihuan:  { zh: '我喜欢中国菜。', py: 'Wǒ xǐhuan Zhōngguó cài.', ja: '中華料理が好きです', tip: '「我喜欢〜」で好きなものを言えるよ。', w: '我|wǒ 喜欢|xǐhuan 中国菜|Zhōngguó cài' },

    /* ---- 旅の準備（空港・ホテル） ---- */
    hzhao:   { zh: '护照', py: 'hùzhào', ja: 'パスポート', tip: '旅でいちばん大事なもの！' },
    dengjipai: { zh: '登机牌', py: 'dēngjīpái', ja: '搭乗券', tip: '「登机」＝飛行機に乗る、「牌」＝札。' },
    feiji:   { zh: '飞机', py: 'fēijī', ja: '飛行機', tip: '「飛ぶ機械」でそのまま！' },
    xingli:  { zh: '行李', py: 'xíngli', ja: '荷物', tip: 'スーツケースは「行李箱」だよ。' },
    ruzhu:   { zh: '我想办理入住', py: 'Wǒ xiǎng bànlǐ rùzhù', ja: 'チェックインしたいです', tip: '「我想〜」で「〜したい」。旅でめちゃくちゃ使えるよ！', w: '我|wǒ 想|xiǎng 办理|bànlǐ 入住|rùzhù' },
    huzhao:  { zh: '这是我的护照', py: 'Zhè shì wǒ de hùzhào', ja: 'これは私のパスポートです', tip: '「这是〜」＝「これは〜です」。指さしながら使えるよ。', w: '这|zhè 是|shì 我的|wǒ de 护照|hùzhào' },
    haode:   { zh: '好的', py: 'Hǎo de', ja: 'わかりました／OK', tip: '「OK！」の感覚で気軽に使える返事だよ。' },
    fangjian: { zh: '房间', py: 'fángjiān', ja: '部屋', tip: 'ホテルの部屋は「房间」。ルームキーは「房卡」。' },
    huanying: { zh: '欢迎', py: 'huānyíng', ja: 'ようこそ', tip: '空港の看板「欢迎来到北京」でも見られるよ！' },
    shide:   { zh: '是的', py: 'Shì de', ja: 'はい', tip: '「そうです」の返事。' },
    qing:    { zh: '请', py: 'qǐng', ja: 'どうぞ／〜してください', tip: '「请进」＝どうぞお入りください。ていねいな言い方を作るよ。' },
    beijing: { zh: '北京', py: 'Běijīng', ja: '北京', tip: '「北の都」。今回の旅の目的地！' },

    /* ---- 数字・時間 ---- */
    n1: { zh: '一', py: 'yī', ja: '1', tip: '高く平らにのばす「第1声」。ずーっと高いまま！' },
    n2: { zh: '二', py: 'èr', ja: '2', tip: '上から下へストンと落とす「第4声」。' },
    n3: { zh: '三', py: 'sān', ja: '3', tip: 'これも高く平らな第1声。「サーン」って感じ。' },
    n4: { zh: '四', py: 'sì', ja: '4', tip: '第4声でストン。「スー」に近いよ。' },
    n5: { zh: '五', py: 'wǔ', ja: '5', tip: '低く下げてから少し上げる「第3声」。' },
    n6:  { zh: '六', py: 'liù', ja: '6', tip: '第4声。「リウ」をストンと。' },
    n7:  { zh: '七', py: 'qī', ja: '7', tip: '「q」は「チ」に近い音。高く平らに。' },
    n8:  { zh: '八', py: 'bā', ja: '8', tip: '「バー」。末広がりで縁起のいい数字なんだって！' },
    n9:  { zh: '九', py: 'jiǔ', ja: '9', tip: '第3声。低く「ジウ」。' },
    n10: { zh: '十', py: 'shí', ja: '10', tip: '下から上へ上げる「第2声」。「えっ？」って聞き返す感じ！' },
    n15: { zh: '十五', py: 'shíwǔ', ja: '15', tip: '十＋五＝十五。日本語と同じ組み立て方！' },
    n20: { zh: '二十', py: 'èrshí', ja: '20', tip: '二×十＝二十。これも日本語と同じ！' },
    liang: { zh: '两', py: 'liǎng', ja: '2つ（数えるとき）', tip: '「2つ」「2元」のように数えるときは「二」じゃなくて「两」！' },
    kuai:  { zh: '块', py: 'kuài', ja: '元（お金）', tip: 'お店では「元」より「块」をよく使うよ。「五块」＝5元。' },
    haonum: { zh: '号', py: 'hào', ja: '〜番／〜日', tip: '「三号」＝3番。日付の「〜日」にも使うよ。' },
    jidian: { zh: '现在几点？', py: 'Xiànzài jǐ diǎn?', ja: '今何時ですか？', tip: '「几」＝いくつ、「点」＝時。', w: '现在|xiànzài 几|jǐ 点|diǎn' },
    sandian: { zh: '三点', py: 'sān diǎn', ja: '3時', tip: '数字＋「点」で〜時。' },
    jintian: { zh: '今天', py: 'jīntiān', ja: '今日', tip: '「今」＋「天」＝今日。' },
    mingtian: { zh: '明天', py: 'míngtiān', ja: '明日', tip: '「明」＋「天」＝明日。' },

    /* ---- 買い物 ---- */
    duoshao: { zh: '多少钱？', py: 'Duōshao qián?', ja: 'いくらですか？', tip: '買い物の最強フレーズ！指さして言えばOK。', w: '多少|duōshao 钱|qián' },
    taigui:  { zh: '太贵了！', py: 'Tài guì le!', ja: '高すぎる！', tip: '「太〜了」で「〜すぎる」。屋台で言ってみよう！', w: '太|tài 贵|guì 了|le' },
    pianyi:  { zh: '便宜一点吧。', py: 'Piányi yìdiǎn ba.', ja: '少し安くしてください', tip: '市場では値段交渉もできるよ。', w: '便宜|piányi 一点|yìdiǎn 吧|ba' },
    yaozhege: { zh: '我要这个', py: 'Wǒ yào zhège', ja: 'これください', tip: 'メニューを指さして「我要这个」。これで何でも頼めちゃう！', w: '我|wǒ 要|yào 这个|zhège' },
    zhege:   { zh: '这个', py: 'zhège', ja: 'これ', tip: '近くのもの。' },
    nage:    { zh: '那个', py: 'nàge', ja: 'あれ／それ', tip: '遠くのもの。' },
    buyao:   { zh: '不要。', py: 'Bú yào.', ja: 'いりません', tip: '「要」＝ほしい、「不要」＝いらない。' },
    shui:    { zh: '一瓶水', py: 'yì píng shuǐ', ja: '水1本', tip: 'ペットボトルは「瓶」で数えるよ。', w: '一|yì 瓶|píng 水|shuǐ' },
    weixin:  { zh: '可以用微信支付吗？', py: 'Kěyǐ yòng Wēixìn zhīfù ma?', ja: 'WeChat Pay は使えますか？', tip: '中国はスマホ決済が主流！「可以〜吗？」＝〜してもいい？', w: '可以|kěyǐ 用|yòng 微信|Wēixìn 支付|zhīfù 吗|ma' },
    geini:   { zh: '给你。', py: 'Gěi nǐ.', ja: 'はい、どうぞ（渡すとき）', tip: 'お金やものを渡すときのひとこと。' },

    /* ---- 食事 ---- */
    kaoya:   { zh: '北京烤鸭', py: 'Běijīng kǎoyā', ja: '北京ダック', tip: 'パリパリの皮を薄い皮で包んで食べる、北京の名物！' },
    shuanyangrou: { zh: '涮羊肉', py: 'shuàn yángròu', ja: '羊肉のしゃぶしゃぶ', tip: '銅の鍋で羊肉をしゃぶしゃぶ。北京の冬の名物！' },
    zhajiangmian: { zh: '炸酱面', py: 'zhájiàngmiàn', ja: 'ジャージャー麺', tip: '北京の家庭の味。甘辛い味噌と野菜をまぜて食べるよ。' },
    xiaolongbao: { zh: '小笼包', py: 'xiǎolóngbāo', ja: '小籠包', tip: '「笼」はせいろ。中のスープが熱いから気をつけて！' },
    caidan:  { zh: '请给我菜单。', py: 'Qǐng gěi wǒ càidān.', ja: 'メニューをください', tip: '「请给我〜」＝〜をください（ていねい）。', w: '请|qǐng 给|gěi 我|wǒ 菜单|càidān' },
    yifen:   { zh: '我要一份烤鸭。', py: 'Wǒ yào yí fèn kǎoyā.', ja: '北京ダックを1人前ください', tip: '「份」は1人前・1セットの数え方。', w: '我|wǒ 要|yào 一份|yí fèn 烤鸭|kǎoyā' },
    yiwan:   { zh: '我要一碗炸酱面。', py: 'Wǒ yào yì wǎn zhájiàngmiàn.', ja: 'ジャージャー麺を1杯ください', tip: '「碗」はおわん。麺やごはんの数え方だよ。', w: '我|wǒ 要|yào 一碗|yì wǎn 炸酱面|zhájiàngmiàn' },
    yilong:  { zh: '一笼小笼包', py: 'yì lóng xiǎolóngbāo', ja: '小籠包1せいろ', tip: '「笼」＝せいろ。小籠包はせいろで数えるよ。', w: '一|yì 笼|lóng 小笼包|xiǎolóngbāo' },
    haochi:  { zh: '好吃！', py: 'Hǎochī!', ja: 'おいしい！', tip: '言われたお店の人もうれしくなる言葉だよ〜' },
    maidan:  { zh: '买单', py: 'Mǎidān', ja: 'お会計お願いします', tip: '手をあげて「买单！」。中国のお店ではよく聞くよ。' },
    buyaola: { zh: '不要辣。', py: 'Bú yào là.', ja: '辛くしないでください', tip: '辛いのが苦手な人は必須！「辣」＝辛い。', w: '不要|bú yào 辣|là' },
    yigong:  { zh: '一共多少钱？', py: 'Yígòng duōshao qián?', ja: '全部でいくらですか？', tip: '「一共」＝全部で。お会計で使おう。', w: '一共|yígòng 多少|duōshao 钱|qián' },

    /* ---- 移動・交通 ---- */
    ditie:  { zh: '地铁站在哪里？', py: 'Dìtiě zhàn zài nǎlǐ?', ja: '地下鉄の駅はどこですか？', tip: '「〜在哪里？」で「〜はどこ？」。前の言葉を変えれば何でも聞けるよ。', w: '地铁站|dìtiě zhàn 在|zài 哪里|nǎlǐ' },
    qu:     { zh: '我要去天安门', py: 'Wǒ yào qù Tiān’ānmén', ja: '天安門へ行きたいです', tip: '「我要去〜」で「〜へ行きたい」。タクシーでも使えるよ！', w: '我|wǒ 要|yào 去|qù 天安门|Tiān’ānmén' },
    cesuo:  { zh: '厕所在哪里？', py: 'Cèsuǒ zài nǎlǐ?', ja: 'トイレはどこですか？', tip: '旅の必需品フレーズ！これは絶対覚えておこう…！', w: '厕所|cèsuǒ 在|zài 哪里|nǎlǐ' },
    zainali: { zh: '在哪里？', py: 'zài nǎlǐ?', ja: 'どこですか？', tip: '場所の名前の後ろにつけるだけ！' },
    zainabian: { zh: '在那边。', py: 'Zài nàbiān.', ja: 'あっちです', tip: '「那边」＝あっち。指さしと一緒に。' },
    zuo:    { zh: '左', py: 'zuǒ', ja: '左', tip: '「往左拐」＝左に曲がる。' },
    you:    { zh: '右', py: 'yòu', ja: '右', tip: '「往右拐」＝右に曲がる。' },
    yizhizou: { zh: '一直走', py: 'yìzhí zǒu', ja: 'まっすぐ行く', tip: '道案内でよく聞く言葉。「走」＝歩く・行く。' },
    dache:  { zh: '我要打车。', py: 'Wǒ yào dǎchē.', ja: 'タクシーに乗りたいです', tip: '「打车」＝タクシーをつかまえる。', w: '我|wǒ 要|yào 打车|dǎchē' },
    yuanma: { zh: '远吗？', py: 'Yuǎn ma?', ja: '遠いですか？', tip: '「远」＝遠い。' },
    henjin: { zh: '很近。', py: 'Hěn jìn.', ja: '近いです', tip: '「近」＝近い。' },
    tingche: { zh: '请在这里停车。', py: 'Qǐng zài zhèlǐ tíngchē.', ja: 'ここで止めてください', tip: 'タクシーを降りたいときに。', w: '请|qǐng 在|zài 这里|zhèlǐ 停车|tíngchē' },

    /* ---- 旅行会話 ---- */
    changcheng: { zh: '长城', py: 'Chángchéng', ja: '万里の長城', tip: '「長い城壁」。全長はなんと2万km以上！' },
    gugong: { zh: '故宫', py: 'Gùgōng', ja: '故宮', tip: '昔の皇帝が住んでいた宮殿。部屋の数は約9000！' },
    tiananmen: { zh: '天安门', py: 'Tiān’ānmén', ja: '天安門', tip: '北京の真ん中にある大きな門。前は天安門広場。' },
    menpiao: { zh: '门票', py: 'ménpiào', ja: '入場券', tip: '「门」＝門、「票」＝チケット。' },
    yizhangpiao: { zh: '我要一张门票。', py: 'Wǒ yào yì zhāng ménpiào.', ja: '入場券を1枚ください', tip: '紙のチケットは「张」で数えるよ。', w: '我|wǒ 要|yào 一张|yì zhāng 门票|ménpiào' },
    paizhao: { zh: '可以拍照吗？', py: 'Kěyǐ pāizhào ma?', ja: '写真を撮ってもいいですか？', tip: '「拍照」＝写真を撮る。', w: '可以|kěyǐ 拍照|pāizhào 吗|ma' },
    bangwo:  { zh: '可以帮我拍照吗？', py: 'Kěyǐ bāng wǒ pāizhào ma?', ja: '写真を撮ってもらえますか？', tip: '「帮我〜」＝私のために〜して。', w: '可以|kěyǐ 帮|bāng 我|wǒ 拍照|pāizhào 吗|ma' },
    taimei:  { zh: '太美了！', py: 'Tài měi le!', ja: 'きれい！', tip: '景色を見たらこれ！「太〜了」は感動にも使えるよ。', w: '太|tài 美|měi 了|le' },
    haolei:  { zh: '好累啊！', py: 'Hǎo lèi a!', ja: '疲れた〜！', tip: '長城の階段を登ったら、きっと言いたくなる…' },
    haohan:  { zh: '不到长城非好汉', py: 'Bú dào Chángchéng fēi hǎohàn', ja: '長城に登らずして好漢にあらず', tip: '毛沢東の詩の一節。長城に登ったらみんなこれを言うよ！', w: '不到|bú dào 长城|Chángchéng 非|fēi 好汉|hǎohàn' },
    tingbudong: { zh: '我听不懂。', py: 'Wǒ tīng bu dǒng.', ja: '聞き取れません', tip: 'わからないときは素直にこれ！', w: '我|wǒ 听|tīng 不|bu 懂|dǒng' },
    manyidian: { zh: '请说慢一点。', py: 'Qǐng shuō màn yìdiǎn.', ja: 'もう少しゆっくり話してください', tip: 'これを言えば、ゆっくり話してくれるよ。', w: '请|qǐng 说|shuō 慢|màn 一点|yìdiǎn' },

    /* ================= ここから Ver.2 で追加 ================= */
    /* ---- 発音・基本の単語・日付 ---- */
    chi:    { zh: '吃', py: 'chī', ja: '食べる', tip: '「ch」は舌を巻いて「チー」。巻き舌の音だよ。' },
    he:     { zh: '喝', py: 'hē', ja: '飲む', tip: '「h」はのどの奥から息を出す「ホ」と「ハ」の間の音。' },
    qugo:   { zh: '去', py: 'qù', ja: '行く', tip: '「q」は「チ」、「ü」は「ユ」の口で「イ」。「チュイ」に近いよ。' },
    yu:     { zh: '鱼', py: 'yú', ja: '魚', tip: '「ü」の音。口をすぼめて「イ」と言う感じ。' },
    da:     { zh: '大', py: 'dà', ja: '大きい', tip: '日本語と同じ漢字！' },
    xiao:   { zh: '小', py: 'xiǎo', ja: '小さい', tip: '「x」は「シ」。小籠包の「小」だね。' },
    duo:    { zh: '多', py: 'duō', ja: '多い', tip: '「多少钱？」の「多」だよ。' },
    shao:   { zh: '少', py: 'shǎo', ja: '少ない', tip: '「多」と「少」で「多少」＝どれくらい。' },
    yiyue:  { zh: '一月', py: 'yīyuè', ja: '1月', tip: '数字＋「月」でそのまま。十二月まで同じ！' },
    xingqiyi: { zh: '星期一', py: 'xīngqīyī', ja: '月曜日', tip: '「星期」＋数字。星期一＝月曜、星期二＝火曜…日曜は「星期天」。' },
    zuotian: { zh: '昨天', py: 'zuótiān', ja: '昨日', tip: '昨天・今天・明天、セットで覚えよう。' },
    jihao:  { zh: '今天几号？', py: 'Jīntiān jǐ hào?', ja: '今日は何日？', tip: '日付の「〜日」は「号」を使うよ。', w: '今天|jīntiān 几|jǐ 号|hào' },

    /* ---- 単語：食べ物 ---- */
    mifan:  { zh: '米饭', py: 'mǐfàn', ja: 'ごはん', tip: '炊いたお米。「饭」だけでも「ごはん・食事」。' },
    miantiao: { zh: '面条', py: 'miàntiáo', ja: '麺', tip: '炸酱面の「面」も麺のこと！' },
    jiaozi: { zh: '饺子', py: 'jiǎozi', ja: '餃子', tip: '北の方では水餃子が定番だよ。' },
    jidan:  { zh: '鸡蛋', py: 'jīdàn', ja: '卵', tip: '「鸡」＝ニワトリ、「蛋」＝たまご。' },
    pingguo: { zh: '苹果', py: 'píngguǒ', ja: 'りんご', tip: 'あのスマホの会社名も中国語だとこれ！' },
    xigua:  { zh: '西瓜', py: 'xīguā', ja: 'スイカ', tip: '日本語と同じ漢字だね。' },
    cha:    { zh: '茶', py: 'chá', ja: 'お茶', tip: '中国はお茶の国。種類もたくさん！' },
    niunai: { zh: '牛奶', py: 'niúnǎi', ja: '牛乳', tip: '「牛のお乳」でそのまま。' },

    /* ---- 単語：動物 ---- */
    mao:    { zh: '猫', py: 'māo', ja: '猫', tip: '鳴き声みたいな音で「マオ」。' },
    gou:    { zh: '狗', py: 'gǒu', ja: '犬', tip: '第3声で低く「ゴウ」。' },
    niao:   { zh: '鸟', py: 'niǎo', ja: '鳥', tip: '北京の胡同では鳥かごを持ったおじいさんも！' },
    cangshu: { zh: '仓鼠', py: 'cāngshǔ', ja: 'ハムスター', tip: 'ぼくのこと！「倉庫のネズミ」って意味なんだ🐹' },
    xiongmao: { zh: '熊猫', py: 'xióngmāo', ja: 'パンダ', tip: '「クマ＋ネコ」でパンダ！' },
    laohu:  { zh: '老虎', py: 'lǎohǔ', ja: 'トラ', tip: '「老」は年寄りじゃなくて、動物の名前につく言葉。' },
    tuzi:   { zh: '兔子', py: 'tùzi', ja: 'ウサギ', tip: '「子」は軽く短く読むよ。' },
    houzi:  { zh: '猴子', py: 'hóuzi', ja: 'サル', tip: '西遊記の孫悟空は「猴王」！' },

    /* ---- 単語：人・家族 ---- */
    baba:   { zh: '爸爸', py: 'bàba', ja: 'お父さん', tip: '2つめの「ba」は軽く。' },
    mama:   { zh: '妈妈', py: 'māma', ja: 'お母さん', tip: '声調の練習で出てきた「妈」だね。' },
    gege:   { zh: '哥哥', py: 'gēge', ja: '兄', tip: '弟は「弟弟（dìdi）」。' },
    meimei: { zh: '妹妹', py: 'mèimei', ja: '妹', tip: '姉は「姐姐（jiějie）」。' },
    pengyou: { zh: '朋友', py: 'péngyou', ja: '友だち', tip: '「好朋友」＝親友。' },
    laoshi: { zh: '老师', py: 'lǎoshī', ja: '先生', tip: '学校の先生。ていねいな呼びかけにも使うよ。' },
    haizi:  { zh: '孩子', py: 'háizi', ja: '子ども', tip: '「小孩」とも言うよ。' },
    laoren: { zh: '老人', py: 'lǎorén', ja: 'お年寄り', tip: '話しかけるときは「大爷（おじいさん）」「大妈（おばあさん）」も使うよ。' },

    /* ---- 単語：学校 ---- */
    xuexiao: { zh: '学校', py: 'xuéxiào', ja: '学校', tip: '日本語と同じ漢字！' },
    shu:    { zh: '书', py: 'shū', ja: '本', tip: '「書」の簡体字。' },
    bi:     { zh: '笔', py: 'bǐ', ja: 'ペン', tip: '書くもの全般。鉛筆は「铅笔」。' },
    kaoshi: { zh: '考试', py: 'kǎoshì', ja: '試験', tip: '「考える＋試す」。' },
    shangke: { zh: '上课', py: 'shàngkè', ja: '授業を受ける', tip: '「上」は始める、「下课」で授業が終わる。' },
    zuoye:  { zh: '作业', py: 'zuòyè', ja: '宿題', tip: '「做作业」＝宿題をする。' },
    tongxue: { zh: '同学', py: 'tóngxué', ja: 'クラスメート', tip: '「同じ学び」でクラスメート。' },
    hanyu:  { zh: '汉语', py: 'Hànyǔ', ja: '中国語', tip: '「中文」とも言うよ。' },

    /* ---- 単語：仕事 ---- */
    gongzuo: { zh: '工作', py: 'gōngzuò', ja: '仕事', tip: '「工作」は動詞「働く」にもなるよ。' },
    gongsi: { zh: '公司', py: 'gōngsī', ja: '会社', tip: '「司」は「つかさどる」。' },
    yisheng: { zh: '医生', py: 'yīshēng', ja: '医者', tip: '日本語の「医生」とは意味が違うので注意！' },
    jingcha: { zh: '警察', py: 'jǐngchá', ja: '警察', tip: '日本語と同じ漢字！' },
    fuwuyuan: { zh: '服务员', py: 'fúwùyuán', ja: '店員さん', tip: 'お店で「服务员！」と呼ぶと来てくれるよ。' },
    siji:   { zh: '司机', py: 'sījī', ja: '運転手', tip: 'タクシーの運転手さんは「师傅」と呼ぶことも。' },
    shangban: { zh: '上班', py: 'shàngbān', ja: '出勤する', tip: '「上课」と同じ「上」！' },
    xiaban: { zh: '下班', py: 'xiàbān', ja: '仕事が終わる', tip: '「下班了！」＝お仕事おわり！' },

    /* ---- 単語：趣味・武術 ---- */
    kanshu: { zh: '看书', py: 'kàn shū', ja: '本を読む', tip: '「看」＝見る・読む。' },
    tingyinyue: { zh: '听音乐', py: 'tīng yīnyuè', ja: '音楽を聴く', tip: '「听」＝聞く。' },
    changge: { zh: '唱歌', py: 'chàng gē', ja: '歌う', tip: 'カラオケは「卡拉OK」！' },
    tiaowu: { zh: '跳舞', py: 'tiào wǔ', ja: '踊る', tip: '広場で踊るおばさんたちは「广场舞」。' },
    youyong: { zh: '游泳', py: 'yóuyǒng', ja: '泳ぐ', tip: '「游」も「泳」も泳ぐこと。' },
    lanqiu: { zh: '打篮球', py: 'dǎ lánqiú', ja: 'バスケをする', tip: '球技は「打」を使うよ。' },
    lvyou:  { zh: '旅游', py: 'lǚyóu', ja: '旅行する', tip: '今のぼくたちだね！' },
    youxi:  { zh: '玩游戏', py: 'wán yóuxì', ja: 'ゲームをする', tip: '「玩」＝遊ぶ。' },
    gongfu: { zh: '功夫', py: 'gōngfu', ja: 'カンフー', tip: 'もとは「時間をかけて身につけた技」って意味なんだ。' },
    wushu:  { zh: '武术', py: 'wǔshù', ja: '武術', tip: '少林寺は武術の聖地！' },
    shifu:  { zh: '师父', py: 'shīfu', ja: '師匠', tip: '武術やお寺の先生を呼ぶときに使うよ。' },
    bisai:  { zh: '比赛', py: 'bǐsài', ja: '試合・大会', tip: '武術大会は「武术比赛」。' },
    tiao:   { zh: '跳', py: 'tiào', ja: '跳ぶ', tip: '試合で「跳！」と聞こえたらジャンプ！' },
    dun:    { zh: '蹲', py: 'dūn', ja: 'しゃがむ', tip: '「蹲！」で低くしゃがんでよけよう。' },
    quan:   { zh: '拳', py: 'quán', ja: '拳（パンチ）', tip: '少林拳の「拳」。' },
    tui:    { zh: '腿', py: 'tuǐ', ja: '蹴り（足）', tip: '「腿」は足のこと。武術では蹴り技。' },
    amituofo: { zh: '阿弥陀佛', py: 'Ēmítuófó', ja: '（お坊さんのあいさつ）', tip: '少林寺のお坊さんは手を合わせてこう言うよ。' },
    baoquan: { zh: '抱拳礼', py: 'bàoquán lǐ', ja: '拳をつつむ礼', tip: '右の拳を左の手のひらでつつむ、武術のあいさつ。' },

    /* ---- 単語：日常生活 ---- */
    qichuang: { zh: '起床', py: 'qǐchuáng', ja: '起きる', tip: '「床（ベッド）から起きる」。' },
    shuijiao: { zh: '睡觉', py: 'shuìjiào', ja: '寝る', tip: '「晚安」と一緒に覚えよう。' },
    xizao:  { zh: '洗澡', py: 'xǐzǎo', ja: 'お風呂に入る', tip: 'シャワーも「洗澡」。' },
    chifan: { zh: '吃饭', py: 'chī fàn', ja: 'ご飯を食べる', tip: '「吃饭了吗？」はあいさつにもなるよ。' },
    shouji: { zh: '手机', py: 'shǒujī', ja: '携帯電話', tip: '「手の機械」でスマホ。' },
    qian:   { zh: '钱', py: 'qián', ja: 'お金', tip: '「多少钱」の「钱」！' },
    yifu:   { zh: '衣服', py: 'yīfu', ja: '服', tip: '「服」は軽く読むよ。' },
    jia:    { zh: '家', py: 'jiā', ja: '家', tip: '「回家」＝家に帰る。' },

    /* ---- 単語：場所・交通 ---- */
    yinhang: { zh: '银行', py: 'yínháng', ja: '銀行', tip: '「行」はここでは「háng」と読むよ。' },
    yiyuan: { zh: '医院', py: 'yīyuàn', ja: '病院', tip: '「医」＋「院」。' },
    chaoshi: { zh: '超市', py: 'chāoshì', ja: 'スーパー', tip: '「超级市场」の略。' },
    gongyuan: { zh: '公园', py: 'gōngyuán', ja: '公園', tip: '朝の公園は太極拳をする人でいっぱい！' },
    huochezhan: { zh: '火车站', py: 'huǒchēzhàn', ja: '駅（鉄道）', tip: '「火车」＝汽車・列車。高速鉄道は「高铁」。' },
    jichang: { zh: '机场', py: 'jīchǎng', ja: '空港', tip: '「飞机」の「机」＋「场」。' },
    chuzuche: { zh: '出租车', py: 'chūzūchē', ja: 'タクシー', tip: '「打车」＝タクシーに乗る。' },
    gongjiao: { zh: '公交车', py: 'gōngjiāochē', ja: 'バス', tip: '路線バスのこと。' },
    hutong: { zh: '胡同', py: 'hútòng', ja: '胡同（路地）', tip: '北京の古い路地。昔ながらの暮らしが残っているよ。' },
    gaotie: { zh: '高铁', py: 'gāotiě', ja: '高速鉄道', tip: '中国の新幹線！北京から少林寺のある河南省まで約2時間半。' },

    /* ---- 文法：語順 ---- */
    wochimifan: { zh: '我吃米饭。', py: 'Wǒ chī mǐfàn.', ja: '私はごはんを食べます', tip: '「私・食べる・ごはん」。動詞が目的語の前！', w: '我|wǒ 吃|chī 米饭|mǐfàn' },
    tahecha: { zh: '他喝茶。', py: 'Tā hē chá.', ja: '彼はお茶を飲みます', tip: '主語・動詞・目的語（S＋V＋O）。英語と同じ順番。', w: '他|tā 喝|hē 茶|chá' },
    woxuexi: { zh: '我学习汉语。', py: 'Wǒ xuéxí Hànyǔ.', ja: '私は中国語を勉強します', tip: '「学习」＝勉強する。', w: '我|wǒ 学习|xuéxí 汉语|Hànyǔ' },
    nikanshu: { zh: '你看书。', py: 'Nǐ kàn shū.', ja: 'あなたは本を読みます', w: '你|nǐ 看|kàn 书|shū' },
    wojintianqu: { zh: '我今天去北京。', py: 'Wǒ jīntiān qù Běijīng.', ja: '私は今日北京へ行きます', tip: '「いつ」は動詞の前に置くよ。', w: '我|wǒ 今天|jīntiān 去|qù 北京|Běijīng' },
    wozaijia: { zh: '我在家吃饭。', py: 'Wǒ zài jiā chī fàn.', ja: '私は家でご飯を食べます', tip: '「どこで」も動詞の前。「在＋場所」。', w: '我|wǒ 在|zài 家|jiā 吃饭|chī fàn' },
    tamingtian: { zh: '他明天上班。', py: 'Tā míngtiān shàngbān.', ja: '彼は明日出勤します', w: '他|tā 明天|míngtiān 上班|shàngbān' },

    /* ---- 文法：疑問文 ---- */
    nishixuesheng: { zh: '你是学生吗？', py: 'Nǐ shì xuésheng ma?', ja: 'あなたは学生ですか？', tip: '文の最後に「吗」。', w: '你|nǐ 是|shì 学生|xuésheng 吗|ma' },
    nixihuanmao: { zh: '你喜欢猫吗？', py: 'Nǐ xǐhuan māo ma?', ja: '猫は好きですか？', w: '你|nǐ 喜欢|xǐhuan 猫|māo 吗|ma' },
    nichishenme: { zh: '你吃什么？', py: 'Nǐ chī shénme?', ja: '何を食べますか？', tip: '「什么」＝なに。答えの位置にそのまま入れる！', w: '你|nǐ 吃|chī 什么|shénme' },
    tashishei: { zh: '他是谁？', py: 'Tā shì shéi?', ja: '彼は誰ですか？', tip: '「谁」＝だれ。', w: '他|tā 是|shì 谁|shéi' },
    niqunar: { zh: '你去哪儿？', py: 'Nǐ qù nǎr?', ja: 'どこへ行くの？', tip: '「哪儿」は北京っぽい言い方。「哪里」と同じ意味。', w: '你|nǐ 去|qù 哪儿|nǎr' },
    jigegege: { zh: '你有几个哥哥？', py: 'Nǐ yǒu jǐ ge gēge?', ja: 'お兄さんは何人いますか？', tip: '「几」＝いくつ（10より少ない数を聞く）。', w: '你|nǐ 有|yǒu 几个|jǐ ge 哥哥|gēge' },
    shibushi: { zh: '你是不是日本人？', py: 'Nǐ shì bu shì Rìběn rén?', ja: 'あなたは日本人ですか？（はい・いいえ）', tip: '「是不是」のように肯定＋否定を並べても質問になるよ。', w: '你|nǐ 是不是|shì bu shì 日本人|Rìběn rén' },
    haobuhao: { zh: '好不好？', py: 'Hǎo bu hǎo?', ja: 'いい？／どう？', tip: '誘うときによく使う！' },

    /* ---- 文法：否定文 ---- */
    wobuchila: { zh: '我不吃辣。', py: 'Wǒ bù chī là.', ja: '私は辛いものを食べません', tip: '「不」＝しない（意志・習慣）。', w: '我|wǒ 不|bù 吃|chī 辣|là' },
    tabuqu: { zh: '他不去。', py: 'Tā bú qù.', ja: '彼は行きません', tip: '第4声の前なので「bú」。', w: '他|tā 不|bú 去|qù' },
    womeiyouqian: { zh: '我没有钱。', py: 'Wǒ méiyǒu qián.', ja: 'お金がありません', tip: '「有」の否定は「没有」。「不有」とは言わないよ。', w: '我|wǒ 没有|méiyǒu 钱|qián' },
    tameilai: { zh: '他没来。', py: 'Tā méi lái.', ja: '彼は来なかった', tip: '「没」＝しなかった（過去の否定）。', w: '他|tā 没|méi 来|lái' },

    /* ---- 文法：形容詞 ---- */
    henda:  { zh: '很大', py: 'hěn dà', ja: '大きい', tip: '形容詞の前に「很」をつけるのが基本。' },
    hengui: { zh: '很贵', py: 'hěn guì', ja: '（値段が）高い', tip: '「太贵了」の「贵」。' },
    piaoliang: { zh: '很漂亮', py: 'hěn piàoliang', ja: 'きれい', tip: '人にも景色にも使えるよ。' },
    henmang: { zh: '很忙', py: 'hěn máng', ja: '忙しい', tip: '「你忙吗？」＝忙しい？' },
    zhegehaochi: { zh: '这个很好吃。', py: 'Zhège hěn hǎochī.', ja: 'これはおいしい', tip: '形容詞の文には「是」がいらない！', w: '这个|zhège 很|hěn 好吃|hǎochī' },
    jintianre: { zh: '今天很热。', py: 'Jīntiān hěn rè.', ja: '今日は暑い', w: '今天|jīntiān 很|hěn 热|rè' },
    tabiwogao: { zh: '他比我高。', py: 'Tā bǐ wǒ gāo.', ja: '彼は私より背が高い', tip: '「A 比 B ＋形容詞」で比べる。', w: '他|tā 比|bǐ 我|wǒ 高|gāo' },

    /* ---- 文法：時制・アスペクト ---- */
    wochile: { zh: '我吃了。', py: 'Wǒ chī le.', ja: '食べました', tip: '動詞の後ろの「了」＝〜した（完了）。', w: '我|wǒ 吃|chī 了|le' },
    womaishu: { zh: '我买了一本书。', py: 'Wǒ mǎi le yì běn shū.', ja: '本を1冊買いました', tip: '本は「本」で数えるよ。', w: '我|wǒ 买了|mǎi le 一本|yì běn 书|shū' },
    woquguo: { zh: '我去过北京。', py: 'Wǒ qù guo Běijīng.', ja: '北京に行ったことがあります', tip: '「过」＝〜したことがある（経験）。', w: '我|wǒ 去过|qù guo 北京|Běijīng' },
    wochiguo: { zh: '我吃过烤鸭。', py: 'Wǒ chī guo kǎoyā.', ja: '北京ダックを食べたことがあります', w: '我|wǒ 吃过|chī guo 烤鸭|kǎoyā' },
    wozaikan: { zh: '我在看书。', py: 'Wǒ zài kàn shū.', ja: '本を読んでいるところです', tip: '動詞の前の「在」＝〜しているところ（進行）。', w: '我|wǒ 在|zài 看|kàn 书|shū' },
    woyaoquzg: { zh: '我要去中国。', py: 'Wǒ yào qù Zhōngguó.', ja: '中国へ行くつもりです', tip: '「要」＝〜するつもり・〜したい（これから）。', w: '我|wǒ 要|yào 去|qù 中国|Zhōngguó' },
    xiayu:  { zh: '明天要下雨。', py: 'Míngtiān yào xià yǔ.', ja: '明日は雨が降りそうです', tip: '「要」は「〜しそう」にもなるよ。', w: '明天|míngtiān 要|yào 下雨|xià yǔ' },

    /* ---- 読解 ---- */
    jinnian: { zh: '今年', py: 'jīnnián', ja: '今年', tip: '今天・今年。「今」が付けば「この」。' },
    sui:    { zh: '岁', py: 'suì', ja: '〜歳', tip: '「你几岁？」＝何歳？（子どもに聞くとき）' },
    re:     { zh: '热', py: 'rè', ja: '暑い・熱い', tip: '寒いは「冷（lěng）」。' },
    bing:   { zh: '冰', py: 'bīng', ja: '氷・冷たい', tip: '「冰水」＝冷たい水。' },
    xiawu:  { zh: '下午', py: 'xiàwǔ', ja: '午後', tip: '午前は「上午」。' },
    menkou: { zh: '门口', py: 'ménkǒu', ja: '入口・門の前', tip: '待ち合わせによく使う言葉。' },
    mang:   { zh: '忙', py: 'máng', ja: '忙しい', tip: '日本語と同じ漢字！' },
    buneng: { zh: '不能', py: 'bù néng', ja: '〜できない', tip: '「能」＝できる。' },

    /* ---- 会話：友だち ---- */
    ganshenme: { zh: '你在干什么？', py: 'Nǐ zài gàn shénme?', ja: '何してるの？', tip: '友だちどうしの気軽な言い方。', w: '你|nǐ 在|zài 干|gàn 什么|shénme' },
    yiqiqu: { zh: '一起去吧！', py: 'Yìqǐ qù ba!', ja: '一緒に行こう！', tip: '文の最後の「吧」＝〜しよう！', w: '一起|yìqǐ 去|qù 吧|ba' },
    taihaole: { zh: '太好了！', py: 'Tài hǎo le!', ja: 'やった！よかった！', tip: 'うれしいときのひとこと。' },
    zhendema: { zh: '真的吗？', py: 'Zhēn de ma?', ja: '本当？', tip: 'おどろいたときに。' },
    woyeshi: { zh: '我也是。', py: 'Wǒ yě shì.', ja: '私もです', tip: '「也」＝〜も。' },
    meiwenti: { zh: '没问题！', py: 'Méi wèntí!', ja: '問題ない！OK！', tip: '頼まれごとへの気持ちいい返事。' },
    xiacijian: { zh: '下次见！', py: 'Xià cì jiàn!', ja: 'また今度！', tip: '「下次」＝次回。' },
    jiayou: { zh: '加油！', py: 'Jiāyóu!', ja: 'がんばれ！', tip: 'もとは「油を足す」。応援の定番！' },

    /* ---- 会話：電話・メッセージ ---- */
    wei:    { zh: '喂？', py: 'Wéi?', ja: 'もしもし', tip: '電話では第2声で「ウェイ？」と上げるよ。' },
    naweisi: { zh: '请问，您是哪位？', py: 'Qǐngwèn, nín shì nǎ wèi?', ja: 'どちら様ですか？', tip: '「哪位」＝どなた（ていねい）。', w: '请问|qǐngwèn 您|nín 是|shì 哪位|nǎ wèi' },
    zhaowang: { zh: '我找王老师。', py: 'Wǒ zhǎo Wáng lǎoshī.', ja: '王先生をお願いします', tip: '「找」＝さがす・たずねる。電話の取り次ぎで使うよ。', w: '我|wǒ 找|zhǎo 王老师|Wáng lǎoshī' },
    dengyixia: { zh: '请等一下。', py: 'Qǐng děng yíxià.', ja: '少々お待ちください', tip: '屋台でも電話でも使えるよ。', w: '请|qǐng 等|děng 一下|yíxià' },
    faweixin: { zh: '我给你发微信。', py: 'Wǒ gěi nǐ fā Wēixìn.', ja: 'WeChat を送るね', tip: '中国ではメッセージは WeChat（微信）が定番。', w: '我|wǒ 给|gěi 你|nǐ 发|fā 微信|Wēixìn' },
    shoudao: { zh: '收到！', py: 'Shōudào!', ja: '了解！（受け取ったよ）', tip: 'メッセージの返事でよく使う！' },
    haoma:  { zh: '你的电话号码是多少？', py: 'Nǐ de diànhuà hàomǎ shì duōshao?', ja: '電話番号は何番？', tip: '番号を聞くときも「多少」。', w: '你的|nǐ de 电话|diànhuà 号码|hàomǎ 是|shì 多少|duōshao' },
    huitouliao: { zh: '回头聊！', py: 'Huítóu liáo!', ja: 'またあとでね！', tip: '「回头」＝あとで、「聊」＝おしゃべりする。' },
  };

  App.phrase = (id) => Object.assign({ id }, App.PHRASES[id]);

  // 並べ替え用：'我|wǒ 是|shì' → [{zh:'我',py:'wǒ'}, ...]
  App.phraseWords = (id) => {
    const p = App.PHRASES[id];
    if (!p || !p.w) return null;
    // ピンインの中のスペース（Rìběn rén）では切らず、次の「中国語|」の前でだけ切る
    return p.w.split(/ (?=[^ |]+\|)/).map((t) => {
      const [zh, py = ''] = t.split('|');
      return { zh, py };
    });
  };
})(window.App = window.App || {});
