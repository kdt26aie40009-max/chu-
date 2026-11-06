/* 3D 胡同（北京の古い路地）のレイアウト — 寄り道ステージ
 *   路地      x: -2〜2, z: -40〜22（南の入口から北へ）
 *   四合院    x: -15〜-2.6, z: -24〜-8（左の赤い門から入れる中庭の家）
 *   横の路地  x: -34〜36, z: -47〜-40（路地の突き当たりを左右へ）。途中に茶館（x≈14）
 *   ⭐ おすすめスポット（イベントはなし。歩いて見るだけ・話せる人がいる）
 *     西の端  什刹海の湖ぞい   x: -46〜-34, z: -64〜-24（柳の並木・ボート）
 *     東の端  鼓楼の広場       x: 36〜72, z: -66〜-22
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
      id: 'fisher', name: '釣りをするおじいさん', emoji: '🎣',
      look: { top: '#6B7A5A', bottom: '#3A3A3A', hair: '#D8D8D8', cap: '#C9B48A' },
      stand: { x: -44.2, z: -33, rot: -Math.PI / 2 },
      script: [
        { type: 'understand', zh: '你好！我在钓鱼呢。', py: 'Nǐ hǎo! Wǒ zài diàoyú ne.', ja: 'やあ！いま釣りをしてるんだよ。',
          q: 'おじいさんは何をしている？', options: ['釣り', '料理', 'お昼寝'], answer: 0, hint: '「钓鱼（diàoyú）」＝釣り。「鱼」＝魚' },
        { type: 'line', zh: '什刹海很美吧？', py: 'Shíchàhǎi hěn měi ba?', ja: '什刹海、きれいだろう？' },
        { type: 'say', hamster: '「きれい！」と答えよう', options: ['taimei', 'taigui', 'haolei'], answer: 0 },
      ],
    },
    {
      id: 'teahouse', name: '茶館の店員さん', emoji: '🍵',
      look: { top: '#2F6B4A', bottom: '#2B2B2B', hair: '#2B2220', hairStyle: 'bun' },
      stand: { x: 14, z: -45.4, rot: 0 },
      script: [
        { type: 'understand', zh: '欢迎！喝杯茉莉花茶吧？', py: 'Huānyíng! Hē bēi mòlìhuā chá ba?', ja: 'いらっしゃい！ジャスミン茶をいかが？',
          q: '何をすすめられた？', options: ['ジャスミン茶', 'コーヒー', 'ジュース'], answer: 0, hint: '「茉莉花茶（mòlìhuā chá）」＝ジャスミン茶' },
        { type: 'say', hamster: '「はい、お願いします」', options: ['haode', 'buyao', 'zaijian'], answer: 0 },
        { type: 'line', zh: '请慢用！', py: 'Qǐng màn yòng!', ja: 'ごゆっくりどうぞ！', hamster: 'いい香り〜🍵' },
      ],
    },
    {
      id: 'drumguide', name: '鼓楼の案内係さん', emoji: '🥁',
      look: { top: '#A8322A', bottom: '#2F3740', hair: '#1E1A18', cap: '#A8322A' },
      stand: { x: 50.5, z: -41, rot: -Math.PI / 2 },
      script: [
        { type: 'line', zh: '这是鼓楼。以前用鼓声告诉大家时间。', py: 'Zhè shì Gǔlóu. Yǐqián yòng gǔ shēng gàosu dàjiā shíjiān.', ja: 'これは鼓楼。昔は太鼓の音でみんなに時間を知らせたんだよ。',
          hamster: '📖 右上の「文化メモ」で、くわしく読めるよ' },
        { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', 'zaijian', 'nihao'], answer: 0 },
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
    scene.fog = new THREE.Fog('#D7E6F0', 40, 160);
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
    let waterTex = null;
    const boats = [];
    const redDoor = M('#A8322A');
    const wood = M('#7A5236');

    /* ---------- 地面 ---------- */
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(132, 140), new THREE.MeshStandardMaterial({ map: tex(128, 128, (g, w, h) => {
      g.fillStyle = '#A59D90'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) { g.fillStyle = Math.random() < 0.5 ? '#9A9285' : '#B1A99C'; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    }, [26, 28]), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(20, 0, -30);
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
    // 南の端（北の突き当たりは横の路地につながる）
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


    /* ======================= 横の路地とおすすめスポット ======================= */
    // 東西にのびる壁（瓦つき）
    const wallX = (z, x0, x1, s) => {
      const len = x1 - x0;
      box(len, 3.4, 0.5, brickTex(len / 3, 1), (x0 + x1) / 2, 1.7, z, { collide: true });
      const t = box(len + 0.2, 0.25, 1.1, tile, (x0 + x1) / 2, 3.5, z);
      t.rotation.x = s * 0.25;
    };
    // 壁に付いた赤い門（s: 門の向き。+1 = 南向き）
    const doorX = (x, z, s) => {
      box(2.2, 3.0, 0.3, M('#5A3A26'), x, 1.5, z + s * 0.1);
      box(1.7, 2.5, 0.12, redDoor, x, 1.25, z + s * 0.27);
      box(2.6, 0.4, 0.4, tile, x, 3.2, z + s * 0.2);
      [-1, 1].forEach((e) => {
        const drum = cyl(0.3, 0.3, 0.2, M('#B7B2A8'), x + e * 1.2, 0.45, z + s * 0.55, 14);
        drum.rotation.z = Math.PI / 2;
      });
    };
    wallX(-39.75, -34, -2.5, 1);
    wallX(-39.75, 2.5, 36, 1);
    wallX(-47.25, -34, 36, -1);
    [-27, -12, 24, 31].forEach((x) => doorX(x, -47, 1));
    [-20, -9, 9, 22].forEach((x) => doorX(x, -40, -1));
    [-28, -16, -4, 4, 20, 30].forEach((x) => [-41, -46].forEach((z) => {
      const l = sph(0.26, new THREE.MeshBasicMaterial({ color: '#F0503C' }), x, 2.75, z);
      l.scale.y = 0.85;
    }));
    // 分かれ道の案内（左＝什刹海、右＝鼓楼）
    readables.push(Md.readable(Md.sign(THREE, scene, { zh: '什刹海', en: 'Shichahai', arrow: '←', bg: '#2E5E9E', accent: '#FFFFFF', sub: '#D6E6FA', w: 768, h: 256 }, 1.7, -1.3, 2.4, -46.9), 'toShichahai'));
    readables.push(Md.readable(Md.sign(THREE, scene, { zh: '鼓楼', en: 'Drum Tower', arrow: '→', bg: '#2E5E9E', accent: '#FFFFFF', sub: '#D6E6FA', w: 768, h: 256 }, 1.7, 1.3, 2.4, -46.9), 'toGulou'));
    // 老槐树（大きな古い木）と石のベンチ
    cyl(0.45, 0.6, 5.5, wood, -20, 2.75, -45.6);
    rect(-20.6, -19.4, -46.2, -45);
    sph(3.2, M('#557F45'), -20, 6.6, -45.2);
    sph(2.4, M('#6A9A55'), -18.2, 6, -44);
    sph(2.2, M('#4E7A3E'), -21.8, 6.2, -44.4);
    box(2.2, 0.45, 0.6, M('#B7B2A8'), -16.5, 0.22, -46.4, { collide: true });

    /* ---------- ⭐ 茶館（横の路地の北側） ---------- */
    {
      const cx = 14;
      const fz = -46.6; // 店の正面
      box(11, 3.6, 0.6, M('#6E3B2A'), cx, 1.8, fz - 0.2);
      // 格子の窓と入口
      [-3.6, 3.6].forEach((dx) => {
        box(2.6, 1.6, 0.1, M('#E9D6A8'), cx + dx, 1.9, fz + 0.12);
        for (let k = -2; k <= 2; k++) box(0.06, 1.6, 0.12, M('#5A3020'), cx + dx + k * 0.5, 1.9, fz + 0.16);
        for (let k = -1; k <= 1; k++) box(2.6, 0.06, 0.12, M('#5A3020'), cx + dx, 1.9 + k * 0.5, fz + 0.16);
      });
      box(1.8, 2.6, 0.1, M('#3A2418'), cx, 1.3, fz + 0.12);
      // 赤い柱・軒・提灯
      [-5.2, -1.6, 1.6, 5.2].forEach((dx) => { cyl(0.14, 0.14, 3.4, M('#B83A2E'), cx + dx, 1.7, fz + 1.3, 10); rect(cx + dx - 0.2, cx + dx + 0.2, fz + 1.1, fz + 1.5); });
      const eave = box(12, 0.25, 2.4, tile, cx, 3.55, fz + 0.9);
      eave.rotation.x = -0.18;
      box(11.6, 0.35, 0.2, M('#245F73'), cx, 3.25, fz + 1.4);
      readables.push(Md.readable(Md.sign(THREE, scene, { zh: '胡同茶馆', en: 'Tea House', bg: '#2B1A12', accent: '#E8C46A', sub: '#E9D6A8', w: 768, h: 256 }, 2.6, cx, 2.95, fz + 1.55), 'chaguan'));
      [-3.4, 3.4].forEach((dx) => {
        cyl(0.01, 0.01, 0.4, M('#333'), cx + dx, 2.85, fz + 1.5, 4);
        const l = sph(0.3, new THREE.MeshStandardMaterial({ color: '#E0302A', emissive: '#7A1008' }), cx + dx, 2.45, fz + 1.5);
        l.scale.y = 1.2;
      });
      // 外のテーブル（四角い木のテーブルと小さな腰かけ）と急須・湯のみ
      [-3.6, 3.6].forEach((dx) => {
        const tx = cx + dx;
        const tz = -43.6;
        box(1.1, 0.75, 1.1, wood, tx, 0.375, tz, { collide: true });
        [[-0.85, 0], [0.85, 0], [0, 0.85]].forEach(([ox, oz]) => box(0.4, 0.45, 0.4, M('#5A3A26'), tx + ox, 0.225, tz + oz));
        const pot = sph(0.14, M('#3E6E8E'), tx, 0.88, tz);
        pot.scale.y = 0.8;
        [[-0.3, 0.25], [0.3, -0.25], [0.25, 0.3]].forEach(([ox, oz]) => cyl(0.05, 0.04, 0.08, M('#F4EFE6'), tx + ox, 0.79, tz + oz, 8));
      });
    }

    /* ---------- ⭐ 什刹海（西の端の湖ぞい） ---------- */
    {
      // 湖ぞいの道の両端と、路地側の壁
      wallX(-24, -46, -34, 1);
      wallX(-64, -46, -34, -1);
      const wallZ = (x, z0, z1) => {
        const len = z0 - z1;
        box(0.5, 3.4, len, brickTex(len / 3, 1), x, 1.7, (z0 + z1) / 2, { collide: true });
        const t = box(1.1, 0.25, len + 0.2, tile, x, 3.5, (z0 + z1) / 2);
        t.rotation.z = -0.25;
      };
      wallZ(-34.25, -24, -39.5);
      wallZ(-34.25, -47.5, -64);
      // 湖（地面より少し低い水面）と石の岸・白い手すり
      const water = new THREE.Mesh(new THREE.PlaneGeometry(160, 240), new THREE.MeshStandardMaterial({ map: tex(256, 256, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, w, h);
        gr.addColorStop(0, '#5E9EC0'); gr.addColorStop(1, '#79B5CF');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
        for (let i = 0; i < 40; i++) {
          const x = Math.random() * w; const y = Math.random() * h;
          g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 7, y - 3, x + 14, y); g.stroke();
        }
      }, [20, 30]), roughness: 0.25, metalness: 0.1 }));
      water.rotation.x = -Math.PI / 2;
      water.position.set(-126, -0.5, -40);
      scene.add(water);
      waterTex = water.material.map;
      box(1.2, 1.2, 44, M('#B7B2A8'), -46.6, -0.1, -44);
      rect(-48, -45.9, -64, -24);
      for (let z = -63; z <= -25; z += 2) cyl(0.08, 0.08, 0.9, M('#EDEAE2'), -46.2, 0.95, z, 6);
      box(0.12, 0.12, 40, M('#EDEAE2'), -46.2, 1.35, -44);
      // 柳の並木（たれ下がる枝）
      const willow = (x, z, k = 1) => {
        cyl(0.2 * k, 0.3 * k, 4 * k, wood, x, 2 * k, z);
        const crown = sph(2.1 * k, M('#8DB255'), x, 4.6 * k, z);
        crown.scale.set(1, 1.25, 1);
        for (let a = 0; a < 7; a++) {
          const ang = (a / 7) * Math.PI * 2;
          const drop = sph(0.7 * k, M(a % 2 ? '#9CC060' : '#7FA84C'), x + Math.cos(ang) * 1.6 * k, 3.2 * k, z + Math.sin(ang) * 1.6 * k);
          drop.scale.set(0.6, 2.2, 0.6);
        }
      };
      [-61, -53, -45, -37, -29].forEach((z) => { willow(-44.6, z); rect(-45, -44.2, z - 0.4, z + 0.4); });
      // ベンチ
      [-49, -33].forEach((z) => box(0.6, 0.45, 2, wood, -36, 0.22, z, { collide: true }));
      // 湖のボートと、むこう岸（柳と灰色の屋根）
      [[-62, -30, 0.4], [-75, -52, -0.3], [-58, -58, 1.2]].forEach(([x, z, r]) => {
        const g = new THREE.Group();
        const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 3.6), M('#C9A06A'));
        hull.position.y = -0.3;
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.8), M('#C0392B'));
        roof.position.y = 0.9;
        g.add(hull, roof);
        [[-0.7, -0.8], [0.7, -0.8], [-0.7, 0.8], [0.7, 0.8]].forEach(([px, pz]) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 5), M('#5A3A26'));
          post.position.set(px, 0.35, pz);
          g.add(post);
        });
        g.position.set(x, 0, z);
        g.rotation.y = r;
        scene.add(g);
        boats.push(g);
      });
      const far = new THREE.Mesh(new THREE.PlaneGeometry(60, 240), M('#A59D90'));
      far.rotation.x = -Math.PI / 2;
      far.position.set(-135, 0.02, -40);
      scene.add(far);
      for (let z = -150; z <= 70; z += 9) {
        willow(-108, z + (z % 2) * 2, 1.3);
        box(8, 4, 6, M('#8E9196'), -116, 2, z + 4);
        const r = box(9, 0.4, 7, tile, -116, 4.3, z + 4);
        r.rotation.z = 0.12;
      }
      readables.push(Md.readable(Md.sign(THREE, scene, { zh: '什刹海', en: 'Shichahai Lake', bg: '#1F4E79', accent: '#FFFFFF', sub: '#CFE3F5', w: 768, h: 256 }, 2.4, -34.6, 2.4, -32, -Math.PI / 2), 'shichahai'));
    }

    /* ---------- ⭐ 鼓楼（東の端の広場） ---------- */
    {
      const wallZ = (x, z0, z1) => {
        const len = z0 - z1;
        box(0.5, 3.4, len, brickTex(len / 3, 1), x, 1.7, (z0 + z1) / 2, { collide: true });
        const t = box(1.1, 0.25, len + 0.2, tile, x, 3.5, (z0 + z1) / 2);
        t.rotation.z = 0.25;
      };
      wallZ(36.25, -22, -39.5);
      wallZ(36.25, -47.5, -66);
      wallX(-22, 36, 72, 1);
      wallX(-66, 36, 72, -1);
      wallZ(72.25, -22, -66);
      // 広場の石だたみ
      const sq = new THREE.Mesh(new THREE.PlaneGeometry(36, 44), new THREE.MeshStandardMaterial({ map: tex(128, 128, (g, w, h) => {
        g.fillStyle = '#C4BCAC'; g.fillRect(0, 0, w, h);
        g.strokeStyle = '#A9A190'; g.lineWidth = 3;
        for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(0, k * 32); g.lineTo(w, k * 32); g.stroke(); g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32, h); g.stroke(); }
      }, [9, 11]), roughness: 1 }));
      sq.rotation.x = -Math.PI / 2;
      sq.position.set(54, 0.02, -44);
      scene.add(sq);
      // 鼓楼：赤い台（3 つのアーチ）＋ 2 階の楼閣＋二重の屋根
      const TX = 62;
      const TZ = -44;
      const red = M('#A8322A');
      box(14, 8, 20, red, TX, 4, TZ, { collide: true });
      box(14.6, 0.6, 20.6, M('#8C8478'), TX, 0.3, TZ);
      box(14.8, 0.5, 20.8, M('#6E6A64'), TX, 8.25, TZ);
      [-5.5, 0, 5.5].forEach((dz) => {
        box(0.2, 4.2, 2.8, M('#2A1A14'), TX - 7.02, 2.1, TZ + dz);
        const arch = cyl(1.4, 1.4, 0.2, M('#2A1A14'), TX - 7.02, 4.2, TZ + dz, 16);
        arch.rotation.z = Math.PI / 2;
      });
      // 2 階
      box(11, 5.4, 17, red, TX, 11.2, TZ);
      for (let dz = -8; dz <= 8; dz += 2) cyl(0.25, 0.25, 5.4, M('#B83A2E'), TX - 5.9, 11.2, TZ + dz, 10);
      box(0.2, 1.2, 17, M('#245F73'), TX - 5.95, 13.4, TZ);
      box(12.6, 0.5, 18.6, M('#6E6A64'), TX, 8.7, TZ);
      // 屋根（四角すいをつぶした形）
      const roofAt = (w, d, h, y, color) => {
        const r = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), M(color));
        r.rotation.y = Math.PI / 4;
        r.scale.set(w / Math.SQRT2, h, d / Math.SQRT2);
        r.position.set(TX, y, TZ);
        scene.add(r);
        return r;
      };
      roofAt(16, 23, 2.6, 15.2, '#4A4A50');
      box(9, 2.2, 15, red, TX, 16.6, TZ);
      roofAt(14, 20, 4.2, 19.6, '#4A4A50');
      box(0.4, 0.5, 9, M('#2E5E4A'), TX, 21.7, TZ);
      // 太鼓（2 階の窓から見える）
      [-4, 0, 4].forEach((dz) => {
        const d = cyl(1, 1, 0.9, M('#9A2A20'), TX - 5.4, 11, TZ + dz, 18);
        d.rotation.z = Math.PI / 2;
        cyl(0.9, 0.9, 0.95, M('#E9D6A8'), TX - 5.4, 11, TZ + dz, 18).rotation.z = Math.PI / 2;
      });
      readables.push(Md.readable(Md.sign(THREE, scene, { zh: '鼓楼', en: 'Drum Tower', bg: '#2B1A12', accent: '#E8C46A', sub: '#E9D6A8', w: 512, h: 256 }, 2.4, TX - 7.15, 6.6, TZ, -Math.PI / 2), 'gulou'));
      // 広場の木と屋台
      [[42, -26], [42, -62], [66, -26], [66, -62]].forEach(([x, z]) => {
        cyl(0.22, 0.3, 4, wood, x, 2, z);
        sph(2.2, M('#5E8F4E'), x, 5, z);
        rect(x - 0.4, x + 0.4, z - 0.4, z + 0.4);
      });
      box(2.4, 1, 1.2, M('#C0392B'), 45, 0.5, -30, { collide: true });
      box(2.6, 0.12, 1.6, M('#F5B92E'), 45, 2.3, -30);
      [-1, 1].forEach((e) => cyl(0.05, 0.05, 2.3, M('#5A3A26'), 45 + e * 1.1, 1.15, -30.6, 6));
    }

    /* ======================= キャラクター ======================= */
    const hamster = Md.hamster(THREE);
    hamster.position.set(1.2, 0, 19);
    scene.add(hamster);
    const people = App.World3D.spawnPeople(THREE, scene, PEOPLE);
    // ⭐ おすすめスポットの名札（遠くからでも見える）
    const pin = (x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); return o; };
    const spotTags = [
      { obj: pin(-40, 0, -44), y: 4.2, text: '⭐ おすすめ：什刹海', maxDist: 80 },
      { obj: pin(14, 0, -45.5), y: 4.4, text: '⭐ おすすめ：茶館', maxDist: 40 },
      { obj: pin(55, 0, -44), y: 9.5, text: '⭐ おすすめ：鼓楼', maxDist: 90 },
    ];

    return {
      colliders,
      readables,
      bounds: null,
      spawn: { x: 0, z: 20.5, yaw: 0 },
      hamster,
      people,
      interactables: [],
      tags: spotTags,
      update(dt, t) {
        if (waterTex) waterTex.offset.set(t * 0.004, t * 0.002);
        boats.forEach((b, k) => { b.position.y = Math.sin(t * 1.4 + k) * 0.06; b.rotation.z = Math.sin(t * 1.1 + k * 2) * 0.03; });
      },
      discoveries: [
        { id: 'sign', x: 0, z: 18, r: 2.6, culture: 'hutong', say: '青い札は路地の名前。<b>胡同</b>（hútòng）は北京の古い路地のことだよ' },
        { id: 'drum', x: 1.6, z: 14, r: 2, culture: 'mendun', say: '門の前の丸い石は<b>门墩</b>（méndūn）。家を守るお守りなんだって' },
        { id: 'trike', x: 0.5, z: -6.5, r: 2.4, say: '<b>三轮车</b>（三輪車）。胡同めぐりのタクシーみたいなものだよ' },
        { id: 'cat', x: 1.6, z: -2, r: 2, say: '塀の上に猫！🐈「<b>猫</b>（māo）」だね' },
        { id: 'courtyard', x: -4.5, z: -16, r: 2.4, culture: 'siheyuan', say: 'ここが<b>四合院</b>！中庭を 4 つの建物が囲む北京の伝統の家' },
        { id: 'fork', x: 0, z: -43, r: 2.6, say: '道が分かれてる！<b>左（西）は什刹海</b>、<b>右（東）は鼓楼</b>。どっちもおすすめスポットだよ⭐' },
        { id: 'oldtree', x: -18, z: -43.5, r: 2.4, say: '大きな<b>老槐树</b>（lǎo huái shù・エンジュの古い木）。何百年も胡同を見守ってきたんだって' },
        { id: 'chaguan', x: 14, z: -43, r: 3, culture: 'chaguan', say: '<b>茶馆</b>（cháguǎn）＝茶館。お茶を飲みながらのんびりおしゃべりするお店だよ🍵' },
        { id: 'shichahai', x: -40, z: -42, r: 5, culture: 'shichahai', say: 'わあ、湖だ！ここが<b>什刹海</b>（Shíchàhǎi）。柳の並木がきれいだね🌿' },
        { id: 'gulou', x: 46, z: -44, r: 6, culture: 'gulou', say: '大きい！これが<b>鼓楼</b>（Gǔlóu）。昔は太鼓で町に時間を知らせていたんだ🥁' },
      ],
    };
  }

  App.World3D = App.World3D || {};
  App.World3D.buildHutong = buildHutong;
})(window.App = window.App || {});
