"""モチ（ハムスター）の声を、50音を 1 音ずつ録音した動画から作る。

使い方（ffmpeg・numpy が必要。pip install imageio-ffmpeg numpy）:
    python tools/build_mochi_voice.py <あ〜の の動画> <は〜ん の動画>

- 動画の音声から「声が出ている区間」を探し、録音の順番どおりに 1 音ずつ切り出す
  （1 本目 = あ〜の の 25 音、2 本目 = は〜ん。「を」は録音が無ければ「お」で代用）
- 前後の無音を切り、音量をそろえ、短い mp3 にして js/data/voice-mochi.js に埋め込む
  （file:// でもそのまま読めるように、ファイルではなく data URI で持つ）
"""
import base64, os, subprocess, sys
import numpy as np
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 22050
ROWS_1 = 'あいうえおかきくけこさしすせそたちつてとなにぬねの'
ROWS_2_FULL = 'はひふへほまみむめもやゆよらりるれろわをん'
ROWS_2_NO_WO = 'はひふへほまみむめもやゆよらりるれろわん'
OUT = os.path.join(os.path.dirname(__file__), '..', 'js', 'data', 'voice-mochi.js')


def load_audio(path):
    raw = subprocess.run([FF, '-loglevel', 'error', '-i', path, '-vn', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


def voice_band_db(x, hop):
    win = hop * 2
    freqs = np.fft.rfftfreq(win, 1 / SR)
    band = (freqs > 300) & (freqs < 3400)
    hann = np.hanning(win)
    n = (len(x) - win) // hop
    e = [np.sum(np.abs(np.fft.rfft(x[i * hop:i * hop + win] * hann))[band] ** 2) for i in range(n)]
    return 10 * np.log10(np.array(e) + 1e-12)


def find_utterances(x, rise=18, hop_s=0.02):
    hop = int(SR * hop_s)
    db = voice_band_db(x, hop)
    on = db > np.percentile(db, 50) + rise
    segs, s = [], None
    for i, v in enumerate(on):
        if v and s is None:
            s = i
        elif not v and s is not None:
            segs.append([s, i]); s = None
    if s is not None:
        segs.append([s, len(on)])
    merged = []
    for a, b in segs:
        if merged and (a - merged[-1][1]) * hop_s < 0.25:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return [(a * hop_s, b * hop_s) for a, b in merged if (b - a) * hop_s >= 0.12]


def highpass(x, cut=120):
    # 1 次の簡単なハイパス（足音・風などの低い雑音を減らす）
    rc = 1 / (2 * np.pi * cut)
    a = rc / (rc + 1 / SR)
    y = np.empty_like(x)
    prev_x = prev_y = 0.0
    for i, v in enumerate(x):
        prev_y = a * (prev_y + v - prev_x)
        prev_x = v
        y[i] = prev_y
    return y


def tidy(clip):
    """前後の無音を詰めて、フェードと音量合わせをする。"""
    clip = highpass(clip)
    hop = int(SR * 0.005)
    env = np.array([np.sqrt(np.mean(clip[i:i + hop] ** 2) + 1e-12) for i in range(0, len(clip) - hop, hop)])
    db = 20 * np.log10(env)
    on = np.where(db > db.max() - 20)[0]
    a = max(0, on[0] * hop - int(SR * 0.015))
    b = min(len(clip), on[-1] * hop + hop + int(SR * 0.03))
    c = clip[a:b].copy()
    f = int(SR * 0.008)
    c[:f] *= np.linspace(0, 1, f)
    c[-f:] *= np.linspace(1, 0, f)
    rms = np.sqrt(np.mean(c[np.abs(c) > np.abs(c).max() * 0.1] ** 2))
    c *= 0.18 / max(rms, 1e-4)
    return np.clip(c, -0.98, 0.98)


def to_mp3_data_uri(c):
    pcm = (c * 32767).astype(np.int16).tobytes()
    mp3 = subprocess.run([FF, '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                          '-codec:a', 'libmp3lame', '-b:a', '56k', '-f', 'mp3', '-'],
                         input=pcm, capture_output=True, check=True).stdout
    return 'data:audio/mpeg;base64,' + base64.b64encode(mp3).decode('ascii'), len(c) / SR


def main(v1, v2):
    clips = {}
    for path, kana_all in ((v1, [ROWS_1]), (v2, [ROWS_2_FULL, ROWS_2_NO_WO])):
        x = load_audio(path)
        segs = find_utterances(x)
        kana = next((k for k in kana_all if len(k) == len(segs)), None)
        if kana is None:
            sys.exit(f'{os.path.basename(path)}: {len(segs)} 音見つかりました（{"/".join(str(len(k)) for k in kana_all)} 音のはず）')
        for ch, (a, b) in zip(kana, segs):
            lo = max(0, int((a - 0.1) * SR)); hi = min(len(x), int((b + 0.12) * SR))
            clips[ch] = tidy(x[lo:hi])
        print(f'{os.path.basename(path)}: {len(segs)} 音 → {kana}')
    if 'を' not in clips:
        clips['を'] = clips['お']
        print('「を」は録音が無いので「お」で代用')

    data, durs = {}, {}
    for ch in ROWS_1 + ROWS_2_FULL:
        data[ch], durs[ch] = to_mp3_data_uri(clips[ch])
    body = ',\n'.join(f"    '{ch}': '{uri}'" for ch, uri in data.items())
    js = f"""/* モチ（ハムスター）の声：50音を 1 音ずつ録音したもの（tools/build_mochi_voice.py で作成。手で編集しない） */
(function (App) {{
  'use strict';
  App.MOCHI_VOICE = {{
{body},
  }};
}})(window.App = window.App || {{}});
"""
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(js)
    print(f'{os.path.normpath(OUT)}: {len(js) // 1024} KB, 1 音の長さ {min(durs.values()):.2f}〜{max(durs.values()):.2f} 秒')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
