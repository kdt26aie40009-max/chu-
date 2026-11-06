/* 3D 旅行モードの行き先（ステージ）
 * 2D 学習とは独立。3D の中でクリアすると次のステージが開く（after: クリアが必要なステージ）。
 *
 * region: { id, name, zh, desc, how? }   北京と、高速鉄道で行く河南省（少林寺）
 * stage:  { id, region, kind, no?, name, emoji, field, params?, after, desc, goal, words, level }
 *   kind   … 'main'（本線・番号つき）/ 'side'（寄り道）/ 'special'（特別な旅先）
 *   field  … 3D 画面（js/screens/<field>.js）。まだ無いものはマップで「準備中」になる
 *   words  … 出発前の「単語チェック」で出す言葉（2〜5 個・js/data/phrases.js の id）
 *   level  … 難しさ ★1〜3
 */
(function (App) {
  'use strict';

  App.TRIP = {
    regions: [
      { id: 'beijing', name: '北京', zh: '北京 Běijīng', desc: '中国の首都。空港に着いたら旅のはじまり！' },
      {
        id: 'henan', name: '河南省・嵩山', zh: '河南 Hénán', desc: '北京から南西へ約 700km。少林寺のある山',
        how: '🚄 高速鉄道（高铁）で約 2 時間半',
      },
    ],
    stages: [
      {
        id: 'airport', region: 'beijing', kind: 'main', no: 1, name: '空港', emoji: '✈️', field: 'airport3d', after: null, level: 1,
        desc: '北京首都国際空港。カウンターで中国語デビュー！', goal: 'チェックインする',
        words: ['nihao', 'xiexie', 'hzhao', 'dengjipai'],
      },
      {
        id: 'hotel', region: 'beijing', kind: 'main', no: 2, name: 'ホテル', emoji: '🏨', field: 'hotel3d', after: 'airport', level: 1,
        desc: 'フロントでチェックインして、自分の部屋をさがそう', goal: '302 号室に入る',
        words: ['ruzhu', 'huzhao', 'haode', 'fangjian'],
      },
      {
        id: 'market', region: 'beijing', kind: 'main', no: 3, name: '北京の商店街', emoji: '🏮', field: 'stall3d', after: 'hotel', level: 2,
        desc: '王府井の商店街。北京ダック・涮羊肉・炸酱面・小籠包、好きな店へ！', goal: 'お店で 1 回ごはんを食べる',
        words: ['caidan', 'yaozhege', 'duoshao', 'maidan', 'haochi'],
      },
      {
        id: 'hutong', region: 'beijing', kind: 'side', name: '胡同さんぽ', emoji: '🏘️', field: 'hutong3d', after: 'hotel', level: 1,
        desc: '寄り道。古い路地で、地元の人とのんびりおしゃべり。奥には湖の什刹海や鼓楼も', goal: '路地の人と話す',
        words: ['hutong', 'laoren', 'haizi', 'niao'],
      },
      {
        id: 'tiananmen', region: 'beijing', kind: 'main', no: 4, name: '天安門広場', emoji: '🏛️', field: 'capital3d', params: { area: 'square' }, after: 'market', level: 2,
        desc: '北京のまんなかの大きな広場。案内人さんと記念写真', goal: '天安門の前で写真を撮る',
        words: ['tiananmen', 'zainali', 'yizhizou', 'bangwo'],
      },
      {
        id: 'gugong', region: 'beijing', kind: 'main', no: 5, name: '故宮', emoji: '🏯', field: 'capital3d', params: { area: 'palace' }, after: 'tiananmen', level: 2,
        desc: '天安門をくぐった先の、昔の皇帝の宮殿', goal: '入場券を買って太和殿まで行く',
        words: ['gugong', 'menpiao', 'yizhangpiao', 'taimei'],
      },
      {
        id: 'greatwall', region: 'beijing', kind: 'main', no: 6, name: '万里の長城', emoji: '🧱', field: 'greatwall3d', after: 'gugong', level: 2,
        desc: '北京の北の山へ。城壁を登って、てっぺんの見張り台へ', goal: '好汉坡まで登る',
        words: ['changcheng', 'menpiao', 'haolei', 'haohan', 'jiayou'],
      },
      {
        id: 'shaolin', region: 'henan', kind: 'special', name: '少林寺', emoji: '🥋', field: 'shaolin3d', after: 'airport', level: 3,
        desc: '武術の聖地。武術大会で 2 人の達人に挑む（高難度）', goal: '武術大会で 2 連勝する',
        words: ['amituofo', 'shifu', 'tiao', 'dun', 'quan'],
      },
    ],
  };
})(window.App = window.App || {});
