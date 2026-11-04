"""タイトル画面の「タイトルコール」の声を、録音した動画から作る。

使い方（pip install imageio-ffmpeg numpy）:
    python tools/build_title_call.py <動画>

前後の無音を切って音量をそろえ、mp3 にして js/data/title-call.js に埋め込む（file:// でも鳴るように data URI で持つ）。
"""
import base64, os, subprocess, sys
import numpy as np
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'js', 'data', 'title-call.js')


def main(path):
    raw = subprocess.run([FF, '-loglevel', 'error', '-i', path, '-vn', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    # 人の声の帯域（300〜3400Hz）の大きさで、声が出ている所を探す（録画開始のタップ音などは拾わない）
    hop = int(SR * 0.01)
    win = hop * 2
    freqs = np.fft.rfftfreq(win, 1 / SR)
    band = (freqs > 300) & (freqs < 3400)
    hann = np.hanning(win)
    db = np.array([10 * np.log10(np.sum(np.abs(np.fft.rfft(x[i:i + win] * hann))[band] ** 2) + 1e-12)
                   for i in range(0, len(x) - win, hop)])
    on = np.where(db > np.percentile(db, 50) + 18)[0]
    a = max(0, on[0] * hop - int(SR * 0.08))
    b = min(len(x), on[-1] * hop + hop + int(SR * 0.15))
    c = x[a:b].copy()
    fi, fo = int(SR * 0.02), int(SR * 0.06)
    c[:fi] *= np.linspace(0, 1, fi)
    c[-fo:] *= np.linspace(1, 0, fo)
    c *= 0.9 / max(np.abs(c).max(), 1e-4)
    mp3 = subprocess.run([FF, '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                          '-codec:a', 'libmp3lame', '-b:a', '96k', '-f', 'mp3', '-'],
                         input=(c * 32767).astype(np.int16).tobytes(), capture_output=True, check=True).stdout
    uri = 'data:audio/mpeg;base64,' + base64.b64encode(mp3).decode('ascii')
    js = f"""/* タイトルコールの声（tools/build_title_call.py で作成。手で編集しない） */
(function (App) {{
  'use strict';
  App.TITLE_CALL = '{uri}';
}})(window.App = window.App || {{}});
"""
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(js)
    print(f'{os.path.normpath(OUT)}: {len(c) / SR:.2f} 秒, {len(js) // 1024} KB')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
