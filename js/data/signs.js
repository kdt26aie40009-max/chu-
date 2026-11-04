/* 町の看板・表示の中国語（3D の看板やマップの文字をタップすると読める）
 * id: { zh: 表記, py: ピンイン, ja: 意味, say?: 読み上げ用（記号や数字を読みやすくしたもの）, note?: ハムスターのひとこと,
 *       lines?: [{ zh, py, ja }]（案内板など、1 行ずつ聞ける表示） }
 * 3D 側は js/world3d/<場所>.js で App.Models3D.readable(看板, 'id') として看板に結びつける
 */
(function (App) {
  'use strict';

  App.SIGNS = {
    /* ---- 空港 ---- */
    checkinCounters: { zh: '值机柜台', py: 'zhíjī guìtái', ja: 'チェックインカウンター', note: '「值机」＝チェックイン、「柜台」＝カウンターだよ' },
    checkinA: { zh: '值机 A', py: 'zhíjī A', ja: 'チェックイン A', note: 'アルファベットはそのまま英語読みでOK！' },
    checkinB: { zh: '值机 B', py: 'zhíjī B', ja: 'チェックイン B', note: 'アルファベットはそのまま英語読みでOK！' },
    checkinC: { zh: '值机 C', py: 'zhíjī C', ja: 'チェックイン C', note: 'アルファベットはそのまま英語読みでOK！' },
    checkinArrow: { zh: '值机', py: 'zhíjī', ja: 'チェックイン（この先）', note: '矢印の方へ進むとチェックインカウンターがあるよ' },
    info: { zh: '问讯处', py: 'wènxùnchù', ja: '案内所', note: '「问讯」＝たずねる。困ったらここへ行こう！' },
    welcome: { zh: '欢迎来到北京', py: 'Huānyíng lái dào Běijīng', ja: '北京へようこそ', note: '「欢迎」＝ようこそ。お店の「欢迎光临」（いらっしゃいませ）にも出てくるよ' },
    gates: { zh: '登机口', py: 'dēngjīkǒu', ja: '搭乗口', note: '「登机」＝飛行機に乗る、「口」＝入口。飛行機はここから乗るよ' },
    gatesA: { zh: '登机口 A1–A20', say: '登机口 A1 到 A20', py: 'dēngjīkǒu A1 dào A20', ja: '搭乗口 A1〜A20', note: '「〜」は「到（dào）」と読むよ' },
    exit: { zh: '出口', py: 'chūkǒu', ja: '出口', note: '日本語と同じ漢字！読み方は「チューコウ」に近いよ' },
    restroom: { zh: '洗手间', py: 'xǐshǒujiān', ja: 'トイレ（お手洗い）', note: '「手を洗う部屋」でトイレ。「厕所」とも言うよ' },
    departures: {
      zh: '出发', py: 'chūfā', ja: '出発（フライト案内）', note: '行き先と、いまの状態が書いてあるよ。1行ずつ聞いてみよう！',
      lines: [
        { zh: '仓鼠航空', py: 'Cāngshǔ Hángkōng', ja: 'ハムスター航空' },
        { zh: '上海', py: 'Shànghǎi', ja: '上海（シャンハイ）' },
        { zh: '成都', py: 'Chéngdū', ja: '成都（せいと）' },
        { zh: '东京', py: 'Dōngjīng', ja: '東京' },
        { zh: '广州', py: 'Guǎngzhōu', ja: '広州（こうしゅう）' },
        { zh: '西安', py: 'Xī’ān', ja: '西安（せいあん）' },
        { zh: '准时', py: 'zhǔnshí', ja: '定刻どおり' },
        { zh: '值机', py: 'zhíjī', ja: 'チェックイン受付中' },
        { zh: '登机', py: 'dēngjī', ja: '搭乗中' },
      ],
    },

    /* ---- ホテル ---- */
    hotelName: { zh: '仓鼠大酒店', py: 'Cāngshǔ Dà Jiǔdiàn', ja: 'ハムスター・グランドホテル', note: '「酒店」＝ホテル。お酒のお店じゃないんだ！' },
    reception: { zh: '前台', py: 'qiántái', ja: 'フロント（受付）', note: '「前の台」でフロント。チェックインはここ！' },
    elevator: { zh: '电梯', py: 'diàntī', ja: 'エレベーター', note: '「电」＝電気、「梯」＝はしご。電気のはしご＝エレベーター！' },
    elevator3: { zh: '电梯 3F', say: '电梯 三楼', py: 'diàntī sān lóu', ja: 'エレベーター（3階）', note: '「3F」は中国語だと「三楼（sān lóu）」' },
    restaurant: { zh: '餐厅', py: 'cāntīng', ja: 'レストラン', note: '「餐」＝食事、「厅」＝ホール' },
    breakfast: { zh: '早餐 6:30–10:00', say: '早餐 六点半到十点', py: 'zǎocān liù diǎn bàn dào shí diǎn', ja: '朝食 6:30〜10:00', note: '「点」＝〜時、「半」＝半。時間の言い方も覚えちゃおう' },
    emergencyExit: { zh: '安全出口', py: 'ānquán chūkǒu', ja: '非常口', note: '「安全な出口」で非常口。いざというときのために！' },
    tv: { zh: '你好吗？', py: 'Nǐ hǎo ma?', ja: '元気？', note: '「吗」をつけると質問になるよ。ドラマの続きはまた今度！' },

    /* ---- 北京 ---- */
    beijing: { zh: '北京', py: 'Běijīng', ja: '北京（ペキン）', note: '「北の都」。中国の首都だよ' },
  };
})(window.App = window.App || {});
