/* 3D 小籠包の屋台（美食街）のレイアウト
 * 南北にのびる屋台通り。入口の牌楼（手前 z=24）から奥（z=-27）へ歩く。
 *   通り      x: -3.9〜3.9（bounds で制限）
 *   左の屋台  糖葫芦(z=10)・臭豆腐(z=-3)・小笼包(z=-16.5, 点餐/取餐の 2 窓口)
 *   右の屋台  烤串(z=14)・奶茶(z=4)・生煎(z=-8)、奥は象棋をする広場
 * 単位はメートル。屋台のカウンターは当たり判定つき。
 */
(function (App) {
  'use strict';

  const BUKEQI = { zh: '不客气。', py: 'Bú kèqi.', ja: 'どういたしまして' };
  const SHIDE = { zh: '是的。', py: 'Shì de.', ja: 'はい' };

  /* ---------- 屋台通りにいる人たち（会話の書式は airport.js と同じ） ---------- */
  const PEOPLE = [
    {
      id: 'kebab', name: '串焼き屋のお兄さん', emoji: '🍢',
      look: { top: '#FFFFFF', bottom: '#2B2B2B', hair: '#1E1A18', cap: '#C0504D' },
      stand: { x: 5.5, z: 14, rot: -Math.PI / 2 },
      script: [
        { type: 'say', zh: '你好！来尝尝！', py: 'Nǐ hǎo! Lái chángchang!', ja: 'いらっしゃい！食べてって！',
          hamster: 'あいさつを返そう', options: ['nihao', 'zaijian', 'xiexie'], answer: 0 },
        { type: 'understand', zh: '烤串，一块一串！', py: 'Kǎochuàn, yí kuài yí chuàn!', ja: '串焼き、1本1元だよ！',
          q: '1本いくら？', options: ['1元', '5元', '3元'], answer: 0, hint: '「一（yī）」＝1。「块（kuài）」は「元」のことだよ' },
        { type: 'say', hamster: '安い！でもまずは小籠包…。またね、と言おう', options: ['zaijian', 'nihao', 'haode'], answer: 0 },
      ],
    },
    {
      id: 'kid', name: '糖葫芦を持った男の子', emoji: '🍡',
      look: { top: '#4FA3D9', bottom: '#3A4A5A', hair: '#2B2220', scale: 0.6 },
      stand: { x: -2.4, z: 7.6, rot: Math.PI * 0.75 },
      script: [
        { type: 'understand', zh: '你看！我的糖葫芦有五个！', py: 'Nǐ kàn! Wǒ de tánghúlu yǒu wǔ ge!', ja: '見て！ぼくの糖葫芦、5個ついてるよ！',
          q: 'いくつついてるって？', options: ['5個', '4個', '2個'], answer: 0, hint: '「五（wǔ）」＝5。低く下げてから上げる音だよ' },
        { type: 'say', hamster: '「いいね！」は<b>真好！</b>', options: [{ zh: '真好！', py: 'Zhēn hǎo!', ja: 'いいね！' }, 'duoshao', 'cesuo'], answer: 0 },
        { type: 'line', zh: '一、二、三、四、五！', py: 'Yī, èr, sān, sì, wǔ!', ja: '1、2、3、4、5！', hamster: '数えてくれた！数字の復習になるね' },
      ],
    },
    {
      id: 'queue', name: '小籠包を待つお姉さん', emoji: '🎫',
      look: { top: '#E86F9A', bottom: '#F4EFE6', hair: '#2B2220', hairStyle: 'long', bag: '#5B4A3F' },
      stand: { x: -2.3, z: -17, rot: -Math.PI / 2 },
      script: [
        { type: 'say', zh: '你好！你也来买小笼包吗？', py: 'Nǐ hǎo! Nǐ yě lái mǎi xiǎolóngbāo ma?', ja: 'こんにちは！あなたも小籠包を買いに来たの？',
          hamster: '「はい」は<b>是的</b>', options: [SHIDE, 'zaijian', 'maidan'], answer: 0 },
        { type: 'understand', zh: '我是二号。', py: 'Wǒ shì èr hào.', ja: '私は2番なの。',
          q: '何番って言った？', options: ['2番', '3番', '5番'], answer: 0, hint: '「二（èr）」は上から下へストンと落とす音！' },
        { type: 'line', zh: '这家很有名，要等一下。', py: 'Zhè jiā hěn yǒumíng, yào děng yíxià.', ja: 'このお店は有名だから、ちょっと待つのよ。',
          hamster: '「号（hào）」＝〜番。番号を聞き取れると便利だね' },
      ],
    },
    {
      id: 'photo', name: '写真をとる観光客', emoji: '📷',
      look: { top: '#2BB5A0', bottom: '#4A5560', hair: '#3B2A20', camera: true, backpack: '#D9A441' },
      path: [[1.6, 20], [1.6, -10], [-0.8, -10], [-0.8, 20]],
      script: [
        { type: 'understand', zh: '你好！可以帮我拍照吗？', py: 'Nǐ hǎo! Kěyǐ bāng wǒ pāizhào ma?', ja: 'こんにちは！写真を撮ってもらえますか？',
          q: '何を頼まれた？', options: ['写真を撮ってほしい', '道を教えてほしい', 'お金を貸してほしい'], answer: 0, hint: '「拍照（pāizhào）」＝写真を撮る' },
        { type: 'say', hamster: 'いいよ！「わかりました」と答えよう', options: ['haode', 'cesuo', 'zaijian'], answer: 0 },
        { type: 'line', zh: '一、二、三，茄子！', py: 'Yī, èr, sān, qiézi!', ja: 'いち、に、さん、チーズ！', hamster: '中国では「茄子（ナス）」がチーズの代わりなんだって！📸' },
        { type: 'say', zh: '谢谢你！', py: 'Xièxie nǐ!', ja: 'ありがとう！', hamster: '「どういたしまして」は<b>不客气</b>', options: [BUKEQI, 'xiexie', 'nihao'], answer: 0 },
      ],
    },
    {
      id: 'grandpa', name: '象棋をするおじいさん', emoji: '♟️',
      look: { top: '#E8DCC8', bottom: '#3A3A3A', hair: '#D8D8D8' },
      sit: { x: 3.25, z: -23.5, rot: -Math.PI / 2 },
      script: [
        { type: 'say', zh: '你好，年轻人！', py: 'Nǐ hǎo, niánqīngrén!', ja: 'やあ、若いの！', hamster: 'あいさつを返そう', options: ['nihao', 'maidan', 'huzhao'], answer: 0 },
        { type: 'understand', zh: '我每天吃一笼小笼包。', py: 'Wǒ měitiān chī yì lóng xiǎolóngbāo.', ja: 'わしは毎日、小籠包を1せいろ食べるんじゃ。',
          q: '毎日何せいろ食べる？', options: ['1せいろ', '5せいろ', '3せいろ'], answer: 0, hint: '「一笼（yì lóng）」＝1せいろ。「笼」はせいろのことだよ' },
        { type: 'say', hamster: '「すごい！」は<b>真厉害！</b>', options: [{ zh: '真厉害！', py: 'Zhēn lìhai!', ja: 'すごい！' }, 'cesuo', 'ruzhu'], answer: 0 },
        { type: 'line', zh: '哈哈！这家的小笼包最好吃！', py: 'Hāha! Zhè jiā de xiǎolóngbāo zuì hǎochī!', ja: 'はっはっは！ここの小籠包がいちばんうまいぞ！' },
      ],
    },
  ];

  function buildStall(THREE, scene) {
    const Md = App.Models3D;
    const colliders = [];
    const rect = (minX, maxX, minZ, maxZ) => { const c = { minX, maxX, minZ, maxZ }; colliders.push(c); return c; };
    const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0 }, o));
    const box = (w, h, d, mat, x, y, z, { collide = false, parent = scene, rotY = 0 } = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      parent.add(m);
      if (collide) rect(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
      return m;
    };
    const cyl = (rt, rb, h, mat, x, y, z, seg = 18, parent = scene) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const sph = (r, mat, x, y, z, parent = scene) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
      m.position.set(x, y, z);
      parent.add(m);
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
    const signOpts = (o) => Object.assign({ bg: '#8E2F2F', accent: '#FFC23D', sub: '#FBE3C4' }, o);

    /* ---------- 空・光（夕焼け） ---------- */
    scene.background = new THREE.Color('#F2A27E');
    scene.fog = new THREE.Fog('#F2A27E', 40, 110);
    scene.add(new THREE.HemisphereLight(0xffe9d2, 0x7a5a48, 0.75));
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const sun = new THREE.DirectionalLight(0xffc89a, 0.45);
    sun.position.set(-12, 18, -20);
    scene.add(sun);
    const warm = (x, y, z, intensity = 0.6, dist = 16) => {
      const l = new THREE.PointLight(0xffb070, intensity, dist, 1.6);
      l.position.set(x, y, z);
      scene.add(l);
    };
    warm(0, 4.5, 14);
    warm(0, 4.5, -2);
    warm(-2, 4.5, -17, 0.8);

    const wood = M('#7A5236');
    const woodDark = M('#5A3A26');
    const red = M('#B83A2E');
    const gold = M('#D9A441', { metalness: 0.4, roughness: 0.4 });
    const tile = M('#3E3B3A', { roughness: 0.9 });
    const bamboo = M('#D9B97A');
    const white = M('#FFFFFF');
    const steel = M('#9AA5AE', { metalness: 0.5, roughness: 0.4 });

    /* ---------- 地面（石畳） ---------- */
    const stoneTex = tex(256, 256, (g, w, h) => {
      g.fillStyle = '#9C948A'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const v = 140 + Math.floor(Math.random() * 30);
          g.fillStyle = `rgb(${v},${v - 6},${v - 14})`;
          const ox = (y % 2) * 32;
          g.fillRect(x * 64 + ox + 2, y * 64 + 2, 60, 60);
        }
      }
    }, [5, 30]);
    plane(20, 70, new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 }), 0, 0, 0, -Math.PI / 2);

    /* ---------- 両側の古い建物（石库门風） ---------- */
    const facadeTex = tex(512, 512, (g, w, h) => {
      g.fillStyle = '#CFC6B8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#8F8578';
      for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < w; x += 32) g.fillRect(x + 1, y + 1, 30, 1);
      // 2 階の窓（赤い格子）
      [[60, 60], [300, 60]].forEach(([x, y]) => {
        g.fillStyle = '#6B2A22'; g.fillRect(x, y, 150, 150);
        g.fillStyle = '#F6D9A0'; g.fillRect(x + 10, y + 10, 130, 130);
        g.strokeStyle = '#6B2A22'; g.lineWidth = 6;
        for (let k = 1; k < 4; k++) {
          g.beginPath(); g.moveTo(x + 10 + k * 32.5, y + 10); g.lineTo(x + 10 + k * 32.5, y + 140); g.stroke();
          g.beginPath(); g.moveTo(x + 10, y + 10 + k * 32.5); g.lineTo(x + 140, y + 10 + k * 32.5); g.stroke();
        }
      });
      g.fillStyle = '#6E655A'; g.fillRect(0, 250, w, 14);
    }, [12, 1]);
    const facadeMat = new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.9 });
    [-1, 1].forEach((s) => {
      box(0.5, 7.5, 62, M('#CFC6B8'), s * 8.4, 3.75, -2);
      plane(62, 7.5, facadeMat, s * 8.14, 3.75, -2, 0, -s * Math.PI / 2);
      // 瓦屋根（反り返ったひさし）
      const roof = box(2.6, 0.25, 62.6, tile, s * 7.6, 7.7, -2);
      roof.rotation.z = s * 0.35;
      box(0.2, 0.2, 62.6, M('#2C2928'), s * 6.4, 7.35, -2);
    });

    /* ---------- 奥の建物（突き当たり） ---------- */
    const endTex = tex(1024, 512, (g, w, h) => {
      g.fillStyle = '#CFC6B8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#6B2A22';
      for (let i = 0; i < 5; i++) g.fillRect(70 + i * 190, 90, 120, 170);
      g.fillStyle = '#F6D9A0';
      for (let i = 0; i < 5; i++) g.fillRect(82 + i * 190, 102, 96, 146);
      g.fillStyle = '#4A2A1E'; g.fillRect(w / 2 - 90, 320, 180, 192);
      g.fillStyle = '#B83A2E'; g.fillRect(w / 2 - 80, 330, 160, 182);
    });
    box(18, 8, 0.5, M('#CFC6B8'), 0, 4, -27.9);
    plane(18, 8, new THREE.MeshStandardMaterial({ map: endTex, roughness: 0.9 }), 0, 4, -27.64);
    const endRoof = box(18.6, 0.25, 2.4, tile, 0, 8.1, -27.2);
    endRoof.rotation.x = 0.35;
    Md.sign(THREE, scene, signOpts({ zh: '王府井小吃街', en: 'Wangfujing Snack Street' }), 4.4, 0, 5.2, -27.55);

    /* ---------- 入口の牌楼（ゲート） ---------- */
    [-4.6, 4.6].forEach((x) => {
      cyl(0.3, 0.3, 5.6, red, x, 2.8, 24, 14);
      cyl(0.42, 0.42, 0.4, M('#5A5550'), x, 0.2, 24, 14);
      rect(x - 0.35, x + 0.35, 23.65, 24.35);
    });
    box(10.4, 0.5, 0.5, red, 0, 5.3, 24);
    box(11.6, 0.3, 1.6, tile, 0, 6.2, 24);
    box(10.2, 0.6, 1.2, M('#2C2928'), 0, 5.85, 24);
    [-1, 1].forEach((s) => {
      const tip = box(1.2, 0.2, 1.6, tile, s * 6.1, 6.45, 24);
      tip.rotation.z = -s * 0.4;
    });
    Md.sign(THREE, scene, signOpts({ zh: '美食街', en: 'Food Street' }), 3.6, 0, 4.4, 24.3);
    Md.sign(THREE, scene, signOpts({ zh: '美食街', en: 'Food Street' }), 3.6, 0, 4.4, 23.7, Math.PI);

    /* ---------- 通りをまたぐ提灯 ---------- */
    const lanternMat = new THREE.MeshBasicMaterial({ color: '#F0503C' });
    const lanterns = [];
    for (let z = -22; z <= 20; z += 7) {
      const rope = cyl(0.015, 0.015, 16, M('#3A2A20'), 0, 5.4, z, 4);
      rope.rotation.z = Math.PI / 2;
      [-4.5, -1.5, 1.5, 4.5].forEach((x) => {
        const g = new THREE.Group();
        const body = sph(0.32, lanternMat, 0, -0.45, 0, g);
        body.scale.y = 0.85;
        cyl(0.16, 0.16, 0.08, gold, 0, -0.18, 0, 10, g);
        cyl(0.16, 0.16, 0.08, gold, 0, -0.72, 0, 10, g);
        cyl(0.02, 0.05, 0.3, M('#F2C14E'), 0, -0.9, 0, 6, g);
        g.position.set(x, 5.4, z);
        scene.add(g);
        lanterns.push({ g, ph: Math.random() * 6 });
      });
    }

    /* ---------- 屋台 ----------
     * side: -1 = 左（看板は +x 向き）、1 = 右（看板は -x 向き）
     */
    const awningTex = (c1, c2) => tex(256, 256, (g, w, h) => {
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(0, (i * h) / 8, w, h / 8); }
    });
    function stall(side, z, len, { zh, en, price, c1 = '#B83A2E', c2 = '#F6E7C8', bg = '#8E2F2F' }) {
      const s = side;
      const fx = s * 4.6;
      box(0.9, 1.0, len, wood, fx, 0.5, z, { collide: true });
      box(1.1, 0.06, len + 0.1, M('#E8DCC8'), fx, 1.03, z);
      box(0.2, 3.4, len, M('#E8DCC8'), s * 6.9, 1.7, z);
      [-1, 1].forEach((e) => {
        box(2.0, 3.4, 0.12, woodDark, s * 5.9, 1.7, z + e * (len / 2));
        cyl(0.06, 0.06, 3.0, woodDark, s * 4.12, 1.5, z + e * (len / 2 - 0.06), 8);
      });
      rect(Math.min(s * 4.12, s * 6.9) - 0.1, Math.max(s * 4.12, s * 6.9) + 0.1, z - len / 2 - 0.1, z - len / 2 + 0.1);
      rect(Math.min(s * 4.12, s * 6.9) - 0.1, Math.max(s * 4.12, s * 6.9) + 0.1, z + len / 2 - 0.1, z + len / 2 + 0.1);
      const aw = box(3.0, 0.08, len + 0.4, new THREE.MeshStandardMaterial({ map: awningTex(c1, c2), roughness: 0.9 }), s * 5.5, 3.25, z);
      aw.rotation.z = s * 0.22;
      Md.sign(THREE, scene, signOpts({ zh, en: price ? `${price} · ${en}` : en, bg }), Math.min(3.4, len * 0.7), s * 4.1, 3.9, z, -s * Math.PI / 2);
    }

    // 左：糖葫芦
    stall(-1, 10, 4.5, { zh: '糖葫芦', en: 'Candied Fruit', price: '¥3', c1: '#C0392B', c2: '#FADBD8' });
    for (let k = 0; k < 6; k++) {
      const x = -4.4 - (k % 2) * 0.3;
      const zz = 8.6 + k * 0.5;
      cyl(0.015, 0.015, 0.9, bamboo, x, 1.5, zz, 4);
      for (let b = 0; b < 4; b++) sph(0.06, M('#D6242A', { roughness: 0.3 }), x, 1.3 + b * 0.14, zz);
    }
    // 左：臭豆腐
    stall(-1, -3, 4.5, { zh: '臭豆腐', en: 'Stinky Tofu', price: '¥5', c1: '#2E7D4F', c2: '#E3F2E8', bg: '#2E5E3E' });
    cyl(0.45, 0.4, 0.15, M('#2A2A2A'), -4.6, 1.13, -3.5, 16);
    for (let k = 0; k < 6; k++) box(0.12, 0.08, 0.12, M('#3B2B1E'), -4.75 + (k % 3) * 0.15, 1.24, -3.65 + Math.floor(k / 3) * 0.2);
    // 右：烤串
    stall(1, 14, 4.5, { zh: '烤串', en: 'Skewers', price: '¥1', c1: '#D35400', c2: '#FDEBD0', bg: '#7A3A12' });
    box(0.5, 0.18, 2.2, M('#2A2A2A'), 4.6, 1.15, 14);
    for (let k = 0; k < 9; k++) {
      const st = cyl(0.01, 0.01, 0.6, bamboo, 4.6, 1.28, 13.1 + k * 0.22, 4);
      st.rotation.z = Math.PI / 2;
      [-0.12, 0, 0.12].forEach((dx) => box(0.07, 0.06, 0.06, M('#8A3B1E'), 4.6 + dx, 1.28, 13.1 + k * 0.22));
    }
    // 右：奶茶
    stall(1, 4, 4.5, { zh: '奶茶', en: 'Milk Tea', price: '¥4', c1: '#C49A6C', c2: '#FFF5E6', bg: '#6B4A2E' });
    for (let k = 0; k < 5; k++) {
      cyl(0.07, 0.06, 0.22, M('#E8D2B0', { transparent: true, opacity: 0.85 }), 4.4, 1.17, 3 + k * 0.45, 10);
      cyl(0.01, 0.01, 0.12, M('#2BB5A0'), 4.42, 1.33, 3 + k * 0.45, 4);
    }
    // 右：生煎
    stall(1, -8, 5, { zh: '生煎包', en: 'Pan-fried Buns', price: '¥2', c1: '#B9770E', c2: '#FEF5E7', bg: '#7A4A12' });
    cyl(0.6, 0.6, 0.12, M('#2A2A2A'), 4.6, 1.12, -8, 20);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const bun = sph(0.12, M('#F5E6CC'), 4.6 + Math.cos(a) * 0.35, 1.22, -8 + Math.sin(a) * 0.35);
      bun.scale.y = 0.7;
    }

    /* ---------- 小笼包の屋台（左奥・いちばん大きい） ---------- */
    const XZ = -16.5;
    stall(-1, XZ, 9, { zh: '小笼包', en: 'Xiaolongbao', c1: '#C0392B', c2: '#FFF5E6' });
    // 窓口の吊り看板
    Md.sign(THREE, scene, signOpts({ zh: '点餐', en: 'Order', w: 512, h: 256, bg: '#24476B', accent: '#FFC23D', sub: '#CFE3F5' }), 1.2, -4.05, 2.5, -14, Math.PI / 2);
    Md.sign(THREE, scene, signOpts({ zh: '取餐', en: 'Pick-up', w: 512, h: 256, bg: '#2E5E3E', accent: '#FFC23D', sub: '#D9F5E3' }), 1.2, -4.05, 2.5, -19.5, Math.PI / 2);
    // 奥の壁のメニュー
    const menuTex = tex(512, 384, (g, w, h) => {
      g.fillStyle = '#3B2618'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#D9A441'; g.lineWidth = 8; g.strokeRect(12, 12, w - 24, h - 24);
      g.fillStyle = '#FFE7B8'; g.textAlign = 'center';
      g.font = `bold 64px ${Md.FONT}`; g.fillText('菜单 Menu', w / 2, 92);
      g.font = `bold 52px ${Md.FONT}`;
      g.fillText('小笼包  一笼 ¥5', w / 2, 190);
      g.fillText('生煎包  一个 ¥2', w / 2, 260);
      g.font = `bold 32px ${Md.FONT}`; g.fillStyle = '#F2C14E';
      g.fillText('（一笼＝1せいろ）', w / 2, 330);
    });
    plane(2.4, 1.8, new THREE.MeshBasicMaterial({ map: menuTex }), -6.78, 2.2, -16.8, 0, Math.PI / 2);
    // せいろ（蒸籠）の山と湯気
    const steamers = [[-4.55, -18.6], [-4.55, -20.2], [-5.9, -19.4]];
    const steamMat = () => new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.5, depthWrite: false });
    const puffs = [];
    steamers.forEach(([x, z], i) => {
      const base = i === 2 ? 0.95 : 1.06;
      for (let k = 0; k < 4; k++) cyl(0.36, 0.36, 0.16, bamboo, x, base + 0.08 + k * 0.17, z, 18);
      cyl(0.38, 0.3, 0.1, M('#C7A563'), x, base + 0.08 + 4 * 0.17, z, 18);
      if (i === 2) box(0.9, 0.95, 0.9, steel, x, 0.475, z);
      for (let k = 0; k < 4; k++) {
        const p = sph(0.16, steamMat(), x, base + 0.8, z);
        puffs.push({ m: p, x, z, y0: base + 0.8, t: k / 4 });
      }
    });
    // 注文口の小籠包のお皿
    cyl(0.25, 0.22, 0.04, white, -4.6, 1.08, -14.6, 16);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const b = sph(0.07, M('#FFF8EC'), -4.6 + Math.cos(a) * 0.13, 1.14, -14.6 + Math.sin(a) * 0.13);
      b.scale.y = 0.8;
    }
    // 番号の電光掲示（今呼んでいる番号）
    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = 256;
    boardCanvas.height = 128;
    const boardTex = new THREE.CanvasTexture(boardCanvas);
    const drawBoard = (text) => {
      const g = boardCanvas.getContext('2d');
      g.fillStyle = '#111111'; g.fillRect(0, 0, 256, 128);
      g.fillStyle = '#FF5A3C'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `bold 64px ${Md.FONT}`;
      g.fillText(text, 128, 66);
      boardTex.needsUpdate = true;
    };
    drawBoard('— 号');
    box(0.08, 0.7, 1.4, M('#2A2A2A'), -6.76, 2.3, -19.8);
    plane(1.3, 0.62, new THREE.MeshBasicMaterial({ map: boardTex }), -6.71, 2.3, -19.8, 0, Math.PI / 2);

    // 屋台の人
    const auntie = Md.person(THREE, { top: '#FFFFFF', bottom: '#5A3A26', hair: '#3B2A20', hairStyle: 'bun' });
    auntie.position.set(-5.5, 0, -14);
    auntie.rotation.y = Math.PI / 2;
    const chef = Md.person(THREE, { top: '#FFFFFF', bottom: '#2B2B2B', hair: '#1E1A18', cap: '#FFFFFF' });
    chef.position.set(-5.4, 0, -19.5);
    chef.rotation.y = Math.PI / 2;
    scene.add(auntie, chef);
    // 他の屋台の店員（話しかけない飾り）
    [
      [-5.5, 10, Math.PI / 2, { top: '#C0392B', hair: '#2B2220', hairStyle: 'long' }],
      [-5.5, -3, Math.PI / 2, { top: '#2E7D4F', hair: '#1E1A18' }],
      [5.5, 4, -Math.PI / 2, { top: '#C49A6C', hair: '#3B2A20', hairStyle: 'long' }],
      [5.5, -8, -Math.PI / 2, { top: '#FFFFFF', hair: '#1E1A18', cap: '#B9770E' }],
    ].forEach(([x, z, rot, look]) => {
      const p = Md.person(THREE, look);
      p.position.set(x, 0, z);
      p.rotation.y = rot;
      scene.add(p);
    });

    /* ---------- 奥の広場：象棋のテーブル ---------- */
    box(0.9, 0.7, 0.9, wood, 2.3, 0.35, -23.5, { collide: true });
    const boardChess = tex(256, 256, (g, w, h) => {
      g.fillStyle = '#E8C98A'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#5A3A26'; g.lineWidth = 2;
      for (let k = 0; k <= 8; k++) {
        g.beginPath(); g.moveTo(16 + k * 28, 16); g.lineTo(16 + k * 28, h - 16); g.stroke();
        g.beginPath(); g.moveTo(16, 16 + k * 28); g.lineTo(w - 16, 16 + k * 28); g.stroke();
      }
    });
    plane(0.8, 0.8, new THREE.MeshBasicMaterial({ map: boardChess }), 2.3, 0.71, -23.5, -Math.PI / 2);
    for (let k = 0; k < 8; k++) {
      cyl(0.045, 0.045, 0.03, M(k % 2 ? '#C0392B' : '#2A2A2A'), 2.0 + (k % 4) * 0.2, 0.73, -23.8 + Math.floor(k / 4) * 0.6, 10);
    }
    [3.25, 1.35].forEach((x) => { box(0.45, 0.55, 0.45, woodDark, x, 0.275, -23.5); });
    rect(1.1, 3.5, -23.8, -23.2);
    const rival = Md.person(THREE, { top: '#5B6BB8', bottom: '#3A3A3A', hair: '#BBBBBB', sitting: true });
    rival.position.set(1.35, 0, -23.5);
    rival.rotation.y = Math.PI / 2;
    scene.add(rival);
    // 植木鉢
    [[-3.4, 22.6], [3.4, 22.6], [-3.4, -26.6], [3.4, -26.6]].forEach(([x, z]) => {
      cyl(0.35, 0.28, 0.6, M('#8E5B3E'), x, 0.3, z);
      sph(0.5, M('#4E9A55'), x, 1.0, z);
      rect(x - 0.4, x + 0.4, z - 0.4, z + 0.4);
    });

    /* ======================= キャラクター ======================= */
    const hamster = Md.hamster(THREE);
    hamster.position.set(1.4, 0, 25.8);
    scene.add(hamster);
    const people = App.World3D.spawnPeople(THREE, scene, PEOPLE);

    return {
      colliders,
      bounds: { minX: -3.9, maxX: 3.9, minZ: -27, maxZ: 28.5 },
      spawn: { x: 0, z: 27.5, yaw: 0 },
      hamster,
      people,
      drawBoard,
      interactables: [
        { id: 'order', x: -3.4, z: -14, r: 2.4 },
        { id: 'pickup', x: -3.4, z: -19.5, r: 2.4 },
      ],
      tags: [
        { obj: auntie, y: 2.25, text: '👩‍🍳 点餐（注文）', maxDist: 18 },
        { obj: chef, y: 2.25, text: '🧑‍🍳 取餐（受け取り）', maxDist: 18 },
      ],
      discoveries: [
        { id: 'gate', x: 0, z: 23, r: 2.6, say: '<b>美食街</b>＝グルメ通り！<br>いろんな屋台があるね。<b>小笼包</b>はどこかな？' },
        { id: 'tanghulu', x: -3.2, z: 10, r: 2.4, say: '<b>糖葫芦</b>は果物のあめがけ🍡<br>看板の <b>¥3</b> は <b>三块</b>（sān kuài）！' },
        { id: 'naicha', x: 3.2, z: 4, r: 2.4, say: '<b>奶茶</b>＝ミルクティー🧋<br><b>¥4</b> は <b>四块</b>（sì kuài）だよ' },
        { id: 'choudoufu', x: -3.2, z: -3, r: 2.4, say: '<b>臭豆腐</b>…「臭い豆腐」！におうけど、おいしいんだって<br><b>¥5</b> は <b>五块</b>（wǔ kuài）' },
        { id: 'shengjian', x: 3.2, z: -8, r: 2.4, say: '<b>生煎包</b>は焼き小籠包！上海名物だよ<br><b>¥2</b> は <b>两块</b>（liǎng kuài）。お金の「2」は <b>两</b> になるんだ' },
      ],
      update(dt, t) {
        puffs.forEach((p) => {
          p.t += dt * 0.45;
          if (p.t > 1) p.t -= 1;
          p.m.position.set(p.x + Math.sin(p.t * 6 + p.x) * 0.08, p.y0 + p.t * 1.1, p.z);
          p.m.scale.setScalar(0.6 + p.t * 1.6);
          p.m.material.opacity = 0.5 * (1 - p.t);
        });
        lanterns.forEach((l) => { l.g.rotation.z = Math.sin(t * 1.3 + l.ph) * 0.06; });
      },
    };
  }

  App.World3D = App.World3D || {};
  App.World3D.buildStall = buildStall;
})(window.App = window.App || {});
