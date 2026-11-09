/* 🏠 おうち：ハムスターを育てる画面（しくみは js/core/pet.js）
 *   ごはん … レベルが上がるともらえる。タップであげると、そだち・なかよし度が増えて大きくなる
 *   なでる … ハムスターを指（マウス）でスリスリ。タップするとつつく
 */
(function (App) {
  'use strict';
  App.screens = App.screens || {};

  const { esc, $ } = App.U;
  const UI = App.UI;

  const STROKE = 90; // これだけ指を動かすと「1 回なでた」
  const POKE = ['きゅっ！', 'なになに〜？', 'くすぐったいよ〜', 'えへへ', '你好！（ニーハオ）', 'あそぼ〜！'];
  const NADE = ['きもちいい〜', 'もっとなでて〜', 'しあわせ〜', 'ふわぁ…ねむくなってきた', 'えへへ、だいすき！'];
  const FULL = ['今日はいっぱいなでてもらったよ〜', 'ふにゃ〜、とろけちゃう…'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  App.screens.pet = (root) => {
    const Pet = App.Pet;
    const P = App.Progress;
    Pet.sync();
    const name = App.Hamster.name;

    root.innerHTML = `
      ${UI.topbar({ title: '🏠 おうち', back: 'title' })}
      <main class="page">
        <section class="pet-room" aria-label="${esc(name)}のおうち">
          <div class="pet-wall" aria-hidden="true"><span class="pet-window">☀️</span><span class="pet-frame">🀄</span></div>
          <div class="pet-floor" aria-hidden="true"></div>
          <span class="pet-deco pet-house" aria-hidden="true">🏠</span>
          <span class="pet-deco pet-wheel" aria-hidden="true">🎡</span>
          <span class="pet-deco pet-water" aria-hidden="true">🍶</span>
          <div class="bubble pet-bubble" data-bubble></div>
          <button class="pet-ham" data-ham aria-label="${esc(name)}をなでる">
            <span class="pet-ham-body" data-ham-body></span>
          </button>
          <div class="pet-fx" data-fx aria-hidden="true"></div>
        </section>
        <p class="soft-note">👆 ${esc(name)}を指でスリスリするとなでられるよ</p>

        <section class="card pet-status" data-status></section>

        <section class="card">
          <h3>🍽️ ごはん</h3>
          <div class="pet-foods" data-foods></div>
          <p class="muted small" data-food-note></p>
        </section>
      </main>`;

    const room = $('.pet-room', root);
    const ham = $('[data-ham]', root);
    const body = $('[data-ham-body]', root);
    const bubble = $('[data-bubble]', root);
    const fx = $('[data-fx]', root);

    let moodTimer = 0;
    let sayTimer = 0;
    let eating = false;
    function draw(mood = 'normal') {
      body.innerHTML = App.Hamster.svg(mood);
      body.style.setProperty('--s', Pet.stage().scale);
    }
    function setMood(mood, sec = 1.4) {
      draw(mood);
      clearTimeout(moodTimer);
      moodTimer = setTimeout(() => draw('normal'), sec * 1000);
    }
    function say(html, sec = 2.6) {
      bubble.innerHTML = html;
      bubble.classList.add('is-show');
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => bubble.classList.remove('is-show'), sec * 1000);
    }
    function hop(cls) {
      ham.classList.remove('is-hop', 'is-wiggle');
      void ham.offsetWidth;
      ham.classList.add(cls);
    }
    // ハート・キラキラなどを、ルームの中の (x, y) からふわっと出す
    function pop(text, x, y, cls = '') {
      const r = room.getBoundingClientRect();
      const s = document.createElement('span');
      s.className = `pet-pop ${cls}`;
      s.textContent = text;
      s.style.left = `${x - r.left}px`;
      s.style.top = `${y - r.top}px`;
      fx.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    }
    const hamCenter = () => {
      const b = ham.getBoundingClientRect();
      return [b.left + b.width / 2, b.top + b.height * 0.35];
    };

    function renderStatus() {
      const st = Pet.stage();
      const bd = Pet.bond();
      const lv = P.level();
      const bar = (cur, need) => `<div class="progress"><div class="progress-fill" style="width:${need ? Math.min(100, (cur / need) * 100) : 100}%"></div></div>`;
      $('[data-status]', root).innerHTML = `
        <div class="pet-name"><b>${esc(name)}</b><span class="chip chip-level">${esc(st.name)}</span></div>
        <div class="pet-meter"><span>🌱 そだち</span>${bar(st.cur, st.need)}<small>${st.next ? `あと ${st.need - st.cur} で「${esc(st.next.name)}」` : 'さいこうまで育った！'}</small></div>
        <div class="pet-meter is-love"><span>💗 なかよし</span>${bar(bd.cur, bd.need)}<small>${esc(bd.name)}${bd.next ? `（あと ${bd.need - bd.cur}）` : ''}</small></div>
        <div class="pet-meter is-exp"><span>⭐ Lv.${lv.level}</span>${bar(lv.cur, lv.need)}<small>あと ${lv.need - lv.cur} EXP で次のごはん</small></div>`;
    }

    function renderFoods() {
      $('[data-foods]', root).innerHTML = Pet.FOODS.map((f) => {
        const n = Pet.count(f.id);
        return `<button class="pet-food${n ? '' : ' is-empty'}" data-food="${f.id}" ${n ? '' : 'disabled'} aria-label="${esc(f.name)}をあげる（${n}こ）">
          <span class="pet-food-emoji">${f.emoji}</span><b>${esc(f.name)}</b><span class="zh">${esc(f.zh)}</span><i>×${n}</i></button>`;
      }).join('');
      const lv = P.level();
      $('[data-food-note]', root).innerHTML = Pet.total()
        ? 'タップであげよう。中国語の名前も聞けるよ'
        : `ごはんがないよ。2D の学習や 3D の旅で EXP をためて、レベルを上げるともらえる！（あと <b>${lv.need - lv.cur} EXP</b>）<br>同じレッスンやフィールドをもう一度遊んでも EXP がもらえるよ`;
      root.querySelectorAll('[data-food]').forEach((b) => { b.onclick = () => feed(b); });
    }

    function feed(btn) {
      if (eating) return;
      const r = Pet.feed(btn.dataset.food);
      if (!r) return;
      eating = true;
      const f = r.food;
      App.Speech.speak(f.zh);
      // ボタンからハムスターの口へ、ごはんが飛んでいく
      const from = btn.getBoundingClientRect();
      const [tx, ty] = hamCenter();
      const rr = room.getBoundingClientRect();
      const fly = document.createElement('span');
      fly.className = 'pet-fly';
      fly.textContent = f.emoji;
      fly.style.left = `${from.left + from.width / 2 - rr.left}px`;
      fly.style.top = `${from.top + 20 - rr.top}px`;
      fx.appendChild(fly);
      requestAnimationFrame(() => {
        fly.style.transform = `translate(${tx - from.left - from.width / 2}px, ${ty + 30 - from.top - 20}px) scale(.6)`;
        fly.style.opacity = '0.2';
      });
      setTimeout(() => {
        fly.remove();
        App.Sfx.play('eat');
        setMood('eat', 1.6);
        hop('is-wiggle');
        say(`${esc(f.say)}<br><small>🌱 そだち +${f.grow}　💗 なかよし +${f.love}</small>`, 3);
        const [x, y] = hamCenter();
        pop('💗', x + 30, y);
        renderStatus();
        renderFoods();
        if (r.grew) {
          setTimeout(() => {
            App.Sfx.play('clear');
            draw('happy');
            hop('is-hop');
            pop('✨', x - 40, y - 20, 'is-big');
            pop('✨', x + 40, y - 30, 'is-big');
            say(`大きくなったよ！<br><b>「${esc(Pet.stage().name)}」</b>になった🎉`, 4);
            App.MochiVoice.speak('大きくなったよ！');
          }, 1500);
        }
        setTimeout(() => { eating = false; }, 700);
      }, 520);
    }

    // なでる（ドラッグ）・つつく（タップ）
    let drag = null;
    ham.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, dist: 0, sum: 0, t: performance.now() };
      try { ham.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    });
    ham.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const d = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.dist += d;
      drag.sum += d;
      if (drag.dist < STROKE) return;
      drag.dist = 0;
      const up = Pet.nade();
      App.Sfx.play('pet');
      setMood('love', 1.6);
      pop(up ? '💗' : '♡', e.clientX, e.clientY - 20);
      if (up) {
        renderStatus();
        if (Math.random() < 0.35) say(pick(NADE));
      } else {
        say(pick(FULL));
      }
    });
    const end = () => {
      if (!drag) return;
      const tap = drag.sum < 12 && performance.now() - drag.t < 400;
      drag = null;
      if (!tap || eating) return;
      App.Sfx.play('tap');
      setMood('wow', 0.9);
      hop('is-hop');
      const line = pick(POKE);
      say(line, 1.8);
      if (Math.random() < 0.5) App.MochiVoice.speak(line.replace(/（.*）/, ''));
    };
    ham.addEventListener('pointerup', end);
    ham.addEventListener('pointercancel', () => { drag = null; });

    draw('happy');
    renderStatus();
    renderFoods();
    say(Pet.total() ? `${esc(name)}だよ！<br>ごはん、ちょうだい〜🍽️` : `${esc(name)}のおうちへようこそ！<br>なでてくれる？`, 3.5);
    App.onLeave(() => { clearTimeout(moodTimer); clearTimeout(sayTimer); });
  };
})(window.App = window.App || {});
