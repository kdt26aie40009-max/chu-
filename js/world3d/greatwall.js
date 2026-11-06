/* 3D 万里の長城のレイアウト
 * 南の広場（z: 14〜32）で入場券を買い、関門をくぐって北（-z）へ城壁の上を登っていく。
 *   通路       x: -2.25〜2.25（両側に胸壁）、z: 14 → -250（約 260m。上り坂・下り坂をくり返す）
 *   見張り台   8 つ（PROFILE の平らなところ）。いちばん奥の ⑧（高さ 44）が「好汉坡」
 * 坂と階段の高さは heightAt(x, z)（engine.js が目線・人・ハムスターの高さに使う）。
 * まわりの山（terrainH）は城壁の高さにそって尾根になり、森でおおわれている。てっぺんの先は飾りの長城が続く。
 */
(function (App) {
  'use strict';

  // 城壁の高さ [z, 高さ]（z が小さいほど奥）。2 点が同じ高さのところに見張り台を置く
  const PROFILE = [
    [14, 0], [0, 5], [-8, 5], [-36, 14], [-44, 14], [-60, 10], [-68, 10], [-98, 20], [-106, 20],
    [-124, 16], [-132, 16], [-166, 28], [-174, 28], [-208, 36], [-216, 36], [-236, 44], [-250, 44],
  ];
  const END_Z = PROFILE[PROFILE.length - 1][0];
  const TOP_H = PROFILE[PROFILE.length - 1][1];
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
      stand: { x: 1.6, z: -244, rot: -Math.PI / 2 },
      script: [
        { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつを返そう', options: ['nihao', 'zaijian', 'maidan'], answer: 0 },
        { type: 'understand', zh: '你是日本人吗？', py: 'Nǐ shì Rìběn rén ma?', ja: 'あなたは日本人ですか？',
          q: '何を聞かれた？', options: ['日本人かどうか', '学生かどうか', '疲れたかどうか'], answer: 0, hint: '「吗」で終わる質問だね' },
        { type: 'say', hamster: '「はい、日本人です」と答えよう', options: ['ribenren', 'bushi', 'xuesheng'], answer: 0 },
        { type: 'line', zh: '认识你很高兴！这里太美了！', py: 'Rènshi nǐ hěn gāoxìng! Zhèlǐ tài měi le!', ja: '会えてうれしいよ！ここは本当にきれいだね！' },
        { type: 'say', hamster: '同じ気持ちを伝えよう', options: ['taimei', 'taigui', 'buyaola'], answer: 0 },
      ],
    },
    {
      id: 'hikers', name: '登山サークルの大学生', emoji: '🥾',
      look: { top: '#27AE60', bottom: '#2F3740', hair: '#1E1A18', cap: '#27AE60', backpack: '#F5B92E' },
      stand: { x: -1.6, z: -212, rot: Math.PI / 2 },
      script: [
        { type: 'line', zh: '你好！快到顶了，加油！', py: 'Nǐ hǎo! Kuài dào dǐng le, jiāyóu!', ja: 'こんにちは！もうすぐてっぺんだよ、がんばって！' },
        { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', 'zaijian', 'maidan'], answer: 0 },
      ],
    },
    {
      id: 'painter', name: '景色を描くおじさん', emoji: '🖌️',
      look: { top: '#8E5BB8', bottom: '#3E3A36', hair: '#BBBBBB', cap: '#F4EFE6' },
      stand: { x: 1.6, z: -102, rot: -Math.PI / 2 },
      script: [
        { type: 'line', zh: '嗯，今天的长城很美。', py: 'Ńg, jīntiān de Chángchéng hěn měi.', ja: 'うむ、今日の長城は美しい。', hamster: '絵を描いてる…じゃましないように' },
      ],
    },
    {
      id: 'historian', name: '歴史の先生', emoji: '👨‍🏫',
      look: { top: '#3E5C8A', bottom: '#3E3A36', hair: '#5A4A3A' },
      stand: { x: 1.6, z: -64, rot: -Math.PI / 2 },
      script: [
        { type: 'line', zh: '你知道吗？长城有两千多年的历史。', py: 'Nǐ zhīdào ma? Chángchéng yǒu liǎngqiān duō nián de lìshǐ.', ja: '知ってる？長城には 2000 年以上の歴史があるんだよ。',
          hamster: '「历史（lìshǐ）」＝歴史！' },
        { type: 'line', zh: '这一段是明朝修的。', py: 'Zhè yí duàn shì Míngcháo xiū de.', ja: 'このあたりは明の時代に造られたんだ。',
          hamster: '📖 右上の「文化メモ」で、くわしく読めるよ' },
        { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', 'zaijian', 'maidan'], answer: 0 },
      ],
    },
    {
      id: 'grandma', name: '散歩中のおばあちゃん', emoji: '👵',
      look: { top: '#C0504D', bottom: '#3E3A36', hair: '#D8D8D8', hairStyle: 'bun' },
      stand: { x: -1.6, z: -128, rot: Math.PI / 2 },
      script: [
        { type: 'understand', zh: '慢慢走，别着急。', py: 'Mànmàn zǒu, bié zháojí.', ja: 'ゆっくり歩きなさい、あせらずにね。',
          q: '何と言われた？', options: ['ゆっくり歩いてね', '急いで走って', 'ここで休もう'], answer: 0, hint: '「慢慢（mànmàn）」＝ゆっくり' },
        { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', 'duibuqi', 'nihao'], answer: 0 },
        { type: 'line', zh: '前面还很长哦！加油！', py: 'Qiánmiàn hái hěn cháng o! Jiāyóu!', ja: 'この先もまだ長いよ！がんばって！', hamster: 'まだ半分くらい…！' },
      ],
    },
  ];

  /* ---------- まわりの山（城壁の尾根と、森におおわれた丘） ---------- */
  const smooth = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // てっぺんの先は、尾根が少しずつ高くなりながら左右にくねる（飾りの長城がその上を続く）
  const ridgeX = (z) => (z < END_Z ? 34 * Math.sin((END_Z - z) * 0.018) : 0);
  const ridgeH = (z) => (z < END_Z ? TOP_H + (END_Z - z) * 0.16 : heightAt(0, z));
  function terrainH(x, z) {
    const ax = Math.abs(x - ridgeX(z));
    const base = ridgeH(z) - 1.2;
    const sig = 9 + Math.max(0, base) * 0.6;
    const t = Math.max(0, ax - 3.4);
    const ridge = base * Math.exp(-(t * t) / (2 * sig * sig));
    const n1 = Math.sin(x * 0.045 + Math.sin(z * 0.03) * 1.5) * Math.cos(z * 0.037 + x * 0.01);
    const n2 = Math.sin(x * 0.11 + z * 0.07) * Math.sin(z * 0.09 - x * 0.05);
    const far = Math.min(1, Math.pow(Math.max(0, ax - 45) / 150, 1.3)) * 60 * (0.75 + 0.25 * Math.sin(z * 0.025 + x * 0.03));
    const hills = (7 + n1 * 7 + n2 * 2.5) * smooth(10, 40, ax) + far;
    // 入口の広場のあたりは平ら
    const flat = 1 - (1 - smooth(16, 40, Math.abs(x))) * smooth(-10, 8, z);
    return Math.max(0, ridge, hills * flat);
  }

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
    const tex = (w, h, draw, repeat) => {
      const t = Md.canvasTexture(THREE, w, h, draw);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      if (repeat) t.repeat.set(repeat[0], repeat[1]);
      return t;
    };

    /* ---------- 空・光（よく晴れた日） ---------- */
    const Sc = App.Scenery3D;
    scene.background = new THREE.Color('#D6EAF6');
    scene.fog = new THREE.Fog('#D6EAF6', 80, 340);
    Sc.sky(THREE, scene, { top: '#3F8FDA', horizon: '#D6EAF6', ground: '#B9D3A8', sun: [-0.5, 0.42, -0.75] });
    Sc.farMountains(THREE, scene, { r: 320, colors: ['#8DB0A6', '#B3CCD3'], height: [40, 95] });
    Sc.clouds(THREE, scene, { count: 16, y: [75, 130], r: [150, 300] });
    scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x5d7a45, 0.8));
    const sun = new THREE.DirectionalLight(0xfff1d6, 0.8);
    sun.position.set(-40, 60, -50);
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

    /* ---------- 地面：尾根と丘（頂点の色で草・森・岩をぬり分け） ---------- */
    {
      const geo = new THREE.PlaneGeometry(620, 660, 155, 165);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, 0, -110);
      const pos = geo.attributes.position;
      const colors = [];
      const c = new THREE.Color();
      const cLow = new THREE.Color('#9CCB6E');
      const cMid = new THREE.Color('#5E9C47');
      const cHigh = new THREE.Color('#4A7F3E');
      const cRock = new THREE.Color('#9A9A86');
      const cForest = new THREE.Color('#3E7434');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h = terrainH(x, z);
        pos.setY(i, h);
        const k = Math.min(1, h / 30);
        c.copy(cLow).lerp(cMid, Math.min(1, k * 1.6));
        if (k > 0.6) c.lerp(cHigh, (k - 0.6) * 2);
        const v = Math.sin(x * 0.31 + z * 0.17) * Math.cos(z * 0.23 - x * 0.11);
        c.offsetHSL(v * 0.02, 0, v * 0.04);
        // 森の中は地面も濃い緑に
        const clump = Math.sin(x * 0.06) * Math.cos(z * 0.05) + 0.5 * Math.sin(x * 0.13 + z * 0.1);
        if (clump > -0.75 && !(Math.abs(x) < 16 && z > -6 && z < 40)) c.lerp(cForest, Math.min(0.55, (clump + 0.75) * 0.4) * smooth(5, 12, Math.abs(x - ridgeX(z))));
        if (h > 55) c.lerp(cRock, Math.min(0.6, (h - 55) / 40));
        colors.push(c.r, c.g, c.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })));
    }
    // 入口の広場（石だたみ）
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(18, 20), new THREE.MeshStandardMaterial({ map: tex(128, 128, (g, w, h) => {
      g.fillStyle = '#B3A387'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#97876A'; g.lineWidth = 3;
      for (let y = 0; y <= h; y += 32) for (let x = 0; x <= w; x += 32) g.strokeRect(x + ((y / 32) % 2) * 16, y, 32, 32);
    }, [5, 5]), roughness: 1 }));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.03, 23.5);
    scene.add(plaza);

    /* ---------- 森（尾根の斜面と丘。ところどころ紅葉） ---------- */
    {
      const rnd = Sc.rand(11);
      const pts = [];
      const AUTUMN = ['#D9792E', '#C9472F', '#E3A33A'];
      for (let i = 0; i < 16000 && pts.length < 4200; i++) {
        // 城壁の近く（見える範囲）ほど木を多く
        const near = rnd() < 0.55;
        const x = near ? (rnd() - 0.5) * 140 : (rnd() - 0.5) * 520;
        const z = near ? 20 - rnd() * 300 : 150 - rnd() * 560;
        const ax = Math.abs(x - ridgeX(z));
        if (ax < 5.4) continue; // 城壁の上
        if (Math.abs(x) < 16 && z > -6 && z < 40) continue; // 広場と関門
        const clump = Math.sin(x * 0.06) * Math.cos(z * 0.05) + 0.5 * Math.sin(x * 0.13 + z * 0.1);
        if (clump < -0.75 && rnd() < 0.7) continue; // ところどころ草原のすき間
        const y = terrainH(x, z);
        const round = rnd() < 0.45;
        pts.push({
          x, y, z, s: (ax < 12 ? 0.85 : ax < 40 ? 1.15 : 1.6) * (0.75 + rnd() * 0.7), kind: round ? 'round' : 'pine',
          color: round && rnd() < 0.18 ? AUTUMN[Math.floor(rnd() * 3)] : null,
        });
      }
      Sc.forest(THREE, scene, pts);
    }

    /* ---------- てっぺんの先へ続く長城（飾り） ---------- */
    {
      const pts = [];
      for (let z = END_Z - 4; z > -440; z -= 7) {
        const x = ridgeX(z);
        pts.push([x, z, terrainH(x, z) + 0.6]);
      }
      // 左の山なみをこえていくもう 1 本
      for (let k = 0; k < 26; k++) {
        const x = -40 - k * 8;
        const z = -150 - 30 * Math.sin(k * 0.3) - k * 4;
        pts.push(null);
        pts.push([x, z, terrainH(x, z) + 0.6]);
      }
      let prev = null;
      let n = 0;
      pts.forEach((pt) => {
        if (!pt) { prev = null; return; }
        const [x, z, h] = pt;
        if (prev) {
          const [px, pz, ph] = prev;
          const len = Math.hypot(x - px, z - pz, h - ph);
          const seg = box(2.6, 2.2, len + 0.4, stoneMat, (x + px) / 2, (h + ph) / 2 + 0.4, (z + pz) / 2);
          seg.lookAt(x, h + 0.4, z);
          if (++n % 6 === 0) box(4.2, 4.2, 4.2, stoneMat, x, h + 1.8, z);
        }
        prev = pt;
      });
    }

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
    rect(-3.2, -2.25, END_Z - 0.5, 14.2);
    rect(2.25, 3.2, END_Z - 0.5, 14.2);

    /* ---------- 見張り台（烽火台） ---------- */
    function tower(zFront, zBack, h) {
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
      end(zBack, true);
      box(8.8, 0.4, len + 0.6, wm, 0, h + 4.8, cz);
      for (let k = -4; k <= 4; k += 1.6) {
        box(0.7, 0.6, 0.6, stoneMat, k, h + 5.3, zFront);
        box(0.7, 0.6, 0.6, stoneMat, k, h + 5.3, zBack);
      }
      // 側面の窓
      [-1, 1].forEach((s) => {
        for (let z = zBack + 1.6; z < zFront - 1; z += 2.4) box(0.64, 1.0, 0.7, M('#2E2A26'), s * 4, h + 2, z);
      });
    }
    // てっぺん（好汉坡）：景色が見わたせるように低い胸壁だけ。まんなかに楼閣、奥に石碑
    function summit(zFront, zBack, h) {
      const len = zFront - zBack;
      const cz = (zFront + zBack) / 2;
      const wm = brickMat(len / 3, 1);
      box(8.6, 6, len, wm, 0, h - 3, cz);
      [-1, 1].forEach((s) => {
        box(0.6, 1.1, len, wm, s * 4, h + 0.55, cz);
        for (let z = zBack + 0.6; z < zFront; z += 1.3) box(0.66, 0.55, 0.6, stoneMat, s * 4, h + 1.4, z);
        box(2.7, 1.1, 0.6, wm, s * 2.95, h + 0.55, zFront, { collide: true });
      });
      box(8.6, 1.1, 0.6, wm, 0, h + 0.55, zBack, { collide: true });
      for (let x = -3.9; x <= 3.9; x += 1.3) box(0.6, 0.55, 0.66, stoneMat, x, h + 1.4, zBack);
      // 楼閣
      [-2, 2].forEach((x) => [-2.5, 2.5].forEach((z) => box(0.3, 3, 0.3, redMat, x, h + 1.5, cz + z)));
      box(5.6, 0.3, 6.6, redMat, 0, h + 3.1, cz);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2, 4), roofMat);
      roof.position.set(0, h + 4.25, cz);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1, 1, 1.15);
      scene.add(roof);
      // 旗
      box(0.08, 4.6, 0.08, M('#555555'), 3.4, h + 2.3, zFront - 0.6);
      box(1.4, 0.9, 0.04, redMat, 4.1, h + 4.1, zFront - 0.6, { rotY: Math.PI / 2 });
      // 石碑「好汉坡」
      box(2.2, 2.8, 0.5, M('#8E8676'), 0, h + 1.4, zBack + 1);
      box(2.5, 0.3, 0.7, M('#6E6858'), 0, h + 2.95, zBack + 1);
      Md.sign(THREE, scene, { zh: '好汉坡', en: 'Hero’s Slope', bg: '#8E2F2F', accent: '#FFC23D', sub: '#FBE3C4' }, 1.9, 0, h + 1.6, zBack + 1.27);
    }
    // PROFILE の平らなところ（同じ高さが 2 つ続くところ）に見張り台。いちばん奥がてっぺん
    for (let i = 1; i < PROFILE.length - 1; i++) {
      const [z0, h0] = PROFILE[i];
      const [z1, h1] = PROFILE[i + 1];
      if (h0 !== h1) continue;
      if (i + 1 === PROFILE.length - 1) summit(z0, z1, h0); else tower(z0, z1, h0);
    }
    const topFront = PROFILE[PROFILE.length - 2][0];
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
        { id: 'gate', x: 0, z: 20.5, r: 3, culture: 'changcheng', say: '<b>万里长城</b>＝万里の長城！<br>まずは左の<b>售票处</b>で入場券（门票）を買おう' },
        { id: 'tower1', x: 0, z: -4, r: 3, culture: 'fenghuotai', say: '<b>烽火台</b>＝のろし台。<br>敵が来たら煙をあげて知らせたんだって' },
        { id: 'slope', x: 0, z: -22, r: 3, say: 'けっこう急な階段…！<br>「<b>好累啊！</b>」って言いたくなるね' },
        { id: 'tower2', x: 0, z: -40, r: 3, say: '長城は全長2万km以上！<br>「宇宙から見える」は、実はウソらしいよ' },
        { id: 'down', x: 0, z: -52, r: 3, say: '今度は下り坂！<br>長城は山の尾根にそって、上ったり下ったりするんだ' },
        { id: 'brick', x: 0, z: -64, r: 3, culture: 'chengzhuan', say: 'このレンガのつなぎ目…<br><b>もち米</b>が入ってるんだって！' },
        { id: 'view', x: 0, z: -84, r: 3, say: '後ろをふり返ってみて！<br>「<b>太美了！</b>」な景色だよ' },
        { id: 'forest', x: 0, z: -116, r: 3, say: '下を見て！一面の森🌲<br>秋は紅葉で、山が赤や黄色にそまるんだって' },
        { id: 'half', x: 0, z: -150, r: 3, say: 'まだまだ続く…！「<b>好累啊</b>」…<br>でも、もうひとふんばり！' },
        { id: 'far', x: 0, z: -190, r: 3, say: '向こうの山にも長城が見える！<br>ほんとうに「万里」だね' },
        { id: 'last', x: 0, z: -228, r: 3, culture: 'haohanpo', say: '最後の急な坂！<br>ここを登りきれば<b>好汉坡</b>だ！<b>加油！</b>' },
      ],
      topHeight: TOP_H,
      topZ: END_Z,
      zones: [{ id: 'top', x1: -2.4, x2: 2.4, z1: END_Z + 1, z2: topFront - 3 }],
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
