/* 3D 空港のレイアウト
 * 単位はメートル。ホールは x: -18〜18, z: -28〜28, 高さ 9。
 * 入口(手前 z=+28) → 黄色いガイドライン → チェックインカウンター(奥 z≈-19)
 * 返り値の colliders は当たり判定（XZ 平面の矩形）、points はイベント地点
 */
(function (App) {
  'use strict';

  const W = 36, D = 56, H = 9;
  const HX = W / 2, HZ = D / 2;

  /* ---------- 空港にいる人たちと会話 ----------
   * 配置: sit（ベンチに座る）/ stand（立ち止まる）/ path（ルートを歩き回る）
   * script の書式（js/world3d/engine.js の runTalk が実行する）:
   *   { type: 'line', zh, py, ja, hamster?, next? }                 相手のセリフ
   *   { type: 'understand', zh, py, ja, q, options: [...], answer, hint? }  聞き取り
   *   { type: 'say', zh?, py?, ja?, hamster, options: [{zh,py,ja}|'phraseId'], answer }  返事を選ぶ
   */
  const BUKEQI = { zh: '不客气。', py: 'Bú kèqi.', ja: 'どういたしまして' };
  const JIUDIAN = { zh: '我去酒店。', py: 'Wǒ qù jiǔdiàn.', ja: 'ホテルへ行きます' };
  const DUIBUQI = { zh: '对不起。', py: 'Duìbuqǐ.', ja: 'ごめんなさい' };

  const PEOPLE = [
    {
      id: 'granny', name: '旅行者のおばあちゃん', emoji: '👵',
      look: { top: '#C0504D', bottom: '#5B4A3F', hair: '#D9D9D9', hairStyle: 'bun', bag: '#8A5A3C' },
      sit: { x: -11.5, z: 1.05, rot: 0 },
      script: [
        { type: 'understand', zh: '你好！你是日本人吗？', py: 'Nǐ hǎo! Nǐ shì Rìběn rén ma?', ja: 'こんにちは！あなたは日本人？',
          q: '何を聞かれた？', options: ['日本人かどうか', '名前', '行き先'], answer: 0, hint: '「日本人（Rìběn rén）」が聞こえたかな？' },
        { type: 'say', hamster: '「はい、日本人です」と答えよう',
          options: [{ zh: '是的，我是日本人。', py: 'Shì de, wǒ shì Rìběn rén.', ja: 'はい、日本人です' }, 'yaozhege', 'zaijian'], answer: 0 },
        { type: 'line', zh: '欢迎来中国！祝你玩得开心！', py: 'Huānyíng lái Zhōngguó! Zhù nǐ wán de kāixīn!', ja: '中国へようこそ！楽しんでね！' },
        { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', 'nihao', 'zaijian'], answer: 0 },
      ],
    },
    {
      id: 'biz', name: '出張中のお兄さん', emoji: '🧑‍💼',
      look: { top: '#3A4A5A', bottom: '#2B2B2B', hair: '#1E1A18', bag: '#6B4F3A' },
      path: [[3, 8], [3, -8], [-4.2, -8], [-4.2, 8]],
      script: [
        { type: 'understand', zh: '不好意思，洗手间在哪里？', py: 'Bù hǎoyìsi, xǐshǒujiān zài nǎlǐ?', ja: 'すみません、トイレはどこですか？',
          q: '何を聞かれた？', options: ['トイレの場所', '今の時間', '値段'], answer: 0, hint: '「洗手间」は左の壁の看板にも書いてあるよ' },
        { type: 'say', hamster: '左の壁の方にあったね。「あっちです」と教えてあげよう',
          options: [{ zh: '在那边。', py: 'Zài nàbiān.', ja: 'あっちです' }, 'duoshao', 'haochi'], answer: 0 },
        { type: 'line', zh: '太好了，谢谢！', py: 'Tài hǎo le, xièxie!', ja: 'よかった、ありがとう！' },
        { type: 'say', hamster: '「どういたしまして」は<b>不客气</b>だよ', options: [BUKEQI, 'xiexie', DUIBUQI], answer: 0 },
      ],
    },
    {
      id: 'kid', name: '飛行機好きの男の子', emoji: '👦',
      look: { top: '#F5B92E', bottom: '#2F6FA8', hair: '#2B2220', scale: 0.62, cap: '#E05A3A' },
      stand: { x: 15.8, z: -7, rot: Math.PI / 2 },
      script: [
        { type: 'understand', zh: '你看！飞机！好大啊！', py: 'Nǐ kàn! Fēijī! Hǎo dà a!', ja: '見て！飛行機！おっきい！',
          q: '何を見てって言ってる？', options: ['飛行機', '電車', 'ハムスター'], answer: 0 },
        { type: 'say', hamster: '「本当だ！」は<b>真的</b>だよ',
          options: [{ zh: '真的！好大！', py: 'Zhēn de! Hǎo dà!', ja: '本当だ！大きい！' }, 'ruzhu', 'maidan'], answer: 0 },
        { type: 'line', zh: '哇，仓鼠！好可爱！', py: 'Wā, cāngshǔ! Hǎo kě’ài!', ja: 'わあ、ハムスター！かわいい！', hamster: 'えへへ…照れるなあ🐹' },
        { type: 'say', hamster: 'バイバイしよう', options: ['zaijian', 'xiexie', 'nihao'], answer: 0 },
      ],
    },
    {
      id: 'student', name: 'バックパッカーの学生', emoji: '🎒',
      look: { top: '#2BB5A0', bottom: '#4A5560', hair: '#3B2A20', backpack: '#FF8A3D' },
      path: [[-2, 18.5], [-14, 18.5], [-14, -4], [-2, -4]],
      script: [
        { type: 'say', zh: '嗨！你好！', py: 'Hāi! Nǐ hǎo!', ja: 'やあ！こんにちは！', hamster: 'あいさつを返そう', options: ['nihao', 'zaijian', 'maidan'], answer: 0 },
        { type: 'understand', zh: '你去哪儿？', py: 'Nǐ qù nǎr?', ja: 'どこへ行くの？',
          q: '何を聞かれた？', options: ['どこへ行くか', '何を食べたか', '何歳か'], answer: 0, hint: '「去（qù）」は「行く」だよ' },
        { type: 'say', hamster: '「ホテルへ行きます」は<b>我去酒店</b>', options: [JIUDIAN, 'haochi', DUIBUQI], answer: 0 },
        { type: 'line', zh: '一路平安！拜拜！', py: 'Yílù píng’ān! Báibái!', ja: '気をつけてね！バイバイ！' },
      ],
    },
    {
      id: 'cleaner', name: '清掃員さん', emoji: '🧹',
      look: { top: '#7FB27F', bottom: '#4F6B4F', hair: '#2B2220', cap: '#7FB27F', mop: true },
      stand: { x: 4.6, z: -9.4, rot: -Math.PI / 2 },
      script: [
        { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつを返そう', options: ['nihao', 'maidan', 'duoshao'], answer: 0 },
        { type: 'understand', zh: '小心，地很滑。', py: 'Xiǎoxīn, dì hěn huá.', ja: '気をつけて、床がすべるよ。',
          q: 'なんて言われた？', options: ['床がすべるから気をつけて', 'ここは禁煙です', 'もうすぐ出発です'], answer: 0, hint: '「小心」＝気をつけて' },
        { type: 'say', hamster: '教えてくれてありがとう、と伝えよう', options: ['xiexie', 'zaijian', BUKEQI], answer: 0 },
      ],
    },
    {
      id: 'photo', name: '写真を撮りたいカップル', emoji: '📸',
      look: { top: '#FF9EAA', bottom: '#F4EFE6', hair: '#3B2A20', hairStyle: 'long', camera: true },
      stand: { x: 8.6, z: 12, rot: -Math.PI / 2 },
      script: [
        { type: 'understand', zh: '你好！可以帮我们拍照吗？', py: 'Nǐ hǎo! Kěyǐ bāng wǒmen pāizhào ma?', ja: 'こんにちは！写真を撮ってもらえますか？',
          q: '何をお願いされた？', options: ['写真を撮ってほしい', '道を教えてほしい', '荷物を持ってほしい'], answer: 0, hint: '「拍照（pāizhào）」は写真を撮ること' },
        { type: 'say', hamster: 'OK してあげよう', options: ['haode', { zh: '不是。', py: 'Bú shì.', ja: '違います' }, 'maidan'], answer: 0 },
        { type: 'understand', zh: '好，一、二、三——茄子！', py: 'Hǎo, yī, èr, sān — qiézi!', ja: 'はい、1、2、3——チーズ！',
          q: 'いくつまで数えた？', options: ['3まで', '5まで', '10まで'], answer: 0, hint: '「茄子（なす）」が中国の「はいチーズ」なんだって！' },
        { type: 'line', zh: '谢谢你！拍得真好！', py: 'Xièxie nǐ! Pāi de zhēn hǎo!', ja: 'ありがとう！上手に撮れてる！' },
        { type: 'say', hamster: '「どういたしまして」！', options: [BUKEQI, 'nihao', 'zaijian'], answer: 0 },
      ],
    },
    {
      id: 'reader', name: '飛行機を待つおじさん', emoji: '👴',
      look: { top: '#8A6E4B', bottom: '#3E3A36', hair: '#BDBDBD' },
      sit: { x: 11, z: -2.45, rot: 0 },
      script: [
        { type: 'say', zh: '嗯？你好。', py: 'Ńg? Nǐ hǎo.', ja: 'ん？こんにちは。', hamster: 'あいさつしよう', options: ['nihao', 'maidan', 'duoshao'], answer: 0 },
        { type: 'understand', zh: '我的飞机晚点了……', py: 'Wǒ de fēijī wǎndiǎn le…', ja: 'わしの飛行機、遅れてるんだ……',
          q: 'おじさんはどうしたの？', options: ['飛行機が遅れている', 'お腹がすいた', '道に迷った'], answer: 0, hint: '「晚点」＝遅れる。出発ボードでも見かけるよ' },
        { type: 'say', hamster: '元気を出して！「さようなら」でお別れしよう', options: ['zaijian', 'haochi', 'xiexie'], answer: 0 },
      ],
    },
    {
      id: 'traveler', name: '旅行中のお姉さん', emoji: '👩',
      look: { top: '#5B6BB8', bottom: '#2F3740', hair: '#1E1A18', hairStyle: 'long', bag: '#F5B92E' },
      path: [[8, -12.5], [8, -4], [14.5, -4], [14.5, -12.5]],
      script: [
        { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつを返そう', options: ['nihao', 'xiexie', 'maidan'], answer: 0 },
        { type: 'understand', zh: '我要去东京。你呢？', py: 'Wǒ yào qù Dōngjīng. Nǐ ne?', ja: '私は東京に行くの。あなたは？',
          q: 'お姉さんはどこへ行く？', options: ['東京', '北京', '上海'], answer: 0, hint: '「东京（Dōngjīng）」＝東京' },
        { type: 'say', hamster: '「ホテルへ行きます」と答えよう', options: [JIUDIAN, 'haochi', DUIBUQI], answer: 0 },
        { type: 'line', zh: '好的！拜拜！', py: 'Hǎo de! Báibái!', ja: 'そっか！バイバイ！' },
      ],
    },
  ];

  function buildAirport(THREE, scene) {
    const Md = App.Models3D;
    const colliders = [];
    const readables = [];
    const read = (obj, id, extra) => readables.push(Md.readable(obj, id, extra));
    const rect = (minX, maxX, minZ, maxZ) => colliders.push({ minX, maxX, minZ, maxZ });
    const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0 }, o));

    const box = (w, h, d, mat, x, y, z, { collide = false, parent = scene, rotY = 0 } = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      parent.add(m);
      if (collide) rect(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
      return m;
    };
    const cyl = (rt, rb, h, mat, x, y, z, seg = 20, parent = scene) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const sph = (r, mat, x, y, z, parent = scene) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };

    /* ---------- 空・光 ---------- */
    scene.background = new THREE.Color('#BFE6FF');
    scene.fog = new THREE.Fog('#DCEEFB', 50, 140);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8ad9a, 0.68));
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    const sun = new THREE.DirectionalLight(0xfff4e0, 0.45);
    sun.position.set(30, 40, 10);
    scene.add(sun);

    /* ---------- 床 ---------- */
    const floorTex = Md.canvasTexture(THREE, 512, 512, (g, w, h) => {
      g.fillStyle = '#E2DACB';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#D6CDBC';
      g.fillRect(0, 0, w / 2, h / 2);
      g.fillRect(w / 2, h / 2, w / 2, h / 2);
      g.strokeStyle = '#D4CCBE';
      g.lineWidth = 3;
      for (let i = 0; i <= 2; i++) {
        g.beginPath(); g.moveTo((i * w) / 2, 0); g.lineTo((i * w) / 2, h); g.stroke();
        g.beginPath(); g.moveTo(0, (i * h) / 2); g.lineTo(w, (i * h) / 2); g.stroke();
      }
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(W / 4, D / 4);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.35, metalness: 0.05 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 外の地面（滑走路エリア）
    const tarmac = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), M('#A3A9AE'));
    tarmac.rotation.x = -Math.PI / 2;
    tarmac.position.y = -0.03;
    scene.add(tarmac);
    for (let z = -60; z <= 60; z += 10) {
      box(0.4, 0.02, 5, M('#F2F2F2'), HX + 32, 0, z);
    }

    // 入口からカウンターまでの黄色いガイドライン
    const lineMat = M('#F5B92E', { emissive: '#F5B92E', emissiveIntensity: 0.25 });
    const chevMat = M('#FF8A3D', { emissive: '#FF8A3D', emissiveIntensity: 0.2 });
    box(0.4, 0.012, 40, lineMat, 0, 0.006, 5);
    [20, 12, 4, -4, -12].forEach((z) => {
      box(0.9, 0.014, 0.18, chevMat, -0.22, 0.008, z + 0.22, { rotY: Math.PI / 4 });
      box(0.9, 0.014, 0.18, chevMat, 0.22, 0.008, z + 0.22, { rotY: -Math.PI / 4 });
    });

    /* ---------- 壁・天井 ---------- */
    const wallMat = M('#EADFCF');
    const trimMat = M('#2BB5A0');
    const frameMat = M('#8A97A3', { metalness: 0.3, roughness: 0.4 });
    const glass = new THREE.MeshStandardMaterial({ color: '#CFEFFF', transparent: true, opacity: 0.25, roughness: 0.1, metalness: 0.1, depthWrite: false });

    box(W, H, 0.4, wallMat, 0, H / 2, -HZ);                     // 奥
    box(0.4, H, D, wallMat, -HX, H / 2, 0);                     // 左
    // 手前（入口つき）
    box(14, H, 0.4, wallMat, -11, H / 2, HZ);
    box(14, H, 0.4, wallMat, 11, H / 2, HZ);
    box(8, H - 3.4, 0.4, wallMat, 0, 3.4 + (H - 3.4) / 2, HZ);
    box(3.9, 3.4, 0.08, glass, -2, 1.7, HZ);
    box(3.9, 3.4, 0.08, glass, 2, 1.7, HZ);
    [-4, 0, 4].forEach((x) => box(0.15, 3.4, 0.3, frameMat, x, 1.7, HZ));
    box(8, 0.2, 0.3, frameMat, 0, 3.4, HZ);
    box(8, 0.02, 3, M('#7D8790'), 0, 0.012, HZ - 1.6);           // 玄関マット
    // 右（大きな窓）
    box(0.4, 0.8, D, wallMat, HX, 0.4, 0);
    box(0.4, 2, D, wallMat, HX, H - 1, 0);
    box(0.08, H - 2.8, D, glass, HX, 0.8 + (H - 2.8) / 2, 0);
    for (let z = -HZ; z <= HZ; z += 4) box(0.25, H - 2.8, 0.2, frameMat, HX - 0.05, 0.8 + (H - 2.8) / 2, z);
    // 幅木
    box(0.05, 0.25, D, trimMat, -HX + 0.22, 0.125, 0);
    box(W, 0.25, 0.05, trimMat, 0, 0.125, -HZ + 0.22);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M('#FBFAF7'));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    scene.add(ceil);
    const lightMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
    for (let x = -12; x <= 12; x += 6) {
      for (let z = -24; z <= 24; z += 6) box(3, 0.08, 1, lightMat, x, H - 0.05, z);
    }

    /* ---------- 柱・植物 ---------- */
    const pillarMat = M('#DCD3C4');
    [-6, 6].forEach((x) => [-10, 2, 14].forEach((z) => {
      cyl(0.55, 0.55, H, pillarMat, x, H / 2, z);
      cyl(0.62, 0.62, 0.3, trimMat, x, 0.15, z);
      rect(x - 0.6, x + 0.6, z - 0.6, z + 0.6);
    }));
    const potMat = M('#C46A3E');
    const leafMat = M('#5DAA5A');
    const leafMat2 = M('#78C06E');
    const plant = (x, z) => {
      cyl(0.36, 0.28, 0.6, potMat, x, 0.3, z);
      sph(0.55, leafMat, x, 1.05, z);
      sph(0.4, leafMat2, x + 0.15, 1.45, z - 0.1);
      rect(x - 0.45, x + 0.45, z - 0.45, z + 0.45);
    };
    [[-16.8, 26.8], [16.8, 26.8], [-16.8, -16], [16.5, -26.5], [-7.2, 14], [7.2, 2]].forEach(([x, z]) => plant(x, z));

    /* ---------- チェックインカウンター ---------- */
    const navy = M('#24476B');
    const counterMat = M('#FFFFFF', { roughness: 0.5 });
    const woodMat = M('#C9A37A');
    const darkMat = M('#2F3740', { roughness: 0.4 });
    box(26, 4.4, 0.3, navy, 0, 2.2, -21.2);
    read(Md.sign(THREE, scene, { zh: '值机柜台', en: 'Check-in Counters', bg: '#1F3B57' }, 9, 0, 5.8, -21.0), 'checkinCounters');
    [-9, 0, 9].forEach((x, i) => {
      box(5, 1.1, 1.2, counterMat, x, 0.55, -18.6);
      box(5.2, 0.06, 1.4, woodMat, x, 1.13, -18.6);
      box(5, 0.18, 0.02, trimMat, x, 0.85, -17.99);
      box(0.7, 0.45, 0.05, darkMat, x + 1.3, 1.45, -18.9);
      box(0.08, 0.25, 0.08, darkMat, x + 1.3, 1.2, -18.95);
      box(1.2, 0.12, 0.9, M('#9AA5AE', { metalness: 0.3 }), x - 1.6, 0.06, -17.5); // 荷物の秤
      read(Md.sign(THREE, scene, { zh: `值机 ${'ABC'[i]}`, en: i === 1 ? 'All Flights' : 'Hamster Air', bg: '#2BB5A0', accent: '#FFFFFF' }, 3, x, 3.3, -21.0), `checkin${'ABC'[i]}`);
    });
    rect(-13, 13, -21.5, -18.0);

    // 並ぶためのポール（左右のカウンター前）
    const postMat = M('#B8C2CA', { metalness: 0.5, roughness: 0.3 });
    const beltMat = M('#2F6FA8');
    [-9, 9].forEach((cx) => {
      [-16.4, -14.6].forEach((z) => {
        for (let x = cx - 2; x <= cx + 2; x += 2) {
          cyl(0.05, 0.05, 1, postMat, x, 0.5, z, 8);
          cyl(0.16, 0.18, 0.04, postMat, x, 0.02, z, 12);
          if (x < cx + 2) box(2, 0.06, 0.02, beltMat, x + 1, 0.92, z);
        }
      });
    });

    // 係員（真ん中のカウンター）
    const npc = Md.staff(THREE);
    npc.position.set(0, 0, -19.6);
    scene.add(npc);

    /* ---------- ベンチ・荷物 ---------- */
    const seatMat = M('#5B8DB8');
    const legMat = M('#7D8790', { metalness: 0.4, roughness: 0.4 });
    const bench = (x, z) => {
      box(3.2, 0.12, 0.6, seatMat, x, 0.46, z);
      box(3.2, 0.55, 0.08, seatMat, x, 0.8, z - 0.28);
      box(0.08, 0.46, 0.5, legMat, x - 1.4, 0.23, z);
      box(0.08, 0.46, 0.5, legMat, x + 1.4, 0.23, z);
      rect(x - 1.65, x + 1.65, z - 0.4, z + 0.4);
    };
    [-11.5, 11].forEach((x) => [-6, -2.5, 1, 4.5, 8].forEach((z) => bench(x, z)));
    const bagColors = ['#FF8A3D', '#2BB5A0', '#F5B92E', '#FF9EAA', '#5B6B7B'];
    const suitcase = (x, z, color) => {
      box(0.45, 0.65, 0.26, M(color), x, 0.36, z);
      box(0.05, 0.3, 0.05, legMat, x, 0.83, z);
      box(0.25, 0.04, 0.05, legMat, x, 0.98, z);
      cyl(0.04, 0.04, 0.05, darkMat, x - 0.15, 0.03, z, 8);
      cyl(0.04, 0.04, 0.05, darkMat, x + 0.15, 0.03, z, 8);
    };
    suitcase(-10, -1.9, bagColors[0]);
    suitcase(12.4, 5.1, bagColors[1]);
    suitcase(-12.6, 8.6, bagColors[3]);

    // 荷物カート
    const cart = (x, z, rot, c1, c2) => {
      const g = new THREE.Group();
      box(0.75, 0.06, 1.2, legMat, 0, 0.35, 0, { parent: g });
      box(0.75, 0.5, 0.05, legMat, 0, 0.65, 0.6, { parent: g });
      box(0.75, 0.06, 0.08, M('#E05A3A'), 0, 0.92, 0.62, { parent: g });
      box(0.6, 0.45, 0.85, M(c1), 0, 0.61, -0.05, { parent: g });
      box(0.5, 0.3, 0.6, M(c2), 0, 0.98, -0.05, { parent: g });
      [[-0.3, -0.5], [0.3, -0.5], [-0.3, 0.5], [0.3, 0.5]].forEach(([wx, wz]) => {
        const w = cyl(0.09, 0.09, 0.06, darkMat, wx, 0.09, wz, 10, g);
        w.rotation.z = Math.PI / 2;
      });
      g.position.set(x, 0, z);
      g.rotation.y = rot;
      scene.add(g);
      rect(x - 0.75, x + 0.75, z - 0.75, z + 0.75);
    };
    cart(7, 22, 0.3, '#F5B92E', '#2BB5A0');
    cart(8.4, 22.6, -0.2, '#FF9EAA', '#5B6B7B');
    cart(-7.5, 21, 0.1, '#5B8DB8', '#FF8A3D');

    // ゴミ箱
    const binMat = M('#8FA3B0', { metalness: 0.3 });
    [[3.2, 12], [-3.2, -2], [3.2, -12]].forEach(([x, z]) => {
      cyl(0.3, 0.3, 0.85, binMat, x, 0.43, z);
      cyl(0.33, 0.33, 0.06, trimMat, x, 0.88, z);
      rect(x - 0.35, x + 0.35, z - 0.35, z + 0.35);
    });

    /* ---------- 案内所 ---------- */
    cyl(1.3, 1.3, 1.05, counterMat, -9, 0.53, 15);
    cyl(1.38, 1.38, 0.06, woodMat, -9, 1.08, 15);
    cyl(1.32, 1.32, 0.16, trimMat, -9, 0.8, 15);
    cyl(0.05, 0.05, 2.8, frameMat, -9, 2.4, 15, 8);
    read(Md.sign(THREE, scene, { zh: '问讯处', en: 'Information', arrow: '?', bg: '#2BB5A0', accent: '#FFFFFF' }, 2.6, -9, 3.9, 15, 0.5), 'info');
    rect(-10.4, -7.6, 13.6, 16.4);

    /* ---------- 出発案内板（左の壁） ---------- */
    const boardTex = Md.canvasTexture(THREE, 1024, 512, (g, w, h) => {
      g.fillStyle = '#111827';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#F5B92E';
      g.fillRect(0, 0, w, 86);
      g.fillStyle = '#111827';
      g.font = `bold 50px ${Md.FONT}`;
      g.fillText('出发  Departures', 30, 62);
      g.font = `bold 30px ${Md.FONT}`;
      g.textAlign = 'right';
      g.fillText('仓鼠航空 Hamster Air', w - 30, 58);
      g.textAlign = 'left';
      const rows = [
        ['HM101', '北京 Beijing', '10:30', '准时', '#5BE38B'],
        ['HM205', '成都 Chengdu', '11:05', '值机', '#F5B92E'],
        ['HM318', '东京 Tokyo', '11:40', '登机', '#FF8A3D'],
        ['HM422', '广州 Guangzhou', '12:15', '准时', '#5BE38B'],
        ['HM530', '西安 Xi’an', '12:50', '准时', '#5BE38B'],
      ];
      rows.forEach((r, i) => {
        const y = 150 + i * 76;
        g.fillStyle = i % 2 ? '#162033' : '#1C2940';
        g.fillRect(0, y - 50, w, 76);
        g.font = `bold 38px ${Md.FONT}`;
        g.fillStyle = '#E8F1FF';
        g.fillText(r[0], 30, y);
        g.fillText(r[1], 220, y);
        g.fillText(r[2], 640, y);
        g.fillStyle = r[4];
        g.fillText(r[3], 830, y);
      });
    });
    box(0.2, 4.3, 8.3, M('#30363D'), -HX + 0.32, 4.4, 6);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map: boardTex }));
    board.position.set(-HX + 0.44, 4.4, 6);
    board.rotation.y = Math.PI / 2;
    scene.add(board);
    read({ x: -HX + 0.44, y: 4.4, z: 6, h: 4, rotY: Math.PI / 2 }, 'departures', { en: 'Departures', bg: '#111827' });

    /* ---------- 吊り看板・壁の看板 ---------- */
    read(Md.sign(THREE, scene, { zh: '欢迎来到上海', en: 'Welcome to Shanghai', bg: '#FF8A3D', accent: '#FFE3CC', sub: '#FFF1E6' }, 8, 0, 6.4, 17, 0, { hang: H - 6.4 - 1 }), 'welcome');
    read(Md.sign(THREE, scene, { zh: '值机', en: 'Check-in', arrow: '↑' }, 4.5, 0, 5.8, 5, 0, { hang: H - 5.8 - 0.56 }), 'checkinArrow');
    read(Md.sign(THREE, scene, { zh: '登机口', en: 'Gates', arrow: '←' }, 4.5, -6, 5.8, -13, 0, { hang: H - 5.8 - 0.56 }), 'gates');
    read(Md.sign(THREE, scene, { zh: '出口', en: 'Exit', arrow: '↓', bg: '#2F8F4E', accent: '#D9F5E3' }, 3.6, 0, 4.4, HZ - 0.3, Math.PI), 'exit');

    // トイレ（左の壁）
    box(0.1, 2.6, 1.8, M('#3A4A5A'), -HX + 0.25, 1.3, -10);
    read(Md.sign(THREE, scene, { zh: '洗手间', en: 'Restroom', bg: '#5B6B7B', accent: '#CFE3F5' }, 2.8, -HX + 0.32, 3.4, -10, Math.PI / 2), 'restroom');

    // 搭乗口（左奥）
    box(0.1, 3.2, 4, M('#1F2D3A'), -HX + 0.25, 1.6, -24);
    box(0.12, 0.25, 4.4, trimMat, -HX + 0.27, 3.3, -24);
    read(Md.sign(THREE, scene, { zh: '登机口 A1–A20', en: 'Gates A1–A20', bg: '#1F4E79' }, 4.2, -HX + 0.34, 4.6, -24, Math.PI / 2), 'gatesA');

    /* ---------- 窓の外の飛行機 ---------- */
    const plane = new THREE.Group();
    const white = M('#FFFFFF', { roughness: 0.4 });
    const teal = M('#2BB5A0');
    const fus = cyl(1.6, 1.6, 20, white, 0, 3, 0, 24, plane);
    fus.rotation.x = Math.PI / 2;
    const nose = sph(1.6, white, 0, 3, -10, plane);
    nose.scale.set(1, 1, 1.7);
    const tail = cyl(0.5, 1.6, 5, white, 0, 3.4, 12.5, 24, plane);
    tail.rotation.x = Math.PI / 2;
    box(19, 0.25, 3.5, white, 0, 2.5, 1, { parent: plane });
    box(0.25, 3.4, 2.8, teal, 0, 5.4, 13.2, { parent: plane });
    box(6.5, 0.2, 1.6, white, 0, 3.6, 13.6, { parent: plane });
    box(3.3, 0.35, 15, teal, 0, 2.2, 0, { parent: plane }).scale.set(0.98, 1, 1);
    [-4.5, 4.5].forEach((x) => {
      const eng = cyl(0.65, 0.65, 2.4, M('#D8DEE3'), x, 1.8, -0.5, 18, plane);
      eng.rotation.x = Math.PI / 2;
    });
    for (let z = -7; z <= 8; z += 1.4) {
      [-1, 1].forEach((s) => box(0.05, 0.35, 0.5, M('#2F3740'), 1.55 * s, 3.6, z, { parent: plane }));
    }
    plane.position.set(HX + 18, 0, -4);
    scene.add(plane);

    /* ---------- キャラクター ---------- */
    const hamster = Md.hamster(THREE);
    hamster.position.set(1.6, 0, 20.5);
    scene.add(hamster);

    // 空港にいる人たち（会話の中身は PEOPLE を参照）
    const people = App.World3D.spawnPeople(THREE, scene, PEOPLE);

    return {
      colliders,
      bounds: { minX: -HX + 0.6, maxX: HX - 0.6, minZ: -HZ + 0.6, maxZ: HZ - 0.9 },
      spawn: { x: 0, z: 24.5, yaw: 0 },
      hamster,
      npc,
      people,
      interactables: [{ id: 'desk', x: 0, z: -16.6, r: 3.2 }],
      tags: [{ obj: npc, y: 2.35, text: '🧑‍✈️ 值机柜台（チェックイン）', maxDist: 16 }],
      readables,
      facePlayer: [npc],
      // 近づくと見つかる「発見」スポット（ハムスターがミニ豆知識を言う）
      discoveries: [
        { id: 'board', x: -15, z: 6, r: 4.5, say: '出発ボード発見！<br><b>出发</b>＝出発、<b>登机</b>＝搭乗だよ' },
        { id: 'info', x: -9, z: 15, r: 3.2, say: '案内所は<b>问讯处</b>。困ったらここへ！' },
        { id: 'restroom', x: -15.5, z: -10, r: 3.2, say: 'トイレは<b>洗手间</b>。「厕所」とも言うよ' },
        { id: 'gate', x: -15.5, z: -24, r: 3.6, say: '<b>登机口</b>＝搭乗口！飛行機はここから乗るんだ' },
      ],
    };
  }

  App.World3D = App.World3D || {};
  App.World3D.buildAirport = buildAirport;
})(window.App = window.App || {});
