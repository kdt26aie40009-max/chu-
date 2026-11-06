/* 3D 天安門広場〜故宮のレイアウト（1 つのつながったフィールド・南から北へ歩く）
 *   天安門広場   x: -30〜30, z: 12〜72   記念碑(z=40)・国旗の柱(z=16)
 *   金水橋       z: 7〜11 の堀に 5 本の橋（真ん中の橋だけ天安門の通路につながる）
 *   天安門       z: -3〜7 の城壁。真ん中の通路を北へ（広場で記念写真を撮ると通れる）
 *   故宮の入口   z: -20〜-3   售票处(左)・検票口(z=-16)
 *   故宮の中庭   z: -80〜-20  太和殿(z=-70・三段の基壇の上)
 * 単位はメートル。area: 'square' は広場の南、'palace' は天安門をくぐった先から始まる。
 */
(function (App) {
  'use strict';

  const BUKEQI = { zh: '不客气。', py: 'Bú kèqi.', ja: 'どういたしまして' };

  /* ---------- 広場と故宮にいる人たち ---------- */
  const PEOPLE = [
    // ---- 天安門広場 ----
    {
      id: 'kite', name: '凧あげのおじいさん', emoji: '🪁',
      look: { top: '#E8DCC8', bottom: '#3E3A36', hair: '#D8D8D8', cap: '#5B6B7B' },
      stand: { x: -14, z: 52, rot: Math.PI * 0.25 },
      script: [
        { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつしよう', options: ['nihao', 'zaijian', 'maidan'], answer: 0 },
        { type: 'understand', zh: '今天风很大，放风筝正好！', py: 'Jīntiān fēng hěn dà, fàng fēngzheng zhènghǎo!', ja: '今日は風が強いから、凧あげにぴったりだ！',
          q: '今日の天気は？', options: ['風が強い', '雨が降っている', 'とても暑い'], answer: 0, hint: '「风（fēng）」＝風、「大」＝強い' },
        { type: 'say', hamster: '「すごい！」と言おう', options: [{ zh: '真厉害！', py: 'Zhēn lìhai!', ja: 'すごい！' }, 'buyao', 'wei'], answer: 0 },
      ],
    },
    {
      id: 'flagkid', name: '小さな旗を持った男の子', emoji: '🚩',
      look: { top: '#C0392B', bottom: '#2F6FA8', hair: '#2B2220', scale: 0.6 },
      stand: { x: 9, z: 44, rot: -Math.PI / 2 },
      script: [
        { type: 'understand', zh: '我从上海来的！你呢？', py: 'Wǒ cóng Shànghǎi lái de! Nǐ ne?', ja: 'ぼく上海から来たんだ！きみは？',
          q: 'この子はどこから来た？', options: ['上海', '北京', '東京'], answer: 0 },
        { type: 'say', hamster: '「日本人です」と答えよう', options: ['ribenren', 'xuesheng', 'tingbudong'], answer: 0 },
        { type: 'line', zh: '哇！欢迎来北京！', py: 'Wā! Huānyíng lái Běijīng!', ja: 'わあ！北京へようこそ！' },
      ],
    },
    {
      id: 'selfie', name: '自撮り中のカップル', emoji: '🤳',
      look: { top: '#FF9EAA', bottom: '#F4EFE6', hair: '#3B2A20', hairStyle: 'long', camera: true },
      stand: { x: -6, z: 30, rot: Math.PI / 2 },
      script: [
        { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつしよう', options: ['nihao', 'maidan', 'yuanma'], answer: 0 },
        { type: 'understand', zh: '我们在拍照。天安门太漂亮了！', py: 'Wǒmen zài pāizhào. Tiān’ānmén tài piàoliang le!', ja: '写真を撮ってるの。天安門、すっごくきれい！',
          q: '何をしている？', options: ['写真を撮っている', 'ごはんを食べている', '道に迷っている'], answer: 0, hint: '「在＋動詞」＝〜しているところ（文法で習ったね）' },
        { type: 'say', hamster: '同じ気持ち！', options: ['taimei', 'taigui', 'haolei'], answer: 0 },
      ],
    },
    {
      id: 'tourgroup', name: '団体旅行のおばさん', emoji: '🧢',
      look: { top: '#F5B92E', bottom: '#4A5560', hair: '#3B2A20', cap: '#F5B92E', bag: '#C0392B' },
      path: [[-10, 60], [-10, 22], [10, 22], [10, 60]],
      script: [
        { type: 'understand', zh: '不好意思，厕所在哪里？', py: 'Bù hǎoyìsi, cèsuǒ zài nǎlǐ?', ja: 'すみません、トイレはどこ？',
          q: '何を聞かれた？', options: ['トイレの場所', '今の時間', '地下鉄の駅'], answer: 0 },
        { type: 'say', hamster: 'わからないね…正直に「わかりません」', options: [{ zh: '我不知道。', py: 'Wǒ bù zhīdào.', ja: 'わかりません' }, 'haode', 'taimei'], answer: 0 },
        { type: 'line', zh: '没关系，谢谢！', py: 'Méi guānxi, xièxie!', ja: '大丈夫、ありがとう！' },
      ],
    },
    {
      id: 'police', name: 'おまわりさん', emoji: '👮',
      look: { top: '#2F4A6B', bottom: '#1E2A3A', hair: '#1E1A18', cap: '#2F4A6B' },
      stand: { x: 6, z: 16, rot: Math.PI },
      script: [
        { type: 'say', zh: '你好。', py: 'Nǐ hǎo.', ja: 'こんにちは。', hamster: 'ていねいにあいさつ', options: ['ninhao', 'zaijian', 'jiayou'], answer: 0 },
        { type: 'line', zh: '注意安全，玩得开心。', py: 'Zhùyì ānquán, wán de kāixīn.', ja: '気をつけて、楽しんでね。', hamster: 'あいさつだけでも、ちょっとうれしいね' },
      ],
    },
    {
      id: 'sweeper', name: '掃除のおじさん', emoji: '🧹',
      look: { top: '#E67E22', bottom: '#4A5560', hair: '#3B2A20', cap: '#E67E22', mop: true },
      path: [[14, 34], [14, 58], [20, 58], [20, 34]],
      script: [
        { type: 'line', zh: '早上好！今天人真多啊。', py: 'Zǎoshang hǎo! Jīntiān rén zhēn duō a.', ja: 'おはよう！今日は人が多いねえ。' },
        { type: 'say', hamster: '朝のあいさつを返そう', options: ['zaoshang', 'wanan', 'wanshang'], answer: 0 },
      ],
    },
    // ---- 故宮 ----
    {
      id: 'palacekid', name: '故宮に来た女の子', emoji: '👧',
      look: { top: '#E86F9A', bottom: '#F4EFE6', hair: '#2B2220', hairStyle: 'long', scale: 0.6 },
      stand: { x: -8, z: -40, rot: Math.PI / 2 },
      script: [
        { type: 'understand', zh: '妈妈说，以前皇帝住在这里！', py: 'Māma shuō, yǐqián huángdì zhù zài zhèlǐ!', ja: 'ママが言ってた、昔は皇帝がここに住んでたんだって！',
          q: '昔ここに住んでいたのは？', options: ['皇帝', 'パンダ', 'お坊さん'], answer: 0, hint: '「皇帝（huángdì）」＝皇帝' },
        { type: 'say', hamster: '「本当？」と聞いてみよう', options: ['zhendema', 'meiwenti', 'shoudao'], answer: 0 },
        { type: 'line', zh: '真的！房间有很多很多！', py: 'Zhēn de! Fángjiān yǒu hěn duō hěn duō!', ja: '本当！お部屋がすっごくたくさんあるの！', hamster: '故宮の部屋は約 9000 もあるんだ！' },
      ],
    },
    {
      id: 'artist', name: 'スケッチする学生', emoji: '🎨',
      look: { top: '#2BB5A0', bottom: '#2F3740', hair: '#1E1A18', backpack: '#8E5BB8' },
      stand: { x: 11, z: -30, rot: -Math.PI * 0.6 },
      script: [
        { type: 'say', zh: '你好！你也喜欢故宫吗？', py: 'Nǐ hǎo! Nǐ yě xǐhuan Gùgōng ma?', ja: 'こんにちは！あなたも故宮が好き？',
          hamster: '「はい」と答えよう', options: ['shide', 'buyao', 'tabuqu'], answer: 0 },
        { type: 'understand', zh: '我每个星期都来画画。', py: 'Wǒ měi ge xīngqī dōu lái huà huà.', ja: '毎週ここに絵を描きに来てるの。',
          q: 'どのくらい来ている？', options: ['毎週', '毎年', '初めて'], answer: 0, hint: '「星期」＝週（曜日の「星期一」と同じ！）' },
        { type: 'say', hamster: '「すごい！がんばって」', options: ['jiayou', 'maidan', 'cesuo'], answer: 0 },
      ],
    },
    {
      id: 'foreigner', name: 'チケットを探す旅行者', emoji: '🧳',
      look: { top: '#5B6BB8', bottom: '#4A5560', hair: '#D9A441', backpack: '#2F6FA8' },
      stand: { x: -3.5, z: -9, rot: Math.PI },
      script: [
        { type: 'understand', zh: '请问，售票处在哪里？', py: 'Qǐngwèn, shòupiàochù zài nǎlǐ?', ja: 'すみません、チケット売り場はどこですか？',
          q: '何を聞かれた？', options: ['チケット売り場の場所', 'トイレの場所', '出口の場所'], answer: 0, hint: '「售票处」は看板にも書いてあるよ' },
        { type: 'say', hamster: '左にあったね！「あっちです」', options: ['zainabian', 'henjin', 'tingche'], answer: 0 },
        { type: 'say', zh: '谢谢！', py: 'Xièxie!', ja: 'ありがとう！', hamster: '「どういたしまして」', options: [BUKEQI, 'xiexie', 'duibuqi'], answer: 0 },
      ],
    },
    {
      id: 'elder', name: '太極拳のおばあちゃん', emoji: '🧘',
      look: { top: '#FFFFFF', bottom: '#FFFFFF', hair: '#D9D9D9', hairStyle: 'bun' },
      stand: { x: 13, z: -50, rot: -Math.PI / 2 },
      script: [
        { type: 'line', zh: '慢慢来，慢慢来……', py: 'Mànmàn lái, mànmàn lái……', ja: 'ゆっくり、ゆっくり……', hamster: '太極拳をしてる。ゆったりした動き…' },
        { type: 'say', hamster: 'じゃましないように、そっと「さようなら」', options: ['zaijian', 'jiayou', 'wei'], answer: 0 },
      ],
    },
  ];

  function buildCapital(THREE, scene, area) {
    const Md = App.Models3D;
    const colliders = [];
    const readables = [];
    const rect = (minX, maxX, minZ, maxZ) => { const c = { minX, maxX, minZ, maxZ }; colliders.push(c); return c; };
    const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, o));
    const box = (w, h, d, mat, x, y, z, { collide = false, parent = scene, rotY = 0 } = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      parent.add(m);
      if (collide) rect(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
      return m;
    };
    const cyl = (rt, rb, h, mat, x, y, z, seg = 14, parent = scene) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const sph = (r, mat, x, y, z) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
      m.position.set(x, y, z);
      scene.add(m);
      return m;
    };
    const plane = (w, h, mat, x, y, z, rotX = 0, rotY = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, y, z);
      m.rotation.set(rotX, rotY, 0);
      scene.add(m);
      return m;
    };
    const tex = (w, h, draw, repeat) => {
      const t = Md.canvasTexture(THREE, w, h, draw);
      if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
      return t;
    };
    // 寄棟屋根（四角すい）
    // （回してから外側のグループで伸ばすと、ゆがまずに長方形の屋根になる）
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
    const signRead = (id, opts, width, x, y, z, rotY = 0, extra) => readables.push(Md.readable(Md.sign(THREE, scene, opts, width, x, y, z, rotY, extra), id));

    /* ---------- 空・光（よく晴れた北京） ---------- */
    scene.background = new THREE.Color('#C9E4F5');
    scene.fog = new THREE.Fog('#C9E4F5', 90, 230);
    App.Scenery3D.sky(THREE, scene, { top: '#3F8FDA', horizon: '#C9E4F5', ground: '#D8D0C0', sun: [-0.5, 0.45, 0.6] });
    App.Scenery3D.farMountains(THREE, scene, { r: 300, colors: ['#9DB6C0', '#BACFD8'], height: [18, 45] });
    App.Scenery3D.clouds(THREE, scene, { count: 14, seed: 5 });
    scene.add(new THREE.HemisphereLight(0xf2f8ff, 0x8a7f6a, 0.8));
    const sun = new THREE.DirectionalLight(0xfff1d6, 0.7);
    sun.position.set(-30, 50, 30);
    scene.add(sun);

    const red = M('#A8322A');
    const redDark = M('#7E2620');
    const gold = M('#E8B12E', { roughness: 0.6 });
    const marble = M('#F1EEE6', { roughness: 0.6 });
    const stone = M('#B7B2A8');
    const dark = M('#2A2420');
    const green = M('#5E8F4E');
    // 黄色い瑠璃瓦（たてのすじ＝瓦の列）
    const roofGold = new THREE.MeshStandardMaterial({ map: tex(256, 64, (g, w, h) => {
      for (let x = 0; x < w; x += 8) {
        g.fillStyle = (x / 8) % 2 ? '#E9B02A' : '#F6C83F'; g.fillRect(x, 0, 8, h);
        g.fillStyle = 'rgba(120,70,0,.35)'; g.fillRect(x + 7, 0, 1, h);
      }
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, w, 6);
    }, [10, 1]), roughness: 0.45, metalness: 0.15 });
    // 天安門の赤い壁（下はすこし暗い帯、上にうすい影）
    const redWall = new THREE.MeshStandardMaterial({ map: tex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#9A2C25'); gr.addColorStop(0.15, '#B23A30'); gr.addColorStop(1, '#A8322A');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(80,10,5,${Math.random() * 0.08})`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 20 + Math.random() * 60); }
      g.fillStyle = '#8A8478'; g.fillRect(0, h - 22, w, 22);
      g.fillStyle = '#A9A397'; g.fillRect(0, h - 22, w, 4);
    }), roughness: 0.8 });
    // 軒下の彩色（青・緑・金のもよう）
    const eaveTex = new THREE.MeshStandardMaterial({ map: tex(256, 32, (g, w, h) => {
      g.fillStyle = '#245F73'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 32) {
        g.fillStyle = '#3E8C6A'; g.fillRect(x + 4, 6, 24, 20);
        g.fillStyle = '#E8B12E'; g.fillRect(x + 14, 2, 4, h - 4);
        g.fillStyle = '#F2EADB'; g.fillRect(x, 0, 2, h);
      }
    }, [12, 1]), roughness: 0.7 });

    /* ---------- 地面 ---------- */
    const tileTex = tex(256, 256, (g, w, h) => {
      const tones = ['#C4BCAC', '#BCB4A3', '#C9C2B3', '#B6AE9D'];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        g.fillStyle = tones[(r * 3 + c * 2) % 4]; g.fillRect(c * 64, r * 64, 64, 64);
        for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(90,80,60,${Math.random() * 0.12})`; g.fillRect(c * 64 + Math.random() * 64, r * 64 + Math.random() * 64, 2, 2); }
      }
      g.strokeStyle = '#9E9686'; g.lineWidth = 2;
      for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(0, k * 64); g.lineTo(w, k * 64); g.stroke(); g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64, h); g.stroke(); }
    }, [40, 80]);
    plane(160, 320, new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.95 }), 0, 0, -10, -Math.PI / 2);

    /* ======================= 天安門広場 ======================= */
    // 境界（さく・植え込み）
    [-1, 1].forEach((s) => {
      box(1.2, 0.7, 62, green, s * 31, 0.35, 42, { collide: true });
      for (let z = 14; z <= 70; z += 8) sph(0.8, M('#6DB86A'), s * 31, 1.1, z);
    });
    box(64, 0.7, 1.2, green, 0, 0.35, 73, { collide: true });
    // 人民英雄紀念碑
    box(9, 1, 9, marble, 0, 0.5, 40, { collide: true });
    box(6.5, 1.2, 6.5, marble, 0, 1.6, 40);
    box(2.6, 18, 1.8, M('#D9D4C8'), 0, 11.2, 40);
    roof(3.2, 1.6, 2.4, M('#C8C2B4'), 0, 20.2, 40);
    signRead('monument', { zh: '人民英雄纪念碑', en: 'Monument to the People’s Heroes', bg: '#6B6458', accent: '#E0C068', sub: '#EEE' }, 4.2, 0, 3.4, 44.7, 0);
    // 国旗の柱（旗は国旗を描かず、赤い旗としてゆらす）
    box(4, 0.6, 4, marble, 0, 0.3, 16, { collide: true });
    cyl(0.12, 0.16, 26, M('#D8D8D8', { metalness: 0.5, roughness: 0.3 }), 0, 13, 16, 10);
    const flagGeo = new THREE.PlaneGeometry(4.8, 3.2, 12, 6);
    const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({ color: '#D7261E', side: THREE.DoubleSide, roughness: 0.8 }));
    flag.position.set(2.4, 24, 16);
    scene.add(flag);
    const flagBase = flagGeo.attributes.position.array.slice();
    // 街灯
    for (let z = 22; z <= 68; z += 12) [-20, 20].forEach((x) => {
      cyl(0.1, 0.14, 7, dark, x, 3.5, z, 8);
      [-0.7, 0, 0.7].forEach((dx) => sph(0.28, new THREE.MeshBasicMaterial({ color: '#FFF4D6' }), x + dx, 7.1, z));
      rect(x - 0.3, x + 0.3, z - 0.3, z + 0.3);
    });
    // 両側の大きな建物（遠景）
    [-1, 1].forEach((s) => {
      box(14, 16, 70, M('#E8DCC4'), s * 50, 8, 40);
      for (let z = 10; z <= 70; z += 4) cyl(0.6, 0.6, 14, M('#F2EADB'), s * 42.6, 7, z, 10);
      box(16, 1.2, 72, M('#C9B79A'), s * 50, 16.6, 40);
    });
    // 花壇（赤・黄・ピンクの花がぎっしり）
    {
      const beds = [[-16, 28], [16, 28], [-16, 56], [16, 56]];
      const flowerGeo = new THREE.SphereGeometry(0.26, 8, 6);
      const colors = ['#E74C3C', '#F5B92E', '#E86F9A', '#FF8A3D', '#FFFFFF'];
      const flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), beds.length * 66);
      const m4 = new THREE.Matrix4();
      const c = new THREE.Color();
      let n = 0;
      beds.forEach(([x, z]) => {
        box(10, 0.6, 5, stone, x, 0.3, z, { collide: true });
        box(9.4, 0.12, 4.4, M('#4E7A3A'), x, 0.62, z);
        for (let r = 0; r < 6; r++) for (let k = 0; k < 11; k++) {
          m4.makeTranslation(x - 4.2 + k * 0.84 + (r % 2) * 0.3, 0.82 + Math.random() * 0.1, z - 1.8 + r * 0.72);
          flowers.setMatrixAt(n, m4);
          flowers.setColorAt(n++, c.set(colors[(r + Math.floor(k / 3)) % colors.length]));
        }
      });
      flowers.instanceMatrix.needsUpdate = true;
      if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
      scene.add(flowers);
    }
    // 両わきの松の並木
    {
      const pts = [];
      [-1, 1].forEach((sd) => {
        for (let z = 15; z <= 70; z += 4.5) {
          pts.push({ x: sd * 27.5, y: 0, z, s: 1.25, kind: 'pine' });
          rect(sd * 27.5 - 0.5, sd * 27.5 + 0.5, z - 0.5, z + 0.5);
        }
      });
      App.Scenery3D.forest(THREE, scene, pts);
    }
    // 華表（白い大理石の柱）と石の獅子（天安門の前）
    [-1, 1].forEach((sd) => {
      const hx = sd * 16;
      box(2, 1, 2, marble, hx, 0.5, 13.6, { collide: true });
      cyl(0.42, 0.42, 9, marble, hx, 5.5, 13.6, 8);
      box(2.6, 0.55, 0.22, marble, hx, 8.2, 13.6);
      cyl(0.9, 0.9, 0.3, marble, hx, 10.1, 13.6, 12);
      sph(0.42, marble, hx, 10.6, 13.6);
      const lx = sd * 9;
      box(1.5, 1.2, 2.1, stone, lx, 0.6, 12.9, { collide: true });
      box(0.9, 1.1, 1.5, M('#CFC8BA'), lx, 1.75, 12.8);
      sph(0.55, M('#CFC8BA'), lx, 2.55, 13.3);
      sph(0.3, M('#BEB6A6'), lx + sd * 0.35, 1.5, 13.6);
    });

    /* ---------- 金水橋と堀 ---------- */
    const moatTex = tex(256, 64, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#4A8DBA'); gr.addColorStop(1, '#6FB3D8');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const x = Math.random() * w; const y = Math.random() * h;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 3, x + 16, y); g.stroke();
      }
    }, [8, 1]);
    const moat = plane(64, 4, new THREE.MeshStandardMaterial({ map: moatTex, roughness: 0.2, metalness: 0.15 }), 0, 0.05, 9, -Math.PI / 2);
    const bridges = [[-12, 3], [-6, 3], [0, 5], [6, 3], [12, 3]];
    bridges.forEach(([x, w]) => {
      box(w, 0.4, 4.6, marble, x, 0.25, 9);
      [-1, 1].forEach((e) => {
        box(0.2, 0.8, 4.6, marble, x + e * (w / 2 - 0.1), 0.85, 9);
        for (let k = -2; k <= 2; k++) box(0.3, 0.3, 0.3, marble, x + e * (w / 2 - 0.1), 1.4, 9 + k);
      });
    });
    // 堀は橋以外通れない
    let prev = -32;
    bridges.forEach(([x, w]) => { rect(prev, x - w / 2 + 0.25, 6.8, 11.2); prev = x + w / 2 - 0.25; });
    rect(prev, 32, 6.8, 11.2);
    signRead('jinshuiqiao', { zh: '金水桥', en: 'Golden Water Bridges', bg: '#6B6458', accent: '#E0C068', sub: '#EEE', w: 768, h: 256 }, 2.4, -9, 1.6, 11.6, 0);

    /* ---------- 天安門 ---------- */
    const GZ = 2;   // 城壁の中心
    box(29, 12, 10, redWall, -16.5, 6, GZ, { collide: true });
    box(29, 12, 10, redWall, 16.5, 6, GZ, { collide: true });
    box(4, 4, 10, redWall, 0, 10, GZ);
    // 通路の扉（広場で写真を撮ると開く）
    const gateCollider = rect(-2.1, 2.1, GZ + 4.4, GZ + 5.2);
    const doors = [-1, 1].map((s) => {
      const hinge = new THREE.Group();
      hinge.position.set(s * 2, 0, GZ + 4.9);
      box(2, 7.6, 0.25, redDark, -s * 1, 3.8, 0, { parent: hinge });
      for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), gold);
        stud.position.set(-s * (0.4 + c * 0.6), 1 + r * 1.1, 0.14);
        hinge.add(stud);
      }
      scene.add(hinge);
      return { hinge, s };
    });
    // ほかの 4 つのアーチ（飾り）
    [-12, -6, 6, 12].forEach((x) => plane(3, 6, new THREE.MeshBasicMaterial({ color: '#3A1A16' }), x, 3, GZ + 5.02));
    // 城楼（上の建物）
    box(60, 0.6, 10, marble, 0, 12.3, GZ);
    for (let x = -29; x <= 29; x += 2) box(0.25, 0.9, 0.25, marble, x, 13, GZ + 4.8);
    box(40, 6, 7, red, 0, 15.6, GZ - 0.5);
    for (let x = -19; x <= 19; x += 3.8) cyl(0.35, 0.35, 6, M('#C0392B'), x, 15.6, GZ + 3.2, 10);
    roof(48, 3.2, 14, roofGold, 0, 18.4, GZ);
    roof(42, 4.6, 11, roofGold, 0, 20.8, GZ);
    box(46, 0.5, 13, gold, 0, 18.5, GZ);
    box(40.6, 0.9, 7.6, eaveTex, 0, 18.1, GZ - 0.5);
    box(34.6, 0.7, 7, eaveTex, 0, 21.1, GZ);
    // 大きな赤い提灯（柱と柱のあいだに 8 つ）
    [-17.1, -13.3, -9.5, -5.7, 5.7, 9.5, 13.3, 17.1].forEach((x) => {
      cyl(0.02, 0.02, 0.8, dark, x, 17.6, GZ + 3.6, 4);
      const l = sph(0.75, new THREE.MeshStandardMaterial({ color: '#E0302A', emissive: '#7A1008', roughness: 0.5 }), x, 16.6, GZ + 3.6);
      l.scale.set(1, 1.15, 1);
      cyl(0.42, 0.42, 0.18, gold, x, 17.45, GZ + 3.6, 12);
      cyl(0.42, 0.42, 0.18, gold, x, 15.75, GZ + 3.6, 12);
      cyl(0.05, 0.05, 0.6, M('#F5C842'), x, 15.35, GZ + 3.6, 6);
    });
    signRead('tiananmen', { zh: '天安门', en: 'Tiananmen', bg: '#2A3A6B', accent: '#E0C068', sub: '#E8E8F0' }, 5.2, 0, 16.5, GZ + 3.6, 0);
    const guard = Md.staff(THREE, { uniform: '#2F4A6B', scarf: '#C0392B' });
    guard.position.set(3.5, 0, 13.2);
    guard.rotation.y = Math.PI;
    scene.add(guard);

    /* ======================= 故宮 ======================= */
    // 入口の広場（天安門の北）
    const wallMat = M('#9E2F27');
    [-1, 1].forEach((s) => {
      box(1.6, 8, 100, wallMat, s * 30, 4, -50, { collide: true });
      box(2.4, 0.8, 100, gold, s * 30, 8.4, -50);
    });
    box(62, 8, 1.6, wallMat, 0, 4, -100, { collide: true });
    signRead('palaceMuseum', { zh: '故宫博物院', en: 'The Palace Museum', bg: '#2A3A6B', accent: '#E0C068', sub: '#E8E8F0' }, 4.8, 0, 6.8, -4.5, Math.PI);
    signRead('palaceMuseum', { zh: '故宫博物院', en: 'The Palace Museum', bg: '#2A3A6B', accent: '#E0C068', sub: '#E8E8F0' }, 4.8, 0, 6.8, GZ - 5.2, Math.PI);
    // 售票处（左）
    box(5, 3.2, 3, M('#C9B79A'), -9.5, 1.6, -12, { collide: true });
    box(5.6, 0.4, 3.6, gold, -9.5, 3.4, -12);
    const seller = Md.staff(THREE, { uniform: '#5A2E2E', scarf: '#E0A526' });
    seller.position.set(-9.5, 0, -10.2);
    scene.add(seller);
    signRead('ticketOffice', { zh: '售票处', en: 'Tickets ¥60', bg: '#5A2E2E', accent: '#E0C068', sub: '#F3E2C0', w: 768, h: 256 }, 2.4, -9.5, 3.6, -10.4, 0);
    // 検票口（チケットを買うと開く）
    box(27.5, 1.1, 0.5, M('#8A8F96', { metalness: 0.5 }), -15.75, 0.55, -16, { collide: true });
    box(27.5, 1.1, 0.5, M('#8A8F96', { metalness: 0.5 }), 15.75, 0.55, -16, { collide: true });
    const turnstile = box(4, 1.0, 0.25, M('#E0A526', { metalness: 0.3 }), 0, 0.6, -16);
    const ticketCollider = rect(-2, 2, -16.3, -15.7);
    signRead('ticketCheck', { zh: '检票口', en: 'Ticket Check', bg: '#2F6B4A', accent: '#E0C068', sub: '#E8F4EC', w: 768, h: 256 }, 2.2, 0, 2.6, -15.6, Math.PI);
    // 中庭：石畳の道・銅の獅子・香炉
    plane(8, 64, M('#E4DED2'), 0, 0.02, -52, -Math.PI / 2);
    [-1, 1].forEach((s) => {
      box(1.6, 1.2, 1.6, marble, s * 6, 0.6, -56, { collide: true });
      const lion = sph(0.7, M('#7A5A2A', { metalness: 0.5, roughness: 0.4 }), s * 6, 1.8, -56);
      lion.scale.set(0.8, 1.1, 1);
      sph(0.45, M('#7A5A2A', { metalness: 0.5, roughness: 0.4 }), s * 6, 2.6, -55.7);
      cyl(0.6, 0.45, 1.2, M('#6B5A3A', { metalness: 0.5 }), s * 11, 1.0, -58, 12);
      [-1, 1].forEach((e) => cyl(0.06, 0.06, 0.5, M('#6B5A3A'), s * 11 + e * 0.35, 1.8, -58, 6));
      rect(s * 11 - 0.7, s * 11 + 0.7, -58.7, -57.3);
    });
    // 太和殿（三段の白い基壇の上）
    const HZ = -72;
    [[44, 1.5, 24], [40, 1.5, 21], [36, 1.5, 18]].forEach(([w, h, d], k) => {
      box(w, h, d, marble, 0, h / 2 + k * 1.5, HZ);
      for (let x = -w / 2; x <= w / 2; x += 1.6) box(0.2, 0.7, 0.2, marble, x, (k + 1) * 1.5 + 0.35, HZ + d / 2 - 0.1);
    });
    box(6, 4.5, 6, M('#E8E2D4'), 0, 2.25, HZ + 13.5);
    rect(-22, 22, HZ - 12, HZ + 12);
    rect(-3, 3, HZ + 12, HZ + 16.5);
    box(34, 8, 12, red, 0, 8.5, HZ - 1);
    for (let x = -16; x <= 16; x += 3.2) cyl(0.4, 0.4, 8, M('#C0392B'), x, 8.5, HZ + 5.6, 10);
    roof(42, 3.4, 18, roofGold, 0, 12.5, HZ - 1);
    roof(36, 5, 14, roofGold, 0, 15.2, HZ - 1);
    box(40, 0.5, 16, gold, 0, 12.6, HZ - 1);
    signRead('taihedian', { zh: '太和殿', en: 'Hall of Supreme Harmony', bg: '#2A3A6B', accent: '#E0C068', sub: '#E8E8F0' }, 4, 0, 11.4, HZ + 5.1, 0);
    const palaceGuide = Md.staff(THREE, { uniform: '#24476B', scarf: '#E0A526' });
    palaceGuide.position.set(3.2, 0, -50);
    palaceGuide.rotation.y = Math.PI;
    scene.add(palaceGuide);
    // 案内人さん（広場）
    const squareGuide = Md.person(THREE, { top: '#2BB5A0', bottom: '#2F3740', hair: '#1E1A18', cap: '#F5B92E', bag: '#F5B92E' });
    squareGuide.position.set(-3.2, 0, 14.5);
    squareGuide.rotation.y = 0;
    scene.add(squareGuide);
    const guideFlag = new THREE.Group();
    cyl(0.03, 0.03, 1.6, dark, 0, 0.8, 0, 6, guideFlag);
    box(0.6, 0.4, 0.02, M('#F5B92E'), 0.3, 1.5, 0, { parent: guideFlag });
    guideFlag.position.set(-2.8, 0.9, 14.5);
    scene.add(guideFlag);

    /* ======================= キャラクター ======================= */
    const gate = { collider: gateCollider, open: false };
    const ticket = { collider: ticketCollider, open: false };
    const hamster = Md.hamster(THREE);
    const spawn = area === 'palace' ? { x: 0, z: -6, yaw: 0 } : { x: 0, z: 66, yaw: 0 };
    hamster.position.set(spawn.x + 1.4, 0, spawn.z - 1.6);
    scene.add(hamster);
    const people = App.World3D.spawnPeople(THREE, scene, PEOPLE);

    return {
      colliders,
      readables,
      bounds: null,
      spawn,
      hamster,
      people,
      gate,
      ticket,
      interactables: [
        { id: 'guide', x: -3.2, z: 16.2, r: 2.6 },
        { id: 'gate', x: 0, z: 12.6, r: 2.4 },
        { id: 'ticket', x: -9.5, z: -8.8, r: 2.6 },
        { id: 'check', x: 0, z: -14.2, r: 2.2 },
        { id: 'palaceGuide', x: 3.2, z: -48.4, r: 2.6 },
      ],
      tags: [
        { obj: squareGuide, y: 2.2, text: '🚩 案内人さん', maxDist: 22 },
        { obj: seller, y: 2.35, text: '🎫 售票处', maxDist: 16 },
        { obj: palaceGuide, y: 2.35, text: '🧑‍🏫 故宮のガイドさん', maxDist: 18 },
      ],
      facePlayer: [guard, seller, palaceGuide],
      cultures: [{ id: 'shizi', x: -6, z: -56, r: 3.2 }, { id: 'shizi', x: 6, z: -56, r: 3.2 }, { id: 'taihedian', x: 0, z: -61, r: 6 }],
      discoveries: [
        { id: 'monument', x: 0, z: 46, r: 4, culture: 'monument', say: '<b>人民英雄纪念碑</b>（人民英雄記念碑）。<br>広場のまんなかに立つ大きな記念碑だよ' },
        { id: 'flag', x: 0, z: 20, r: 4, culture: 'tiananmen', say: '毎朝、日の出と一緒にここで旗をあげる式があるんだって' },
        { id: 'bridge', x: 0, z: 12, r: 3, culture: 'jinshuiqiao', say: '<b>金水桥</b>。橋は 5 本あって、昔はまんなかの橋は皇帝しか渡れなかったんだ' },
        { id: 'lion', x: 0, z: -56, r: 4, say: '銅の<b>狮子</b>（獅子）！門を守る守り神だよ' },
        { id: 'roof', x: 0, z: -44, r: 3.5, culture: 'gugong', say: '黄色い屋根は皇帝の色。故宮の部屋は約 9000！' },
      ],
      zones: [{ id: 'hall', x1: -16, x2: 16, z1: -60, z2: -52 }],
      update(dt, t) {
        // 旗をゆらす
        const pos = flagGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = flagBase[i * 3];
          pos.array[i * 3 + 2] = Math.sin(x * 1.4 - t * 4) * 0.25 * ((x + 2.4) / 4.8);
        }
        pos.needsUpdate = true;
        moat.material.map.offset.x = t * 0.03;
        doors.forEach(({ hinge, s }) => {
          const target = gate.open ? -s * 1.6 : 0;
          hinge.rotation.y += (target - hinge.rotation.y) * Math.min(1, dt * 2);
        });
        if (ticket.open) turnstile.rotation.y = Math.min(Math.PI / 2, turnstile.rotation.y + dt * 2);
      },
    };
  }

  App.World3D = App.World3D || {};
  App.World3D.buildCapital = buildCapital;
})(window.App = window.App || {});
