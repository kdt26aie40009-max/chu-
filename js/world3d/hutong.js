/* 3D 胡同（北京の古い路地）のレイアウト — 寄り道ステージ
 *   路地      x: -2〜2, z: -40〜22（南の入口から北へ）
 *   四合院    x: -15〜-2.6, z: -24〜-8（左の赤い門から入れる中庭の家）
 * 単位はメートル。壁はすべて当たり判定つき。
 */
(function (App) {
  'use strict';

  const BUHUI = { zh: '我不会。', py: 'Wǒ bú huì.', ja: 'できないんだ' };

  /* ---------- 路地の人たち（雑談・あいさつだけの人も） ---------- */
  const PEOPLE = [
    {
      id: 'birdman', name: '鳥の散歩をするおじいさん', emoji: '🐦',
      look: { top: '#3A4A5A', bottom: '#2B2B2B', hair: '#D8D8D8', cap: '#3A4A5A' },
      stand: { x: 1.3, z: 12, rot: -Math.PI / 2 },
      script: [
        { type: 'say', zh: '早！', py: 'Zǎo!', ja: 'おはよう！', hamster: '「早！」は短い朝のあいさつ。返そう', options: ['zaoshang', 'wanan', 'zaijian'], answer: 0 },
        { type: 'understand', zh: '这是我的鸟，它每天早上唱歌。', py: 'Zhè shì wǒ de niǎo, tā měitiān zǎoshang chàng gē.', ja: 'これはわしの鳥でな、毎朝歌うんじゃ。',
          q: '鳥は毎朝何をする？', options: ['歌う', '飛んでいく', '寝ている'], answer: 0, hint: '「唱歌（chàng gē）」＝歌う（単語で習ったね）' },
        { type: 'say', hamster: '「すごい！」は<b>真厉害！</b>', options: [{ zh: '真厉害！', py: 'Zhēn lìhai!', ja: 'すごい！' }, 'taigui', 'cesuo'], answer: 0 },
        { type: 'line', zh: '哈哈，北京人都喜欢遛鸟。', py: 'Hāha, Běijīng rén dōu xǐhuan liù niǎo.', ja: 'はは、北京の人は鳥の散歩が好きなんじゃよ。',
          hamster: '鳥かごを持って散歩する「遛鸟（liù niǎo）」は北京の伝統なんだって' },
      ],
    },
    {
      id: 'jianzi', name: '毽子で遊ぶ男の子', emoji: '🪶',
      look: { top: '#27AE60', bottom: '#2F6FA8', hair: '#2B2220', scale: 0.6 },
      stand: { x: -1.2, z: 4, rot: Math.PI / 2 },
      script: [
        { type: 'understand', zh: '你会踢毽子吗？', py: 'Nǐ huì tī jiànzi ma?', ja: '毽子（けんけり）できる？',
          q: '何を聞かれた？', options: ['毽子ができるか', '何歳か', 'どこへ行くか'], answer: 0, hint: '「会（huì）」＝できる。毽子は羽根を足でけって遊ぶおもちゃ' },
        { type: 'say', hamster: 'やったことないね…「できないんだ」', options: [BUHUI, 'shide', 'meiwenti'], answer: 0 },
        { type: 'line', zh: '没关系！我教你！一、二、三……', py: 'Méi guānxi! Wǒ jiāo nǐ! Yī, èr, sān……', ja: '大丈夫！教えてあげる！いち、に、さん……', hamster: 'やさしい〜！' },
        { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', 'zaijian', 'wei'], answer: 0 },
      ],
    },
    {
      id: 'sister', name: '毽子で遊ぶ女の子', emoji: '🎀',
      look: { top: '#E86F9A', bottom: '#F4EFE6', hair: '#2B2220', hairStyle: 'long', scale: 0.58 },
      stand: { x: 0.6, z: 2.6, rot: -Math.PI * 0.8 },
      script: [
        { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつしよう', options: ['nihao', 'zaijian', 'xiexie'], answer: 0 },
        { type: 'line', zh: '我七岁了！他是我哥哥。', py: 'Wǒ qī suì le! Tā shì wǒ gēge.', ja: '私 7 歳！あの子はお兄ちゃん。', hamster: '「哥哥」＝お兄さん（家族の単語！）' },
      ],
    },
    {
      id: 'rickshaw', name: '三輪車の運転手さん', emoji: '🛺',
      look: { top: '#C0392B', bottom: '#2B2B2B', hair: '#1E1A18', cap: '#2B2B2B' },
      stand: { x: 1.4, z: -4, rot: -Math.PI / 2 },
      script: [
        { type: 'understand', zh: '坐三轮车吗？胡同游，一个小时一百块！', py: 'Zuò sānlúnchē ma? Hútòng yóu, yí ge xiǎoshí yìbǎi kuài!', ja: '三輪車乗る？胡同めぐり、1時間100元！',
          q: '1時間いくら？', options: ['100元', '10元', '1000元'], answer: 0, hint: '「一百（yìbǎi）」＝100' },
        { type: 'say', hamster: 'ちょっと高い…！', options: ['taigui', 'haochi', 'shide'], answer: 0 },
        { type: 'say', hamster: '今日は歩きたいから「いりません」', options: ['buyao', 'yaozhege', 'pianyi'], answer: 0 },
        { type: 'line', zh: '好吧，慢慢走！', py: 'Hǎo ba, mànmàn zǒu!', ja: 'そうか、気をつけてな！' },
      ],
    },
    {
      id: 'laundry', name: '洗濯物を干すおばさん', emoji: '👕',
      look: { top: '#F5B92E', bottom: '#5B4A3F', hair: '#3B2A20', hairStyle: 'bun' },
      stand: { x: -1.3, z: -30, rot: Math.PI / 2 },
      script: [
        { type: 'understand', zh: '你好！吃饭了吗？', py: 'Nǐ hǎo! Chī fàn le ma?', ja: 'こんにちは！ごはん食べた？',
          q: '何を聞かれた？', options: ['ごはんを食べたか', '道に迷ったか', '名前'], answer: 0, hint: '北京の定番あいさつ「吃饭了吗？」' },
        { type: 'say', hamster: '「まだです」は<b>还没呢</b>（hái méi ne）', options: [{ zh: '还没呢。', py: 'Hái méi ne.', ja: 'まだです' }, 'wochile', 'buyao'], answer: 0 },
        { type: 'line', zh: '前面有家饺子馆，很好吃！', py: 'Qiánmiàn yǒu jiā jiǎozi guǎn, hěn hǎochī!', ja: 'この先に餃子屋さんがあって、おいしいわよ！' },
      ],
    },
    {
      id: 'courtyard', name: '四合院のおばあちゃん', emoji: '🍵',
      look: { top: '#8E5BB8', bottom: '#3E3A36', hair: '#D9D9D9', hairStyle: 'bun' },
      stand: { x: -9, z: -14, rot: Math.PI / 2 },
      script: [
        { type: 'understand', zh: '来来来，进来喝杯茶吧！', py: 'Lái lái lái, jìnlái hē bēi chá ba!', ja: 'さあさあ、入ってお茶でも飲んでいきなさい！',
          q: '何に誘われた？', options: ['お茶を飲むこと', 'ごはんを作ること', '写真を撮ること'], answer: 0, hint: '「喝（hē）茶（chá）」＝お茶を飲む' },
        { type: 'say', hamster: 'うれしい！お礼を言おう', options: ['xiexie', 'buyao', 'taigui'], answer: 0 },
        { type: 'understand', zh: '这是四合院。我们在这儿住了五十年了。', py: 'Zhè shì sìhéyuàn. Wǒmen zài zhèr zhù le wǔshí nián le.', ja: 'これは四合院。ここに 50 年住んでいるのよ。',
          q: '何年住んでいる？', options: ['50年', '5年', '15年'], answer: 0, hint: '「五十（wǔshí）」＝50' },
        { type: 'say', hamster: 'すてきな家！感想を伝えよう', options: ['taimei', 'haolei', 'tingbudong'], answer: 0 },
        { type: 'line', zh: '常来玩儿啊！', py: 'Cháng lái wánr a!', ja: 'また遊びにおいでね！', hamster: '北京の人、あったかいなあ…🍵' },
      ],
    },
    {
      id: 'mahjong', name: '麻雀をするおじさん', emoji: '🀄',
      look: { top: '#5B8DB8', bottom: '#3A3A3A', hair: '#BBBBBB' },
      sit: { x: -11.5, z: -19, rot: 0 },
      script: [
        { type: 'line', zh: '嘘——我们在打麻将。', py: 'Xū—— wǒmen zài dǎ májiàng.', ja: 'しーっ、いま麻雀してるんだ。', hamster: '真剣勝負みたい…そっとしておこう' },
        { type: 'say', hamster: '小さな声で「さようなら」', options: ['zaijian', 'jiayou', 'wei'], answer: 0 },
      ],
    },
    {
      id: 'cyclist', name: '自転車のお兄さん', emoji: '🚲',
      look: { top: '#2BB5A0', bottom: '#2F3740', hair: '#1E1A18', backpack: '#E67E22' },
      path: [[0.3, 18], [0.3, -36], [-0.3, -36], [-0.3, 18]],
      script: [
        { type: 'line', zh: '你好！胡同里慢慢走啊！', py: 'Nǐ hǎo! Hútòng lǐ mànmàn zǒu a!', ja: 'やあ！胡同はゆっくり歩いてね！' },
      ],
    },
  ];

  function buildHutong(THREE, scene) {
    const Md = App.Models3D;
    const colliders = [];
    const readables = [];
    const rect = (minX, maxX, minZ, maxZ) => { const c = { minX, maxX, minZ, maxZ }; colliders.push(c); return c; };
    const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, metalness: 0 }, o));
    const box = (w, h, d, mat, x, y, z, { collide = false, rotY = 0 } = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      scene.add(m);
      if (collide) rect(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
      return m;
    };
    const cyl = (rt, rb, h, mat, x, y, z, seg = 12) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z);
      scene.add(m);
      return m;
    };
    const sph = (r, mat, x, y, z) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
      m.position.set(x, y, z);
      scene.add(m);
      return m;
    };
    const tex = (w, h, draw, repeat) => {
      const t = Md.canvasTexture(THREE, w, h, draw);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      if (repeat) t.repeat.set(repeat[0], repeat[1]);
      return t;
    };

    /* ---------- 空・光（夕方前のやわらかい光） ---------- */
    scene.background = new THREE.Color('#D7E6F0');
    scene.fog = new THREE.Fog('#D7E6F0', 30, 90);
    App.Scenery3D.sky(THREE, scene, { top: '#5A9BD8', horizon: '#F3E3CC', ground: '#D7E6F0', sun: [0.6, 0.3, 0.3] });
    App.Scenery3D.clouds(THREE, scene, { count: 12, y: [60, 100], r: [90, 200], seed: 9 });
    scene.add(new THREE.HemisphereLight(0xfff6e6, 0x7a6a58, 0.8));
    const sun = new THREE.DirectionalLight(0xffe8c4, 0.55);
    sun.position.set(20, 30, 10);
    scene.add(sun);

    const brickTex = (rx, ry) => new THREE.MeshStandardMaterial({ map: tex(256, 256, (g, w, h) => {
      g.fillStyle = '#8E9196'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < w; x += 32) {
        const v = 130 + Math.floor(Math.random() * 25);
        g.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
        g.fillRect(x + 1, y + 1, 30, 14);
      }
    }, [rx, ry]), roughness: 0.95 });
    const tile = M('#4C4C50');
    const redDoor = M('#A8322A');
    const wood = M('#7A5236');

    /* ---------- 地面 ---------- */
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 90), new THREE.MeshStandardMaterial({ map: tex(128, 128, (g, w, h) => {
      g.fillStyle = '#A59D90'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) { g.fillStyle = Math.random() < 0.5 ? '#9A9285' : '#B1A99C'; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    }, [12, 18]), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(-5, 0, -9);
    scene.add(ground);

    /* ---------- 路地の両側の壁（灰色のれんが＋瓦） ---------- */
    const wallSeg = (x, z0, z1) => {
      const len = z0 - z1;
      box(0.5, 3.4, len, brickTex(len / 3, 1), x, 1.7, (z0 + z1) / 2, { collide: true });
      const t = box(1.1, 0.25, len + 0.2, tile, x, 3.5, (z0 + z1) / 2);
      t.rotation.z = x > 0 ? 0.25 : -0.25;
    };
    // 右の壁（ところどころに門）
    wallSeg(2.5, 22, -40);
    // 左の壁（四合院の門 z=-16 だけ開いている）
    wallSeg(-2.5, 22, -14.9);
    wallSeg(-2.5, -17.1, -40);
    // 北と南の端
    box(6, 3.4, 0.5, brickTex(2, 1), 0, 1.7, -40.2, { collide: true });
    rect(-3, 3, 22.2, 22.8);
    // 門（飾り）と門墩（太鼓形の石）
    const door = (x, z, open = false) => {
      const s = x > 0 ? -1 : 1;
      box(0.3, 3.0, 2.2, M('#5A3A26'), x + s * 0.1, 1.5, z);
      if (!open) box(0.12, 2.5, 1.7, redDoor, x + s * 0.27, 1.25, z);
      box(0.4, 0.4, 2.6, tile, x + s * 0.2, 3.2, z);
      [-1, 1].forEach((e) => {
        const drum = cyl(0.3, 0.3, 0.2, M('#B7B2A8'), x + s * 0.55, 0.45, z + e * 1.2, 14);
        drum.rotation.x = Math.PI / 2;
        box(0.3, 0.3, 0.3, M('#B7B2A8'), x + s * 0.55, 0.15, z + e * 1.2);
      });
      [-0.45, 0.45].forEach((e) => box(0.13, 0.4, 0.2, M('#E0A526'), x + s * 0.34, 2.75, z + e));
    };
    [[2.5, 14], [2.5, 2], [2.5, -12], [2.5, -26], [-2.5, 8], [-2.5, -30]].forEach(([x, z]) => door(x, z));
    door(-2.5, -16, true);
    // 路地の名前（青い札）と赤い提灯
    readables.push(Md.readable(Md.sign(THREE, scene, { zh: '仓鼠胡同', en: 'Cangshu Hutong', bg: '#2E5E9E', accent: '#FFFFFF', sub: '#D6E6FA', w: 768, h: 256 }, 1.6, 2.2, 2.6, 19, -Math.PI / 2), 'hutongName'));
    [16, 6, -6, -20, -34].forEach((z) => [-1, 1].forEach((s) => {
      const l = sph(0.26, new THREE.MeshBasicMaterial({ color: '#F0503C' }), s * 1.9, 2.75, z);
      l.scale.y = 0.85;
    }));
    // 木（枝が路地にかかる）
    [[2.9, 9], [-2.9, -2], [2.9, -20], [-2.9, -36]].forEach(([x, z]) => {
      cyl(0.18, 0.24, 5, wood, x, 2.5, z);
      sph(2.2, M('#5E8F4E'), x, 5.6, z);
      sph(1.6, M('#6DA35A'), x - Math.sign(x) * 1.2, 5.0, z + 0.8);
    });
    // 鳥かご（おじいさんの横の木につるす）
    cyl(0.01, 0.01, 0.8, M('#333'), 2.0, 2.9, 12.1, 4);
    cyl(0.22, 0.22, 0.5, M('#C9A06A', { transparent: true, opacity: 0.7 }), 2.0, 2.3, 12.1, 10);
    sph(0.09, M('#F5B92E'), 2.0, 2.25, 12.1);
    // 自転車・三輪車
    const bike = (x, z, rot) => {
      const g = new THREE.Group();
      [-0.45, 0.45].forEach((dz) => {
        const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 6, 16), M('#222'));
        w.position.set(0, 0.34, dz);
        w.rotation.y = Math.PI / 2;
        g.add(w);
      });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.9), M('#2F6FA8'));
      frame.position.y = 0.6;
      g.add(frame);
      g.position.set(x, 0, z);
      g.rotation.y = rot;
      scene.add(g);
    };
    bike(2.0, 6.5, 0.15);
    bike(-2.0, -8, -0.1);
    const trike = new THREE.Group();
    const tb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.2), M('#C0392B'));
    tb.position.set(0, 0.7, -0.4);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.2), M('#8E2F2F'));
    seat.position.set(0, 1.1, -0.95);
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.1, 12, 1, true, 0, Math.PI), M('#2F6FA8'));
    hood.rotation.z = Math.PI / 2;
    hood.position.set(0, 1.4, -0.6);
    trike.add(tb, seat, hood);
    [[-0.55, -0.6], [0.55, -0.6], [0, 0.9]].forEach(([x, z]) => {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 16), M('#222'));
      w.position.set(x, 0.3, z);
      w.rotation.y = Math.PI / 2;
      trike.add(w);
    });
    trike.position.set(1.6, 0, -6.5);
    scene.add(trike);
    rect(1.0, 2.3, -8, -5.3);
    // 洗濯ひも
    cyl(0.01, 0.01, 4.4, M('#DDD'), 0, 2.6, -31, 4).rotation.z = Math.PI / 2;
    [[-1.2, '#F4EFE6'], [-0.2, '#5B8DB8'], [0.9, '#E86F9A']].forEach(([x, c]) => box(0.6, 0.7, 0.02, M(c), x, 2.2, -31));
    // 猫（塀の上）
    const cat = new THREE.Group();
    const cb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), M('#E8A050'));
    cb.scale.set(1, 0.8, 1.4);
    const ch = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), M('#E8A050'));
    ch.position.set(0, 0.15, 0.28);
    [-1, 1].forEach((s) => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), M('#E8A050')); e.position.set(s * 0.08, 0.3, 0.3); cat.add(e); });
    cat.add(cb, ch);
    cat.position.set(2.5, 3.75, -2);
    cat.rotation.y = -Math.PI / 2;
    scene.add(cat);

    /* ---------- 四合院（左の門の奥） ---------- */
    const cyW = M('#9A9DA2');
    box(0.5, 3.4, 16, cyW, -15.2, 1.7, -16, { collide: true });
    box(13, 3.4, 0.5, cyW, -8.9, 1.7, -8, { collide: true });
    box(13, 3.4, 0.5, cyW, -8.9, 1.7, -24, { collide: true });
    // 中庭の建物（北・西）
    box(10, 3, 3, M('#B5583F'), -9, 1.5, -22.2, { collide: true });
    const r1 = box(11, 0.3, 4, tile, -9, 3.3, -22);
    r1.rotation.x = 0.2;
    box(3, 3, 10, M('#B5583F'), -13.3, 1.5, -16, { collide: true });
    for (let x = -13; x <= -5; x += 2) cyl(0.12, 0.12, 2.8, M('#C0392B'), x, 1.4, -20.6, 8);
    readables.push(Md.readable(Md.sign(THREE, scene, { zh: '四合院', en: 'Courtyard House', bg: '#5A2E2E', accent: '#E0C068', sub: '#F3E2C0', w: 768, h: 256 }, 1.6, -9, 2.9, -20.5), 'siheyuan'));
    // 中庭の木・お茶のテーブル・麻雀卓
    cyl(0.15, 0.2, 3.5, wood, -6, 1.75, -12);
    sph(1.6, M('#5E8F4E'), -6, 4, -12);
    [[-6.6, -11.4], [-5.5, -12.6]].forEach(([x, z]) => sph(0.12, M('#D7261E'), x, 3.6, z));
    box(1.2, 0.7, 0.8, wood, -7.6, 0.35, -14, { collide: true });
    cyl(0.08, 0.06, 0.12, M('#FFFFFF'), -7.8, 0.76, -14, 10);
    cyl(0.12, 0.1, 0.18, M('#2BB5A0'), -7.3, 0.79, -14, 10);
    box(1.2, 0.7, 1.2, M('#2F6B4A'), -11.5, 0.35, -17.8, { collide: true });
    for (let k = 0; k < 8; k++) box(0.1, 0.06, 0.14, M('#F4EFE6'), -11.9 + (k % 4) * 0.25, 0.74, -18.2 + Math.floor(k / 4) * 0.8);
    ['#3A3A3A', '#5B6BB8'].forEach((c, k) => {
      const p = Md.person(THREE, { top: c, bottom: '#2B2B2B', hair: '#BBBBBB', sitting: true });
      p.position.set(k ? -10.3 : -12.7, 0, -17.8);
      p.rotation.y = k ? -Math.PI / 2 : Math.PI / 2;
      scene.add(p);
      box(0.45, 0.55, 0.45, wood, k ? -10.3 : -12.7, 0.275, -17.8);
    });
    box(0.45, 0.55, 0.45, wood, -11.5, 0.275, -19);

    /* ======================= キャラクター ======================= */
    const hamster = Md.hamster(THREE);
    hamster.position.set(1.2, 0, 19);
    scene.add(hamster);
    const people = App.World3D.spawnPeople(THREE, scene, PEOPLE);

    return {
      colliders,
      readables,
      bounds: null,
      spawn: { x: 0, z: 20.5, yaw: 0 },
      hamster,
      people,
      interactables: [],
      discoveries: [
        { id: 'sign', x: 0, z: 18, r: 2.6, culture: 'hutong', say: '青い札は路地の名前。<b>胡同</b>（hútòng）は北京の古い路地のことだよ' },
        { id: 'drum', x: 1.6, z: 14, r: 2, culture: 'mendun', say: '門の前の丸い石は<b>门墩</b>（méndūn）。家を守るお守りなんだって' },
        { id: 'trike', x: 0.5, z: -6.5, r: 2.4, say: '<b>三轮车</b>（三輪車）。胡同めぐりのタクシーみたいなものだよ' },
        { id: 'cat', x: 1.6, z: -2, r: 2, say: '塀の上に猫！🐈「<b>猫</b>（māo）」だね' },
        { id: 'courtyard', x: -4.5, z: -16, r: 2.4, culture: 'siheyuan', say: 'ここが<b>四合院</b>！中庭を 4 つの建物が囲む北京の伝統の家' },
      ],
    };
  }

  App.World3D = App.World3D || {};
  App.World3D.buildHutong = buildHutong;
})(window.App = window.App || {});
