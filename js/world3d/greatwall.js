/* 3D 万里の長城のレイアウト
 * 南の広場（z: 14〜32）で入場券を買い、関門をくぐって北（-z）へ城壁の上を登っていく。
 *   通路       x: -2.25〜2.25（両側に胸壁）、z: 14 → -93
 *   見張り台   ① z -8〜0（高さ 5）  ② z -44〜-36（高さ 14）  ③ てっぺん z -93〜-80（高さ 26）
 * 坂と階段の高さは heightAt(x, z)（engine.js が目線・人・ハムスターの高さに使う）。
 */
(function (App) {
  'use strict';

  // 城壁の高さ [z, 高さ]（z が小さいほど奥＝上）
  const PROFILE = [[14, 0], [0, 5], [-8, 5], [-36, 14], [-44, 14], [-80, 26], [-93, 26]];
  function heightAt(x, z) {
    if (z >= PROFILE[0][0]) return 0;
    for (let i = 0; i < PROFILE.length - 1; i++) {
      const [z0, h0] = PROFILE[i];
      const [z1, h1] = PROFILE[i + 1];
      if (z <= z0 && z >= z1) return h0 + ((z0 - z) / (z0 - z1)) * (h1 - h0);
    }
    return PROFILE[PROFILE.length - 1][1];
  }

  /* ---------- 長城にいる人たち（会話の書式は airport.js と同じ） ---------- */
  const PEOPLE = [
    {
      id: 'tired', name: 'ひと休み中のおじさん', emoji: '😮‍💨',
      look: { top: '#5B6BB8', bottom: '#3E3A36', hair: '#BDBDBD', cap: '#E8DCC8' },
      stand: { x: 1.6, z: -2.5, rot: -Math.PI / 2 },
      script: [
        { type: 'understand', zh: '好累啊！你也累吗？', py: 'Hǎo lèi a! Nǐ yě lèi ma?', ja: '疲れた〜！君も疲れた？',
          q: '何を聞かれた？', options: ['疲れたかどうか', '何歳か', 'どこから来たか'], answer: 0, hint: '「累（lèi）」＝疲れた' },
        { type: 'say', hamster: '正直に…「疲れた〜！」', options: ['haolei', 'haochi', 'taigui'], answer: 0 },
        { type: 'line', zh: '哈哈，加油！', py: 'Hāha, jiāyóu!', ja: 'はは、がんばれ！', hamster: '「加油（jiāyóu）」＝がんばれ！' },
      ],
    },
    {
      id: 'water', name: '水売りのおばさん', emoji: '💧',
      look: { top: '#2BB5A0', bottom: '#4A5560', hair: '#3B2A20', hairStyle: 'bun' },
      stand: { x: -1.7, z: -6, rot: Math.PI / 2 },
      script: [
        { type: 'understand', zh: '你好！要水吗？', py: 'Nǐ hǎo! Yào shuǐ ma?', ja: 'こんにちは！お水いる？',
          q: '何を聞かれた？', options: ['水がいるか', '写真を撮るか', '道に迷ったか'], answer: 0, hint: '「水（shuǐ）」＝水' },
        { type: 'say', hamster: 'のどがカラカラ…水を1本買おう', options: ['shui', 'yiwan', 'yilong'], answer: 0 },
        { type: 'understand', zh: '一瓶水五块。', py: 'Yì píng shuǐ wǔ kuài.', ja: '水1本5元だよ。',
          q: 'いくら？', options: ['5元', '50元', '15元'], answer: 0, hint: '「五块（wǔ kuài）」＝5元' },
        { type: 'say', hamster: 'お金を渡そう', options: ['geini', 'buyao', 'taigui'], answer: 0 },
        { type: 'line', zh: '谢谢！加油！', py: 'Xièxie! Jiāyóu!', ja: 'ありがとう！がんばってね！' },
      ],
    },
    {
      id: 'runner', name: '元気な男の子', emoji: '🧒',
      look: { top: '#F5B92E', bottom: '#2F6FA8', hair: '#2B2220', scale: 0.62, cap: '#E05A3A' },
      path: [[1.2, 10], [1.2, -30], [-1.2, -30], [-1.2, 10]],
      script: [
        { type: 'understand', zh: '不到长城非好汉！', py: 'Bú dào Chángchéng fēi hǎohàn!', ja: '長城に登らずして好漢にあらず！',
          q: 'どんな意味？', options: ['長城に登らないと一人前じゃない', '長城はとても長い', '早く家に帰ろう'], answer: 0,
          hint: '「好汉（hǎohàn）」＝りっぱな人。長城に来た人はみんな言うよ' },
        { type: 'say', hamster: '一緒に言おう！', options: ['haohan', 'taimei', 'haolei'], answer: 0 },
        { type: 'line', zh: '我要第一个到！', py: 'Wǒ yào dì-yī ge dào!', ja: 'ぼくがいちばんに着くんだ！', hamster: '元気だなあ〜' },
      ],
    },
    {
      id: 'photo', name: '写真を撮りたいお姉さん', emoji: '📸',
      look: { top: '#E86F9A', bottom: '#F4EFE6', hair: '#2B2220', hairStyle: 'long', camera: true },
      stand: { x: -1.5, z: -39, rot: Math.PI / 2 },
      script: [
        { type: 'understand', zh: '你好！可以帮我拍照吗？', py: 'Nǐ hǎo! Kěyǐ bāng wǒ pāizhào ma?', ja: 'こんにちは！写真を撮ってもらえますか？',
          q: '何を頼まれた？', options: ['写真を撮ってほしい', '道を教えてほしい', '荷物を持ってほしい'], answer: 0, hint: '「拍照」＝写真を撮る（UNIT 9 で覚えたね）' },
        { type: 'say', hamster: 'OK してあげよう', options: ['haode', 'buyao', 'tingbudong'], answer: 0 },
        { type: 'line', zh: '一、二、三，茄子！', py: 'Yī, èr, sān, qiézi!', ja: 'いち、に、さん、チーズ！' },
        { type: 'say', zh: '谢谢你！', py: 'Xièxie nǐ!', ja: 'ありがとう！', hamster: '「どういたしまして」！', options: ['bukeqi', 'duibuqi', 'zaijian'], answer: 0 },
      ],
    },
    {
      id: 'traveler', name: '世界一周中の旅人', emoji: '🌍',
      look: { top: '#C0504D', bottom: '#4A5560', hair: '#D9A441', backpack: '#2F6FA8' },
      stand: { x: 1.6, z: -87, rot: -Math.PI / 2 },
      script: [
        { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつを返そう', options: ['nihao', 'zaijian', 'maidan'], answer: 0 },
        { type: 'understand', zh: '你是日本人吗？', py: 'Nǐ shì Rìběn rén ma?', ja: 'あなたは日本人ですか？',
          q: '何を聞かれた？', options: ['日本人かどうか', '学生かどうか', '疲れたかどうか'], answer: 0, hint: '「吗」で終わる質問だね' },
        { type: 'say', hamster: '「はい、日本人です」と答えよう', options: ['ribenren', 'bushi', 'xuesheng'], answer: 0 },
        { type: 'line', zh: '认识你很高兴！这里太美了！', py: 'Rènshi nǐ hěn gāoxìng! Zhèlǐ tài měi le!', ja: '会えてうれしいよ！ここは本当にきれいだね！' },
        { type: 'say', hamster: '同じ気持ちを伝えよう', options: ['taimei', 'taigui', 'buyaola'], answer: 0 },
      ],
    },
  ];

  function buildGreatWall(THREE, scene) {
    const Md = App.Models3D;
    const colliders = [];
    const rect = (minX, maxX, minZ, maxZ) => { const c = { minX, maxX, minZ, maxZ }; colliders.push(c); return c; };
    const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, metalness: 0 }, o));
    const box = (w, h, d, mat, x, y, z, { collide = false, parent = scene, rotX = 0, rotY = 0 } = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.rotation.set(rotX, rotY, 0);
      parent.add(m);
      if (collide) rect(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
      return m;
    };
    const cone = (r, h, mat, x, z, seg = 7) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
      m.position.set(x, h / 2, z);
      m.rotation.y = Math.random() * Math.PI;
      scene.add(m);
      return m;
    };
    const tex = (w, h, draw, repeat) => {
      const t = Md.canvasTexture(THREE, w, h, draw);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      if (repeat) t.repeat.set(repeat[0], repeat[1]);
      return t;
    };

    /* ---------- 空・光（よく晴れた日） ---------- */
    scene.background = new THREE.Color('#9FD3F2');
    scene.fog = new THREE.Fog('#BFE0F2', 70, 260);
    scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x6c7a4a, 0.85));
    const sun = new THREE.DirectionalLight(0xfff1d6, 0.75);
    sun.position.set(-30, 60, 20);
    scene.add(sun);

    /* ---------- 素材 ---------- */
    const brick = (base, line) => (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.strokeStyle = line; g.lineWidth = 3;
      for (let y = 0; y <= h; y += 32) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
        for (let x = (y / 32) % 2 ? 32 : 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); }
      }
    };
    const brickMat = (rx, ry) => new THREE.MeshStandardMaterial({ map: tex(256, 256, brick('#B3A58E', '#8C7E68'), [rx, ry]), roughness: 0.95 });
    const stepTex = (len) => tex(64, 64, (g, w, h) => {
      g.fillStyle = '#968770'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#6E624F'; g.fillRect(0, h - 12, w, 12);
      g.fillStyle = '#A99B84'; g.fillRect(0, 0, w, 6);
    }, [3, Math.max(1, Math.round(len / 0.5))]);
    const stoneMat = M('#A89A84');
    const roofMat = M('#4A4644');
    const redMat = M('#B83A2E');

    /* ---------- 地面と山 ---------- */
    const groundMat = new THREE.MeshStandardMaterial({ map: tex(128, 128, (g, w, h) => {
      g.fillStyle = '#7E9A5A'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { g.fillStyle = Math.random() < 0.5 ? '#6F8C4E' : '#8DA866'; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    }, [80, 80]), roughness: 1 });
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), groundMat);
    gnd.rotation.x = -Math.PI / 2;
    scene.add(gnd);

    // 城壁の下の尾根（城壁が山の上を走っているように見せる）
    const ridgeMat = M('#6F8F4E');
    for (let z = 6; z >= -100; z -= 6) {
      const h = heightAt(0, z) - 0.6;
      if (h > 1) cone(15 + h * 0.4, h, ridgeMat, 0, z, 9);
    }
    // 遠くの山
    const hillMats = [M('#5E7F45'), M('#6E8E52'), M('#7C9A5C'), M('#8AA36A')];
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 70 + Math.random() * 170;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d - 40;
      if (Math.abs(x) < 26 && z < 40 && z > -120) continue;
      cone(25 + Math.random() * 35, 18 + Math.random() * 50, hillMats[i % 4], x, z, 8);
    }
    // 遠くの山を越えていく長城（飾り）
    const farWall = (pts) => {
      for (let i = 0; i < pts.length; i++) {
        const [x, z, h] = pts[i];
        cone(26, h, hillMats[i % 4], x, z, 8);
        box(4, 3, 4, stoneMat, x, h + 0.5, z);
        if (i > 0) {
          const [px, pz, ph] = pts[i - 1];
          const len = Math.hypot(x - px, z - pz, h - ph);
          const seg = box(1.6, 1.6, len, stoneMat, (x + px) / 2, (h + ph) / 2 + 0.3, (z + pz) / 2);
          seg.lookAt(x, h + 0.3, z);
        }
      }
    };
    farWall([[-30, -120, 30], [-60, -140, 38], [-95, -125, 28], [-130, -150, 42], [-170, -130, 34]]);
    farWall([[30, -125, 32], [62, -150, 44], [100, -135, 30], [140, -160, 40]]);

    /* ---------- 城壁の通路（坂・階段） ---------- */
    const W = 4.6;
    function segment(z0, h0, z1, h1) {
      const dz = z0 - z1;
      const dh = h1 - h0;
      const L = Math.hypot(dz, dh);
      const th = Math.atan2(dh, dz);
      const cz = (z0 + z1) / 2;
      const ch = (h0 + h1) / 2;
      const top = dh ? new THREE.MeshStandardMaterial({ map: stepTex(L), roughness: 0.95 }) : brickMat(2, L / 3);
      const side = brickMat(L / 4, 1);
      // 通路の床
      const deck = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, L), [side, side, top, side, side, side]);
      deck.position.set(0, ch - 0.15, cz);
      deck.rotation.x = th;
      scene.add(deck);
      // 城壁の本体（床の下）
      const T = 5;
      const body = new THREE.Mesh(new THREE.BoxGeometry(W + 1.4, T, L), brickMat(L / 4, 2));
      body.position.set(0, ch - 0.3 - (T / 2) * Math.cos(th), cz - (T / 2) * Math.sin(th));
      body.rotation.x = th;
      scene.add(body);
      // 胸壁（両側）と凸凹（外側）
      [-1, 1].forEach((s) => {
        box(0.45, 1.0, L, brickMat(L / 4, 0.5), s * 2.55, ch + 0.5, cz, { rotX: th });
        const n = Math.floor(L / 1.3);
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n;
          const z = z0 - t * dz;
          box(0.5, 0.55, 0.6, stoneMat, s * 2.55, h0 + t * dh + 1.25, z);
        }
      });
    }
    for (let i = 0; i < PROFILE.length - 1; i++) segment(PROFILE[i][0], PROFILE[i][1], PROFILE[i + 1][0], PROFILE[i + 1][1]);
    rect(-3.2, -2.25, -93.5, 14.2);
    rect(2.25, 3.2, -93.5, 14.2);

    /* ---------- 見張り台（烽火台） ---------- */
    function tower(zFront, zBack, h, { top = false } = {}) {
      const len = zFront - zBack;
      const cz = (zFront + zBack) / 2;
      const wm = brickMat(len / 3, 1.5);
      box(8.6, 6, len, wm, 0, h - 3, cz);
      [-1, 1].forEach((s) => box(0.6, 4.6, len, wm, s * 4, h + 2.3, cz));
      const end = (z, door) => {
        if (door) {
          [-1, 1].forEach((s) => box(2.7, 4.6, 0.6, wm, s * 2.95, h + 2.3, z, { collide: true }));
          box(3.2, 1.3, 0.6, wm, 0, h + 3.95, z);
        } else {
          box(8.6, 4.6, 0.6, wm, 0, h + 2.3, z, { collide: true });
        }
      };
      end(zFront, true);
      end(zBack, !top);
      box(8.8, 0.4, len + 0.6, wm, 0, h + 4.8, cz);
      for (let k = -4; k <= 4; k += 1.6) {
        box(0.7, 0.6, 0.6, stoneMat, k, h + 5.3, zFront);
        box(0.7, 0.6, 0.6, stoneMat, k, h + 5.3, zBack);
      }
      // 側面の窓
      [-1, 1].forEach((s) => {
        for (let z = zBack + 1.6; z < zFront - 1; z += 2.4) box(0.64, 1.0, 0.7, M('#2E2A26'), s * 4, h + 2, z);
      });
      if (top) {
        // てっぺんの楼閣と旗
        box(5, 0.3, 5, roofMat, 0, h + 7.4, cz);
        [-2, 2].forEach((x) => [-2, 2].forEach((z) => box(0.3, 2.3, 0.3, redMat, x, h + 6.2, cz + z)));
        const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 2.2, 4), roofMat);
        roof.position.set(0, h + 8.6, cz);
        roof.rotation.y = Math.PI / 4;
        scene.add(roof);
        box(0.08, 3.2, 0.08, M('#555555'), 3.6, h + 6.6, zFront + 0.3);
        box(1.4, 0.9, 0.04, redMat, 4.3, h + 7.6, zFront + 0.3);
      }
    }
    tower(0, -8, 5);
    tower(-36, -44, 14);
    tower(-80, -93, 26, { top: true });
    Md.sign(THREE, scene, { zh: '好汉坡', en: 'Hero’s Slope', bg: '#8E2F2F', accent: '#FFC23D', sub: '#FBE3C4' }, 3.2, 0, 26 + 5.8, -79.6);
    Md.sign(THREE, scene, { zh: '烽火台', en: 'Beacon Tower', bg: '#5A4632', accent: '#FFC23D', sub: '#F3E2C0' }, 2.6, 0, 5 + 5.8, 0.35);

    /* ---------- ふもとの関門と広場 ---------- */
    const gm = brickMat(4, 2);
    [-1, 1].forEach((s) => box(6.75, 7, 3, gm, s * 5.625, 3.5, 15.5, { collide: true }));
    box(4.5, 3, 3, gm, 0, 5.5, 15.5);
    box(18.8, 0.5, 3.8, roofMat, 0, 7.25, 15.5);
    for (let k = -8.5; k <= 8.5; k += 1.7) box(0.8, 0.7, 0.6, stoneMat, k, 7.85, 17.1);
    Md.sign(THREE, scene, { zh: '万里长城', en: 'The Great Wall', bg: '#8E2F2F', accent: '#FFC23D', sub: '#FBE3C4' }, 4.4, 0, 6.1, 17.1);
    // 門の扉（入場券を買うと開く）
    const leaves = [-1, 1].map((s) => {
      const hinge = new THREE.Group();
      hinge.position.set(s * 2.2, 0, 17.0);
      box(2.2, 3.9, 0.15, redMat, -s * 1.1, 1.95, 0, { parent: hinge });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), M('#D9A441', { metalness: 0.5 }));
        stud.position.set(-s * (0.45 + c * 0.6), 0.9 + r * 0.8, 0.09);
        hinge.add(stud);
      }
      scene.add(hinge);
      return { hinge, s };
    });
    const gateCollider = rect(-2.3, 2.3, 16.8, 17.3);
    const gate = { open: false, collider: gateCollider };

    // 広場のさく
    const fence = M('#7A5236');
    [[-8.8, 23.5, 0.3, 18], [8.8, 23.5, 0.3, 18], [0, 32.6, 17.9, 0.3]].forEach(([x, z, w, d]) => box(w, 1, d, fence, x, 0.5, z, { collide: true }));
    // 売店（售票处）
    box(1.0, 1.1, 2.8, M('#8A5A3C'), -6.2, 0.55, 22, { collide: true });
    box(1.1, 0.06, 3.0, M('#E8DCC8'), -6.2, 1.13, 22);
    box(0.2, 3.2, 3.0, M('#C9B79A'), -8.4, 1.6, 22);
    box(3.0, 0.15, 3.4, redMat, -7.2, 3.2, 22);
    rect(-8.6, -5.7, 20.4, 23.6);
    Md.sign(THREE, scene, { zh: '售票处', en: 'Tickets ¥40', bg: '#24476B', accent: '#FFC23D', sub: '#CFE3F5', w: 768, h: 256 }, 2.4, -5.65, 2.55, 22, Math.PI / 2);
    const seller = Md.staff(THREE, { uniform: '#24476B', scarf: '#D9A441' });
    seller.position.set(-7.1, 0, 22);
    seller.rotation.y = Math.PI / 2;
    scene.add(seller);
    const guard = Md.staff(THREE, { uniform: '#4F6B4F', scarf: '#B83A2E' });
    guard.position.set(3.4, 0, 18.4);
    scene.add(guard);
    // 案内板
    Md.sign(THREE, scene, { zh: '入口 →', en: 'Entrance', bg: '#2F8F4E', accent: '#D9F5E3', sub: '#D9F5E3' }, 1.8, 6.5, 1.6, 22, -Math.PI / 2);

    /* ======================= キャラクター ======================= */
    const hamster = Md.hamster(THREE);
    hamster.position.set(1.5, 0, 28.5);
    scene.add(hamster);
    const people = App.World3D.spawnPeople(THREE, scene, PEOPLE);

    return {
      colliders,
      bounds: null,
      heightAt,
      spawn: { x: 0, z: 30.5, yaw: 0.25 },
      hamster,
      people,
      gate,
      interactables: [
        { id: 'ticket', x: -4.8, z: 22, r: 2.6 },
        { id: 'gate', x: 0, z: 18.6, r: 2.2 },
      ],
      tags: [
        { obj: seller, y: 2.35, text: '🎫 售票处（チケット売り場）', maxDist: 18 },
        { obj: guard, y: 2.35, text: '💂 入口', maxDist: 12 },
      ],
      facePlayer: [guard],
      discoveries: [
        { id: 'gate', x: 0, z: 20.5, r: 3, say: '<b>万里长城</b>＝万里の長城！<br>まずは左の<b>售票处</b>で入場券（门票）を買おう' },
        { id: 'tower1', x: 0, z: -4, r: 3, say: '<b>烽火台</b>＝のろし台。<br>敵が来たら煙をあげて知らせたんだって' },
        { id: 'slope', x: 0, z: -22, r: 3, say: 'けっこう急な階段…！<br>「<b>好累啊！</b>」って言いたくなるね' },
        { id: 'tower2', x: 0, z: -40, r: 3, say: '長城は全長2万km以上！<br>「宇宙から見える」は、実はウソらしいよ' },
        { id: 'view', x: 0, z: -62, r: 3, say: '後ろをふり返ってみて！<br>「<b>太美了！</b>」な景色だよ' },
      ],
      zones: [{ id: 'top', x1: -2.4, x2: 2.4, z1: -92, z2: -83 }],
      update(dt) {
        if (!gate.open) return;
        leaves.forEach(({ hinge, s }) => {
          const target = -s * 1.75;
          hinge.rotation.y += (target - hinge.rotation.y) * Math.min(1, dt * 2.5);
        });
      },
    };
  }

  App.World3D = App.World3D || {};
  App.World3D.buildGreatWall = buildGreatWall;
})(window.App = window.App || {});
