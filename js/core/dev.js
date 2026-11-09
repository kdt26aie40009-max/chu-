/* 開発者向けテスト機能（ふつうのプレイヤーには表示しない）
 *
 * 入り方：URL に ?dev=1 を付けて開く（?dev=0 で終了）。タイトル上の小さなラベル（「中国語で旅するゲーム」）を 7 回タップでも切り替え。
 * 開発者モード中は「テスト用セーブ」（別の保存場所）を使うので、ふつうのセーブデータは壊れない。
 * 入ったときに、ふつうのセーブをテスト用セーブにコピーする。
 *
 * できること：
 *   - 画面左下の 🛠 から：全レッスン解放・全ステージ解放・2D/3D を全部クリア扱い・テスト用セーブのリセット
 *   - レッスン／単語チェック／3D の会話イベント／チュートリアル／ボス戦に「⏭ スキップ」ボタンが出る
 */
(function (App) {
  'use strict';

  const MODE_KEY = 'hamster-china-trip/devmode';
  const FLAG_KEY = 'hamster-china-trip/devflags';
  const read = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* noop */ } };

  const Dev = {
    on: false,
    flags: { allLessons: false, allStages: false },

    // main.js がセーブを読む前に呼ぶ
    init() {
      const q = new URLSearchParams(location.search).get('dev');
      if (q === '1') write(MODE_KEY, '1');
      if (q === '0') write(MODE_KEY, null);
      Dev.on = read(MODE_KEY) === '1';
      try { Object.assign(Dev.flags, JSON.parse(read(FLAG_KEY) || '{}')); } catch (e) { /* noop */ }
      if (Dev.on) App.Store.useDevSlot(true, { fresh: !read('hamster-china-trip/dev') });
    },

    toggle() {
      const next = !Dev.on;
      write(MODE_KEY, next ? '1' : null);
      Dev.on = next;
      App.Store.useDevSlot(next, { fresh: next && !read('hamster-china-trip/dev') });
      App.U.toast(next ? '🛠 開発者モード ON（テスト用セーブを使います）' : '開発者モード OFF（ふつうのセーブに戻りました）');
      App.go('title');
    },

    setFlag(k, v) {
      Dev.flags[k] = v;
      write(FLAG_KEY, JSON.stringify(Dev.flags));
    },

    // 2D を全部クリア扱い（テスト用セーブだけ）
    clearAll2D() {
      const st = App.Store.state;
      App.Course.lessons().forEach((l) => {
        if (!st.course.lessons[l.id]) st.course.lessons[l.id] = { count: 1, best: 100, firstAt: App.U.todayKey(), dev: true };
      });
      App.Progress.learn(Object.keys(App.PHRASES));
      App.Store.save();
    },
    // 3D を全部クリア扱い
    clearAll3D() {
      App.Trip.stages().filter(App.Trip.ready).forEach((s) => {
        if (!App.Trip.isCleared(s.id)) App.Store.state.trip.cleared[s.id] = { count: 1, firstAt: App.U.todayKey(), lastAt: App.U.todayKey(), dev: true };
      });
      App.Store.save();
    },
    resetSlot() {
      App.Store.useDevSlot(true, { fresh: true });
    },

    // 「⏭ スキップ」ボタン（開発者モードのときだけ HTML を返す）
    skipBtn(label = 'スキップ', attr = 'data-dev-skip') {
      return Dev.on ? `<button class="dev-skip" ${attr}>⏭ ${label}（開発）</button>` : '';
    },

    // 画面ごとに 🛠 ボタンを置く（main.js の App.go から呼ぶ）
    decorate(root) {
      if (!Dev.on) return;
      const b = document.createElement('button');
      b.className = 'dev-fab';
      b.textContent = '🛠';
      b.setAttribute('aria-label', '開発者メニュー');
      b.onclick = () => Dev.panel();
      root.appendChild(b);
    },

    panel() {
      let wrap = document.querySelector('.dev-panel-wrap');
      if (wrap) wrap.remove();
      wrap = document.createElement('div');
      wrap.className = 'dev-panel-wrap';
      const chk = (k, label) => `<label class="dev-row"><input type="checkbox" data-flag="${k}" ${Dev.flags[k] ? 'checked' : ''}> ${label}</label>`;
      wrap.innerHTML = `
        <div class="dev-panel">
          <h3>🛠 開発者メニュー</h3>
          <p class="dev-note">テスト用セーブを使用中（ふつうのセーブは変わりません）</p>
          ${chk('allLessons', '2D：全レッスンを解放')}
          ${chk('allStages', '3D：全ステージを解放')}
          <button data-act="c2">2D を全部クリア扱いにする</button>
          <button data-act="c3">3D を全部クリア扱いにする</button>
          <button data-act="reset">テスト用セーブをリセット（ふつうのセーブをコピー）</button>
          <button data-act="off">開発者モードを終了</button>
          <button data-act="close">閉じる</button>
        </div>`;
      document.body.appendChild(wrap);
      wrap.querySelectorAll('[data-flag]').forEach((c) => { c.onchange = () => Dev.setFlag(c.dataset.flag, c.checked); });
      wrap.querySelectorAll('[data-act]').forEach((b) => {
        b.onclick = () => {
          const act = b.dataset.act;
          wrap.remove();
          if (act === 'c2') { Dev.clearAll2D(); App.U.toast('2D を全部クリア扱いにしました'); }
          if (act === 'c3') { Dev.clearAll3D(); App.U.toast('3D を全部クリア扱いにしました'); }
          if (act === 'reset') { Dev.resetSlot(); App.U.toast('テスト用セーブをリセットしました'); }
          if (act === 'off') { Dev.toggle(); return; }
          if (act !== 'close') App.go(App.currentScreen || 'title');
        };
      });
      wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    },
  };

  App.Dev = Dev;
})(window.App = window.App || {});
