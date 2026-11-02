/* 汎用ヘルパー */
(function (App) {
  'use strict';

  const U = {};

  U.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  U.todayKey = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  U.daysBetween = (a, b) => {
    const pa = new Date(a + 'T00:00:00');
    const pb = new Date(b + 'T00:00:00');
    return Math.round((pb - pa) / 86400000);
  };

  U.formatDate = (key) => {
    if (!key) return '';
    const [, m, d] = key.split('-');
    return `${Number(m)}/${Number(d)}`;
  };

  // 外部スクリプトを必要になったときだけ読み込む（同じ URL は 1 回だけ）
  const scriptCache = {};
  U.loadScript = (src) => {
    if (!scriptCache[src]) {
      scriptCache[src] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => { delete scriptCache[src]; s.remove(); reject(new Error('load failed: ' + src)); };
        document.head.appendChild(s);
      });
    }
    return scriptCache[src];
  };

  let toastTimer = null;
  U.toast = (msg) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = msg;
    el.hidden = false;
    el.classList.remove('is-show');
    void el.offsetWidth;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  };

  App.U = U;
})(window.App = window.App || {});
