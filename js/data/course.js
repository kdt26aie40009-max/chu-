/* 2D 学習コース（Duolingo 風）
 * 4 つのカテゴリ（基礎・単語・文法と文章・会話）から自由に選んで学べる。
 * カテゴリの中では、ユニット → レッスンを上から順にクリアしていく。各ユニットの最後には「まとめ」が自動で付く。
 * 2D の進み具合は 3D 旅行の解放条件には使わない（2D と 3D は独立したモード）。
 *
 * cat:    { id, title, emoji, desc, units: [unit] }
 * unit:   { id, title, emoji, color, desc, lessons: [lesson] }
 * lesson: { id, title, ids: [phraseId], notes?: [html], tutorial?, reads?: [read], dialogue? }
 *   ids      … このレッスンで覚える言葉（js/data/phrases.js）
 *   notes    … 問題の前にハムスターが説明する文法・ポイント
 *   reads    … 読解問題 { zh, py, ja, q, options: [正解, ...], answer: 0 }
 *   dialogue … 会話ロールプレイ（js/data/dialogues.js の id）。最後にチャット形式の会話をする
 * lesson / unit の id はセーブデータに使うので変えないこと。
 */
(function (App) {
  'use strict';

  const cats = [
    /* ====================== 基礎 ====================== */
    {
      id: 'basic', title: '基礎', emoji: '🔤', desc: 'ピンイン・声調・発音・数字・時間',
      units: [
        {
          id: 'u1', title: '中国語の基本', emoji: '🔤', color: '#2BB5A0',
          desc: 'ピンイン・声調・発音と、いちばん基本の言葉',
          lessons: [
            {
              id: 'u1-1', title: 'はじめての中国語', ids: ['wo', 'ni', 'ta', 'hao'], tutorial: true,
              notes: [
                '中国語は<b>漢字</b>で書いて、読み方は<b>ピンイン</b>（ローマ字みたいなもの）で表すよ。<br><span class="zh">我</span> → <b>wǒ</b>',
                'ピンインの上の記号（ˉ ˊ ˇ ˋ）は<b>声調</b>＝音の高さ。<br>最初は「なんとなく」で大丈夫！🔊でまねしてみよう',
              ],
            },
            {
              id: 'u1-2', title: '4つの声調', ids: ['ma1', 'ma2', 'ma3', 'ma4'],
              notes: ['同じ「ma」でも、音の高さで意味が変わるよ！<br>① <b>mā</b> 高く平ら　② <b>má</b> 上がる<br>③ <b>mǎ</b> 下がって上がる　④ <b>mà</b> ストンと下がる'],
            },
            {
              id: 'u1-3', title: '「是」「不」「吗」', ids: ['shi', 'bu', 'hen', 'nihaoma', 'wohenhao'],
              notes: [
                '<b>文法①</b> 文の最後に <span class="zh">吗</span>（ma）をつけると<b>質問</b>になるよ。<br><span class="zh">你好。</span> → <span class="zh">你好吗？</span>（元気？）',
                '<b>文法②</b> 中国語は<b>「私・とても・元気」</b>の順番。<br><span class="zh">我很好。</span>＝私は元気です',
              ],
            },
            {
              id: 'u1-4', title: '発音のコツ', ids: ['chi', 'he', 'qugo', 'yu'],
              notes: [
                '<b>そり舌音</b> zh・ch・sh・r は、舌先を上にそらせて出す音。<br><span class="zh">吃</span> chī（食べる）',
                '<b>j・q・x</b> は「ジ・チ・シ」に近い音。<b>ü</b> は口をすぼめて「イ」。<br><span class="zh">去</span> qù、<span class="zh">鱼</span> yú',
              ],
            },
            { id: 'u1-5', title: '基本の単語', ids: ['da', 'xiao', 'duo', 'shao'] },
          ],
        },
        {
          id: 'u5', title: '数字・時間', emoji: '🔢', color: '#F5B92E',
          desc: '1〜20・値段・番号・時間・日付',
          lessons: [
            { id: 'u5-1', title: '数字 1〜5', ids: ['n1', 'n2', 'n3', 'n4', 'n5'] },
            { id: 'u5-2', title: '数字 6〜10', ids: ['n6', 'n7', 'n8', 'n9', 'n10'] },
            {
              id: 'u5-3', title: 'お金と番号', ids: ['n15', 'n20', 'liang', 'kuai', 'haonum'],
              notes: ['数字は日本語と同じ組み立て方！<br><span class="zh">十五</span>＝15、<span class="zh">二十</span>＝20<br>でも「2つ」「2元」は <span class="zh">两</span>（liǎng）になるよ'],
            },
            { id: 'u5-4', title: '時間', ids: ['jidian', 'sandian', 'jintian', 'mingtian'] },
            { id: 'u5-5', title: '日付・曜日', ids: ['yiyue', 'xingqiyi', 'zuotian', 'jihao'] },
          ],
        },
      ],
    },

    /* ====================== 単語 ====================== */
    {
      id: 'vocab', title: '単語', emoji: '📚', desc: '食べ物・動物・家族・学校・仕事・趣味・生活・場所',
      units: [
        {
          id: 'v1', title: '食べ物', emoji: '🍚', color: '#E67E22', desc: 'ごはん・麺・果物・飲み物',
          lessons: [
            { id: 'v1-1', title: '主食とおかず', ids: ['mifan', 'miantiao', 'jiaozi', 'jidan'] },
            { id: 'v1-2', title: '果物と飲み物', ids: ['pingguo', 'xigua', 'cha', 'niunai'] },
          ],
        },
        {
          id: 'v2', title: '動物', emoji: '🐼', color: '#27AE60', desc: '身近な動物から中国の動物まで',
          lessons: [
            { id: 'v2-1', title: '身近な動物', ids: ['mao', 'gou', 'niao', 'cangshu'] },
            { id: 'v2-2', title: '動物園の動物', ids: ['xiongmao', 'laohu', 'tuzi', 'houzi'] },
          ],
        },
        {
          id: 'v3', title: '人・家族', emoji: '👪', color: '#E86F9A', desc: '家族・友だち・まわりの人',
          lessons: [
            { id: 'v3-1', title: '家族', ids: ['baba', 'mama', 'gege', 'meimei'] },
            { id: 'v3-2', title: 'まわりの人', ids: ['pengyou', 'laoshi', 'haizi', 'laoren'] },
          ],
        },
        {
          id: 'v4', title: '学校', emoji: '🏫', color: '#4FA3D9', desc: '勉強・教室の言葉',
          lessons: [
            { id: 'v4-1', title: '学校のもの', ids: ['xuexiao', 'shu', 'bi', 'kaoshi'] },
            { id: 'v4-2', title: '授業', ids: ['shangke', 'zuoye', 'tongxue', 'hanyu'] },
          ],
        },
        {
          id: 'v5', title: '仕事', emoji: '💼', color: '#5D6D7E', desc: '職業・会社',
          lessons: [
            { id: 'v5-1', title: '仕事と職業', ids: ['gongzuo', 'gongsi', 'yisheng', 'jingcha'] },
            { id: 'v5-2', title: '街ではたらく人', ids: ['fuwuyuan', 'siji', 'shangban', 'xiaban'] },
          ],
        },
        {
          id: 'v6', title: '趣味・武術', emoji: '🥋', color: '#8E44AD', desc: '好きなこと・カンフーの言葉',
          lessons: [
            { id: 'v6-1', title: '趣味①', ids: ['kanshu', 'tingyinyue', 'changge', 'tiaowu'] },
            { id: 'v6-2', title: '趣味②', ids: ['youyong', 'lanqiu', 'lvyou', 'youxi'] },
            { id: 'v6-3', title: 'カンフーの世界', ids: ['gongfu', 'wushu', 'shifu', 'bisai'] },
            {
              id: 'v6-4', title: '武術の動き', ids: ['tiao', 'dun', 'quan', 'tui'],
              notes: ['少林寺の武術大会では、掛け声を聞いて動くよ！<br><span class="zh">跳</span>＝跳ぶ、<span class="zh">蹲</span>＝しゃがむ<br><span class="zh">拳</span>＝パンチ、<span class="zh">腿</span>＝キック'],
            },
            {
              id: 'v6-5', title: '少林寺のあいさつ', ids: ['amituofo', 'baoquan', 'shifu', 'gongfu'],
              notes: ['お坊さんには手を合わせて <span class="zh">阿弥陀佛</span>。<br>武術の礼は <span class="zh">抱拳礼</span>（右の拳を左の手のひらでつつむ）'],
            },
          ],
        },
        {
          id: 'v7', title: '日常生活', emoji: '🏠', color: '#16A085', desc: '1日の生活・身の回りのもの',
          lessons: [
            { id: 'v7-1', title: '1日の生活', ids: ['qichuang', 'shuijiao', 'xizao', 'chifan'] },
            { id: 'v7-2', title: '身の回りのもの', ids: ['shouji', 'qian', 'yifu', 'jia'] },
          ],
        },
        {
          id: 'v8', title: '場所・交通', emoji: '🚉', color: '#2F6FA8', desc: '街の場所・乗り物',
          lessons: [
            { id: 'v8-1', title: '街の場所', ids: ['yinhang', 'yiyuan', 'chaoshi', 'gongyuan'] },
            { id: 'v8-2', title: '乗り物', ids: ['huochezhan', 'jichang', 'chuzuche', 'gongjiao'] },
            { id: 'v8-3', title: '北京の街', ids: ['hutong', 'gaotie', 'beijing', 'tiananmen'] },
          ],
        },
      ],
    },

    /* ====================== 文法と文章 ====================== */
    {
      id: 'grammar', title: '文法と文章', emoji: '🧩', desc: '語順・疑問文・否定文・形容詞・時制・読解',
      units: [
        {
          id: 'g1', title: '語順の基本', emoji: '➡️', color: '#2BB5A0', desc: '主語・動詞・目的語の順番',
          lessons: [
            {
              id: 'g1-1', title: '主語＋動詞＋目的語', ids: ['wochimifan', 'tahecha', 'woxuexi', 'nikanshu'],
              notes: ['中国語の基本の順番は<br><b>主語 ＋ 動詞 ＋ 目的語</b>（英語と同じ！）<br><span class="zh">我 吃 米饭。</span>＝私は・食べる・ごはんを'],
            },
            {
              id: 'g1-2', title: '「いつ」「どこで」の位置', ids: ['wojintianqu', 'wozaijia', 'tamingtian'],
              notes: ['「いつ」「どこで」は<b>動詞の前</b>に置くよ。<br><span class="zh">我 今天 去 北京。</span><br><span class="zh">我 在家 吃饭。</span>'],
            },
          ],
        },
        {
          id: 'g2', title: '疑問文', emoji: '❓', color: '#F5B92E', desc: '吗・疑問詞・反復疑問',
          lessons: [
            {
              id: 'g2-1', title: '「吗」で聞く', ids: ['nishixuesheng', 'nixihuanmao', 'nihaoma'],
              notes: ['ふつうの文の最後に <span class="zh">吗</span> をつけるだけで質問になるよ。'],
            },
            {
              id: 'g2-2', title: '疑問詞で聞く', ids: ['nichishenme', 'tashishei', 'niqunar', 'jigegege'],
              notes: ['<span class="zh">什么</span>（なに）・<span class="zh">谁</span>（だれ）・<span class="zh">哪儿</span>（どこ）・<span class="zh">几</span>（いくつ）は、<br><b>答えが入る場所にそのまま置く</b>よ。このときは「吗」はいらない！'],
            },
            {
              id: 'g2-3', title: '「是不是」で聞く', ids: ['shibushi', 'haobuhao'],
              notes: ['<b>肯定＋否定</b>を並べても質問になるよ。<br><span class="zh">是不是？</span>・<span class="zh">好不好？</span>'],
            },
          ],
        },
        {
          id: 'g3', title: '否定文', emoji: '🙅', color: '#E74C3C', desc: '不 と 没 の使い分け',
          lessons: [
            {
              id: 'g3-1', title: '「不」の否定', ids: ['wobuchila', 'tabuqu', 'bushi'],
              notes: ['<span class="zh">不</span>＝「しない」（意志・習慣・ふだんのこと）。<br>動詞の前に置くよ。'],
            },
            {
              id: 'g3-2', title: '「没」の否定', ids: ['womeiyouqian', 'tameilai'],
              notes: ['<span class="zh">没</span>＝「しなかった」「ない」。<br>「有（ある）」の否定は必ず <span class="zh">没有</span>！'],
            },
          ],
        },
        {
          id: 'g4', title: '形容詞', emoji: '🌈', color: '#8E44AD', desc: '「〜い」の言い方・比べる',
          lessons: [
            { id: 'g4-1', title: '形容詞の基本', ids: ['henda', 'hengui', 'piaoliang', 'henmang'] },
            {
              id: 'g4-2', title: '形容詞の文・比較', ids: ['zhegehaochi', 'jintianre', 'tabiwogao'],
              notes: ['形容詞の文に <span class="zh">是</span> はいらない！<br><span class="zh">今天很热。</span>（今日は暑い）<br>比べるときは <b>A 比 B ＋形容詞</b>'],
            },
          ],
        },
        {
          id: 'g5', title: '時制・アスペクト', emoji: '⏳', color: '#2F6FA8', desc: '了・过・在・要',
          lessons: [
            {
              id: 'g5-1', title: '「了」〜した', ids: ['wochile', 'womaishu'],
              notes: ['中国語に「過去形」はないよ。<br>動詞の後ろの <span class="zh">了</span> で「〜した（完了）」を表す。'],
            },
            {
              id: 'g5-2', title: '「过」〜したことがある', ids: ['woquguo', 'wochiguo'],
              notes: ['<span class="zh">过</span>＝経験。「〜したことがある」。'],
            },
            {
              id: 'g5-3', title: '「在」「要」今とこれから', ids: ['wozaikan', 'woyaoquzg', 'xiayu'],
              notes: ['<span class="zh">在＋動詞</span>＝〜しているところ<br><span class="zh">要＋動詞</span>＝これから〜する・〜しそう'],
            },
          ],
        },
        {
          id: 'g6', title: '読解', emoji: '📖', color: '#7A5236', desc: '短い文章を読んで意味をつかむ',
          lessons: [
            {
              id: 'g6-1', title: '自己紹介を読む', ids: ['jinnian', 'sui', 're', 'bing'],
              reads: [
                { zh: '我叫小明。我是中国人。我今年十岁。', py: 'Wǒ jiào Xiǎo Míng. Wǒ shì Zhōngguó rén. Wǒ jīnnián shí suì.', ja: '私は小明です。中国人です。今年10歳です。',
                  q: '小明は何歳？', options: ['10歳', '4歳', '7歳'] },
                { zh: '今天很热。我想喝冰水。', py: 'Jīntiān hěn rè. Wǒ xiǎng hē bīng shuǐ.', ja: '今日は暑い。冷たい水が飲みたい。',
                  q: '何が飲みたい？', options: ['冷たい水', '熱いお茶', '牛乳'] },
                { zh: '我妈妈是医生，我爸爸是老师。', py: 'Wǒ māma shì yīshēng, wǒ bàba shì lǎoshī.', ja: '母は医者で、父は先生です。',
                  q: 'お父さんの仕事は？', options: ['先生', '医者', '運転手'] },
              ],
            },
            {
              id: 'g6-2', title: 'メッセージを読む', ids: ['xiawu', 'menkou', 'mang', 'buneng'],
              reads: [
                { zh: '明天下午三点，我们在学校门口见。', py: 'Míngtiān xiàwǔ sān diǎn, wǒmen zài xuéxiào ménkǒu jiàn.', ja: '明日の午後3時、学校の門の前で会おう。',
                  q: '何時に会う？', options: ['明日の午後3時', '今日の午後3時', '明日の午前10時'] },
                { zh: '我在超市，你要什么？', py: 'Wǒ zài chāoshì, nǐ yào shénme?', ja: 'スーパーにいるよ。何がほしい？',
                  q: 'この人はどこにいる？', options: ['スーパー', '銀行', '学校'] },
                { zh: '对不起，我今天很忙，不能去。', py: 'Duìbuqǐ, wǒ jīntiān hěn máng, bù néng qù.', ja: 'ごめん、今日は忙しくて行けない。',
                  q: 'この人はどうする？', options: ['今日は行けない', 'もうすぐ着く', '明日は忙しい'] },
              ],
            },
          ],
        },
      ],
    },

    /* ====================== 会話 ====================== */
    {
      id: 'talk', title: '会話', emoji: '💬', desc: 'あいさつ・友だち・買い物・食事・道案内・旅行・電話',
      units: [
        {
          id: 'u2', title: 'あいさつ', emoji: '👋', color: '#FF8A3D',
          desc: 'こんにちは・ありがとう・ごめんなさい',
          lessons: [
            { id: 'u2-1', title: '基本のあいさつ', ids: ['nihao', 'xiexie', 'zaijian', 'ninhao'] },
            { id: 'u2-2', title: '朝・夜のあいさつ', ids: ['zaoshang', 'wanshang', 'wanan', 'mingtianjian'] },
            {
              id: 'u2-3', title: 'お礼とおわび', ids: ['duibuqi', 'meiguanxi', 'bukeqi', 'buhaoyisi'],
              notes: ['セットで覚えよう！<br><span class="zh">谢谢</span> → <span class="zh">不客气</span>（どういたしまして）<br><span class="zh">对不起</span> → <span class="zh">没关系</span>（大丈夫）'],
            },
          ],
        },
        {
          id: 'u3', title: '自己紹介', emoji: '🙋', color: '#E86F9A',
          desc: '名前・国・好きなもの',
          lessons: [
            {
              id: 'u3-1', title: '名前と国', ids: ['wojiao', 'nijiao', 'ribenren', 'zhongguoren'],
              notes: ['<b>文法</b> <span class="zh">A 是 B</span> で「A は B です」。<br><span class="zh">我是日本人。</span>＝私は日本人です'],
            },
            { id: 'u3-2', title: 'もっと自己紹介', ids: ['xuesheng', 'renshi', 'xihuan'] },
          ],
        },
        {
          id: 'c1', title: '友だちとの会話', emoji: '🤝', color: '#27AE60', desc: '誘う・相づち・応援する',
          lessons: [
            { id: 'c1-1', title: '誘う・おどろく', ids: ['ganshenme', 'yiqiqu', 'taihaole', 'zhendema'] },
            { id: 'c1-2', title: '相づちと応援', ids: ['woyeshi', 'meiwenti', 'xiacijian', 'jiayou'] },
          ],
        },
        {
          id: 'u6', title: '買い物', emoji: '🛍️', color: '#8E5BB8',
          desc: '値段を聞く・ねぎる・支払う',
          lessons: [
            { id: 'u6-1', title: 'いくら？', ids: ['duoshao', 'zhege', 'nage', 'yaozhege'] },
            {
              id: 'u6-2', title: '値段交渉', ids: ['taigui', 'pianyi', 'buyao', 'geini'],
              notes: ['<span class="zh">太〜了</span> で「〜すぎる」。<br><span class="zh">太贵了！</span>＝高すぎる！'],
            },
            {
              id: 'u6-3', title: '数え方と支払い', ids: ['shui', 'weixin'],
              notes: ['<b>文法</b> ものを数えるときは<b>量詞</b>をはさむよ。<br><span class="zh">一瓶水</span>（水1本）・<span class="zh">一个</span>（1つ）・<span class="zh">一张票</span>（チケット1枚）'],
            },
            { id: 'u6-rp1', title: '💬 小籠包の屋台', dialogue: 'stall' },
          ],
        },
        {
          id: 'u7', title: '食事', emoji: '🍜', color: '#C0392B',
          desc: '北京ダック・涮羊肉・炸酱面・小籠包を注文',
          lessons: [
            { id: 'u7-1', title: '北京の料理', ids: ['kaoya', 'shuanyangrou', 'zhajiangmian', 'xiaolongbao'] },
            {
              id: 'u7-2', title: '注文する', ids: ['caidan', 'yifen', 'yiwan', 'yilong'],
              notes: ['料理によって数え方が変わるよ！<br><span class="zh">一份</span>（1人前）・<span class="zh">一碗</span>（1杯）・<span class="zh">一笼</span>（1せいろ）'],
            },
            { id: 'u7-3', title: '食べる・会計', ids: ['haochi', 'maidan', 'buyaola', 'yigong'] },
            { id: 'u7-rp1', title: '💬 炸酱面の店', dialogue: 'zhajiang' },
            { id: 'u7-rp2', title: '💬 涮羊肉の店', dialogue: 'shuan' },
            { id: 'u7-rp3', title: '💬 北京ダックの店', dialogue: 'duck' },
          ],
        },
        {
          id: 'u8', title: '道案内・交通', emoji: '🚇', color: '#2F6FA8',
          desc: '道をたずねる・地下鉄・タクシー',
          lessons: [
            {
              id: 'u8-1', title: 'どこですか？', ids: ['zainali', 'ditie', 'cesuo', 'zainabian'],
              notes: ['<b>文法</b> <span class="zh">〜在哪里？</span> で「〜はどこ？」。<br>場所の名前を前に置くだけ！'],
            },
            { id: 'u8-2', title: '道案内', ids: ['qu', 'zuo', 'you', 'yizhizou'] },
            { id: 'u8-3', title: 'タクシー', ids: ['dache', 'yuanma', 'henjin', 'tingche'] },
            { id: 'u8-rp1', title: '💬 地下鉄', dialogue: 'subway' },
            { id: 'u8-rp2', title: '💬 天安門広場', dialogue: 'tiananmen' },
          ],
        },
        {
          id: 'u4', title: '旅行（空港・ホテル）', emoji: '✈️', color: '#4FA3D9',
          desc: '空港・ホテルで使う言葉',
          lessons: [
            { id: 'u4-1', title: '空港の言葉', ids: ['hzhao', 'dengjipai', 'feiji', 'xingli'] },
            {
              id: 'u4-2', title: 'ホテルでチェックイン', ids: ['ruzhu', 'huzhao', 'haode', 'fangjian'],
              notes: ['<b>文法</b> <span class="zh">我想〜</span> で「〜したい」。<br><span class="zh">我想办理入住。</span>＝チェックインしたいです'],
            },
            { id: 'u4-3', title: 'ようこそ北京へ', ids: ['huanying', 'shide', 'qing', 'beijing'] },
            { id: 'u4-rp1', title: '💬 空港', dialogue: 'airport' },
            { id: 'u4-rp2', title: '💬 ホテル', dialogue: 'hotel' },
          ],
        },
        {
          id: 'u9', title: '旅行会話（観光）', emoji: '🏯', color: '#7A5236',
          desc: '観光地・チケット・写真・こまったとき',
          lessons: [
            { id: 'u9-1', title: '北京の名所', ids: ['changcheng', 'gugong', 'tiananmen', 'menpiao'] },
            { id: 'u9-2', title: 'チケットと写真', ids: ['yizhangpiao', 'paizhao', 'bangwo', 'taimei'] },
            { id: 'u9-3', title: 'こまったときは', ids: ['tingbudong', 'manyidian', 'haolei', 'haohan'] },
            { id: 'u9-rp1', title: '💬 故宮', dialogue: 'gugong' },
            { id: 'u9-rp2', title: '💬 万里の長城', dialogue: 'greatwall' },
          ],
        },
        {
          id: 'c2', title: '電話・メッセージ', emoji: '📱', color: '#5D6D7E', desc: '電話の受け答え・SNS のやりとり',
          lessons: [
            { id: 'c2-1', title: '電話をかける', ids: ['wei', 'naweisi', 'zhaowang', 'dengyixia'] },
            { id: 'c2-2', title: 'メッセージ', ids: ['faweixin', 'shoudao', 'haoma', 'huitouliao'] },
          ],
        },
      ],
    },
  ];

  const units = cats.flatMap((c) => c.units);
  units.forEach((u) => {
    const cat = cats.find((c) => c.units.includes(u));
    u.cat = cat;
    u.lessons.forEach((l) => {
      // 会話ロールプレイは、その会話で使う言葉をレッスンの言葉にする
      if (l.dialogue && !l.ids) l.ids = (App.DIALOGUES[l.dialogue].phrases || []).slice();
    });
    // 各ユニットの最後に「まとめ」（そのユニットの言葉をまぜて復習）
    const ids = Array.from(new Set(u.lessons.flatMap((l) => l.ids)));
    u.lessons.push({ id: `${u.id}-review`, title: 'まとめ', review: true, ids });
    u.lessons.forEach((l) => { l.unit = u; });
  });

  App.COURSE = { cats, units };
  // フレーズ → 覚えるレッスン（問題の選択肢づくり・図鑑で使う）
  App.PHRASE_LESSON = {};
  units.forEach((u) => u.lessons.forEach((l) => {
    if (!l.review && !l.dialogue) l.ids.forEach((id) => { if (!App.PHRASE_LESSON[id]) App.PHRASE_LESSON[id] = l; });
  }));
})(window.App = window.App || {});
