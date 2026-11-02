/* 3D 空港（プロトタイプ）
 * 上海マップの ✈️ アイコン → この画面。歩いてチェックインカウンターを探し、中国語でチェックインする。
 * 空港にいる一般の人にも話しかけられる（会話は js/world3d/airport.js の PEOPLE）。
 * Three.js はこの画面に入ったときだけ CDN から読み込む。
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { $, esc, shuffle, toast } = App.U;
  const UI = App.UI;

  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const EYE = 1.6;          // 目の高さ
  const SPEED = 4.2;        // 歩く速さ m/s
  const RUN = 7.5;          // 走る速さ
  const RADIUS = 0.45;      // プレイヤーの当たり判定
  const TURN = 2.2;         // ←→キーで向きを変える速さ rad/s
  const LOOK = 0.0032;      // ドラッグ感度
  const TALK_DIST = 3.2;    // カウンターで話せる距離
  const PERSON_TALK = 2.6;  // 人に話しかけられる距離
  const PERSON_R = 0.32;    // 人の当たり判定
  const NPC_SPEED = 1.15;   // 歩いている人の速さ
  const CHECKIN_EXP = 10;
  const TALK_EXP = 3;

  const isTouch = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // 'phraseId' でも {zh,py,ja} でも書けるようにする
  const opt = (o) => (typeof o === 'string' ? App.PHRASES[o] : o);

  // チェックインカウンターの会話（書式は人の会話と同じ）
  const CHECKIN_SCRIPT = [
    { type: 'hamster', text: 'チェックインしてみよう！<br>まずは係員さんの言葉を聞いてね' },
    { type: 'understand', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', q: '「<b class="zh">你好</b>」の意味は？',
      options: ['こんにちは', 'ありがとう', 'さようなら'], answer: 0 },
    { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: '正解！「你好」は<b>こんにちは</b>。<br>あいさつを返そう！',
      options: ['nihao', 'xiexie', 'zaijian'], answer: 0 },
    { type: 'line', zh: '请出示您的护照。', py: 'Qǐng chūshì nín de hùzhào.', ja: 'パスポートを見せてください。',
      hamster: 'パスポートをわたそう 🛂', next: '🛂 パスポートをわたす' },
    { type: 'say', zh: '好了！这是您的登机牌。', py: 'Hǎo le! Zhè shì nín de dēngjīpái.', ja: 'はい、こちらが搭乗券です。',
      hamster: '搭乗券をもらったよ！<b>お礼</b>を言おう', options: ['xiexie', 'nihao', 'zaijian'], answer: 0 },
  ];

  App.screens.airport3d = (root) => {
    const saved = App.Store.state.world3d || (App.Store.state.world3d = {});
    if (!Array.isArray(saved.talked)) saved.talked = [];

    root.innerHTML = `
      <div class="w3d">
        <div class="w3d-canvas"></div>

        <div class="w3d-top">
          <button class="w3d-back" data-back>← 上海マップへ戻る</button>
          <div class="w3d-goal"></div>
          <button class="w3d-help-btn" data-help aria-label="操作方法">？</button>
        </div>

        <div class="w3d-label w3d-hamster-label"><div class="bubble"></div></div>
        <div class="w3d-label w3d-npc-label">🧑‍✈️ 值机柜台（チェックイン）</div>
        <div class="w3d-label w3d-person-label"></div>

        <button class="btn btn-primary btn-lg w3d-interact" hidden></button>

        <div class="w3d-controls">${isTouch()
          ? '👈 左側ドラッグ：移動　👉 右側ドラッグ：見回す'
          : '<b>WASD / ↑↓</b> 移動　<b>←→</b> 向き　<b>ドラッグ</b> 見回す　<b>Space</b> ダッシュ　<b>E</b> 話す'}</div>

        <div class="w3d-joy" hidden><div class="w3d-joy-knob"></div></div>

        <div class="w3d-overlay w3d-help" hidden>
          <div class="w3d-card pop-in">
            ${UI.hamsterSays('ここは上海の空港だよ！<br>自由に歩いて、<b>チェックインカウンター</b>を探してみよう！<br>空港にいる人にも話しかけてみてね', { mood: 'happy', size: 'md' })}
            <ul class="w3d-help-list">
              ${isTouch()
                ? '<li>👈 画面の<b>左半分</b>をドラッグ … 歩く</li><li>👉 画面の<b>右半分</b>をドラッグ … 見回す</li><li>💬 近くで出るボタンをタップ … 話す</li>'
                : '<li><b>W A S D</b> / <b>↑ ↓</b> … 歩く（<b>Space</b> でダッシュ）</li><li><b>← →</b> … 向きを変える</li><li><b>マウスでドラッグ</b> … 見回す</li><li><b>E</b>（または表示されるボタン）… 話す</li>'}
            </ul>
            <button class="btn btn-primary btn-block" data-help-close>歩いてみる ▶</button>
          </div>
        </div>

        <div class="w3d-overlay w3d-modal" hidden><div class="w3d-card w3d-talk"></div></div>

        <div class="w3d-loading">
          ${App.Hamster.figure({ mood: 'happy', size: 'lg', bounce: true })}
          <p>✈️ 空港へ移動中…</p>
        </div>
      </div>`;

    const el = {
      wrap: $('.w3d', root),
      canvas: $('.w3d-canvas', root),
      goal: $('.w3d-goal', root),
      hLabel: $('.w3d-hamster-label', root),
      hBubble: $('.w3d-hamster-label .bubble', root),
      nLabel: $('.w3d-npc-label', root),
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
      const world = App.World3D.buildAirport(THREE, scene);

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
        phase: 'find',      // find → explore → done
        checkedIn: false,
        found: new Set(),
        talked: new Set(),
        busy: false,        // 会話・ヘルプ表示中は動けない
        talkingTo: null,    // 会話中の人
        tempSay: '',
        tempUntil: 0,
        hamsterChasing: false,
      };

      const input = App.Input3D.create(renderer.domElement, { onInteract: interact, joyEl: el.joy });
      const setBusy = (v) => { game.busy = v; input.setEnabled(!v); };

      /* ---------- 当たり判定 ---------- */
      const hitsPerson = (x, z, r, except) => world.people.some((p) =>
        p !== except && Math.hypot(x - p.model.position.x, z - p.model.position.z) < r + PERSON_R);
      const blocked = (x, z, r, except) =>
        world.colliders.some((c) => x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ)
        || hitsPerson(x, z, r, except);
      const clampB = (v, a, b) => Math.max(a, Math.min(b, v));
      function moveWithCollision(obj, dx, dz, r) {
        const b = world.bounds;
        const nx = clampB(obj.x + dx, b.minX, b.maxX);
        if (!blocked(nx, obj.z, r)) obj.x = nx;
        const nz = clampB(obj.z + dz, b.minZ, b.maxZ);
        if (!blocked(obj.x, nz, r)) obj.z = nz;
      }

      /* ---------- 案内テキスト ---------- */
      const totalFound = world.discoveries.length;
      const totalPeople = world.people.length;
      function guide(nearCounter) {
        const talkedTxt = `話した人 ${game.talked.size}/${totalPeople}`;
        if (game.phase === 'find') {
          return nearCounter
            ? { goal: '🎯 カウンターで話しかけよう', say: 'カウンターに着いた！<br><b>話しかけて</b>みよう' }
            : { goal: '🎯 チェックインカウンターを探そう', say: 'まずは<b>チェックインカウンター</b>を探してみよう！<br><small>黄色い線をたどってね</small>' };
        }
        if (game.phase === 'explore') {
          return { goal: `🧭 探索しよう（発見 ${game.found.size}/${totalFound}・${talkedTxt}）`, say: 'チェックイン完了！🎫<br>空港の<b>人に話しかけたり</b>、看板を見てみよう' };
        }
        return { goal: `🎉 空港探索コンプリート！（${talkedTxt}）`, say: '空港マスターだね！<br>マップに戻って旅を続けよう' };
      }
      let lastGoal = '';
      let lastSay = '';
      function updateTexts(nearCounter, now) {
        const g = guide(nearCounter);
        const say = `🐹 ${now < game.tempUntil ? game.tempSay : g.say}`;
        if (g.goal !== lastGoal) { el.goal.innerHTML = g.goal; lastGoal = g.goal; }
        if (say !== lastSay) { el.hBubble.innerHTML = say; lastSay = say; }
      }
      const hamsterSay = (html, sec = 5) => {
        game.tempSay = html;
        game.tempUntil = performance.now() + sec * 1000;
      };

      /* ---------- 画面上のラベル（3D 位置 → 画面座標） ---------- */
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

      /* ---------- インタラクション ---------- */
      let target = null; // { kind: 'counter' } | { kind: 'person', p }
      function interact() {
        if (game.busy || !target) return;
        App.Sfx.play('tap');
        if (target.kind === 'counter') {
          if (!game.checkedIn) runCheckin();
          else {
            App.Speech.speak('祝您旅途愉快！');
            toast('🧑‍✈️ 祝您旅途愉快！<br><small>Zhù nín lǚtú yúkuài!（よい旅を！）</small>');
          }
        } else {
          talkToPerson(target.p);
        }
      }
      el.interact.onclick = interact;

      /* ---------- 会話ランナー（カウンター・一般の人 共通） ---------- */
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
            ${order.map((o, i) => `<button class="option" data-k="${o.k}"><span class="opt-key">${'ABCD'[i]}</span>
              <span class="opt-body">${zh ? `<span class="zh">${esc(o.zh)}</span>${UI.pinyin(o.py)}` : esc(o.text)}</span></button>`).join('')}
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

      function runTalk(who, script, onDone) {
        setBusy(true);
        el.interact.hidden = true;
        el.modal.hidden = false;
        const t = el.talk;
        let i = 0;
        const nextBtn = (label) => {
          t.insertAdjacentHTML('beforeend', `<button class="btn btn-primary btn-block" data-step>${label}</button>`);
          $('[data-step]', t).onclick = () => { App.Sfx.play('tap'); next(); };
        };

        function next() {
          if (disposed) return;
          if (i >= script.length) { onDone(); return; }
          const s = script[i++];
          t.scrollTop = 0;

          if (s.type === 'hamster') {
            t.innerHTML = UI.hamsterSays(s.text, { mood: 'happy', size: 'sm' });
            nextBtn('つぎへ ▶');
            return;
          }
          if (s.zh) App.Speech.speak(s.zh);

          if (s.type === 'line') {
            t.innerHTML = lineHtml(who, s, false) + (s.hamster ? hamsterLine(s.hamster, 'happy') : '');
            nextBtn(s.next || 'つぎへ ▶');
            return;
          }
          if (s.type === 'understand') {
            t.innerHTML = `${lineHtml(who, s, true)}<div class="w3d-q">❓ ${s.q}</div>`;
            choice(t, s.options.map((text, k) => ({ text, correct: k === s.answer })), {
              onCorrect: () => {
                const ja = $('.msg-ja', t);
                if (ja) ja.classList.remove('is-hidden');
                setTimeout(next, 900);
              },
              wrongMsg: () => (s.hint ? `おしい！${s.hint}` : 'おしい！🔊でもう一回聞いてみよう'),
            });
            return;
          }
          if (s.type === 'say') {
            t.innerHTML = (s.zh ? lineHtml(who, s, false) : '') + hamsterLine(s.hamster || '返事をしよう！');
            const opts = s.options.map((o, k) => Object.assign({ correct: k === s.answer }, opt(o)));
            choice(t, opts, {
              zh: true,
              onCorrect: (o) => {
                App.Speech.speak(o.zh);
                t.insertAdjacentHTML('beforeend', `<div class="w3d-me">🧳 あなた：<span class="zh">${esc(o.zh)}</span>　${esc(o.ja)}</div>`);
                setTimeout(next, 1100);
              },
              wrongMsg: (o) => `「${esc(o.zh)}」は「${esc(o.ja)}」って意味だよ`,
            });
          }
        }
        next();
      }

      const closeTalk = () => {
        el.modal.hidden = true;
        game.talkingTo = null;
        setBusy(false);
      };

      function runCheckin() {
        runTalk({ name: 'チェックインの係員さん', emoji: '🧑‍✈️' }, CHECKIN_SCRIPT, () => {
          const first = !saved.airportCheckedIn;
          if (first) {
            saved.airportCheckedIn = true;
            App.Progress.markPlayed();
            App.Progress.addExp(CHECKIN_EXP);
            App.Store.save();
          }
          game.checkedIn = true;
          game.phase = game.found.size >= totalFound ? 'done' : 'explore';
          App.Sfx.play('clear');
          const t = el.talk;
          t.innerHTML = `
            <div class="w3d-success">
              <div class="w3d-success-emoji">🎫</div>
              <h2>チェックイン成功！</h2>
              ${first ? `<span class="chip chip-new">+${CHECKIN_EXP} EXP</span>` : ''}
            </div>
            <ul class="w3d-used">
              <li><span class="zh">你好</span><span class="py">Nǐ hǎo</span><span>こんにちは</span>${UI.speakBtn('你好', { cls: 'speak-sm' })}</li>
              <li><span class="zh">谢谢</span><span class="py">Xièxie</span><span>ありがとう</span>${UI.speakBtn('谢谢', { cls: 'speak-sm' })}</li>
            </ul>
            ${hamsterLine('やったね！せっかくだから、<b>空港を探索</b>してみよう。<br>空港にいる<b>人にも話しかけて</b>みてね！', 'happy')}
            <button class="btn btn-primary btn-block" data-continue>🧭 空港探索を続ける</button>
            <button class="btn btn-sub btn-block" data-lesson>📝 空港の中国語レッスン（2D）へ</button>`;
          $('[data-continue]', t).onclick = () => {
            App.Sfx.play('tap');
            closeTalk();
            hamsterSay('いろんな人に<b>話しかけて</b>みよう！<br><b>登机口</b>（搭乗口）も探してね', 6);
          };
          $('[data-lesson]', t).onclick = () => App.go('stage', { spotId: 'airport' });
        });
      }

      function talkToPerson(p) {
        game.talkingTo = p;
        const def = p.def;
        runTalk({ name: def.name, emoji: def.emoji }, def.script, () => {
          const first = !saved.talked.includes(def.id);
          if (first) {
            saved.talked.push(def.id);
            App.Progress.markPlayed();
            App.Progress.addExp(TALK_EXP);
            App.Store.save();
          }
          game.talked.add(def.id);
          App.Sfx.play('clear');
          const t = el.talk;
          t.innerHTML = `
            <div class="w3d-success">
              <div class="w3d-success-emoji">${def.emoji}</div>
              <h2>会話できた！</h2>
              <p class="muted">${esc(def.name)}とおしゃべりしたよ</p>
              ${first ? `<span class="chip chip-new">+${TALK_EXP} EXP</span>` : ''}
            </div>
            ${hamsterLine(game.talked.size >= totalPeople
              ? '空港の人<b>全員</b>と話せたね！すごい！🎉'
              : `その調子！あと <b>${totalPeople - game.talked.size}人</b> と話せるよ`, 'happy')}
            <button class="btn btn-primary btn-block" data-continue>🧭 探索にもどる</button>`;
          $('[data-continue]', t).onclick = () => { App.Sfx.play('tap'); closeTalk(); };
        });
      }

      /* ---------- ヘルプ ---------- */
      const openHelp = () => { setBusy(true); el.help.hidden = false; };
      $('[data-help]', root).onclick = openHelp;
      $('[data-help-close]', root).onclick = () => { App.Sfx.play('tap'); el.help.hidden = true; setBusy(false); };

      /* ---------- 人の動き ---------- */
      const angleTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
      function turnToward(obj, target, k) {
        let diff = target - obj.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        obj.rotation.y += diff * Math.min(1, k);
      }
      function updatePeople(dt) {
        world.people.forEach((p) => {
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
              const step = Math.min(d, NPC_SPEED * dt);
              const nx = pos.x + (dx / d) * step;
              const nz = pos.z + (dz / d) * step;
              if (Math.hypot(player.x - nx, player.z - nz) > RADIUS + PERSON_R + 0.05) {
                m.position.x = nx;
                m.position.z = nz;
                p.phase += dt * 7;
                App.Models3D.animateWalk(m, p.phase, 1);
                turnToward(m, Math.atan2(dx, dz), dt * 6);
                return;
              }
            }
          }
          // 止まっている：話しかけられそうならこっちを向く
          App.Models3D.animateWalk(m, p.phase, 0);
          if (attentive && !p.def.sit) turnToward(m, angleTo(pos, player), dt * 5);
          else if (!p.def.path) turnToward(m, p.homeRot, dt * 2);
        });
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
          player.yaw -= look.x * LOOK + s.turn * TURN * dt;
          player.pitch = clampB(player.pitch - look.y * LOOK, -1.1, 1.1);
          if (s.moveX || s.moveZ) {
            const sp = (s.run ? RUN : SPEED) * dt;
            const sin = Math.sin(player.yaw);
            const cos = Math.cos(player.yaw);
            // 前 = (-sin, -cos)、右 = (cos, -sin)
            const dx = (-sin * s.moveZ + cos * s.moveX) * sp;
            const dz = (-cos * s.moveZ - sin * s.moveX) * sp;
            moveWithCollision(player, dx, dz, RADIUS);
            player.walk += dt * (s.run ? 13 : 9);
            moving = true;
          }
        }
        const bob = moving ? Math.sin(player.walk) * (s.run ? 0.06 : 0.045) : 0;
        camera.position.set(player.x, EYE + bob, player.z);
        camera.rotation.set(player.pitch, player.yaw, 0);

        updatePeople(dt);

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

        // 係員：プレイヤーの方を向く
        world.npc.rotation.y = Math.atan2(player.x - world.npc.position.x, player.z - world.npc.position.z) * 0.6;
        world.npc.position.y = Math.sin(t * 1.6) * 0.01;

        // 話しかけられる相手を探す（いちばん近い人 or カウンター）
        const cp = world.points.counter;
        const dCounter = Math.hypot(player.x - cp.x, player.z - cp.z);
        let best = null;
        let bestD = Infinity;
        world.people.forEach((p) => {
          const d = Math.hypot(player.x - p.model.position.x, player.z - p.model.position.z);
          if (d < bestD) { bestD = d; best = p; }
        });
        if (!game.busy) {
          if (dCounter < TALK_DIST && dCounter <= bestD) target = { kind: 'counter' };
          else if (best && bestD < PERSON_TALK) target = { kind: 'person', p: best };
          else target = null;
        }
        const nearCounter = !!target && target.kind === 'counter';

        const showBtn = !!target && !game.busy;
        if (el.interact.hidden === showBtn) el.interact.hidden = !showBtn;
        if (showBtn) {
          const key = isTouch() || s.touched ? '' : '（E）';
          const label = target.kind === 'counter'
            ? (game.checkedIn ? '💬 係員さんに話しかける' : '🛄 チェックインする')
            : `💬 ${target.p.def.emoji} 話しかける`;
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
        world.discoveries.forEach((d) => {
          if (game.found.has(d.id)) return;
          if (Math.hypot(player.x - d.x, player.z - d.z) < d.r) {
            game.found.add(d.id);
            App.Sfx.play('correct');
            hamsterSay(d.say, 6);
            if (game.checkedIn && game.found.size >= totalFound) {
              game.phase = 'done';
              toast('🎉 空港探索コンプリート！');
            }
          }
        });

        updateTexts(nearCounter, now);
        placeLabel(el.hLabel, hm, 1.35, 30);
        placeLabel(el.nLabel, world.npc, 2.35, 16);

        renderer.render(scene, camera);
      }

      el.loading.hidden = true;
      if (!saved.airportHelpSeen) {
        saved.airportHelpSeen = true;
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
  };
})(window.App = window.App || {});
