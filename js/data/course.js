/* 2D 学習コース（Duolingo 風）
 * units を上から順にクリアしていく。各ユニットの最後には「まとめ」レッスンが自動で付く。
 *
 * unit:   { id, title, emoji, color, desc, lessons: [lesson] }
 * lesson: { id, title, ids: [phraseId], notes?: [html], tutorial? }
 *   ids    … このレッスンで新しく覚える言葉（js/data/phrases.js）
 *   notes  … 問題の前にハムスターが説明する文法・ポイント（1 枚ずつ表示）
 *   tutorial … 初めての人向けの使い方説明を最初に出す
 *
 * 旅行モード（北京マップ）の各スポットは requires: '<unit id>' で、どのユニットを
 * クリアすると行けるかを決める（js/data/<都市>.js）。
 */
(function (App) {
  'use strict';

  const units = [
    {
      id: 'u1', title: '中国語の基本', emoji: '🔤', color: '#2BB5A0',
      desc: 'ピンイン・声調と、いちばん基本の言葉',
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
          notes: [
            '同じ「ma」でも、音の高さで意味が変わるよ！<br>① <b>mā</b> 高く平ら　② <b>má</b> 上がる<br>③ <b>mǎ</b> 下がって上がる　④ <b>mà</b> ストンと下がる',
          ],
        },
        {
          id: 'u1-3', title: '「是」「不」「吗」', ids: ['shi', 'bu', 'hen', 'nihaoma', 'wohenhao'],
          notes: [
            '<b>文法①</b> 文の最後に <span class="zh">吗</span>（ma）をつけると<b>質問</b>になるよ。<br><span class="zh">你好。</span> → <span class="zh">你好吗？</span>（元気？）',
            '<b>文法②</b> 中国語は<b>「私・とても・元気」</b>の順番。<br><span class="zh">我很好。</span>＝私は元気です',
          ],
        },
      ],
    },
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
        {
          id: 'u3-2', title: 'もっと自己紹介', ids: ['xuesheng', 'bushi', 'renshi', 'xihuan'],
          notes: ['<b>文法</b> 否定は動詞の前に <span class="zh">不</span>。<br><span class="zh">我不是中国人。</span>＝私は中国人ではありません'],
        },
      ],
    },
    {
      id: 'u4', title: '旅の準備', emoji: '✈️', color: '#4FA3D9',
      desc: '空港・ホテルで使う言葉（クリアで 3D 旅行が解放！）',
      lessons: [
        { id: 'u4-1', title: '空港の言葉', ids: ['hzhao', 'dengjipai', 'feiji', 'xingli'] },
        {
          id: 'u4-2', title: 'ホテルでチェックイン', ids: ['ruzhu', 'huzhao', 'haode', 'fangjian'],
          notes: ['<b>文法</b> <span class="zh">我想〜</span> で「〜したい」。<br><span class="zh">我想办理入住。</span>＝チェックインしたいです'],
        },
        { id: 'u4-3', title: 'ようこそ北京へ', ids: ['huanying', 'shide', 'qing', 'beijing'] },
      ],
    },
    {
      id: 'u5', title: '数字・時間', emoji: '🔢', color: '#F5B92E',
      desc: '1〜20・値段・番号・時間',
      lessons: [
        { id: 'u5-1', title: '数字 1〜5', ids: ['n1', 'n2', 'n3', 'n4', 'n5'] },
        { id: 'u5-2', title: '数字 6〜10', ids: ['n6', 'n7', 'n8', 'n9', 'n10'] },
        {
          id: 'u5-3', title: 'お金と番号', ids: ['n15', 'n20', 'liang', 'kuai', 'haonum'],
          notes: ['数字は日本語と同じ組み立て方！<br><span class="zh">十五</span>＝15、<span class="zh">二十</span>＝20<br>でも「2つ」「2元」は <span class="zh">两</span>（liǎng）になるよ'],
        },
        { id: 'u5-4', title: '時間と日にち', ids: ['jidian', 'sandian', 'jintian', 'mingtian'] },
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
      ],
    },
    {
      id: 'u8', title: '移動・交通', emoji: '🚇', color: '#2F6FA8',
      desc: '道をたずねる・地下鉄・タクシー',
      lessons: [
        {
          id: 'u8-1', title: 'どこですか？', ids: ['zainali', 'ditie', 'cesuo', 'zainabian'],
          notes: ['<b>文法</b> <span class="zh">〜在哪里？</span> で「〜はどこ？」。<br>場所の名前を前に置くだけ！'],
        },
        { id: 'u8-2', title: '道案内', ids: ['qu', 'zuo', 'you', 'yizhizou'] },
        { id: 'u8-3', title: 'タクシー', ids: ['dache', 'yuanma', 'henjin', 'tingche'] },
      ],
    },
    {
      id: 'u9', title: '旅行会話', emoji: '🏯', color: '#7A5236',
      desc: '観光地・チケット・写真・こまったとき',
      lessons: [
        { id: 'u9-1', title: '北京の名所', ids: ['changcheng', 'gugong', 'tiananmen', 'menpiao'] },
        { id: 'u9-2', title: 'チケットと写真', ids: ['yizhangpiao', 'paizhao', 'bangwo', 'taimei'] },
        { id: 'u9-3', title: 'こまったときは', ids: ['tingbudong', 'manyidian', 'haolei', 'haohan'] },
      ],
    },
  ];

  // 各ユニットの最後に「まとめ」（そのユニットの言葉をまぜて復習）を付ける
  units.forEach((u) => {
    u.lessons.push({ id: `${u.id}-review`, title: 'まとめ', review: true, ids: u.lessons.flatMap((l) => l.ids) });
    u.lessons.forEach((l) => { l.unit = u; });
  });

  App.COURSE = { units };
  // フレーズ → 覚えるレッスン（問題の選択肢づくり・図鑑で使う）
  App.PHRASE_LESSON = {};
  units.forEach((u) => u.lessons.forEach((l) => {
    if (!l.review) l.ids.forEach((id) => { App.PHRASE_LESSON[id] = l; });
  }));
})(window.App = window.App || {});
