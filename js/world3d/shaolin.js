/* 3D 少林寺（河南省・嵩山）のレイアウト — 特別な旅先・高難度
 *   山门（入口）   z: 18   「少林寺」の額。南（手前）から入る
 *   中庭           x: -18〜18, z: -40〜16   香炉(z=6)
 *   練功場（左）   x: -15〜-6, z: 2〜-12    木人桩・修行中のお坊さん
 *   塔林（右）     x: 7〜16, z: 4〜-12      小さな石の塔がならぶ
 *   擂台（奥）     z: -24 の武術大会の舞台、その奥に大雄宝殿
 * 単位はメートル。
 */
(function (App) {
  'use strict';

  const AMITUOFO = { zh: '阿弥陀佛。', py: 'Ēmítuófó.', ja: '（お坊さんのあいさつ）' };

  /* ---------- お寺の人たち ---------- */
  const PEOPLE = [
    {
      id: 'guidemonk', name: '案内のお坊さん', emoji: '🙏',
      look: { top: '#E67E22', bottom: '#8E4A1A', hair: '#F1CBA5' },
      stand: { x: 3, z: 13, rot: Math.PI },
      script: [
        { type: 'say', zh: '阿弥陀佛。欢迎来到少林寺。', py: 'Ēmítuófó. Huānyíng lái dào Shàolín Sì.', ja: '阿弥陀仏。少林寺へようこそ。',
          hamster: 'お坊さんには手を合わせて「阿弥陀佛」', options: [AMITUOFO, 'nihao', 'maidan'], answer: 0 },
        { type: 'understand', zh: '少林寺有一千五百多年的历史。', py: 'Shàolín Sì yǒu yìqiān wǔbǎi duō nián de lìshǐ.', ja: '少林寺には 1500 年以上の歴史があります。',
          q: '少林寺の歴史は何年以上？', options: ['1500年', '150年', '15年'], answer: 0, hint: '「一千五百」＝1500' },
        { type: 'line', zh: '今天有武术比赛，在最里面的擂台。', py: 'Jīntiān yǒu wǔshù bǐsài, zài zuì lǐmiàn de lèitái.', ja: '今日は武術大会があります。いちばん奥の舞台（擂台）ですよ。',
          hamster: '「比赛」＝試合・大会。奥の舞台へ行ってみよう！' },
      ],
    },
    {
      id: 'littlemonk', name: '小さなお坊さん', emoji: '🧒',
      look: { top: '#E67E22', bottom: '#8E4A1A', hair: '#F1CBA5', scale: 0.62 },
      stand: { x: -6.5, z: -1, rot: Math.PI / 2 },
      script: [
        { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつしよう', options: ['nihao', 'zaijian', 'wei'], answer: 0 },
        { type: 'understand', zh: '我五岁就来少林寺练功了！', py: 'Wǒ wǔ suì jiù lái Shàolín Sì liàn gōng le!', ja: 'ぼく 5 歳のときから少林寺で修行してるんだ！',
          q: '何歳から修行している？', options: ['5歳', '15歳', '50歳'], answer: 0 },
        { type: 'say', hamster: '「すごい！」', options: [{ zh: '真厉害！', py: 'Zhēn lìhai!', ja: 'すごい！' }, 'buyao', 'tingbudong'], answer: 0 },
        { type: 'line', zh: '嘿！哈！看我的拳！', py: 'Hēi! Hā! Kàn wǒ de quán!', ja: 'えい！やっ！ぼくのパンチを見て！', hamster: '「拳（quán）」＝パンチ。試合でも聞こえるよ！' },
      ],
    },
    {
      id: 'trainmonk', name: '修行中のお坊さん', emoji: '🥋',
      look: { top: '#C0392B', bottom: '#8E4A1A', hair: '#F1CBA5' },
      stand: { x: -12.5, z: 1.5, rot: Math.PI / 2 },
      script: [
        { type: 'say', zh: '阿弥陀佛。', py: 'Ēmítuófó.', ja: '阿弥陀仏。', hamster: '同じように返そう', options: [AMITUOFO, 'zaoshang', 'xiexie'], answer: 0 },
        { type: 'understand', zh: '我们每天早上四点起床练功。', py: 'Wǒmen měitiān zǎoshang sì diǎn qǐchuáng liàn gōng.', ja: '私たちは毎朝 4 時に起きて修行します。',
          q: '毎朝何時に起きる？', options: ['4時', '10時', '7時'], answer: 0, hint: '「四点（sì diǎn）」＝4時' },
        { type: 'say', hamster: '早起き…！「がんばって」', options: ['jiayou', 'wanan', 'maidan'], answer: 0 },
      ],
    },
    {
      id: 'visitor', name: '武術ファンの観光客', emoji: '📣',
      look: { top: '#5B8DB8', bottom: '#2F3740', hair: '#3B2A20', camera: true },
      stand: { x: 4.5, z: 2, rot: -Math.PI / 2 },
      script: [
        { type: 'understand', zh: '你也来看比赛吗？', py: 'Nǐ yě lái kàn bǐsài ma?', ja: 'きみも試合を見に来たの？',
          q: '何を聞かれた？', options: ['試合を見に来たか', 'お寺に住んでいるか', 'カンフーができるか'], answer: 0 },
        { type: 'say', hamster: '「はい」', options: ['shide', 'buyao', 'meiwenti'], answer: 0 },
        { type: 'line', zh: '林小飞特别快！沈岳特别强！两个都很厉害！', py: 'Lín Xiǎofēi tèbié kuài! Shěn Yuè tèbié qiáng! Liǎng ge dōu hěn lìhai!', ja: '林小飞はめちゃくちゃ速い！沈岳はめちゃくちゃ強い！2 人ともすごいんだ！',
          hamster: '大会の 2 人の達人のことだね…！' },
      ],
    },
    {
      id: 'master', name: '塔林の老師父', emoji: '🧓',
      look: { top: '#F4EFE6', bottom: '#8E4A1A', hair: '#E8E8E8' },
      stand: { x: 9.5, z: -1, rot: -Math.PI / 2 },
      script: [
        { type: 'say', zh: '年轻人，来。', py: 'Niánqīngrén, lái.', ja: '若いの、こちらへ。', hamster: '老師父だ…あいさつしよう', options: ['ninhao', 'zaijian', 'maidan'], answer: 0 },
        { type: 'line', zh: '比赛前，要先行抱拳礼。', py: 'Bǐsài qián, yào xiān xíng bàoquán lǐ.', ja: '試合の前には、まず抱拳礼をするのじゃ。',
          hamster: '右の拳を、左の手のひらでつつむ礼だよ' },
        { type: 'understand', zh: '武术不只是打，更重要的是心。', py: 'Wǔshù bù zhǐ shì dǎ, gèng zhòngyào de shì xīn.', ja: '武術は戦うだけではない。もっと大切なのは心じゃ。',
          q: '武術でもっと大切なのは？', options: ['心', '力', 'スピード'], answer: 0, hint: '「心（xīn）」＝心' },
        { type: 'say', hamster: '「わかりました」', options: ['haode', 'taigui', 'buyao'], answer: 0 },
      ],
    },
    {
      id: 'fanA', name: '林小飞の応援団', emoji: '🔥',
      look: { top: '#F08A24', bottom: '#2B2B2B', hair: '#2B2220', hairStyle: 'long' },
      stand: { x: -7, z: -18, rot: Math.PI / 2 },
      script: [
        { type: 'line', zh: '小飞加油！小飞最快！', py: 'Xiǎofēi jiāyóu! Xiǎofēi zuì kuài!', ja: '小飞がんばれ！小飞がいちばん速い！', hamster: '「加油」で応援してる！' },
        { type: 'say', hamster: '一緒に「加油！」', options: ['jiayou', 'haolei', 'shoudao'], answer: 0 },
      ],
    },
    {
      id: 'fanB', name: '沈岳を見守る青年', emoji: '🌑',
      look: { top: '#2F3A4A', bottom: '#2B2B2B', hair: '#1E1A18' },
      stand: { x: 7.5, z: -18, rot: -Math.PI / 2 },
      script: [
        { type: 'understand', zh: '沈岳从来不笑。但是他很尊重对手。', py: 'Shěn Yuè cónglái bú xiào. Dànshì tā hěn zūnzhòng duìshǒu.', ja: '沈岳は決して笑わない。でも、相手をとても尊重しているんだ。',
          q: '沈岳はどんな人？', options: ['笑わないが相手を尊重する', 'いつも笑っている', '相手をばかにする'], answer: 0, hint: '「不笑」＝笑わない、「但是」＝でも' },
        { type: 'say', hamster: '「わかりました」', options: ['haode', 'taimei', 'yaozhege'], answer: 0 },
      ],
    },
    {
      id: 'sweeper', name: '落ち葉をはくお坊さん', emoji: '🍂',
      look: { top: '#8E6A3A', bottom: '#5A3A26', hair: '#F1CBA5', mop: true },
      path: [[-3, 12], [-3, -8], [3, -8], [3, 12]],
      script: [
        { type: 'line', zh: '阿弥陀佛。小心脚下。', py: 'Ēmítuófó. Xiǎoxīn jiǎoxià.', ja: '阿弥陀仏。足もとに気をつけて。' },
      ],
    },
  ];

  function buildShaolin(THREE, scene) {
    const Md = App.Models3D;
    const colliders = [];
    const readables = [];
    const rect = (minX, maxX, minZ, maxZ) => { const c = { minX, maxX, minZ, maxZ }; colliders.push(c); return c; };
    const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, metalness: 0 }, o));
    const box = (w, h, d, mat, x, y, z, { collide = false, rotY = 0, parent = scene } = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      parent.add(m);
      if (collide) rect(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
      return m;
    };
    const cyl = (rt, rb, h, mat, x, y, z, seg = 12, parent = scene) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const cone = (r, h, mat, x, y, z, seg = 8) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
      m.position.set(x, y + h / 2, z);
      scene.add(m);
      return m;
    };
    const roof = (w, h, d, mat, x, y, z) => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.71, 1, 4), mat);
      m.rotation.y = Math.PI / 4;
      g.add(m);
      g.scale.set(w, h, d);
      g.position.set(x, y + h / 2, z);
      scene.add(g);
      return g;
    };
    const tex = (w, h, draw, repeat) => {
      const t = Md.canvasTexture(THREE, w, h, draw);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      if (repeat) t.repeat.set(repeat[0], repeat[1]);
      return t;
    };
    const signRead = (id, opts, width, x, y, z, rotY = 0) => readables.push(Md.readable(Md.sign(THREE, scene, opts, width, x, y, z, rotY), id));

    /* ---------- 空・光（山の朝） ---------- */
    scene.background = new THREE.Color('#D2E2EA');
    scene.fog = new THREE.Fog('#D2E2EA', 50, 170);
    App.Scenery3D.sky(THREE, scene, { top: '#4A92D4', horizon: '#D2E2EA', ground: '#C9C2A8', sun: [0.55, 0.4, 0.5] });
    App.Scenery3D.farMountains(THREE, scene, { r: 290, colors: ['#7E9C8A', '#A8BFC2'], height: [50, 110], seed: 8 });
    App.Scenery3D.clouds(THREE, scene, { count: 14, y: [60, 110], seed: 12 });
    scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x6c6a52, 0.8));
    const sun = new THREE.DirectionalLight(0xffefd2, 0.65);
    sun.position.set(25, 40, 20);
    scene.add(sun);

    const wallMat = M('#A4532E');
    const roofMat = M('#5B6B5A');
    const stone = M('#A9A49A');
    const wood = M('#6B4A2E');
    const pine = M('#3F6B44');

    /* ---------- 地面と山（嵩山） ---------- */
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ map: tex(128, 128, (g, w, h) => {
      g.fillStyle = '#B7A88E'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) { g.fillStyle = Math.random() < 0.5 ? '#A99A80' : '#C4B69C'; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    }, [50, 50]), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(4, 70), M('#CFC6B4'));
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, -5);
    scene.add(path);
    const hill = [M('#6E8A5C'), M('#7D9868'), M('#5E7A50')];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const d = 80 + (i % 3) * 30;
      cone(30 + (i % 4) * 8, 40 + ((i * 7) % 5) * 9, hill[i % 3], Math.cos(a) * d, 0, Math.sin(a) * d - 20, 7);
    }

    // 境内のまわりの森（松が多め。山門の前の参道はあけておく）
    {
      const rnd = App.Scenery3D.rand(21);
      const pts = [];
      for (let i = 0; i < 2600 && pts.length < 520; i++) {
        const x = (rnd() - 0.5) * 170;
        const z = -12 + (rnd() - 0.5) * 170;
        if (Math.abs(x) < 22 && z > -45 && z < 26) continue; // 境内
        if (Math.abs(x) < 7 && z >= 26) continue; // 参道
        if (Math.hypot(x, z + 12) > 85) continue;
        pts.push({ x, y: 0, z, s: 1.2 + rnd() * 0.9, kind: rnd() < 0.7 ? 'pine' : 'round' });
      }
      App.Scenery3D.forest(THREE, scene, pts);
    }

    /* ---------- 境内の壁 ---------- */
    [-1, 1].forEach((s) => {
      box(1, 4, 58, wallMat, s * 18.5, 2, -12, { collide: true });
      box(1.8, 0.4, 58, roofMat, s * 18.5, 4.2, -12);
    });
    box(38, 4, 1, wallMat, 0, 2, -41, { collide: true });

    /* ---------- 山门 ---------- */
    [-1, 1].forEach((s) => {
      box(16.3, 6, 2, wallMat, s * 10.65, 3, 18, { collide: true });
      box(0.8, 6, 2.2, M('#7E3A22'), s * 2.6, 3, 18);
    });
    box(5, 1.6, 2, wallMat, 0, 5.2, 18);
    roof(40, 2.4, 6, roofMat, 0, 6, 18);
    roof(10, 2.6, 5, roofMat, 0, 7.6, 18);
    signRead('shaolinGate', { zh: '少林寺', en: 'Shaolin Temple', bg: '#2A2420', accent: '#E0C068', sub: '#E8E0D0' }, 3.6, 0, 5.1, 19.15, 0);
    [-1, 1].forEach((s) => {
      box(1.2, 1.2, 1.2, stone, s * 4.2, 0.6, 22, { collide: true });
      const lion = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), M('#8E8A80'));
      lion.scale.set(0.8, 1.1, 1);
      lion.position.set(s * 4.2, 1.7, 22);
      scene.add(lion);
    });
    // 入口の外のさく
    [-1, 1].forEach((s) => box(0.4, 1, 14, wood, s * 9, 0.5, 26, { collide: true }));
    box(18, 1, 0.4, wood, 0, 0.5, 33, { collide: true });

    /* ---------- 香炉と松 ---------- */
    cyl(1, 0.8, 1.2, M('#5A4A3A', { metalness: 0.4 }), 0, 0.9, 6, 14);
    cyl(0.4, 1.1, 1.2, M('#4A3C30', { metalness: 0.4 }), 0, 2.1, 6, 14);
    rect(-1.1, 1.1, 4.9, 7.1);
    const smoke = [];
    for (let k = 0; k < 4; k++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: '#E8E8E8', transparent: true, opacity: 0.4, depthWrite: false }));
      scene.add(p);
      smoke.push({ m: p, t: k / 4 });
    }
    [[-15, 12], [15, 12], [-16, -16], [16, -20], [-16, -34], [16, -34], [-5, 14], [5, 14]].forEach(([x, z]) => {
      cyl(0.25, 0.35, 3, wood, x, 1.5, z);
      cone(2.2, 3.4, pine, x, 2.2, z);
      cone(1.6, 2.8, pine, x, 4.2, z);
      rect(x - 0.4, x + 0.4, z - 0.4, z + 0.4);
    });

    /* ---------- 練功場（左）：木人桩・修行中のお坊さん ---------- */
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(10, 14), M('#C2B08E'));
    yard.rotation.x = -Math.PI / 2;
    yard.position.set(-11, 0.03, -5);
    scene.add(yard);
    const dummies = [];
    [[-9, -5.5], [-12.5, -6], [-14.5, -2.5]].forEach(([x, z]) => {
      const g = new THREE.Group();
      cyl(0.28, 0.32, 2, wood, 0, 1, 0, 10, g);
      [0.6, 1.1, 1.5].forEach((y, k) => {
        const arm = cyl(0.05, 0.05, 0.7, wood, 0, y, 0.35, 6, g);
        arm.rotation.x = Math.PI / 2;
        arm.rotation.z = (k - 1) * 0.6;
      });
      g.position.set(x, 0, z);
      scene.add(g);
      rect(x - 0.4, x + 0.4, z - 0.4, z + 0.4);
      dummies.push(g);
    });
    // 武器の棚
    box(0.4, 2, 3, wood, -17.6, 1, -10);
    for (let k = 0; k < 4; k++) cyl(0.03, 0.03, 2.2, M('#9A7A4A'), -17.4, 1.2, -11.2 + k * 0.8, 6);
    rect(-18, -17.2, -11.6, -8.4);
    const monks = [];
    [[-11, -9.5, 0], [-13.5, -9.5, 0], [-8.5, -9.5, 0]].forEach(([x, z, rot]) => {
      const p = Md.person(THREE, { top: '#E67E22', bottom: '#8E4A1A', hair: '#F1CBA5' });
      p.position.set(x, 0, z);
      p.rotation.y = rot;
      scene.add(p);
      rect(x - 0.35, x + 0.35, z - 0.35, z + 0.35);
      monks.push(p);
    });
    signRead('lianGong', { zh: '练功场', en: 'Training Ground', bg: '#5A2E2E', accent: '#E0C068', sub: '#F3E2C0', w: 768, h: 256 }, 2, -6.2, 1.8, 1.8, -Math.PI / 2);

    /* ---------- 塔林（右） ---------- */
    [[9, 2], [12, 3], [15, 1], [10.5, -4], [14, -5], [9, -9], [13, -10]].forEach(([x, z], i) => {
      const lv = 3 + (i % 3);
      for (let k = 0; k < lv; k++) {
        const w = 1.3 - k * 0.18;
        box(w, 0.7, w, stone, x, 0.35 + k * 0.75, z);
        box(w + 0.3, 0.1, w + 0.3, M('#8E8A80'), x, 0.72 + k * 0.75, z);
      }
      cone(0.3, 0.6, stone, x, lv * 0.75, z, 6);
      rect(x - 0.7, x + 0.7, z - 0.7, z + 0.7);
    });
    signRead('talin', { zh: '塔林', en: 'Pagoda Forest', bg: '#2A2420', accent: '#E0C068', sub: '#E8E0D0', w: 768, h: 256 }, 1.8, 7, 1.8, 5, Math.PI / 2);

    /* ---------- 擂台（武術大会の舞台）と大雄宝殿 ---------- */
    const AZ = -26;
    box(11, 1.2, 10, M('#7E3A22'), 0, 0.6, AZ, { collide: true });
    box(10, 0.06, 9, M('#B8332A'), 0, 1.23, AZ);
    [-5, 5].forEach((x) => [-4.6, 4.6].forEach((dz) => {
      cyl(0.12, 0.12, 3, M('#2A2420'), x, 2.6, AZ + dz, 8);
    }));
    [-1, 1].forEach((s) => {
      box(0.08, 2.4, 1.2, M('#B8332A'), s * 5.1, 2.6, AZ + 4.6);
      box(0.06, 0.06, 9.4, M('#E0C068'), s * 5, 4.1, AZ);
    });
    signRead('wushuBisai', { zh: '武术比赛', en: 'Martial Arts Tournament', bg: '#B8332A', accent: '#FFE08A', sub: '#FFF1D6' }, 4.4, 0, 4.4, AZ + 4.8, 0);
    // 観客席
    [-1, 1].forEach((s) => {
      [0, 1].forEach((r) => {
        box(1, 0.45 + r * 0.35, 9, wood, s * (8 + r * 1.2), 0.22 + r * 0.17, AZ, { collide: true });
      });
      for (let k = 0; k < 5; k++) {
        const p = Md.person(THREE, { top: ['#5B8DB8', '#E86F9A', '#27AE60', '#F5B92E', '#8E5BB8'][k], bottom: '#2B2B2B', hair: '#2B2220', sitting: true });
        p.position.set(s * 8.4, 0, AZ - 3.6 + k * 1.8);
        p.rotation.y = -s * Math.PI / 2;
        scene.add(p);
      }
    });
    // 大雄宝殿
    box(26, 1.4, 10, stone, 0, 0.7, -36.5, { collide: true });
    box(22, 6, 7, M('#A4532E'), 0, 4.4, -37);
    for (let x = -10; x <= 10; x += 2.5) cyl(0.3, 0.3, 6, M('#8E2F22'), x, 4.4, -33.2, 10);
    roof(30, 3.4, 12, roofMat, 0, 7.4, -37);
    roof(24, 3.6, 9, roofMat, 0, 9.6, -37);
    signRead('daxiongbaodian', { zh: '大雄宝殿', en: 'Main Hall', bg: '#2A2420', accent: '#E0C068', sub: '#E8E0D0' }, 3.4, 0, 6.6, -33.4, 0);

    // 審判（受付）
    const referee = Md.staff(THREE, { uniform: '#E0A526', scarf: '#B8332A' });
    referee.position.set(0, 0, -19.6);
    referee.rotation.y = 0;
    scene.add(referee);

    /* ---------- 2 人の達人（ボス・オリジナルキャラクター） ---------- */
    const boss = (look, x, z, rot, auraColor) => {
      const p = Md.person(THREE, look);
      p.scale.setScalar(1.06);
      p.position.set(x, 0, z);
      p.rotation.y = rot;
      scene.add(p);
      const aura = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: auraColor, transparent: true, opacity: 0.8 }));
      aura.rotation.x = Math.PI / 2;
      aura.position.set(x, 0.06, z);
      scene.add(aura);
      rect(x - 0.4, x + 0.4, z - 0.4, z + 0.4);
      return { p, aura };
    };
    const bossA = boss({ top: '#F08A24', bottom: '#8E4A1A', hair: '#F1CBA5' }, -4.2, -16.5, Math.PI / 2, '#FFB347');
    const bossB = boss({ top: '#2F3A4A', bottom: '#1E2530', hair: '#1E1A18', hairStyle: 'long' }, 6.5, -15, -Math.PI * 0.6, '#9AA5B1');

    /* ======================= キャラクター ======================= */
    const hamster = Md.hamster(THREE);
    hamster.position.set(1.4, 0, 26.5);
    scene.add(hamster);
    const people = App.World3D.spawnPeople(THREE, scene, PEOPLE);

    return {
      colliders,
      readables,
      bounds: null,
      spawn: { x: 0, z: 28, yaw: 0 },
      hamster,
      people,
      bosses: { a: bossA, b: bossB },
      interactables: [
        { id: 'arena', x: 0, z: -17.8, r: 2.6 },
        { id: 'dummy', x: -9, z: -3.8, r: 2.2 },
        { id: 'bossA', x: -3, z: -15.2, r: 2.2 },
        { id: 'bossB', x: 5.2, z: -13.8, r: 2.2 },
      ],
      tags: [
        { obj: referee, y: 2.35, text: '🏯 武術大会の受付', maxDist: 22 },
        { obj: bossA.p, y: 2.3, text: '🔥 林小飞', maxDist: 14 },
        { obj: bossB.p, y: 2.3, text: '🌑 沈岳', maxDist: 14 },
      ],
      facePlayer: [referee],
      discoveries: [
        { id: 'gate', x: 0, z: 21, r: 3, culture: 'shaolin', say: '<b>少林寺</b>！カンフー（<b>功夫</b>）の聖地だよ。お坊さんには「<b>阿弥陀佛</b>」とあいさつしよう' },
        { id: 'incense', x: 0, z: 8.5, r: 2.6, say: '大きな<b>香炉</b>。お線香のけむりがゆらゆら…' },
        { id: 'yard', x: -7.5, z: -4, r: 3, culture: 'gongfu', say: '<b>练功场</b>（練功場）。木の人形「<b>木人桩</b>」で練習できるみたい！' },
        { id: 'talin', x: 7.5, z: -3, r: 3, culture: 'talin', say: '<b>塔林</b>。昔のえらいお坊さんのお墓の塔なんだって' },
        { id: 'arena', x: 0, z: -15, r: 3, say: '<b>擂台</b>（武術大会の舞台）！<br>受付の人に話しかけると参加できるよ' },
      ],
      update(dt, t) {
        smoke.forEach((s) => {
          s.t += dt * 0.25;
          if (s.t > 1) s.t -= 1;
          s.m.position.set(Math.sin(s.t * 5) * 0.25, 2.8 + s.t * 2.4, 6);
          s.m.scale.setScalar(0.6 + s.t * 1.8);
          s.m.material.opacity = 0.4 * (1 - s.t);
        });
        // 修行中のお坊さん：拳を突く
        monks.forEach((m, i) => {
          const l = m.userData.limbs;
          const a = Math.sin(t * 4 + i) * 0.9;
          l.arms[0].rotation.x = -1.4 + Math.max(0, a);
          l.arms[1].rotation.x = -1.4 + Math.max(0, -a);
        });
        [bossA, bossB].forEach((bb, i) => {
          bb.aura.scale.setScalar(1 + Math.sin(t * (i ? 1.5 : 4)) * 0.12);
          if (!i) bb.p.position.y = Math.abs(Math.sin(t * 5)) * 0.08;
        });
      },
    };
  }

  App.World3D = App.World3D || {};
  App.World3D.buildShaolin = buildShaolin;
})(window.App = window.App || {});
