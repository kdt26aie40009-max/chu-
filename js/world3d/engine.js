/* 3D フィールド共通エンジン
 * 歩く・見回す・当たり判定・ハムスター追従・人の動きと会話・発見スポット・ラベル表示・会話モーダル。
 * タップ（クリック）で移動：地面 → そこまで歩く、人 → 近くまで歩いて話しかける、調べる場所 → 近くまで歩いて調べる。
 * 各フィールド（空港・ホテル…）は「レイアウト（build）」と「設定（cfg）」だけを書けばよい。
 *
 * build(THREE, scene) が返すもの:
 *   colliders: [{minX,maxX,minZ,maxZ, off?}]   当たり判定（off: true で無効＝開いたドアなど）
 *   bounds?:   {minX,maxX,minZ,maxZ}            移動範囲（無ければ colliders だけで制限）
 *   spawn:     {x,z,yaw}
 *   hamster, people: [{def, model, ...}]
 *   interactables: [{id,x,z,r}]                 話しかけ・調べる地点（cfg.onInteract[id] が呼ばれる）
 *   tags: [{obj, y, text, maxDist}]             3D 上に出す名札
 *   facePlayer: [model]                         プレイヤーの方を向く人（係員など）
 *   discoveries: [{id,x,z,r,say,culture?}]      近づくとハムスターが豆知識（culture: 文化メモの id。近くで「📖 文化メモ」が出る）
 *   cultures?: [{id,x,z,r}]                     文化メモ（js/data/culture.js）を読める場所（discoveries 以外で足したいとき）
 *   zones: [{id,x1,x2,z1,z2}]                   入ると cfg.onZone[id] が 1 回呼ばれる
 *   heightAt?(x, z) -> y                        地面の高さ（坂・階段。無ければ平ら）
 *   update?(dt, t, ctx)
 *
 * cfg:
 *   id, loading, helpText, build, initialPhase?
 *   guide(ctx) -> {goal, say}
 *   interactLabel(id, ctx) -> string | null（null ならボタンを出さない）
 *   onInteract: {id: (ctx) => void}, onZone?: {id: fn}, onDiscover?(d, ctx)
 *   onTalked?(def, ctx)    街の人との会話が終わったとき（successCard の前）
 */
