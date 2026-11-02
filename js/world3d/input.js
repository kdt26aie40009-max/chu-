/* 3D 画面の入力
 * - PC: WASD / 矢印（↑↓ 前後・←→ 向きを変える）、マウスドラッグで視点、Space（または Shift）で走る、E / Enter で話す
 * - スマホ: 画面左半分をドラッグ＝移動スティック、右半分をドラッグ＝視点
 * 入力は state にまとめ、ゲーム側は state を読むだけ（操作方法を増やすときはここだけ触る）
 */
(function (App) {
  'use strict';

  const JOY_R = 50; // スティックの半径(px)
  const INTERACT_KEYS = ['KeyE', 'Enter'];
  const NO_SCROLL_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  App.Input3D = {
    create(target, { onInteract = () => {}, joyEl = null } = {}) {
      const keys = new Set();
      const looks = new Map();
      const joy = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
      const state = { moveX: 0, moveZ: 0, turn: 0, run: false, lookDX: 0, lookDY: 0, enabled: true, touched: false };
      const knob = joyEl ? joyEl.querySelector('.w3d-joy-knob') : null;

      const showJoy = () => {
        if (!joyEl) return;
        joyEl.hidden = false;
        joyEl.style.left = joy.ox + 'px';
        joyEl.style.top = joy.oy + 'px';
        if (knob) knob.style.transform = 'translate(0,0)';
      };
      const hideJoy = () => { if (joyEl) joyEl.hidden = true; };

      function onKeyDown(e) {
        if (!state.enabled) return;
        if (INTERACT_KEYS.includes(e.code)) {
          e.preventDefault();
          if (!e.repeat) onInteract();
          return;
        }
        keys.add(e.code);
        if (NO_SCROLL_KEYS.includes(e.code)) {
          e.preventDefault();
          // フォーカス中のボタンが Space で押されないように
          const a = document.activeElement;
          if (a && a !== document.body && a.blur) a.blur();
        }
      }
      const onKeyUp = (e) => keys.delete(e.code);
      const onBlur = () => keys.clear();

      function onDown(e) {
        if (!state.enabled) return;
        if (e.pointerType === 'touch') state.touched = true;
        if (e.pointerType === 'touch' && e.clientX < window.innerWidth * 0.5 && joy.id === null) {
          joy.id = e.pointerId;
          joy.ox = e.clientX;
          joy.oy = e.clientY;
          joy.dx = 0;
          joy.dy = 0;
          showJoy();
        } else {
          looks.set(e.pointerId, { x: e.clientX, y: e.clientY, k: e.pointerType === 'touch' ? 1.6 : 1 });
        }
        try { target.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
        e.preventDefault();
      }

      function onMove(e) {
        if (e.pointerId === joy.id) {
          let dx = e.clientX - joy.ox;
          let dy = e.clientY - joy.oy;
          const len = Math.hypot(dx, dy);
          if (len > JOY_R) { dx *= JOY_R / len; dy *= JOY_R / len; }
          joy.dx = dx;
          joy.dy = dy;
          if (knob) knob.style.transform = `translate(${dx}px, ${dy}px)`;
          return;
        }
        const p = looks.get(e.pointerId);
        if (!p) return;
        state.lookDX += (e.clientX - p.x) * p.k;
        state.lookDY += (e.clientY - p.y) * p.k;
        p.x = e.clientX;
        p.y = e.clientY;
      }

      function onUp(e) {
        if (e.pointerId === joy.id) {
          joy.id = null;
          joy.dx = 0;
          joy.dy = 0;
          hideJoy();
        }
        looks.delete(e.pointerId);
      }

      const noMenu = (e) => e.preventDefault();

      target.addEventListener('pointerdown', onDown);
      target.addEventListener('contextmenu', noMenu);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onBlur);

      return {
        state,
        update() {
          const k = (...codes) => (codes.some((c) => keys.has(c)) ? 1 : 0);
          let mz = k('KeyW', 'ArrowUp') - k('KeyS', 'ArrowDown');
          let mx = k('KeyD') - k('KeyA');
          state.turn = k('ArrowRight') - k('ArrowLeft');
          if (joy.id !== null) {
            mx += joy.dx / JOY_R;
            mz += -joy.dy / JOY_R;
          }
          const len = Math.hypot(mx, mz);
          if (len > 1) { mx /= len; mz /= len; }
          state.moveX = mx;
          state.moveZ = mz;
          state.run = k('Space', 'ShiftLeft', 'ShiftRight') === 1;
        },
        consumeLook() {
          const d = { x: state.lookDX, y: state.lookDY };
          state.lookDX = 0;
          state.lookDY = 0;
          return d;
        },
        setEnabled(v) {
          state.enabled = v;
          if (!v) {
            keys.clear();
            looks.clear();
            joy.id = null;
            joy.dx = 0;
            joy.dy = 0;
            state.lookDX = 0;
            state.lookDY = 0;
            hideJoy();
          }
        },
        dispose() {
          target.removeEventListener('pointerdown', onDown);
          target.removeEventListener('contextmenu', noMenu);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('keyup', onKeyUp);
          window.removeEventListener('blur', onBlur);
        },
      };
    },
  };
})(window.App = window.App || {});
