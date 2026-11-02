/* 3D 用の共通パーツ：テクスチャ付き看板・ハムスター・NPC
 * どの 3D シーン（空港・ホテル…）でも使い回せるようにここにまとめる
 */
(function (App) {
  'use strict';

  const FONT = '"Noto Sans SC", "M PLUS Rounded 1c", "Microsoft YaHei", "PingFang SC", sans-serif';

  function canvasTexture(THREE, w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  // 「中国語（大）＋英語（小）＋矢印」の空港サイン
  function signTexture(THREE, { zh, en = '', arrow = '', bg = '#1F4E79', fg = '#FFFFFF', sub = '#CFE3F5', accent = '#FFC23D', w = 1024, h = 256 }) {
    return canvasTexture(THREE, w, h, (g) => {
      g.fillStyle = bg;
      roundRect(g, 0, 0, w, h, h * 0.12);
      g.fill();
      g.fillStyle = accent;
      g.fillRect(h * 0.12, h * 0.9, w - h * 0.24, h * 0.05);
      const pad = h * 0.2;
      if (arrow) {
        g.fillStyle = accent;
        g.font = `bold ${h * 0.62}px ${FONT}`;
        g.textAlign = 'right';
        g.textBaseline = 'middle';
        g.fillText(arrow, w - pad, h * 0.48);
      }
      g.textAlign = 'left';
      g.textBaseline = 'alphabetic';
      g.fillStyle = fg;
      g.font = `bold ${h * (en ? 0.42 : 0.5)}px ${FONT}`;
      g.fillText(zh, pad, en ? h * 0.52 : h * 0.66);
      if (en) {
        g.fillStyle = sub;
        g.font = `bold ${h * 0.2}px ${FONT}`;
        g.fillText(en, pad, h * 0.8);
      }
    });
  }

  // 看板（裏側は板で隠す）。front は +z 向き。rotY で向きを変える
  function sign(THREE, parent, opts, width, x, y, z, rotY = 0, { hang = 0 } = {}) {
    const tex = signTexture(THREE, opts);
    const w = opts.w || 1024;
    const h = opts.h || 256;
    const height = width * (h / w);
    const g = new THREE.Group();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex }));
    face.position.z = 0.051;
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.1),
      new THREE.MeshStandardMaterial({ color: opts.bg || '#1F4E79', roughness: 0.6 })
    );
    g.add(back, face);
    if (hang > 0) {
      const rodMat = new THREE.MeshStandardMaterial({ color: '#8A97A3', metalness: 0.4, roughness: 0.4 });
      [-width * 0.35, width * 0.35].forEach((rx) => {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, hang, 6), rodMat);
        rod.position.set(rx, height / 2 + hang / 2, 0);
        g.add(rod);
      });
    }
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    parent.add(g);
    return g;
  }

  /* ---------- ハムスター（2D 版と同じ配色） ---------- */
  function hamster(THREE) {
    const g = new THREE.Group();
    const M = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const S = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      g.add(m);
      return m;
    };
    const fur = M('#F4B26A');
    const furDark = M('#E9A060');
    const cream = M('#FFF5E6');
    const pink = M('#F6B3A9');
    const black = new THREE.MeshStandardMaterial({ color: '#2A1E16', roughness: 0.3 });
    const white = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
    const cheek = new THREE.MeshStandardMaterial({ color: '#FF8F8F', roughness: 0.9, transparent: true, opacity: 0.75 });

    S(0.5, fur, 0, 0.5, 0, 1, 0.92, 0.95);               // からだ
    S(0.38, cream, 0, 0.42, 0.2, 1, 0.95, 0.65);          // おなか・口元
    [-1, 1].forEach((s) => {
      S(0.14, furDark, 0.3 * s, 0.92, -0.02);             // 耳
      S(0.08, pink, 0.3 * s, 0.93, 0.06, 1, 1, 0.5);
      S(0.06, black, 0.17 * s, 0.62, 0.43);                // 目
      S(0.022, white, 0.15 * s, 0.655, 0.485);
      S(0.08, cheek, 0.3 * s, 0.5, 0.36, 1, 0.6, 0.4);    // ほっぺ
      S(0.08, M('#F9CDB0'), 0.18 * s, 0.12, 0.3, 1, 0.6, 1); // 足
    });
    S(0.035, M('#D9706A'), 0, 0.545, 0.47);               // 鼻

    // 麦わら帽子
    const hat = new THREE.Group();
    const straw = M('#F2CD6B');
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 28), straw);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.18, 24), M('#F7D985'));
    crown.position.y = 0.1;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.05, 24), M('#2BB5A0'));
    band.position.y = 0.04;
    hat.add(brim, crown, band);
    hat.position.set(0.04, 0.95, 0);
    hat.rotation.z = -0.15;
    g.add(hat);

    return g;
  }

  /* ---------- NPC（係員） ---------- */
  function staff(THREE, { uniform = '#24476B', scarf = '#2BB5A0' } = {}) {
    const g = new THREE.Group();
    const M = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.2, 20), M(uniform));
    body.position.y = 0.95;
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.4, 16), M('#1D2B3A'));
    legs.position.y = 0.2;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.12, 16), M(scarf));
    neck.position.y = 1.6;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), M('#F1CBA5'));
    head.position.y = 1.85;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.255, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), M('#2B2220'));
    hair.position.y = 1.87;
    hair.rotation.x = -0.25;
    const eyeMat = M('#2A1E16');
    [-1, 1].forEach((s) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), eyeMat);
      eye.position.set(0.08 * s, 1.87, 0.22);
      g.add(eye);
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), M('#A0524A'));
    smile.position.set(0, 1.79, 0.225);
    smile.rotation.z = Math.PI;
    g.add(body, legs, neck, head, hair, smile);
    return g;
  }

  /* ---------- 一般の人（歩く・座る・立つ） ----------
   * 腰・ひざ・肩に関節（Group）があり、animateWalk で手足を振る。
   * sitting: true でベンチに座るポーズ（座面の高さ 0.55）
   */
  function person(THREE, o = {}) {
    const {
      top = '#5B8DB8', bottom = '#3A4A5A', skin = '#F1CBA5', hair = '#2B2220', hairStyle = 'short',
      scale = 1, backpack = null, bag = null, cap = null, camera = false, mop = false, sitting = false,
    } = o;
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 });
    const mesh = (geo, mat, x, y, z, parent = body) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    const HIP = 0.87;
    const limbs = { legs: [], knees: [], arms: [] };
    const topMat = M(top);
    const bottomMat = M(bottom);
    const skinMat = M(skin);
    const hairMat = M(hair);

    [-1, 1].forEach((s) => {
      const hip = new THREE.Group();
      hip.position.set(0.1 * s, HIP, 0);
      mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.44, 10), bottomMat, 0, -0.22, 0, hip);
      const knee = new THREE.Group();
      knee.position.y = -0.44;
      hip.add(knee);
      mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.38, 10), bottomMat, 0, -0.19, 0, knee);
      mesh(new THREE.BoxGeometry(0.13, 0.08, 0.24), M('#2F2A28'), 0, -0.4, 0.05, knee);
      body.add(hip);
      limbs.legs.push(hip);
      limbs.knees.push(knee);

      const sh = new THREE.Group();
      sh.position.set(0.31 * s, 1.42, 0);
      mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.56, 10), topMat, 0, -0.28, 0, sh);
      mesh(new THREE.SphereGeometry(0.06, 10, 8), skinMat, 0, -0.58, 0, sh);
      body.add(sh);
      limbs.arms.push(sh);
    });

    mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.62, 16), topMat, 0, 1.17, 0);
    mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.1, 10), skinMat, 0, 1.51, 0);
    mesh(new THREE.SphereGeometry(0.19, 20, 16), skinMat, 0, 1.68, 0);
    const eyeMat = M('#2A1E16');
    [-1, 1].forEach((s) => mesh(new THREE.SphereGeometry(0.025, 8, 6), eyeMat, 0.07 * s, 1.7, 0.172));

    const cap0 = mesh(new THREE.SphereGeometry(0.2, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat, 0, 1.7, -0.01);
    cap0.rotation.x = -0.35;
    if (hairStyle === 'long') mesh(new THREE.BoxGeometry(0.36, 0.38, 0.12), hairMat, 0, 1.55, -0.12);
    if (hairStyle === 'bun') mesh(new THREE.SphereGeometry(0.09, 12, 10), hairMat, 0, 1.86, -0.12);
    if (cap) {
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 18), M(cap), 0, 1.84, 0);
      mesh(new THREE.BoxGeometry(0.26, 0.03, 0.16), M(cap), 0, 1.8, 0.2);
    }
    if (backpack) {
      mesh(new THREE.BoxGeometry(0.36, 0.46, 0.18), M(backpack), 0, 1.18, -0.25);
      mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), M('#FFFFFF'), 0, 1.05, -0.36);
    }
    if (bag) mesh(new THREE.BoxGeometry(0.3, 0.24, 0.08), M(bag), -0.38, 0.9, 0.04);
    if (camera) {
      mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), M('#2F3740'), 0, 1.32, 0.3);
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10), M('#111111'), 0, 1.32, 0.36).rotation.x = Math.PI / 2;
    }
    if (mop) {
      const stick = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6), M('#B08A5A'), 0.42, 0.78, 0.25);
      stick.rotation.x = 0.25;
      mesh(new THREE.BoxGeometry(0.4, 0.06, 0.16), M('#4FA3D9'), 0.42, 0.04, 0.42);
    }

    if (sitting) {
      body.position.y = 0.55 - HIP;
      limbs.legs.forEach((l) => { l.rotation.x = -Math.PI / 2; });
      limbs.knees.forEach((k) => { k.rotation.x = Math.PI / 2; });
      limbs.arms.forEach((a) => { a.rotation.x = -0.5; });
    }
    if (camera) {
      limbs.arms.forEach((a) => { a.rotation.x = -1.1; a.rotation.z = a.position.x > 0 ? -0.35 : 0.35; });
      g.userData.fixedArms = true;
    }

    g.scale.setScalar(scale);
    g.userData.limbs = limbs;
    g.userData.sitting = sitting;
    return g;
  }

  // 歩きアニメ（amount: 0 = 止まる 〜 1 = 歩く）
  function animateWalk(g, phase, amount) {
    const l = g.userData.limbs;
    if (!l || g.userData.sitting) return;
    for (let i = 0; i < 2; i++) {
      const sw = Math.sin(phase + i * Math.PI);
      l.legs[i].rotation.x = sw * 0.55 * amount;
      l.knees[i].rotation.x = Math.max(0, -sw) * 0.7 * amount;
      if (!g.userData.fixedArms) l.arms[i].rotation.x = -sw * 0.45 * amount;
    }
  }

  App.Models3D = { FONT, canvasTexture, roundRect, signTexture, sign, hamster, staff, person, animateWalk };
})(window.App = window.App || {});
