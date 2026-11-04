/* 3D ホテルのレイアウト
 * 3 つのエリアを同じシーンの離れた場所に置き、エレベーターでワープする。
 *   ロビー（1階）   x: -14〜14, z: -16〜16   入口(手前) → フロント(奥)・エレベーター(左)・レストラン(右)
 *   3階の廊下       x: 90〜112, z: -2〜2      西端にエレベーター、北側に 301〜305 号室
 *   302 号室        x: 94〜102, z: -9〜-2     廊下からドアを開けて入る
 * 単位はメートル。壁はすべて当たり判定つき（bounds は使わない）。
 */
(function (App) {
  'use strict';

  const LH = 6;     // ロビーの天井
  const CH = 3.2;   // 廊下・客室の天井

  const BUKEQI = { zh: '不客气。', py: 'Bú kèqi.', ja: 'どういたしまして' };
  const SHIDE = { zh: '是的。', py: 'Shì de.', ja: 'はい' };

  /* ---------- ホテルにいる人たち（会話の書式は airport.js と同じ） ---------- */
  const PEOPLE = [
    {
      id: 'bellhop', name: 'ベルボーイさん', emoji: '🛎️',
      look: { top: '#8E2F2F', bottom: '#2B2B2B', hair: '#1E1A18', cap: '#8E2F2F' },
      stand: { x: 3.6, z: 12.6, rot: -Math.PI / 2 },
      script: [
        { type: 'understand', zh: '欢迎光临！需要帮您拿行李吗？', py: 'Huānyíng guānglín! Xūyào bāng nín ná xíngli ma?', ja: 'いらっしゃいませ！お荷物をお持ちしましょうか？',
          q: '何を聞かれた？', options: ['荷物を運ぶか', '部屋の番号', '朝ごはんの時間'], answer: 0, hint: '「行李（xíngli）」は荷物のことだよ' },
        { type: 'say', hamster: 'お願いしよう！', options: [{ zh: '好的，谢谢！', py: 'Hǎo de, xièxie!', ja: 'はい、ありがとう！' }, 'zaijian', 'duoshao'], answer: 0 },
        { type: 'line', zh: '不客气！祝您入住愉快！', py: 'Bú kèqi! Zhù nín rùzhù yúkuài!', ja: 'どういたしまして！ごゆっくりどうぞ！' },
      ],
    },
    {
      id: 'auntie', name: 'ロビーでくつろぐおばさん', emoji: '☕',
      look: { top: '#D9A441', bottom: '#5B4A3F', hair: '#3B2A20', hairStyle: 'bun' },
      sit: { x: 11.85, z: 7, rot: -Math.PI / 2 },
      script: [
        { type: 'say', zh: '你好呀！', py: 'Nǐ hǎo ya!', ja: 'こんにちは〜！', hamster: 'あいさつを返そう', options: ['nihao', 'maidan', 'cesuo'], answer: 0 },
        { type: 'understand', zh: '这家酒店的早餐很好吃！', py: 'Zhè jiā jiǔdiàn de zǎocān hěn hǎochī!', ja: 'このホテルの朝ごはん、とってもおいしいのよ！',
          q: '何がおいしいって？', options: ['朝ごはん', 'お茶', 'ラーメン'], answer: 0, hint: '「早餐」＝朝ごはん。右の壁のレストランの看板にもあるよ' },
        { type: 'say', hamster: '「本当？」は<b>真的吗？</b>', options: [{ zh: '真的吗？', py: 'Zhēn de ma?', ja: '本当？' }, 'ruzhu', 'maidan'], answer: 0 },
        { type: 'line', zh: '真的！明天一定要试试！', py: 'Zhēn de! Míngtiān yídìng yào shìshi!', ja: '本当よ！明日ぜひ食べてみて！' },
      ],
    },
    {
      id: 'laptop', name: '出張中のビジネス客', emoji: '💻',
      look: { top: '#3A4A5A', bottom: '#2B2B2B', hair: '#1E1A18' },
      sit: { x: -9, z: 5.55, rot: 0 },
      script: [
        { type: 'understand', zh: '请问，Wi-Fi 密码是多少？', py: 'Qǐngwèn, Wi-Fi mìmǎ shì duōshao?', ja: 'すみません、Wi-Fi のパスワードは何ですか？',
          q: '何を聞かれた？', options: ['Wi-Fi のパスワード', '部屋の値段', 'トイレの場所'], answer: 0, hint: '「多少」は「いくら」以外に「何番？」にも使えるよ' },
        { type: 'say', hamster: 'わからないね…「わかりません」は<b>我不知道</b>', options: [{ zh: '我不知道。', py: 'Wǒ bù zhīdào.', ja: 'わかりません' }, 'haode', 'haochi'], answer: 0 },
        { type: 'line', zh: '没关系！我问问前台。', py: 'Méi guānxi! Wǒ wènwen qiántái.', ja: '大丈夫！フロントに聞いてみるよ。', hamster: '「没关系」＝大丈夫・気にしないで' },
      ],
    },
    {
      id: 'girl', name: '元気な女の子', emoji: '👧',
      look: { top: '#FF9EAA', bottom: '#F4EFE6', hair: '#2B2220', hairStyle: 'long', scale: 0.6 },
      stand: { x: -4.2, z: 11.2, rot: Math.PI / 4 },
      script: [
        { type: 'say', zh: '你好！', py: 'Nǐ hǎo!', ja: 'こんにちは！', hamster: 'あいさつを返そう', options: ['nihao', 'zaijian', 'maidan'], answer: 0 },
        { type: 'understand', zh: '我五岁了！', py: 'Wǒ wǔ suì le!', ja: '5さいだよ！',
          q: '何歳って言った？', options: ['5歳', '3歳', '10歳'], answer: 0, hint: '「五（wǔ）」＝5。屋台で覚えた数字だね' },
        { type: 'say', hamster: '「かわいいね」は<b>好可爱</b>', options: [{ zh: '好可爱！', py: 'Hǎo kě’ài!', ja: 'かわいいね！' }, 'maidan', 'ruzhu'], answer: 0 },
        { type: 'line', zh: '仓鼠也好可爱！', py: 'Cāngshǔ yě hǎo kě’ài!', ja: 'ハムスターもかわいい！', hamster: 'えへへ…🐹' },
      ],
    },
    {
      id: 'checkout', name: 'チェックアウトする旅行者', emoji: '🧳',
      look: { top: '#2BB5A0', bottom: '#4A5560', hair: '#3B2A20', backpack: '#5B6BB8' },
      path: [[-3, 4], [-3, -6.5], [3, -6.5], [3, 4]],
      script: [
        { type: 'say', zh: '你好！你也住这儿吗？', py: 'Nǐ hǎo! Nǐ yě zhù zhèr ma?', ja: 'こんにちは！あなたもここに泊まってるの？',
          hamster: '「はい」と答えよう。<b>是的</b>＝はい', options: [SHIDE, 'duoshao', 'cesuo'], answer: 0 },
        { type: 'understand', zh: '我今天退房，要去北京。', py: 'Wǒ jīntiān tuìfáng, yào qù Běijīng.', ja: '今日チェックアウトして、北京に行くんだ。',
          q: 'どこへ行くって？', options: ['北京', '東京', '成都'], answer: 0, hint: '「北京（Běijīng）」が聞こえたかな？' },
        { type: 'say', hamster: '気をつけてね！お別れしよう', options: ['zaijian', 'haochi', 'ruzhu'], answer: 0 },
      ],
    },
    {
      id: 'housekeeper', name: 'ルームサービスのスタッフ', emoji: '🧺',
      look: { top: '#E8DCC8', bottom: '#5A3A26', hair: '#2B2220', hairStyle: 'bun' },
      stand: { x: 105, z: 1.15, rot: -Math.PI / 2 },
      script: [
        { type: 'understand', zh: '您好！需要打扫房间吗？', py: 'Nín hǎo! Xūyào dǎsǎo fángjiān ma?', ja: 'こんにちは！お部屋の掃除は必要ですか？',
          q: '何を聞かれた？', options: ['部屋の掃除が必要か', 'チェックアウトの時間', '朝ごはんの場所'], answer: 0, hint: '「打扫（dǎsǎo）」＝掃除する' },
        { type: 'say', hamster: 'まだ大丈夫だね。「大丈夫です、ありがとう」は<b>不用，谢谢</b>',
          options: [{ zh: '不用，谢谢。', py: 'Búyòng, xièxie.', ja: '大丈夫です、ありがとう' }, 'ruzhu', 'yaozhege'], answer: 0 },
        { type: 'line', zh: '好的！有需要请找我。', py: 'Hǎo de! Yǒu xūyào qǐng zhǎo wǒ.', ja: 'かしこまりました！何かあれば呼んでください。' },
        { type: 'say', hamster: 'お礼を言おう', options: ['xiexie', BUKEQI, 'zaijian'], answer: 0 },
      ],
    },
  ];

  function buildHotel(THREE, scene) {
    const Md = App.Models3D;
    const colliders = [];
    const readables = [];
    const read = (obj, id, extra) => readables.push(Md.readable(obj, id, extra));
    const rect = (minX, maxX, minZ, maxZ) => { const c = { minX, maxX, minZ, maxZ }; colliders.push(c); return c; };
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
    const signOpts = (o) => Object.assign({ bg: '#3B2618', accent: '#D9A441', sub: '#F3E2C0' }, o);

    /* ---------- 空・光（夕方） ---------- */
    scene.background = new THREE.Color('#33406A');
    scene.fog = new THREE.Fog('#33406A', 60, 160);
    scene.add(new THREE.HemisphereLight(0xfff1dc, 0x6e5a48, 0.7));
    scene.add(new THREE.AmbientLight(0xffffff, 0.14));
    const dir = new THREE.DirectionalLight(0xffe2b8, 0.3);
    dir.position.set(10, 20, 12);
    scene.add(dir);
    const warm = (x, y, z, intensity = 0.6, dist = 22) => {
      const l = new THREE.PointLight(0xffd59a, intensity, dist, 1.6);
      l.position.set(x, y, z);
      scene.add(l);
    };

    const woodDark = M('#6B4226');
    const woodMid = M('#8A5A3C');
    const gold = M('#D9A441', { metalness: 0.5, roughness: 0.35 });
    const marble = M('#F3EEE6', { roughness: 0.3 });
    const wallMat = M('#EFE3D1');
    const wainscot = M('#7A5236');
    const metal = M('#BFC6CC', { metalness: 0.6, roughness: 0.3 });
    const dark = M('#2F2A28', { roughness: 0.5 });
    const glass = new THREE.MeshStandardMaterial({ color: '#BFD8F0', transparent: true, opacity: 0.25, roughness: 0.1, depthWrite: false });
    const leafMat = M('#4E9A55');
    const potMat = M('#C9A37A');

    /* ======================= ロビー ======================= */
    const marbleTex = tex(512, 512, (g, w, h) => {
      g.fillStyle = '#E2D6C3'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#D6C6AE'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2);
      g.strokeStyle = 'rgba(160,140,110,.25)'; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        g.beginPath(); g.moveTo(Math.random() * w, 0);
        g.bezierCurveTo(Math.random() * w, h * 0.3, Math.random() * w, h * 0.7, Math.random() * w, h);
        g.stroke();
      }
      g.strokeStyle = '#CBB99E'; g.lineWidth = 3;
      g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    }, [7, 8]);
    plane(28, 32, new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.6 }), 0, 0, 0, -Math.PI / 2);

    const rugTex = tex(512, 768, (g, w, h) => {
      g.fillStyle = '#8E3B2F'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#D9A441'; g.lineWidth = 18; g.strokeRect(28, 28, w - 56, h - 56);
      g.lineWidth = 4; g.strokeRect(60, 60, w - 120, h - 120);
      g.fillStyle = 'rgba(217,164,65,.55)';
      for (let y = 120; y < h - 100; y += 80) {
        for (let x = 110; x < w - 90; x += 80) {
          g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 18, y); g.lineTo(x, y + 18); g.lineTo(x - 18, y); g.closePath(); g.fill();
        }
      }
    });
    plane(8, 12, new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.9 }), 0, 0.01, 3, -Math.PI / 2);

    // 壁
    box(28, LH, 0.4, wallMat, 0, LH / 2, -16, { collide: true });
    box(0.4, LH, 32, wallMat, -14, LH / 2, 0, { collide: true });
    box(0.4, LH, 32, wallMat, 14, LH / 2, 0, { collide: true });
    box(11, LH, 0.4, wallMat, -8.5, LH / 2, 16, { collide: true });
    box(11, LH, 0.4, wallMat, 8.5, LH / 2, 16, { collide: true });
    box(6, LH - 3.2, 0.4, wallMat, 0, 3.2 + (LH - 3.2) / 2, 16);
    box(6, 3.2, 0.1, glass, 0, 1.6, 16, { collide: true });
    [-3, 0, 3].forEach((x) => box(0.12, 3.2, 0.25, gold, x, 1.6, 16));
    box(6, 0.15, 0.3, gold, 0, 3.2, 16);
    // 腰壁（木）
    box(0.06, 1.1, 32, wainscot, -13.78, 0.55, 0);
    box(0.06, 1.1, 32, wainscot, 13.78, 0.55, 0);
    box(28, 1.1, 0.06, wainscot, 0, 0.55, -15.78);
    box(0.08, 0.06, 32, gold, -13.76, 1.12, 0);
    box(0.08, 0.06, 32, gold, 13.76, 1.12, 0);
    // 天井・シャンデリア
    plane(28, 32, M('#FBF6EE'), 0, LH, 0, Math.PI / 2);
    const lampMat = new THREE.MeshBasicMaterial({ color: '#FFE7B8' });
    for (let x = -9; x <= 9; x += 6) for (let z = -12; z <= 12; z += 8) cyl(0.45, 0.45, 0.06, lampMat, x, LH - 0.03, z, 18);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.06, 8, 40), gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, LH - 1.4, 3);
    scene.add(ring);
    cyl(0.03, 0.03, 1.3, gold, 0, LH - 0.7, 3, 6);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      sph(0.14, lampMat, Math.cos(a) * 1.4, LH - 1.6, 3 + Math.sin(a) * 1.4);
    }
    sph(0.35, lampMat, 0, LH - 1.8, 3);
    warm(0, LH - 2, 3, 0.55, 24);
    warm(0, 5, -10, 0.3, 14);

    // 柱
    [-6, 6].forEach((x) => [-4, 8].forEach((z) => {
      cyl(0.45, 0.45, LH, M('#E8DCC8'), x, LH / 2, z);
      cyl(0.55, 0.55, 0.3, gold, x, 0.15, z);
      cyl(0.55, 0.55, 0.2, gold, x, LH - 0.1, z);
      rect(x - 0.5, x + 0.5, z - 0.5, z + 0.5);
    }));

    // 植物
    const plant = (x, z, s = 1) => {
      cyl(0.32 * s, 0.26 * s, 0.6 * s, potMat, x, 0.3 * s, z);
      sph(0.5 * s, leafMat, x, 1.0 * s, z);
      sph(0.36 * s, M('#6DB86A'), x + 0.12, 1.4 * s, z - 0.1);
      rect(x - 0.4 * s, x + 0.4 * s, z - 0.4 * s, z + 0.4 * s);
    };
    [[-12.8, 14.6], [12.8, 14.6], [-12.8, -14.6], [12.8, -14.6], [-6.8, 14.2]].forEach(([x, z]) => plant(x, z));

    /* ---------- フロント ---------- */
    box(16, 4.5, 0.3, M('#5A3A26'), 0, 2.25, -15.65);
    read(Md.sign(THREE, scene, signOpts({ zh: '仓鼠大酒店', en: 'Hamster Grand Hotel' }), 6, 0, 3.2, -15.45), 'hotelName');
    box(12, 1.15, 1.2, woodDark, 0, 0.575, -11);
    box(12.3, 0.08, 1.4, marble, 0, 1.19, -11);
    box(12, 0.08, 0.02, gold, 0, 0.95, -10.39);
    box(12, 0.08, 0.02, gold, 0, 0.25, -10.39);
    [-3.5, 3.5].forEach((x) => {
      box(0.6, 0.42, 0.05, dark, x, 1.48, -11.3);
      box(0.08, 0.2, 0.08, dark, x, 1.28, -11.32);
    });
    const bellBase = cyl(0.12, 0.12, 0.03, gold, 1.2, 1.25, -10.75, 16);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold);
    bell.position.set(1.2, 1.26, -10.75);
    scene.add(bell, bellBase);
    rect(-6.2, 6.2, -15.8, -10.35);
    read(Md.sign(THREE, scene, signOpts({ zh: '前台', en: 'Reception' }), 3.6, 0, 4.4, -9.5, 0, { hang: LH - 4.4 - 0.45 }), 'reception');

    const wang = Md.staff(THREE, { uniform: '#5A2E2E', scarf: '#D9A441' });
    wang.position.set(0, 0, -12.2);
    scene.add(wang);

    /* ---------- エレベーター（左の壁） ---------- */
    const elevatorDoors = (x, z, rotY, n = 2) => {
      for (let k = 0; k < n; k++) {
        const zz = z + (k - (n - 1) / 2) * 2.6;
        const g = new THREE.Group();
        box(2.0, 2.8, 0.15, M('#B8A58A', { metalness: 0.4 }), 0, 1.4, 0, { parent: g });
        box(0.88, 2.55, 0.06, metal, -0.46, 1.28, 0.08, { parent: g });
        box(0.88, 2.55, 0.06, metal, 0.46, 1.28, 0.08, { parent: g });
        box(0.5, 0.18, 0.04, M('#1A1A1A'), 0, 2.95, 0.08, { parent: g });
        box(0.12, 0.24, 0.04, gold, 1.25, 1.2, 0.08, { parent: g });
        g.position.set(x, 0, zz);
        g.rotation.y = rotY;
        scene.add(g);
      }
    };
    elevatorDoors(-13.72, -4.5, Math.PI / 2);
    read(Md.sign(THREE, scene, signOpts({ zh: '电梯', en: 'Elevator' }), 3, -13.7, 3.75, -4.5, Math.PI / 2), 'elevator');

    /* ---------- レストラン（右の壁） ---------- */
    box(0.1, 2.8, 2.6, M('#2C1E16'), 13.75, 1.4, -4);
    box(0.12, 0.15, 3, gold, 13.73, 2.85, -4);
    read(Md.sign(THREE, scene, signOpts({ zh: '餐厅', en: 'Restaurant' }), 3, 13.7, 3.75, -4, -Math.PI / 2), 'restaurant');
    read(Md.sign(THREE, scene, signOpts({ zh: '早餐 6:30–10:00', en: 'Breakfast' }), 2, 13.72, 1.6, -1.6, -Math.PI / 2), 'breakfast');

    /* ---------- ラウンジ（右手前） ---------- */
    const sofaMat = M('#2F6F6A');
    box(0.8, 0.5, 2.8, sofaMat, 12.2, 0.25, 7);
    box(0.25, 0.95, 2.8, sofaMat, 12.7, 0.6, 7);
    box(0.8, 0.7, 0.25, sofaMat, 12.2, 0.35, 5.5);
    box(0.8, 0.7, 0.25, sofaMat, 12.2, 0.35, 8.5);
    rect(11.75, 13.0, 5.3, 8.7);
    box(1.8, 0.42, 1.0, woodDark, 9.8, 0.21, 7, { collide: true });
    box(1.9, 0.04, 1.1, marble, 9.8, 0.44, 7);
    cyl(0.12, 0.12, 0.12, M('#FFFFFF'), 9.5, 0.52, 6.8, 12);
    cyl(0.1, 0.08, 0.16, M('#2BB5A0'), 10.2, 0.54, 7.2, 12);
    // 一人がけソファ
    [[8.2, 4.8], [8.2, 9.2]].forEach(([x, z]) => {
      box(0.9, 0.48, 0.9, sofaMat, x, 0.24, z);
      box(0.9, 0.8, 0.2, sofaMat, x, 0.6, z + (z < 7 ? -0.4 : 0.4));
      rect(x - 0.5, x + 0.5, z - 0.5, z + 0.5);
    });

    /* ---------- ビジネス客のテーブル（左） ---------- */
    cyl(0.6, 0.6, 0.05, woodMid, -9, 0.75, 6.4, 24);
    cyl(0.06, 0.06, 0.72, dark, -9, 0.37, 6.4, 8);
    cyl(0.35, 0.35, 0.04, dark, -9, 0.02, 6.4, 16);
    box(0.5, 0.08, 0.5, woodMid, -9, 0.5, 5.5);
    box(0.5, 0.6, 0.06, woodMid, -9, 0.8, 5.22);
    box(0.4, 0.02, 0.28, M('#9AA5AE', { metalness: 0.4 }), -9, 0.79, 6.45);
    const screen = box(0.4, 0.26, 0.02, M('#2F3740'), -9, 0.92, 6.6);
    screen.rotation.x = -0.3;
    rect(-9.7, -8.3, 5.1, 7.05);

    /* ---------- 絵（左の壁） ---------- */
    const artTex = tex(512, 300, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#F6E7C8'); grd.addColorStop(1, '#E9D3A8');
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
      g.fillStyle = '#7C8C7A';
      g.beginPath(); g.moveTo(0, h * 0.75); g.lineTo(w * 0.2, h * 0.3); g.lineTo(w * 0.35, h * 0.6); g.lineTo(w * 0.55, h * 0.2); g.lineTo(w * 0.8, h * 0.65); g.lineTo(w, h * 0.4); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#5E6E5C';
      g.beginPath(); g.moveTo(0, h * 0.85); g.lineTo(w * 0.3, h * 0.55); g.lineTo(w * 0.6, h * 0.8); g.lineTo(w, h * 0.6); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#C0504D'; g.beginPath(); g.arc(w * 0.8, h * 0.22, 22, 0, Math.PI * 2); g.fill();
    });
    box(0.1, 2.6, 4.2, gold, -13.78, 3, 9);
    plane(4, 2.4, new THREE.MeshBasicMaterial({ map: artTex }), -13.72, 3, 9, 0, Math.PI / 2);

    /* ---------- 入口の荷物カート ---------- */
    const cartG = new THREE.Group();
    box(1.1, 0.06, 0.7, gold, 0, 0.25, 0, { parent: cartG });
    [-0.5, 0.5].forEach((x) => cyl(0.03, 0.03, 1.7, gold, x, 1.1, 0, 8, cartG));
    box(1.1, 0.05, 0.05, gold, 0, 1.95, 0, { parent: cartG });
    box(0.5, 0.6, 0.3, M('#C0504D'), -0.2, 0.6, 0, { parent: cartG });
    box(0.4, 0.45, 0.28, M('#2BB5A0'), 0.25, 0.52, 0.05, { parent: cartG });
    cartG.position.set(5.8, 0, 13.2);
    scene.add(cartG);
    rect(5.15, 6.45, 12.75, 13.65);

    /* ======================= 3 階の廊下（x: 90〜112） ======================= */
    const carpetTex = tex(256, 256, (g, w, h) => {
      g.fillStyle = '#2F5E66'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#D9A441'; g.lineWidth = 3;
      g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = 'rgba(217,164,65,.6)';
      g.beginPath(); g.arc(w / 2, h / 2, 20, 0, Math.PI * 2); g.fill();
    }, [11, 2]);
    plane(22, 4, new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.95 }), 101, 0, 0, -Math.PI / 2);
    plane(22, 4, M('#F7F1E6'), 101, CH, 0, Math.PI / 2);
    const cWall = M('#EADBC4');
    box(0.3, CH, 4.6, cWall, 89.85, CH / 2, 0, { collide: true });
    box(0.3, CH, 4.6, cWall, 112.15, CH / 2, 0, { collide: true });
    box(22.6, CH, 0.3, cWall, 101, CH / 2, 2.15, { collide: true });
    // 北の壁（302 の入口だけ空ける）
    box(7.4, CH, 0.3, cWall, 93.7, CH / 2, -2.15, { collide: true });
    box(13.4, CH, 0.3, cWall, 105.3, CH / 2, -2.15, { collide: true });
    box(1.2, CH - 2.35, 0.3, cWall, 98, 2.35 + (CH - 2.35) / 2, -2.15);
    box(22, 0.9, 0.04, wainscot, 101, 0.45, -1.98);
    box(22, 0.9, 0.04, wainscot, 101, 0.45, 1.98);
    for (let x = 93; x <= 109; x += 4) {
      box(0.8, 0.05, 0.4, lampMat, x, CH - 0.03, 0);
    }
    warm(95, CH - 0.4, 0, 0.5, 12);
    warm(106, CH - 0.4, 0, 0.5, 12);

    // ドア
    const doorMat = M('#7A5236');
    const plate = (num, x, z, rotY) => Md.sign(THREE, scene, signOpts({ zh: String(num), w: 512, h: 256 }), 0.5, x, 1.7, z, rotY);
    const decoDoor = (num, x, north) => {
      const z = north ? -1.98 : 1.98;
      box(1.1, 2.3, 0.06, doorMat, x, 1.15, z);
      box(1.3, 0.1, 0.08, gold, x, 2.33, z);
      box(0.06, 0.06, 0.1, gold, x + 0.4, 1.05, z + (north ? 0.05 : -0.05));
      plate(num, x + 0.95, north ? -1.95 : 1.95, north ? 0 : Math.PI);
    };
    [[301, 94], [303, 102], [304, 106], [305, 110]].forEach(([n, x]) => decoDoor(n, x, true));
    [[306, 94], [307, 98], [308, 102], [309, 106], [310, 110]].forEach(([n, x]) => decoDoor(n, x, false));
    // 302 のドア（開く）
    const hinge = new THREE.Group();
    hinge.position.set(97.45, 0, -2.0);
    box(1.1, 2.3, 0.06, doorMat, 0.55, 1.15, 0, { parent: hinge });
    box(0.06, 0.06, 0.1, gold, 0.95, 1.05, 0.05, { parent: hinge });
    scene.add(hinge);
    box(1.3, 0.1, 0.08, gold, 98, 2.33, -1.98);
    plate(302, 98.95, -1.95, 0);
    const doorCollider = rect(97.4, 98.6, -2.3, -1.95);
    const door302 = { hinge, collider: doorCollider, open: false };

    // エレベーター（西端）と非常口（東端）
    elevatorDoors(90.02, 0, Math.PI / 2, 1);
    read(Md.sign(THREE, scene, signOpts({ zh: '电梯 3F', en: 'Elevator' }), 1.6, 90.05, 2.85, -1.4, Math.PI / 2), 'elevator3');
    box(0.08, 2.4, 1.2, M('#3E6B4A'), 112, 1.2, 0);
    read(Md.sign(THREE, scene, { zh: '安全出口', en: 'Emergency Exit', arrow: '→', bg: '#2F8F4E', accent: '#D9F5E3', sub: '#D9F5E3' }, 1.8, 111.95, 2.75, 0, -Math.PI / 2), 'emergencyExit');
    // 廊下の小さな植物
    plant(111.2, -1.4, 0.7);

    /* ======================= 302 号室（x: 94〜102, z: -9〜-2） ======================= */
    const floorTex = tex(256, 256, (g, w, h) => {
      g.fillStyle = '#B88A5E'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#9C7148'; g.lineWidth = 3;
      for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      for (let y = 0; y < h; y += 32) { const x = ((y / 32) % 2) * 96 + 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); }
    }, [3, 3]);
    plane(8, 7, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 }), 98, 0.002, -5.65, -Math.PI / 2);
    plane(8, 7, M('#FBF6EE'), 98, CH, -5.65, Math.PI / 2);
    const rWall = M('#F2E8DA');
    box(0.3, CH, 7.4, rWall, 93.85, CH / 2, -5.65, { collide: true });
    box(0.3, CH, 7.4, rWall, 102.15, CH / 2, -5.65, { collide: true });
    // 奥の壁（窓つき）
    box(8.6, 0.9, 0.3, rWall, 98, 0.45, -9.15);
    box(8.6, 0.6, 0.3, rWall, 98, CH - 0.3, -9.15);
    rect(93.7, 102.3, -9.3, -9.0);
    const nightTex = tex(1024, 400, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#1B2448'); grd.addColorStop(0.6, '#3B3F78'); grd.addColorStop(1, '#C77A6A');
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
      g.fillStyle = '#FFFFFF';
      for (let i = 0; i < 60; i++) g.fillRect(Math.random() * w, Math.random() * h * 0.4, 2, 2);
      for (let i = 0; i < 26; i++) {
        const bw = 30 + Math.random() * 50;
        const bh = 80 + Math.random() * 200;
        const bx = (i / 26) * w + Math.random() * 10;
        g.fillStyle = '#141A33'; g.fillRect(bx, h - bh, bw, bh);
        g.fillStyle = 'rgba(255,214,140,.85)';
        for (let yy = h - bh + 10; yy < h - 8; yy += 14) for (let xx = bx + 5; xx < bx + bw - 6; xx += 10) if (Math.random() < 0.45) g.fillRect(xx, yy, 4, 6);
      }
      // 遠くのタワー
      g.fillStyle = '#141A33'; g.fillRect(w * 0.62, h * 0.18, 10, h * 0.82);
      g.fillStyle = '#E86F9A'; g.beginPath(); g.arc(w * 0.62 + 5, h * 0.42, 22, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(w * 0.62 + 5, h * 0.7, 30, 0, Math.PI * 2); g.fill();
    });
    plane(7.6, CH - 1.5, new THREE.MeshBasicMaterial({ map: nightTex }), 98, 0.9 + (CH - 1.5) / 2, -9.0);
    [94.5, 98, 101.5].forEach((x) => box(0.08, CH - 1.5, 0.08, woodDark, x, 0.9 + (CH - 1.5) / 2, -8.98));
    // カーテン
    box(0.7, CH - 0.7, 0.08, M('#B5584A'), 94.4, (CH - 0.7) / 2 + 0.3, -8.9);
    box(0.7, CH - 0.7, 0.08, M('#B5584A'), 101.6, (CH - 0.7) / 2 + 0.3, -8.9);

    // ベッド
    box(2.4, 0.45, 2.5, woodDark, 96.2, 0.225, -7.5);
    box(2.3, 0.25, 2.4, M('#FFFFFF'), 96.2, 0.57, -7.5);
    box(2.3, 0.08, 1.5, M('#2BB5A0'), 96.2, 0.73, -6.95);
    box(2.31, 0.06, 0.22, gold, 96.2, 0.78, -6.35);
    [-0.55, 0.55].forEach((dx) => box(0.85, 0.18, 0.45, M('#FFFFFF'), 96.2 + dx, 0.8, -8.4));
    box(2.5, 1.2, 0.12, woodMid, 96.2, 0.85, -8.75);
    rect(94.95, 97.45, -8.85, -6.2);
    // ナイトテーブルとランプ
    box(0.5, 0.5, 0.45, woodDark, 97.85, 0.25, -8.4);
    cyl(0.05, 0.08, 0.3, gold, 97.85, 0.65, -8.4, 10);
    cyl(0.16, 0.22, 0.25, new THREE.MeshBasicMaterial({ color: '#FFE7B8' }), 97.85, 0.9, -8.4, 16);
    rect(97.55, 98.15, -8.65, -8.15);
    warm(98, CH - 0.5, -5.6, 0.5, 10);
    // テレビ（ドラマのイベントにつなげる）
    const tvTex = tex(512, 300, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, w, h);
      grd.addColorStop(0, '#F5B98A'); grd.addColorStop(1, '#8E5B8A');
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2F2240';
      g.beginPath(); g.arc(w * 0.35, h * 0.45, 40, 0, Math.PI * 2); g.fill(); g.fillRect(w * 0.35 - 45, h * 0.55, 90, 140);
      g.beginPath(); g.arc(w * 0.65, h * 0.42, 38, 0, Math.PI * 2); g.fill(); g.fillRect(w * 0.65 - 42, h * 0.52, 84, 150);
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, h - 56, w, 56);
      g.fillStyle = '#FFFFFF'; g.font = `bold 34px ${Md.FONT}`; g.textAlign = 'center';
      g.fillText('“你好吗？”', w / 2, h - 18);
    });
    box(0.5, 0.5, 1.8, woodDark, 101.7, 0.25, -5.4, { collide: true });
    box(0.06, 0.85, 1.5, M('#111111'), 101.95, 1.4, -5.4);
    plane(1.4, 0.78, new THREE.MeshBasicMaterial({ map: tvTex }), 101.91, 1.4, -5.4, 0, -Math.PI / 2);
    read({ x: 101.91, y: 1.4, z: -5.4, h: 0.78, rotY: -Math.PI / 2 }, 'tv', { en: 'TV', bg: '#2F2240' });
    // 机といす
    box(0.6, 0.75, 1.2, woodMid, 94.35, 0.375, -4.2, { collide: true });
    box(0.45, 0.08, 0.45, woodMid, 95.0, 0.48, -4.2);
    box(0.06, 0.55, 0.45, woodMid, 95.22, 0.78, -4.2);
    box(0.3, 0.02, 0.2, M('#FFFFFF'), 94.35, 0.76, -4.0);
    // スーツケース
    box(0.45, 0.65, 0.26, M('#FF8A3D'), 100.9, 0.36, -3.0);
    rect(100.6, 101.2, -3.2, -2.8);

    /* ======================= キャラクター ======================= */
    const hamster = Md.hamster(THREE);
    hamster.position.set(1.5, 0, 11.2);
    scene.add(hamster);
    const people = App.World3D.spawnPeople(THREE, scene, PEOPLE);

    return {
      colliders,
      bounds: null,
      spawn: { x: 0, z: 13.6, yaw: 0 },
      hamster,
      people,
      staff: wang,
      door302,
      places: {
        corridor: { x: 91.8, z: 0, yaw: -Math.PI / 2 },
        lobby: { x: -11.6, z: -4.5, yaw: -Math.PI / 2 },
      },
      interactables: [
        { id: 'desk', x: 0, z: -9.4, r: 3 },
        { id: 'elevator', x: -12.3, z: -4.5, r: 2.8 },
        { id: 'elevator3', x: 91.4, z: 0, r: 1.8 },
        { id: 'door301', x: 94, z: -1.2, r: 1.2 },
        { id: 'door302', x: 98, z: -1.2, r: 1.4 },
        { id: 'door303', x: 102, z: -1.2, r: 1.2 },
        { id: 'door304', x: 106, z: -1.2, r: 1.2 },
        { id: 'door305', x: 110, z: -1.2, r: 1.2 },
      ],
      tags: [{ obj: wang, y: 2.35, text: '🧑‍💼 前台（フロント）', maxDist: 16 }],
      readables,
      facePlayer: [wang],
      discoveries: [
        { id: 'elevator', x: -12.3, z: -4.5, r: 3.4, say: '<b>电梯</b>＝エレベーター！<br>「梯」は、はしごって意味なんだ' },
        { id: 'restaurant', x: 12.6, z: -3, r: 3.2, say: '<b>餐厅</b>＝レストラン、<b>早餐</b>＝朝ごはん！' },
        { id: 'exit', x: 110.6, z: 0, r: 2.2, say: '<b>安全出口</b>＝非常口。いざというときのために覚えておこう' },
        { id: 'tv', x: 100.3, z: -5.4, r: 1.9, say: '📺 テレビで中国ドラマをやってる！<br>「你好吗？」＝元気？…続きはまた今度！' },
      ],
      zones: [{ id: 'room', x1: 94.6, x2: 101.4, z1: -7.6, z2: -3.4 }],
      update(dt) {
        if (door302.open && hinge.rotation.y < 1.5) hinge.rotation.y = Math.min(1.5, hinge.rotation.y + dt * 2.2);
      },
    };
  }

  App.World3D = App.World3D || {};
  App.World3D.buildHotel = buildHotel;
})(window.App = window.App || {});
