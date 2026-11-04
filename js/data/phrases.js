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
