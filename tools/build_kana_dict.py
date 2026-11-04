"""モチの声で読むための「漢字 → ひらがな」辞書を作る。

使い方（pykakasi が必要。pip install pykakasi）:
    python tools/build_kana_dict.py

js/ の中の日本語の文字列から漢字を含む言葉を集め、読みを js/data/kana-dict.js に書き出す。
読みがおかしい言葉は OVERRIDES に書くと優先される。セリフを増やしたら、もう一度実行する。
"""
import glob, os, re, sys
import pykakasi

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'js', 'data', 'kana-dict.js')
SKIP = {'kana-dict.js', 'voice-mochi.js'}

# 自動の読みが合わない言葉（固有名詞・中国の地名など）
OVERRIDES = {
    '上海': 'しゃんはい', '浦東': 'ぷーどん', '外灘': 'わいたん', '黄浦江': 'こうほこう',
    '小籠包': 'しょうろんぽう', '中国語': 'ちゅうごくご', '中国': 'ちゅうごく', '今日': 'きょう',
    '明日': 'あした', '昨日': 'きのう', '一緒': 'いっしょ', '一回': 'いっかい', '何度': 'なんど',
    '大丈夫': 'だいじょうぶ', '入国審査': 'にゅうこくしんさ', '係員': 'かかりいん', '屋台': 'やたい',
    '声調': 'せいちょう', '地下鉄': 'ちかてつ', '夜景': 'やけい', '駅員': 'えきいん', '号線': 'ごうせん',
    'お腹': 'おなか', '湯気': 'ゆげ', '注文': 'ちゅうもん', '会計': 'かいけい', '指': 'ゆび',
    '部屋': 'へや', '探索': 'たんさく', '搭乗券': 'とうじょうけん', '搭乗口': 'とうじょうぐち',
    '出発': 'しゅっぱつ', '豆知識': 'まめちしき', '看板': 'かんばん', '案内所': 'あんないじょ',
    '下手': 'へた', '上手': 'じょうず', '一人': 'ひとり', '二人': 'ふたり', '人': 'ひと',
    '本当': 'ほんとう', '旅': 'たび', '何': 'なに', '方': 'ほう', '後': 'あと', '時': 'とき',
    'お金': 'おかね', 'お水': 'おみず', 'お昼': 'おひる', 'お店': 'おみせ', 'お兄さん': 'おにいさん', 'お姉さん': 'おねえさん',
    '今日は': 'きょうは', '入っ': 'はいっ', '入る': 'はいる', '入れ': 'いれ', '指さ': 'ゆびさ',
}


def japanese_runs(text):
    # 漢字を含む「漢字・かな」の連なりを取り出す
    return [m for m in re.findall(r'[぀-ヿ一-鿿々ー]+', text) if re.search(r'[一-鿿々]', m)]


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    kks = pykakasi.kakasi()
    words = {}
    for path in glob.glob(os.path.join(ROOT, 'js', '**', '*.js'), recursive=True):
        if os.path.basename(path) in SKIP:
            continue
        with open(path, encoding='utf-8') as f:
            src = f.read()
        for run in japanese_runs(src):
            for t in kks.convert(run):
                orig, hira = t['orig'], t['hira']
                if re.search(r'[一-鿿々]', orig) and hira and hira != orig:
                    words.setdefault(orig, hira)
    words.update(OVERRIDES)
    items = sorted(words.items(), key=lambda kv: (-len(kv[0]), kv[0]))
    body = ',\n'.join(f"    '{k}': '{v}'" for k, v in items)
    js = f"""/* モチの声用「漢字 → ひらがな」辞書（tools/build_kana_dict.py で作成。手で直すときは OVERRIDES へ） */
(function (App) {{
  'use strict';
  App.KANA_DICT = {{
{body},
  }};
}})(window.App = window.App || {{}});
"""
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(js)
    print(f'{os.path.normpath(OUT)}: {len(items)} 語')


if __name__ == '__main__':
    main()
