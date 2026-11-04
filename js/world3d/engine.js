/* 3D フィールド共通エンジン
 * 歩く・見回す・当たり判定・ハムスター追従・人の動きと会話・発見スポット・ラベル表示・会話モーダル。
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
 *   discoveries: [{id,x,z,r,say}]               近づくとハムスターが豆知識
 *   zones: [{id,x1,x2,z1,z2}]                   入ると cfg.onZone[id] が 1 回呼ばれる
 *   update?(dt, t, ctx)
 *
 * cfg:
 *   id, loading, helpText, build, initialPhase?
 *   guide(ctx) -> {goal, say}
 *   interactLabel(id, ctx) -> string | null（null ならボタンを出さない）
 *   onInteract: {id: (ctx) => void}, onZone?: {id: fn}, onDiscover?(d, ctx)
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

    root.innerHTML = `
      <div class="w3d">
        <div class="w3d-canvas"></div>
        <div class="w3d-tags"></div>

        <div class="w3d-top">
          <button class="w3d-back" data-back>← 上海マップへ戻る</button>
          <div class="w3d-goal"></div>
          <button class="w3d-help-btn" data-help aria-label="操作方法">？</button>
        </div>

        <div class="w3d-label w3d-hamster-label"><div class="bubble"></div></div>
        <div class="w3d-label w3d-person-label"></div>

        <button class="btn btn-primary btn-lg w3d-interact" hidden></button>

        <div class="w3d-controls">${isTouch()
          ? '👈 左側ドラッグ：移動　👉 右側ドラッグ：見回す'
          : '<b>WASD / ↑↓</b> 移動　<b>←→</b> 向き　<b>ドラッグ</b> 見回す　<b>Space</b> ダッシュ　<b>E</b> 話す'}</div>

        <div class="w3d-joy" hidden><div class="w3d-joy-knob"></div></div>

        <div class="w3d-overlay w3d-help" hidden>
          <div class="w3d-card pop-in">
            ${UI.hamsterSays(cfg.helpText, { mood: 'happy', size: 'md' })}
            <ul class="w3d-help-list">
              ${isTouch()
                ? '<li>👈 画面の<b>左半分</b>をドラッグ … 歩く</li><li>👉 画面の<b>右半分</b>をドラッグ … 見回す</li><li>💬 近くで出るボタンをタップ … 話す・調べる</li>'
                : '<li><b>W A S D</b> / <b>↑ ↓</b> … 歩く（<b>Space</b> でダッシュ）</li><li><b>← →</b> … 向きを変える</li><li><b>マウスでドラッグ</b> … 見回す</li><li><b>E</b>（または表示されるボタン）… 話す・調べる</li>'}
            </ul>
            <button class="btn btn-primary btn-block" data-help-close>歩いてみる ▶</button>
          </div>
        </div>

        <div class="w3d-overlay w3d-modal" hidden>
          <div class="w3d-card w3d-talk-wrap">
            <button class="w3d-close" data-talk-close aria-label="会話をやめる">×</button>
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
          <button class="btn btn-primary" data-go="map">← 上海マップへ戻る</button>`;
      });

    function start(THREE) {
      /* ---------- レンダラー ---------- */
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
      } catch (e) {
        el.loading.innerHTML = '<p>この端末では 3D 表示ができないみたい…</p><button class="btn btn-primary" data-go="map">← 上海マップへ戻る</button>';
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      el.canvas.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);
      camera.rotation.order = 'YXZ';
      const world = cfg.build(THREE, scene);
      const people = world.people || [];
      const interactables = world.interactables || [];
      const discoveries = world.discoveries || [];
      const zones = world.zones || [];

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
      let target = null; // { kind: 'spot', id } | { kind: 'person', p }

      const input = App.Input3D.create(renderer.domElement, { onInteract: interact, joyEl: el.joy });
      const setBusy = (v) => { game.busy = v; input.setEnabled(!v); };

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

      let talkToken = 0;
      function runTalk(who, script, onDone) {
        setBusy(true);
        el.interact.hidden = true;
        el.modal.hidden = false;
        const token = ++talkToken;
        const t = el.talk;
        let i = 0;
        const nextBtn = (label) => {
          t.insertAdjacentHTML('beforeend', `<button class="btn btn-primary btn-block" data-step>${label}</button>`);
          $('[data-step]', t).onclick = () => { App.Sfx.play('tap'); next(); };
        };
        const later = (fn, ms) => setTimeout(() => { if (token === talkToken && !disposed) fn(); }, ms);

        function next() {
          if (disposed || token !== talkToken) return;
          if (i >= script.length) { onDone(); return; }
          const s = script[i++];
          t.parentElement.scrollTop = 0;

          if (s.type === 'hamster') {
            t.innerHTML = UI.hamsterSays(s.text, { mood: s.mood || 'happy', size: 'sm' });
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
        el.modal.hidden = true;
        game.talkingTo = null;
        setBusy(false);
      }
      $('[data-talk-close]', root).onclick = () => { App.Sfx.play('tap'); closeTalk(); };

      // 会話のあとの「できた！」カード（モーダル内に表示）
      function successCard({ emoji, title, sub = '', exp = 0, body = '', buttons = [] }) {
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
        runTalk, closeTalk, successCard, hamsterSay, hamsterLine, toast, teleport, reward,
        save: () => App.Store.save(),
        near: null,
      };

      /* ---------- 話す・調べる ---------- */
      function interact() {
        if (game.busy || !target) return;
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
        camera.position.set(player.x, C.EYE + bob, player.z);
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
          hm.position.y = Math.abs(Math.sin(t * 10)) * 0.14;
        } else {
          hm.position.y = 0.04 + Math.sin(t * 2.2) * 0.04;
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
            hamsterSay(d.say, 6);
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

        updateTexts(now);
        placeLabel(el.hLabel, hm, 1.35, 30);
        (world.tags || []).forEach((tg) => placeLabel(tg.el, tg.obj, tg.y, tg.maxDist || 16));

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