(function (App) {
  'use strict';

  const { $, esc, shuffle, toast } = App.U;
  const UI = App.UI;

  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const C = {
    EYE: 1.6,          // 目の高さ
    SPEED: 4.2,        // 歩く速さ m/s
    RUN: 7.5,          // ダッシュ
    RADIUS: 0.45,      // プレイヤーの当たり判定
    TURN: 2.2,         // ←→ で向きを変える速さ rad/s
    LOOK: 0.0032,      // ドラッグ感度
    PERSON_TALK: 2.6,  // 人に話しかけられる距離
    PERSON_R: 0.32,    // 人の当たり判定
    NPC_SPEED: 1.15,   // 歩いている人の速さ
    TALK_EXP: 3,       // 初めて話した人ごとの EXP
  };

  const isTouch = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  // 会話の選択肢は 'phraseId' でも {zh,py,ja} でも書ける
  const opt = (o) => (typeof o === 'string' ? App.PHRASES[o] : o);

  // フィールドごとのセーブ枠 world3d[id] = { done, talked: [], helpSeen, ... }
  function slot(id) {
    const w = App.Store.state.world3d || (App.Store.state.world3d = {});
    if (!w[id] || typeof w[id] !== 'object' || Array.isArray(w[id])) w[id] = {};
    const s = w[id];
    if (id === 'airport' && ('airportCheckedIn' in w || 'talked' in w || 'airportHelpSeen' in w)) {
      // 初期プロトタイプの保存形式から移行
      if (w.airportCheckedIn) s.done = true;
      if (Array.isArray(w.talked)) s.talked = Array.from(new Set([...(s.talked || []), ...w.talked]));
      if (w.airportHelpSeen) s.helpSeen = true;
      delete w.airportCheckedIn;
      delete w.talked;
      delete w.airportHelpSeen;
    }
    if (!Array.isArray(s.talked)) s.talked = [];
    return s;
  }

  function mount(root, cfg) {
    const saved = slot(cfg.id);
    App.Store.save();
    const backLabel = '← 旅のマップへ';

    root.innerHTML = `
      <div class="w3d">
        <div class="w3d-canvas"></div>
        <div class="w3d-tags"></div>

        <div class="w3d-top">
          <button class="w3d-back" data-back>${backLabel}</button>
          <div class="w3d-goal"></div>
          <button class="w3d-help-btn" data-help aria-label="操作方法">？</button>
        </div>

        <div class="w3d-label w3d-hamster-label"><div class="bubble"></div></div>
        <div class="w3d-label w3d-person-label"></div>
        <button class="w3d-label w3d-read" hidden></button>
        <button class="w3d-culture" hidden></button>

        <button class="btn btn-primary btn-lg w3d-interact" hidden></button>

        <div class="w3d-controls">${isTouch()
          ? '👆 タップ：そこへ歩く・話しかける　👈 左ドラッグ：移動　👉 右ドラッグ：見回す'
          : '<b>クリック</b> そこへ歩く・話す　<b>WASD / ↑↓</b> 移動　<b>←→</b> 向き　<b>ドラッグ</b> 見回す　<b>Space</b> ダッシュ　<b>E</b> 話す'}</div>

        <div class="w3d-joy" hidden><div class="w3d-joy-knob"></div></div>

        <div class="w3d-overlay w3d-help" hidden>
          <div class="w3d-card pop-in">
            ${UI.hamsterSays(cfg.helpText, { mood: 'happy', size: 'md' })}
            <ul class="w3d-help-list">
              ${isTouch()
                ? '<li>👆 行きたい場所を<b>タップ</b> … そこまで歩く</li><li>🧑 人を<b>タップ</b> … 近くまで歩いて話しかける</li><li>👈 画面の<b>左半分</b>をドラッグ … 自分で歩く</li><li>👉 画面の<b>右半分</b>をドラッグ … 見回す</li><li>💬 近くで出るボタンをタップ … 話す・調べる</li>'
                : '<li>🖱️ 行きたい場所・人を<b>クリック</b> … そこまで歩く・話しかける</li><li><b>W A S D</b> / <b>↑ ↓</b> … 歩く（<b>Space</b> でダッシュ）</li><li><b>← →</b> … 向きを変える</li><li><b>マウスでドラッグ</b> … 見回す</li><li><b>E</b>（または表示されるボタン）… 話す・調べる</li>'}
            </ul>
            <button class="btn btn-primary btn-block" data-help-close>歩いてみる ▶</button>
          </div>
        </div>

        <div class="w3d-overlay w3d-modal" hidden>
          <div class="w3d-card w3d-talk-wrap">
            <button class="w3d-close" data-talk-close aria-label="会話をやめる">×</button>
            ${App.Dev.skipBtn('会話をスキップ', 'data-dev-talk-skip hidden')}
            <div class="w3d-talk-tools">${UI.rateToggle()}${UI.voiceNotice()}</div>
            <div class="w3d-talk"></div>
          </div>
        </div>

        <div class="w3d-loading">
          ${App.Hamster.figure({ mood: 'happy', size: 'lg', bounce: true })}
          <p>${cfg.loading}</p>
        </div>
      </div>`;

    const el = {
      wrap: $('.w3d', root),
      canvas: $('.w3d-canvas', root),
      tags: $('.w3d-tags', root),
      goal: $('.w3d-goal', root),
      hLabel: $('.w3d-hamster-label', root),
      hBubble: $('.w3d-hamster-label .bubble', root),
      pLabel: $('.w3d-person-label', root),
      read: $('.w3d-read', root),
      culture: $('.w3d-culture', root),
      interact: $('.w3d-interact', root),
      joy: $('.w3d-joy', root),
      help: $('.w3d-help', root),
      modal: $('.w3d-modal', root),
      talk: $('.w3d-talk', root),
      loading: $('.w3d-loading', root),
    };

    let disposed = false;
    let cleanup = () => { disposed = true; };
    App.onLeave(() => cleanup());

    $('[data-back]', root).onclick = () => { App.Sfx.play('tap'); App.go('map'); };

    const loadThree = window.THREE ? Promise.resolve() : App.U.loadScript(THREE_URL);
    loadThree
      .then(() => { if (!disposed) start(window.THREE); })
      .catch(() => {
        el.loading.innerHTML = `
          ${App.Hamster.figure({ mood: 'think', size: 'lg' })}
          <p>3D の読み込みに失敗しちゃった…<br><small>インターネット接続を確認してね</small></p>
          <button class="btn btn-primary" data-go="map">${backLabel}</button>`;
      });

    function start(THREE) {
      /* ---------- レンダラー ---------- */
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
      } catch (e) {
        el.loading.innerHTML = '<p>この端末では 3D 表示ができないみたい…</p><button class="btn btn-primary" data-go="map">${backLabel}</button>';
        return;
      }
      // スマホは画素数をおさえて軽くする
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch() ? 1.5 : 2));
      el.canvas.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);
      camera.rotation.order = 'YXZ';
      const world = cfg.build(THREE, scene);
      const people = world.people || [];
      const interactables = world.interactables || [];
      const discoveries = world.discoveries || [];
      const zones = world.zones || [];
      const ground = world.heightAt || (() => 0);
      const readables = world.readables || [];
      const cultures = (world.cultures || []).concat(discoveries.filter((d) => d.culture).map((d) => ({ id: d.culture, x: d.x, z: d.z, r: d.r + 3 })))
        .filter((c) => App.Culture.get(c.id));

      const resize = () => {
        const w = el.wrap.clientWidth;
        const h = el.wrap.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      /* ---------- 状態 ---------- */
      const player = { x: world.spawn.x, z: world.spawn.z, yaw: world.spawn.yaw, pitch: -0.06, walk: 0 };
      const game = {
        phase: cfg.initialPhase || 'find',
        flags: {},
        found: new Set(),
        talked: new Set(),
        busy: false,
        talkingTo: null,
        tempSay: '',
        tempUntil: 0,
        hamsterChasing: false,
        totals: { found: discoveries.length, people: people.length },
      };
      saved.peopleTotal = people.length; // 旅のマップの★（話した人の数）に使う
      let target = null; // { kind: 'spot', id } | { kind: 'person', p }
      let reading = null; // いま画面に「🔍 読む」ボタンを出している看板
      let culNear = null; // いま「📖 文化メモ」ボタンを出している場所

      const input = App.Input3D.create(renderer.domElement, { onInteract: interact, onTap: tapAt, joyEl: el.joy });
      const setBusy = (v) => { game.busy = v; input.setEnabled(!v); if (v) stopWalk(); };

      /* ---------- 当たり判定 ---------- */
      const hitsPerson = (x, z, r) => people.some((p) =>
        Math.hypot(x - p.model.position.x, z - p.model.position.z) < r + C.PERSON_R);
      const blocked = (x, z, r) =>
        world.colliders.some((c) => !c.off && x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ)
        || hitsPerson(x, z, r);
      const clampB = (v, a, b) => Math.max(a, Math.min(b, v));
      function moveWithCollision(obj, dx, dz, r) {
        const b = world.bounds;
        const nx = b ? clampB(obj.x + dx, b.minX, b.maxX) : obj.x + dx;
        if (!blocked(nx, obj.z, r)) obj.x = nx;
        const nz = b ? clampB(obj.z + dz, b.minZ, b.maxZ) : obj.z + dz;
        if (!blocked(obj.x, nz, r)) obj.z = nz;
      }

      /* ---------- ハムスターのセリフ ---------- */
      const hamsterSay = (html, sec = 5) => {
        game.tempSay = html;
        game.tempUntil = performance.now() + sec * 1000;
      };

      /* ---------- 3D 位置 → 画面座標のラベル ---------- */
      const tmp = new THREE.Vector3();
      function placeLabel(node, obj, yOff, maxDist) {
        tmp.set(obj.position.x, obj.position.y + yOff, obj.position.z);
        const dist = tmp.distanceTo(camera.position);
        tmp.project(camera);
        const visible = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1 && dist < maxDist;
        node.style.display = visible ? '' : 'none';
        if (visible) {
          const x = (tmp.x * 0.5 + 0.5) * el.wrap.clientWidth;
          const y = (-tmp.y * 0.5 + 0.5) * el.wrap.clientHeight;
          node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
        }
      }
      // 画面に見えている近くの看板をひとつ選び、その下に「🔍 〜を読む」ボタンを出す
      const readDist = (r) => Math.min(28, 8 + r.h * 16); // 大きい看板ほど遠くから読める
      function updateReadable(s) {
        let best = null;
        let bestScore = Infinity;
        if (!game.busy) {
          readables.forEach((r) => {
            const dx = player.x - r.x;
            const dz = player.z - r.z;
            const dist = Math.hypot(dx, dz);
            if (dist > readDist(r)) return;
            // 看板の表側（+z を rotY だけ回した向き）から見ているときだけ
            if (Math.sin(r.rotY) * dx + Math.cos(r.rotY) * dz <= 0) return;
            tmp.set(r.x, r.y, r.z).project(camera);
            if (tmp.z >= 1 || Math.abs(tmp.x) > 0.85 || Math.abs(tmp.y) > 0.95) return;
            const score = Math.hypot(tmp.x, tmp.y) + dist / readDist(r); // 画面の真ん中に近く、近い看板を優先
            if (score < bestScore) { bestScore = score; best = r; }
          });
        }
        reading = best;
        if (!best) { el.read.hidden = true; return; }
        const key = !target && !(isTouch() || s.touched) ? '（E）' : '';
        if (el.read.dataset.label !== best.id + key) {
          el.read.dataset.label = best.id + key;
          el.read.innerHTML = `🔍 <span class="zh">${esc(best.zh)}</span> を読む${key}`;
        }
        el.read.hidden = false;
        // 看板の下のふちのすぐ下（画面からはみ出さないように寄せる）
        tmp.set(best.x, best.y - best.h / 2, best.z).project(camera);
        const w = el.wrap.clientWidth;
        const h = el.wrap.clientHeight;
        const x = clampB((tmp.x * 0.5 + 0.5) * w, 90, w - 90);
        const y = clampB((-tmp.y * 0.5 + 0.5) * h, 70, h - 170);
        el.read.style.transform = `translate(${x}px, ${y}px) translate(-50%, 8px)`;
      }

      (world.tags || []).forEach((t) => {
        const d = document.createElement('div');
        d.className = 'w3d-label w3d-npc-label';
        d.innerHTML = t.text;
        el.tags.appendChild(d);
        t.el = d;
      });

      /* ---------- 会話モーダル ---------- */
      const lineHtml = (who, s, hideJa) => `
        <div class="w3d-npc-line">
          <div class="avatar">${who.emoji}</div>
          <div class="msg-bubble">
            <div class="msg-name">${esc(who.name)}</div>
            <div class="msg-zh"><span class="zh">${esc(s.zh)}</span>${UI.speakBtn(s.zh, { cls: 'speak-sm' })}</div>
            ${UI.pinyin(s.py)}
            ${s.ja ? `<div class="msg-ja${hideJa ? ' is-hidden' : ''}">${esc(s.ja)}</div>` : ''}
          </div>
        </div>`;
      const hamsterLine = (text, mood = 'normal') => UI.hamsterSays(text, { mood, size: 'xs', cls: 'is-compact' });

      function choice(container, options, { zh = false, onCorrect, wrongMsg }) {
        const order = shuffle(options.map((o, k) => Object.assign({ k }, o)));
        container.insertAdjacentHTML('beforeend', `
          <div class="options ${zh ? 'options-zh' : ''} w3d-options">
            ${order.map((o, i) => `<div class="opt-wrap"><button class="option" data-k="${o.k}"><span class="opt-key">${'ABCD'[i]}</span>
              <span class="opt-body">${zh ? `<span class="zh">${esc(o.zh)}</span>${UI.pinyin(o.py)}` : esc(o.text)}</span></button>
              ${zh ? UI.speakBtn(o.zh, { cls: 'speak-sm opt-speak' }) : ''}</div>`).join('')}
          </div>
          <div class="w3d-fb"></div>`);
        container.querySelectorAll('.w3d-options .option').forEach((btn) => {
          btn.onclick = () => {
            const o = options[Number(btn.dataset.k)];
            if (o.correct) {
              App.Sfx.play('correct');
              btn.classList.add('is-correct');
              container.querySelectorAll('.w3d-options .option').forEach((b) => { b.disabled = true; });
              onCorrect(o);
            } else {
              App.Sfx.play('wrong');
              btn.classList.add('is-wrong', 'shake');
              btn.disabled = true;
              $('.w3d-fb', container).innerHTML = hamsterLine(wrongMsg(o), 'think');
            }
          };
        });
      }

      /* メニューで選んだ料理など（{zh} {py} {ja} {price} {priceZh} {pricePy} {sale} {saleZh} {salePy}）を
       * 後のセリフに差し込む。options: 'price' / 'sale' で値段の聞き取り問題を自動で作る */
      function fillStep(s, v) {
        if (!v) return s;
        const f = (str) => (typeof str === 'string' ? str.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m)) : str);
        const out = {};
        Object.keys(s).forEach((k) => { out[k] = Array.isArray(s[k]) ? s[k].map((o) => (o && typeof o === 'object' ? { zh: f(o.zh), py: f(o.py), ja: f(o.ja) } : f(o))) : f(s[k]); });
        if (s.options === 'price' || s.options === 'sale') {
          const n = s.options === 'price' ? v.price : v.sale;
          const wrong = [n + 10, n > 10 ? n - 5 : n + 5].filter((x) => x !== n);
          out.options = [`${n}元`, ...wrong.map((x) => `${x}元`)];
          out.answer = 0;
          out.hint = out.hint || `「${s.options === 'price' ? v.priceZh : v.saleZh}」＝${n}元`;
        }
        return out;
      }

      let talkToken = 0;
      function runTalk(who, script, onDone) {
        setBusy(true);
        el.interact.hidden = true;
        el.modal.hidden = false;
        const token = ++talkToken;
        const t = el.talk;
        let i = 0;
        let vars = null;
        // 開発者モード：会話イベントを最後まで進めたことにする
        const devSkip = $('[data-dev-talk-skip]', root);
        if (devSkip) {
          devSkip.hidden = false;
          devSkip.onclick = () => {
            if (token !== talkToken) return;
            const menu = script.find((x) => x.type === 'menu');
            if (menu && !vars) vars = menu.items[0];
            ctx.talkVars = vars;
            i = script.length;
            onDone(vars);
          };
        }
        const nextBtn = (label) => {
          t.insertAdjacentHTML('beforeend', `<button class="btn btn-primary btn-block" data-step>${label}</button>`);
          $('[data-step]', t).onclick = () => { App.Sfx.play('tap'); next(); };
        };
        const later = (fn, ms) => setTimeout(() => { if (token === talkToken && !disposed) fn(); }, ms);

        function next() {
          if (disposed || token !== talkToken) return;
          if (i >= script.length) { onDone(vars); return; }
          const s = fillStep(script[i++], vars);
          t.parentElement.scrollTop = 0;

          if (s.type === 'menu') {
            t.innerHTML = `${s.hamster ? hamsterLine(s.hamster, 'happy') : ''}
              <div class="w3d-menu"><div class="w3d-menu-title">📜 ${esc(s.title || '菜单 メニュー')}</div>
              ${s.items.map((m, k) => `<button class="w3d-menu-item" data-m="${k}">
                <span class="w3d-menu-emoji">${m.emoji || '🍽️'}</span>
                <span class="w3d-menu-name"><span class="zh">${esc(m.zh)}</span>${UI.pinyin(m.py, { force: true })}<small>${esc(m.ja)}</small></span>
                <span class="w3d-menu-price">¥${m.price}</span></button>`).join('')}</div>`;
            t.querySelectorAll('[data-m]').forEach((b) => {
              b.onclick = () => {
                vars = s.items[Number(b.dataset.m)];
                ctx.talkVars = vars;
                App.Sfx.play('correct');
                App.Speech.speak(vars.zh);
                b.classList.add('is-picked');
                t.querySelectorAll('[data-m]').forEach((x) => { x.disabled = true; });
                later(next, 700);
              };
            });
            return;
          }

          if (s.type === 'hamster') {
            t.innerHTML = UI.hamsterSays(s.text, { mood: s.mood || 'happy', size: 'sm' });
            App.MochiVoice.speak(s.text);
            nextBtn(s.next || 'つぎへ ▶');
            return;
          }
          if (s.zh) App.Speech.speak(s.zh);

          if (s.type === 'line') {
            t.innerHTML = lineHtml(s.who || who, s, false) + (s.hamster ? hamsterLine(s.hamster, 'happy') : '');
            nextBtn(s.next || 'つぎへ ▶');
            return;
          }
          if (s.type === 'understand') {
            t.innerHTML = `${lineHtml(s.who || who, s, true)}<div class="w3d-q">❓ ${s.q}</div>`;
            choice(t, s.options.map((text, k) => ({ text, correct: k === s.answer })), {
              onCorrect: () => {
                const ja = $('.msg-ja', t);
                if (ja) ja.classList.remove('is-hidden');
                later(next, 900);
              },
              wrongMsg: () => (s.hint ? `おしい！${s.hint}` : 'おしい！🔊でもう一回聞いてみよう'),
            });
            return;
          }
          if (s.type === 'say') {
            t.innerHTML = (s.zh ? lineHtml(s.who || who, s, false) : '') + hamsterLine(s.hamster || '返事をしよう！');
            const opts = s.options.map((o, k) => Object.assign({ correct: k === s.answer }, opt(o)));
            choice(t, opts, {
              zh: true,
              onCorrect: (o) => {
                App.Speech.speak(o.zh);
                t.insertAdjacentHTML('beforeend', `<div class="w3d-me">🧳 あなた：<span class="zh">${esc(o.zh)}</span>${UI.speakBtn(o.zh, { cls: 'speak-sm' })}${UI.pinyin(o.py)}<div>${esc(o.ja)}</div></div>`);
                later(next, 1100);
              },
              wrongMsg: (o) => `「${esc(o.zh)}」は「${esc(o.ja)}」って意味だよ`,
            });
          }
        }
        next();
      }

      function closeTalk() {
        talkToken++;
        const ds = $('[data-dev-talk-skip]', root);
        if (ds) ds.hidden = true;
        el.modal.hidden = true;
        game.talkingTo = null;
        setBusy(false);
      }
      $('[data-talk-close]', root).onclick = () => { App.Sfx.play('tap'); closeTalk(); };

      /* ---------- 看板を読む ---------- */
      const signCard = (r) => `
        <div class="sign-card">
          <div class="sign-plate" style="background:${esc(r.bg)}">
            <span class="zh">${esc(r.zh)}</span>${r.en ? `<small>${esc(r.en)}</small>` : ''}
          </div>
          <div class="sign-read">
            <div class="sign-text">${UI.pinyin(r.py, { force: true, cls: 'py-lg' })}<div class="sign-ja">${esc(r.ja)}</div></div>
            ${UI.speakBtn(r.say || r.zh, { label: '🔊 聞く', cls: 'speak-pill' })}
          </div>
          ${r.lines ? `<ul class="sign-lines">${r.lines.map((l) => `
            <li><span class="zh">${esc(l.zh)}</span><span class="py">${esc(l.py)}</span><span class="sign-line-ja">${esc(l.ja)}</span>${UI.speakBtn(l.zh, { cls: 'speak-sm' })}</li>`).join('')}
          </ul>` : ''}
          ${r.note ? hamsterLine(r.note) : ''}
        </div>`;

      function openSign(r) {
        App.Sfx.play('tap');
        talkToken++;
        setBusy(true);
        el.interact.hidden = true;
        el.read.hidden = true;
        el.modal.hidden = false;
        el.talk.parentElement.scrollTop = 0;
        el.talk.innerHTML = `${signCard(r)}<button class="btn btn-primary btn-block" data-step>とじる</button>`;
        $('[data-step]', el.talk).onclick = () => { App.Sfx.play('tap'); closeTalk(); };
        App.Speech.speak(r.say || r.zh);
      }
      el.read.onclick = () => { if (reading && !game.busy) openSign(reading); };

      /* ---------- 文化メモ（建物・食べ物の説明と歴史） ---------- */
      function updateCulture() {
        let best = null;
        let bestD = Infinity;
        if (!game.busy) {
          cultures.forEach((c) => {
            const d = Math.hypot(player.x - c.x, player.z - c.z);
            if (d < c.r && d < bestD) { bestD = d; best = c; }
          });
        }
        culNear = best;
        if (!best) { el.culture.hidden = true; return; }
        const info = App.Culture.get(best.id);
        const read = App.Culture.isRead(best.id);
        const key = best.id + (read ? ':read' : '');
        if (el.culture.dataset.k !== key) {
          el.culture.dataset.k = key;
          el.culture.innerHTML = `<small>📖 文化メモ</small><b>${info.emoji} ${esc(info.name)}</b>${read ? '' : '<i>NEW</i>'}`;
        }
        el.culture.hidden = false;
      }
      // after: 「もどる」で呼ぶ関数（成功カードから開いたときなど）。無ければ閉じる
      function openCulture(id, { after } = {}) {
        if (!App.Culture.get(id)) return;
        App.Sfx.play('tap');
        talkToken++;
        setBusy(true);
        el.interact.hidden = true;
        el.read.hidden = true;
        el.culture.hidden = true;
        el.modal.hidden = false;
        el.talk.parentElement.scrollTop = 0;
        App.Culture.markRead(id);
        el.talk.innerHTML = `${App.Culture.card(id)}<button class="btn btn-primary btn-block" data-step>とじる</button>`;
        $('[data-step]', el.talk).onclick = () => { App.Sfx.play('tap'); if (after) after(); else closeTalk(); };
      }
      el.culture.onclick = () => { if (culNear && !game.busy) openCulture(culNear.id); };

      // 会話のあとの「できた！」カード（モーダル内に表示）
      function successCard({ emoji, title, sub = '', exp = 0, body = '', buttons = [] }) {
        const ds = $('[data-dev-talk-skip]', root);
        if (ds) ds.hidden = true;
        el.modal.hidden = false;
        setBusy(true);
        App.Sfx.play('clear');
        const t = el.talk;
        t.innerHTML = `
          <div class="w3d-success">
            <div class="w3d-success-emoji">${emoji}</div>
            <h2>${title}</h2>
            ${sub ? `<p class="muted">${sub}</p>` : ''}
            ${exp ? `<span class="chip chip-new">+${exp} EXP</span>` : ''}
          </div>
          ${body}
          ${buttons.map((b, k) => `<button class="btn ${b.primary === false ? 'btn-sub' : 'btn-primary'} btn-block" data-sbtn="${k}">${b.label}</button>`).join('')}`;
        t.querySelectorAll('[data-sbtn]').forEach((btn) => {
          btn.onclick = () => {
            App.Sfx.play('tap');
            const b = buttons[Number(btn.dataset.sbtn)];
            if (b.onClick) b.onClick(); else closeTalk();
          };
        });
      }

      function reward(exp) {
        App.Progress.markPlayed();
        App.Progress.addExp(exp);
        App.Store.save();
      }

      function teleport(to) {
        player.x = to.x;
        player.z = to.z;
        player.yaw = to.yaw || 0;
        player.pitch = -0.06;
        const hm = world.hamster;
        hm.position.set(to.x - Math.sin(player.yaw) * 2.2 + Math.cos(player.yaw) * 0.8, 0, to.z - Math.cos(player.yaw) * 2.2 - Math.sin(player.yaw) * 0.8);
        game.hamsterChasing = false;
      }

      const ctx = {
        THREE, scene, world, game, saved, player, el, C,
        runTalk, closeTalk, successCard, hamsterSay, hamsterLine, toast, teleport, reward, openCulture,
        setBusy, // 3D の上に別の画面（武術大会など）を出すときに、歩けないようにする
        save: () => App.Store.save(),
        near: null,
      };

      /* ---------- 話す・調べる ---------- */
      function interact() {
        if (game.busy) return;
        if (!target) { if (reading) openSign(reading); return; }
        App.Sfx.play('tap');
        if (target.kind === 'spot') {
          const fn = cfg.onInteract && cfg.onInteract[target.id];
          if (fn) fn(ctx);
        } else {
          talkToPerson(target.p);
        }
      }
      el.interact.onclick = interact;

      function talkToPerson(p) {
        game.talkingTo = p;
        const def = p.def;
        runTalk({ name: def.name, emoji: def.emoji }, def.script, () => {
          const first = !saved.talked.includes(def.id);
          if (first) {
            saved.talked.push(def.id);
            reward(C.TALK_EXP);
          }
          game.talked.add(def.id);
          if (cfg.onTalked) cfg.onTalked(def, ctx);
          successCard({
            emoji: def.emoji,
            title: '会話できた！',
            sub: `${esc(def.name)}とおしゃべりしたよ`,
            exp: first ? C.TALK_EXP : 0,
            body: hamsterLine(game.talked.size >= game.totals.people
              ? 'ここにいる人<b>全員</b>と話せたね！すごい！🎉'
              : `その調子！あと <b>${game.totals.people - game.talked.size}人</b> と話せるよ`, 'happy'),
            buttons: [{ label: '🧭 探索にもどる' }],
          });
        });
      }

      /* ---------- タップで移動・話しかける ---------- */
      // walk = { kind: 'point'|'person'|'spot', x, z, p?, it?, stuckT }
      let walk = null;
      const marker = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.5, 28),
        new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.9, depthWrite: false }));
      marker.rotation.x = -Math.PI / 2;
      marker.visible = false;
      marker.renderOrder = 5;
      scene.add(marker);
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      // タップで当たりを調べるもの（空・雲・遠くの山・裏面だけの空の球はのぞく）
      function pickables() {
        const skip = new Set(scene.userData.follow || []);
        const list = [];
        scene.children.forEach((o) => {
          if (skip.has(o) || o === marker || o.isLight) return;
          o.traverse((m) => {
            if (!m.isMesh || !m.visible) return;
            const mat = Array.isArray(m.material) ? m.material[0] : m.material;
            if (mat && mat.side === THREE.BackSide) return;
            list.push(m);
          });
        });
        return list;
      }
      function stopWalk() {
        walk = null;
        marker.visible = false;
      }
      function startWalk(w) {
        walk = Object.assign({ stuckT: 0, side: 1, bestD: Infinity, slowT: 0 }, w);
        marker.visible = w.kind === 'point';
        if (marker.visible) marker.position.set(w.x, ground(w.x, w.z) + 0.06, w.z);
      }
      const isInside = (root, o) => { for (let n = o; n; n = n.parent) if (n === root) return true; return false; };
      function tapAt(cx, cy) {
        if (game.busy) return;
        const rect = renderer.domElement.getBoundingClientRect();
        ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        raycaster.far = 120;
        const hit = raycaster.intersectObjects(pickables(), false)[0];
        // 1) 人をタップ → 近くまで歩いて話しかける（人は細いので、画面の上で近ければ OK。壁のむこうの人はのぞく）
        const w = el.wrap.clientWidth;
        const h = el.wrap.clientHeight;
        const pxPerM = h / (2 * Math.tan((camera.fov * Math.PI) / 360)); // 1m 先の 1m が何 px か
        let tapped = null;
        let tappedScore = 1;
        people.forEach((p) => {
          const m = p.model;
          const cy3 = m.position.y + 0.9 * m.scale.y; // からだの真ん中
          const camD = camera.position.distanceTo(tmp.set(m.position.x, cy3, m.position.z));
          if (camD > 45 || (hit && hit.distance < camD - 1.2 && !isInside(m, hit.object))) return;
          tmp.project(camera);
          if (tmp.z >= 1) return;
          // 人の形（よこ 0.3m・たて 1m）のだ円＋指の太さ 22px の中なら当たり
          const rx = (0.3 * pxPerM) / camD + 22;
          const ry = (1.0 * m.scale.y * pxPerM) / camD + 22;
          const ex = ((tmp.x * 0.5 + 0.5) * w - cx) / rx;
          const ey = ((-tmp.y * 0.5 + 0.5) * h - cy) / ry;
          const score = Math.hypot(ex, ey);
          if (score < tappedScore) { tapped = p; tappedScore = score; }
        });
        if (tapped) {
          App.Sfx.play('tap');
          const d = Math.hypot(player.x - tapped.model.position.x, player.z - tapped.model.position.z);
          if (d < C.PERSON_TALK) { stopWalk(); target = { kind: 'person', p: tapped }; talkToPerson(tapped); } else startWalk({ kind: 'person', p: tapped });
          return;
        }
        if (!hit) return;
        const hx = hit.point.x;
        const hz = hit.point.z;
        // 2) 看板をタップ（読める距離なら、そのまま読む）
        const sign = readables.find((r) => hit.point.distanceTo(tmp.set(r.x, r.y, r.z)) < Math.max(1.6, r.h * 0.9));
        if (sign && Math.hypot(player.x - sign.x, player.z - sign.z) <= readDist(sign)) { stopWalk(); openSign(sign); return; }
        // 3) 調べる場所（カウンター・屋台・出口など）の近く → 歩いて行って調べる
        let spot = null;
        let spotD = Infinity;
        interactables.forEach((it) => {
          const d = Math.hypot(hx - it.x, hz - it.z);
          if (d < it.r + 1.2 && d < spotD && cfg.interactLabel(it.id, ctx)) { spot = it; spotD = d; }
        });
        if (spot) {
          App.Sfx.play('tap');
          if (Math.hypot(player.x - spot.x, player.z - spot.z) < spot.r) { stopWalk(); target = { kind: 'spot', id: spot.id }; interact(); } else startWalk({ kind: 'spot', it: spot, x: spot.x, z: spot.z });
          return;
        }
        // 4) ふつうの場所 → そこまで歩く（壁などをタップしたら、ぶつかるところまで）
        startWalk({ kind: 'point', x: hx, z: hz });
      }
      // 毎フレーム：目的地に向かって歩く。着いたら話しかける・調べる。進めなくなったら止まる
      function updateWalk(dt) {
        if (!walk) return false;
        if (walk.kind === 'person') { walk.x = walk.p.model.position.x; walk.z = walk.p.model.position.z; }
        const dx = walk.x - player.x;
        const dz = walk.z - player.z;
        const d = Math.hypot(dx, dz);
        const reach = walk.kind === 'person' ? C.PERSON_TALK - 0.6 : walk.kind === 'spot' ? Math.max(0.6, walk.it.r * 0.55) : 0.35;
        if (d <= reach) {
          const w = walk;
          stopWalk();
          if (w.kind === 'person') { target = { kind: 'person', p: w.p }; talkToPerson(w.p); }
          else if (w.kind === 'spot' && cfg.interactLabel(w.it.id, ctx)) { target = { kind: 'spot', id: w.it.id }; interact(); }
          return false;
        }
        // 進む方向に向きを合わせる（前 = (-sin yaw, -cos yaw)）
        let diff = Math.atan2(-dx, -dz) - player.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        player.yaw += diff * Math.min(1, dt * 7);
        player.pitch += (-0.08 - player.pitch) * Math.min(1, dt * 3);
        const run = d > 12;
        const step = Math.min(d, (run ? C.RUN : C.SPEED) * dt);
        const bx = player.x;
        const bz = player.z;
        const base = Math.atan2(dx, dz);
        let moved = 0;
        // まっすぐ → 少し横 → もっと横…と試して、進める向きへ（人や柱をよける）
        for (const a of [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4]) {
          const ang = base + a * walk.side;
          player.x = bx;
          player.z = bz;
          moveWithCollision(player, Math.sin(ang) * step, Math.cos(ang) * step, C.RADIUS);
          moved = Math.hypot(player.x - bx, player.z - bz);
          if (moved >= step * 0.6) { if (a < 0) walk.side = -walk.side; break; }
        }
        // ほとんど進めない／目的地に近づけない時間が続いたら止まる
        walk.stuckT = moved < step * 0.25 ? walk.stuckT + dt : 0;
        if (d < walk.bestD - 0.3) { walk.bestD = d; walk.slowT = 0; } else walk.slowT += dt;
        if (walk.stuckT > 0.5 || walk.slowT > 2) {
          const kind = walk.kind;
          stopWalk();
          if (kind !== 'point') hamsterSay('うーん、まっすぐは行けないみたい…<br><small>まわり道してみてね</small>', 3);
          return false;
        }
        player.walk += dt * (run ? 13 : 9);
        return run ? 'run' : 'walk';
      }

      /* ---------- ヘルプ ---------- */
      const openHelp = () => { setBusy(true); el.help.hidden = false; };
      $('[data-help]', root).onclick = openHelp;
      $('[data-help-close]', root).onclick = () => { App.Sfx.play('tap'); el.help.hidden = true; setBusy(false); };

      /* ---------- 人の動き ---------- */
      const angleTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
      function turnToward(obj, angle, k) {
        let diff = angle - obj.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        obj.rotation.y += diff * Math.min(1, k);
      }
      function updatePeople(dt) {
        people.forEach((p) => {
          const m = p.model;
          m.position.y = ground(m.position.x, m.position.z);
          const pos = { x: m.position.x, z: m.position.z };
          const dPlayer = Math.hypot(player.x - pos.x, player.z - pos.z);
          const talking = game.talkingTo === p;
          const attentive = talking || (target && target.p === p);

          if (p.def.path && !talking) {
            const [wx, wz] = p.def.path[p.wp];
            const dx = wx - pos.x;
            const dz = wz - pos.z;
            const d = Math.hypot(dx, dz);
            if (d < 0.15) {
              p.wp = (p.wp + 1) % p.def.path.length;
            } else if (dPlayer > 1.6 && !attentive) {
              const step = Math.min(d, C.NPC_SPEED * dt);
              const nx = pos.x + (dx / d) * step;
              const nz = pos.z + (dz / d) * step;
              if (Math.hypot(player.x - nx, player.z - nz) > C.RADIUS + C.PERSON_R + 0.05) {
                m.position.x = nx;
                m.position.z = nz;
                p.phase += dt * 7;
                App.Models3D.animateWalk(m, p.phase, 1);
                turnToward(m, Math.atan2(dx, dz), dt * 6);
                return;
              }
            }
          }
          App.Models3D.animateWalk(m, p.phase, 0);
          if (attentive && !p.def.sit) turnToward(m, angleTo(pos, player), dt * 5);
          else if (!p.def.path) turnToward(m, p.homeRot, dt * 2);
        });
      }

      /* ---------- 案内テキスト ---------- */
      let lastGoal = '';
      let lastSay = '';
      function updateTexts(now) {
        const g = cfg.guide(ctx);
        const say = `🐹 ${now < game.tempUntil ? game.tempSay : g.say}`;
        if (g.goal !== lastGoal) { el.goal.innerHTML = g.goal; lastGoal = g.goal; }
        if (say !== lastSay) { el.hBubble.innerHTML = say; lastSay = say; }
      }

      /* ---------- メインループ ---------- */
      const clock = new THREE.Clock();
      let raf = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        const now = performance.now();

        input.update();
        const s = input.state;
        const look = input.consumeLook();
        let moving = false;
        if (!game.busy) {
          player.yaw -= look.x * C.LOOK + s.turn * C.TURN * dt;
          player.pitch = clampB(player.pitch - look.y * C.LOOK, -1.1, 1.1);
          if (s.moveX || s.moveZ || s.turn || Math.abs(look.x) > 2) stopWalk(); // 自分で動かしたらタップ移動はやめる
          if (updateWalk(dt)) moving = true;
          if (s.moveX || s.moveZ) {
            const sp = (s.run ? C.RUN : C.SPEED) * dt;
            const sin = Math.sin(player.yaw);
            const cos = Math.cos(player.yaw);
            // 前 = (-sin, -cos)、右 = (cos, -sin)
            const dx = (-sin * s.moveZ + cos * s.moveX) * sp;
            const dz = (-cos * s.moveZ - sin * s.moveX) * sp;
            moveWithCollision(player, dx, dz, C.RADIUS);
            player.walk += dt * (s.run ? 13 : 9);
            moving = true;
          }
        }
        const bob = moving ? Math.sin(player.walk) * (s.run ? 0.06 : 0.045) : 0;
        if (marker.visible) marker.material.opacity = 0.55 + Math.sin(t * 6) * 0.35;
        camera.position.set(player.x, C.EYE + bob + ground(player.x, player.z), player.z);
        camera.rotation.set(player.pitch, player.yaw, 0);

        updatePeople(dt);
        if (world.update) world.update(dt, t, ctx);

        // ハムスター：離れすぎたらトコトコついてくる
        const hm = world.hamster;
        const hp = { x: hm.position.x, z: hm.position.z };
        const hdx = player.x - hp.x;
        const hdz = player.z - hp.z;
        const hd = Math.hypot(hdx, hdz);
        if (hd > 4.5) game.hamsterChasing = true;
        if (hd < 2.4) game.hamsterChasing = false;
        if (game.hamsterChasing) {
          const step = Math.min(hd - 2.3, Math.min(s.run ? 9 : 7, hd * 1.3) * dt);
          moveWithCollision(hp, (hdx / hd) * step, (hdz / hd) * step, 0.4);
          hm.position.x = hp.x;
          hm.position.z = hp.z;
          hm.position.y = ground(hp.x, hp.z) + Math.abs(Math.sin(t * 10)) * 0.14;
        } else {
          hm.position.y = ground(hp.x, hp.z) + 0.04 + Math.sin(t * 2.2) * 0.04;
        }
        turnToward(hm, Math.atan2(hdx, hdz), dt * 6);

        (world.facePlayer || []).forEach((m) => {
          m.rotation.y = Math.atan2(player.x - m.position.x, player.z - m.position.z) * 0.6;
        });

        // いちばん近い「話せる相手・調べられる場所」
        let bestSpot = null;
        let bestSpotD = Infinity;
        interactables.forEach((it) => {
          const d = Math.hypot(player.x - it.x, player.z - it.z);
          if (d < it.r && d < bestSpotD && cfg.interactLabel(it.id, ctx)) { bestSpot = it; bestSpotD = d; }
        });
        let best = null;
        let bestD = Infinity;
        people.forEach((p) => {
          const d = Math.hypot(player.x - p.model.position.x, player.z - p.model.position.z);
          if (d < bestD) { bestD = d; best = p; }
        });
        if (!game.busy) {
          if (bestSpot && (bestSpotD <= bestD || bestD >= C.PERSON_TALK)) target = { kind: 'spot', id: bestSpot.id };
          else if (best && bestD < C.PERSON_TALK) target = { kind: 'person', p: best };
          else target = null;
        }
        ctx.near = target && target.kind === 'spot' ? target.id : null;

        const showBtn = !!target && !game.busy;
        if (el.interact.hidden === showBtn) el.interact.hidden = !showBtn;
        if (showBtn) {
          const key = isTouch() || s.touched ? '' : '（E）';
          const label = target.kind === 'spot' ? cfg.interactLabel(target.id, ctx) : `💬 ${target.p.def.emoji} 話しかける`;
          if (el.interact.dataset.label !== label + key) {
            el.interact.dataset.label = label + key;
            el.interact.textContent = label + key;
          }
        }

        // 近くの人の名札
        if (best && bestD < 7 && !game.busy) {
          const tag = `${game.talked.has(best.def.id) ? '✅' : '💬'} ${best.def.emoji} ${best.def.name}`;
          if (el.pLabel.dataset.tag !== tag) { el.pLabel.dataset.tag = tag; el.pLabel.textContent = tag; }
          placeLabel(el.pLabel, best.model, (best.def.sit ? 1.6 : 2.05) * best.model.scale.y, 7.5);
        } else {
          el.pLabel.style.display = 'none';
        }

        // 発見スポット
        discoveries.forEach((d) => {
          if (game.found.has(d.id)) return;
          if (Math.hypot(player.x - d.x, player.z - d.z) < d.r) {
            game.found.add(d.id);
            App.Sfx.play('correct');
            hamsterSay(d.culture && !App.Culture.isRead(d.culture)
              ? `${d.say}<br><small>📖 右上の「文化メモ」で、くわしく読めるよ</small>` : d.say, d.culture ? 7 : 6);
            if (cfg.onDiscover) cfg.onDiscover(d, ctx);
          }
        });

        // エリアに入ったとき
        if (!game.busy) {
          zones.forEach((zn) => {
            const key = 'zone:' + zn.id;
            if (game.flags[key]) return;
            if (player.x > zn.x1 && player.x < zn.x2 && player.z > zn.z1 && player.z < zn.z2) {
              game.flags[key] = true;
              const fn = cfg.onZone && cfg.onZone[zn.id];
              if (fn) fn(ctx);
            }
          });
        }

        updateReadable(s);
        updateCulture();
        updateTexts(now);
        placeLabel(el.hLabel, hm, 1.35, 30);
        (world.tags || []).forEach((tg) => placeLabel(tg.el, tg.obj, tg.y, tg.maxDist || 16));

        // 空・雲・遠くの山（scenery.js）はカメラについてくる
        (scene.userData.follow || []).forEach((o) => {
          o.position.x = camera.position.x;
          o.position.z = camera.position.z;
          if (o.userData.followY) o.position.y = camera.position.y;
        });
        renderer.render(scene, camera);
      }

      el.loading.hidden = true;
      if (!saved.helpSeen) {
        saved.helpSeen = true;
        App.Store.save();
        openHelp();
      }
      frame();

      cleanup = () => {
        disposed = true;
        cancelAnimationFrame(raf);
        input.dispose();
        window.removeEventListener('resize', resize);
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          }
        });
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      };
    }
  }

  // 人の配置（共通）：def.sit / def.stand / def.path
  function spawnPeople(THREE, scene, defs) {
    return defs.map((def) => {
      const model = App.Models3D.person(THREE, Object.assign({ sitting: !!def.sit }, def.look));
      const at = def.sit || def.stand || { x: def.path[0][0], z: def.path[0][1], rot: 0 };
      model.position.set(at.x, 0, at.z);
      model.rotation.y = at.rot || 0;
      scene.add(model);
      return { def, model, wp: 1, phase: Math.random() * 6, homeRot: at.rot || 0 };
    });
  }

  App.World3D = App.World3D || {};
  App.World3D.mount = mount;
  App.World3D.spawnPeople = spawnPeople;
  App.World3D.C = C;
})(window.App = window.App || {});
