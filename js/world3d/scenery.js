/* 3D の背景（空・雲・遠くの山・森）の共通部品
 *   sky(THREE, scene, { top, horizon, ground, sun, sunColor, sunSize })  グラデーションの空（カメラについてくる）＋太陽の光
 *   clouds(THREE, scene, { count, y, r, tint })          ふわふわの雲（カメラについてくる＝とても遠くに見える。tint で夕焼け色にも）
 *   farMountains(THREE, scene, { r, colors })            地平線の山なみ（カメラについてくる・霧なしの淡い色）
 *   forest(THREE, scene, points)                         木をまとめて置く（InstancedMesh で軽い）
 *     points: [{ x, y, z, s, kind: 'pine'|'round', color? }]
 * scene.userData.follow に入れたものは、engine.js が毎フレームカメラの位置に合わせる。
 */
(function (App) {
  'use strict';

  const follow = (scene, obj, withY) => {
    obj.userData.followY = !!withY;
    (scene.userData.follow || (scene.userData.follow = [])).push(obj);
  };

  // 再現できる乱数（毎回同じ景色になるように）
  function rand(seed = 1) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function sky(THREE, scene, { top = '#4F9BE0', horizon = '#D9ECF7', ground = '#CFE3C0', sun = [-0.45, 0.35, -0.8], sunColor = '#FFFFFF', sunSize = 80 } = {}) {
    const geo = new THREE.SphereGeometry(360, 32, 16);
    const cTop = new THREE.Color(top);
    const cHor = new THREE.Color(horizon);
    const cGnd = new THREE.Color(ground);
    const pos = geo.attributes.position;
    const colors = [];
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 360;
      if (y >= 0) c.copy(cHor).lerp(cTop, Math.pow(y, 0.55));
      else c.copy(cHor).lerp(cGnd, Math.min(1, -y * 4));
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    mesh.renderOrder = -10;
    mesh.frustumCulled = false;
    scene.add(mesh);
    follow(scene, mesh, true);

    // 太陽（やわらかい光のかたまり）
    const tex = App.Models3D.canvasTexture(THREE, 128, 128, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,240,1)');
      gr.addColorStop(0.18, 'rgba(255,248,214,.95)');
      gr.addColorStop(0.45, 'rgba(255,240,190,.35)');
      gr.addColorStop(1, 'rgba(255,240,190,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: sunColor, fog: false, depthWrite: false, transparent: true }));
    const v = new THREE.Vector3(sun[0], sun[1], sun[2]).normalize().multiplyScalar(330);
    glow.position.copy(v);
    glow.scale.set(sunSize, sunSize, 1);
    glow.renderOrder = -9;
    const holder = new THREE.Group();
    holder.add(glow);
    scene.add(holder);
    follow(scene, holder, true);
    return mesh;
  }

  function cloudTexture(THREE, seed) {
    const r = rand(seed);
    return App.Models3D.canvasTexture(THREE, 256, 128, (g, w, h) => {
      const puffs = 7 + Math.floor(r() * 4);
      for (let i = 0; i < puffs; i++) {
        const x = w * (0.18 + r() * 0.64);
        const y = h * (0.45 + r() * 0.25);
        const rad = h * (0.2 + r() * 0.2);
        const gr = g.createRadialGradient(x, y - rad * 0.2, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(0.65, 'rgba(255,255,255,.9)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x, y, rad, 0, Math.PI * 2);
        g.fill();
      }
      // 下の方を少し灰色にして立体感
      const sh = g.createLinearGradient(0, h * 0.5, 0, h);
      sh.addColorStop(0, 'rgba(190,205,225,0)');
      sh.addColorStop(1, 'rgba(190,205,225,.55)');
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = sh;
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
    });
  }

  function clouds(THREE, scene, { count = 14, y = [70, 120], r = [140, 300], seed = 7, tint = '#FFFFFF' } = {}) {
    const rnd = rand(seed);
    const group = new THREE.Group();
    const texes = [0, 1, 2].map((k) => cloudTexture(THREE, seed * 10 + k));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rnd() * 0.5;
      const d = r[0] + rnd() * (r[1] - r[0]);
      const mat = new THREE.SpriteMaterial({ map: texes[i % 3], color: tint, fog: false, depthWrite: false, transparent: true, opacity: 0.85 + rnd() * 0.15 });
      const sp = new THREE.Sprite(mat);
      const sc = 50 + rnd() * 60;
      sp.scale.set(sc, sc * 0.45, 1);
      sp.position.set(Math.cos(a) * d, y[0] + rnd() * (y[1] - y[0]), Math.sin(a) * d);
      sp.renderOrder = -8;
      group.add(sp);
    }
    scene.add(group);
    follow(scene, group, false);
    return group;
  }

  // 地平線の山なみ（2 列。奥ほど空に近い色）
  function farMountains(THREE, scene, { r = 300, colors = ['#86A9A0', '#A9C4CB'], height = [30, 80], seed = 3 } = {}) {
    const rnd = rand(seed);
    const group = new THREE.Group();
    colors.forEach((col, row) => {
      const mat = new THREE.MeshBasicMaterial({ color: col, fog: false });
      const rr = r + row * 30;
      const n = 22 + row * 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rnd() * 0.2;
        const hgt = height[0] + rnd() * (height[1] - height[0]) + row * 12;
        const m = new THREE.Mesh(new THREE.ConeGeometry(hgt * (0.9 + rnd() * 0.6), hgt, 6), mat);
        m.position.set(Math.cos(a) * rr, hgt / 2 - 6, Math.sin(a) * rr);
        m.rotation.y = rnd() * Math.PI;
        m.renderOrder = -7 + row;
        group.add(m);
      }
    });
    scene.add(group);
    follow(scene, group, false);
    return group;
  }

  // 木をまとめて置く。pine＝とがった針葉樹、round＝丸い広葉樹（紅葉の色も OK）
  function forest(THREE, scene, points) {
    const pines = points.filter((p) => p.kind !== 'round');
    const rounds = points.filter((p) => p.kind === 'round');
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    const make = (geo, list, place, colorOf) => {
      if (!list.length) return null;
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), list.length);
      list.forEach((p, i) => {
        const { y, sx, sy } = place(p);
        q.setFromAxisAngle(up, (p.x * 13.7 + p.z * 7.3) % (Math.PI * 2));
        m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(sx, sy, sx));
        mesh.setMatrixAt(i, m4);
        mesh.setColorAt(i, col.set(colorOf(p)));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      scene.add(mesh);
      return mesh;
    };
    const PINE = ['#2F6B3A', '#3A7A3F', '#2B5E36', '#46874A'];
    const ROUND = ['#5FA048', '#6DB04F', '#4E9440', '#7DB858'];
    const pick = (arr, p) => arr[Math.abs(Math.floor(p.x * 3.1 + p.z * 1.7)) % arr.length];
    const trunks = new THREE.CylinderGeometry(0.12, 0.18, 1, 5);
    trunks.translate(0, 0.5, 0);
    make(trunks, points, (p) => ({ y: p.y - 0.2, sx: p.s, sy: p.s * 1.4 }), () => '#6B4A30');
    const cone = new THREE.ConeGeometry(1.1, 2.8, 7);
    cone.translate(0, 2.3, 0);
    make(cone, pines, (p) => ({ y: p.y, sx: p.s, sy: p.s }), (p) => p.color || pick(PINE, p));
    const ball = new THREE.IcosahedronGeometry(1.25, 0);
    ball.translate(0, 2.2, 0);
    make(ball, rounds, (p) => ({ y: p.y, sx: p.s, sy: p.s * 0.95 }), (p) => p.color || pick(ROUND, p));
  }

  App.Scenery3D = { sky, clouds, farMountains, forest, rand };
})(window.App = window.App || {});
