/* 2D 学習コースの進行と、レッスンの問題づくり
 * 進み具合は state.course.lessons[lessonId] = { count, best, firstAt, lastAt }。
 * 問題は「覚え度（learned[id].strength 0〜5）」に合わせて毎回つくり直す：
 *   はじめて → 覚えるカード＋やさしい問題、覚えてきた → 日→中・並べ替え・聞き取り
 */
(function (App) {
  'use strict';

  const { shuffle } = App.U;
  const S = () => App.Store.state;
  const LESSON_EXP = 15;
  const REPLAY_EXP = 8;
  const NO_MISS_BONUS = 5;
  const MAX_GRADED = 12;      // 1 レッスンの問題数の上限（約 5 分）
  const REVIEW_GRADED = 10;

  const C = {};

  C.units = () => App.COURSE.units;
  C.lessons = () => App.COURSE.units.flatMap((u) => u.lessons);
  C.find = (id) => C.lessons().find((l) => l.id === id) || null;
  C.unit = (id) => App.COURSE.units.find((u) => u.id === id) || null;

  const rec = () => S().course.lessons;
  C.isDone = (lessonId) => !!rec()[lessonId];
  C.isUnlocked = (lesson) => {
    const list = C.lessons();
    const i = list.indexOf(lesson);
    return i <= 0 || C.isDone(list[i - 1].id);
  };
  C.current = () => C.lessons().find((l) => !C.isDone(l.id)) || null;
  C.unitDone = (unitId) => {
    const u = C.unit(unitId);
    return !!u && u.lessons.every((l) => C.isDone(l.id));
  };
  C.unitProgress = (u) => ({ done: u.lessons.filter((l) => C.isDone(l.id)).length, total: u.lessons.length });
  C.percent = () => {
    const list = C.lessons();
    return Math.round((list.filter((l) => C.isDone(l.id)).length / list.length) * 100);
  };

  // 旅行モード（北京マップ・3D）は「旅の準備」ユニットのクリアで解放。
  // 以前の版で旅を進めていたセーブデータはそのまま行けるようにする
  C.TRAVEL_UNIT = 'u4';
  C.travelUnlocked = () => {
    if (C.unitDone(C.TRAVEL_UNIT)) return true;
    const st = S();
    return Object.keys(st.cleared).length > 0
      || Object.values(st.world3d || {}).some((w) => w && w.done);
  };

  C.complete = (lesson, { correct, total, mistakes }) => {
    const first = !C.isDone(lesson.id);
    const base = first ? LESSON_EXP : REPLAY_EXP;
    const bonus = mistakes === 0 ? NO_MISS_BONUS : 0;
    const gained = base + bonus;
    const unitWasDone = C.unitDone(lesson.unit.id);
    const travelWas = C.travelUnlocked();

    App.Progress.markPlayed();
    App.Progress.learn(lesson.ids);
    const lv = App.Progress.addExp(gained);
    const today = App.U.todayKey();
    const r = rec()[lesson.id] || { count: 0, best: 0, firstAt: today };
    r.count++;
    r.lastAt = today;
    r.best = Math.max(r.best, total ? Math.round((correct / total) * 100) : 100);
    rec()[lesson.id] = r;
    App.Progress.log({ kind: 'lesson', lessonId: lesson.id, exp: gained });
    App.Store.save();

    const unitCleared = !unitWasDone && C.unitDone(lesson.unit.id);
    const travelOpened = !travelWas && C.travelUnlocked();
    return Object.assign({ first, base, bonus, gained, correct, total, mistakes, unitCleared, travelOpened, next: C.current() }, lv);
  };

  /* ---------- 問題づくり ---------- */
  const isSentence = (id) => !!App.PHRASES[id].w || App.PHRASES[id].zh.length >= 4;
  const strength = (id) => (S().learned[id] ? S().learned[id].strength : -1);

  // 選択肢：同じレッスン → 同じユニット → その他 の順に、同じ種類（単語/文）から選ぶ
  C.distractors = (id, n, field) => {
    const answer = App.PHRASES[id];
    const lesson = App.PHRASE_LESSON[id];
    const all = Object.keys(App.PHRASES).filter((k) => k !== id);
    const kind = isSentence(id);
    const rank = (k) => {
      const l = App.PHRASE_LESSON[k];
      let r = l === lesson ? 0 : (l && lesson && l.unit === lesson.unit ? 1 : 2);
      if (isSentence(k) !== kind) r += 2;
      return r + Math.random();
    };
    const seen = new Set([answer[field]]);
    const out = [];
    for (const k of all.sort((a, b) => rank(a) - rank(b))) {
      const t = App.PHRASES[k][field];
      if (seen.has(t)) continue;
      seen.add(t);
      out.push(k);
      if (out.length >= n) break;
    }
    return out;
  };

  const choice = (id, mode) => {
    const field = mode === 'ja2zh' ? 'zh' : 'ja';
    return { type: 'choice', id, mode, options: shuffle([id, ...C.distractors(id, 3, field)]) };
  };
  const listenOk = () => App.Speech.supported;

  // 覚え度に合わせて 1 問えらぶ
  function questionFor(id, k) {
    const s = strength(id);
    const hasOrder = !!App.PHRASES[id].w;
    if (s <= 1) return choice(id, k % 2 && listenOk() ? 'listen' : 'zh2ja');
    if (s <= 3) {
      if (hasOrder && k % 3 === 0) return { type: 'order', id };
      return choice(id, k % 2 && listenOk() ? 'listen' : 'ja2zh');
    }
    if (hasOrder && k % 2 === 0) return { type: 'order', id };
    return choice(id, listenOk() && k % 3 === 1 ? 'listen' : 'ja2zh');
  }

  // 他のレッスンで覚えた、弱い言葉（復習をまぜる）
  const weakOthers = (exclude, n) => Object.entries(S().learned)
    .filter(([id, e]) => App.PHRASES[id] && !exclude.includes(id) && e.strength < 3)
    .sort((a, b) => a[1].strength - b[1].strength || Math.random() - 0.5)
    .slice(0, n)
    .map(([id]) => id);

  C.build = (lesson) => {
    const ids = lesson.ids.filter((id) => App.PHRASES[id]);
    if (lesson.review) return C.buildReview(ids, REVIEW_GRADED);

    const items = [];
    const graded = [];
    if (lesson.tutorial && !C.isDone(lesson.id)) items.push({ type: 'tutorial' });
    (lesson.notes || []).forEach((html) => items.push({ type: 'note', html }));

    // ① 新しい言葉：カードで覚える → すぐやさしい問題
    ids.forEach((id, k) => {
      if (strength(id) < 0) {
        items.push({ type: 'teach', id });
        items.push(choice(id, k % 2 && listenOk() ? 'listen' : 'zh2ja'));
      }
    });
    // ② 組み合わせ（言葉と意味）
    if (ids.length >= 3) graded.push({ type: 'match', ids: shuffle(ids).slice(0, 4) });
    // ③ 並べ替え（文）
    ids.filter((id) => App.PHRASES[id].w).forEach((id) => graded.push({ type: 'order', id }));
    // ④ 日→中・聞き取り（覚え度しだい）
    ids.forEach((id, k) => graded.push(strength(id) < 0 ? choice(id, 'ja2zh') : questionFor(id, k + 1)));
    if (listenOk()) shuffle(ids).slice(0, 2).forEach((id) => graded.push(choice(id, 'listen')));
    // ⑤ 前に覚えた弱い言葉をすこし
    weakOthers(ids, 2).forEach((id, k) => graded.push(questionFor(id, k)));
    // ⑥ 声に出す練習（マイクが使えるときだけ・採点なし）
    if (App.Speech.canRecognize) graded.splice(1, 0, { type: 'speak', id: ids[ids.length - 1] });

    const rest = MAX_GRADED - items.filter((x) => x.type === 'choice').length;
    return items.concat(graded.slice(0, Math.max(4, rest)));
  };

  // 復習・まとめ：弱い言葉から
  C.buildReview = (ids, n) => {
    const pick = ids.slice().sort((a, b) => strength(a) - strength(b) || Math.random() - 0.5).slice(0, n);
    const items = [];
    const words = pick.filter((id) => !isSentence(id));
    if (words.length >= 3) items.push({ type: 'match', ids: words.slice(0, 4) });
    pick.forEach((id, k) => items.push(questionFor(id, k)));
    return shuffle(items).slice(0, n);
  };

  App.Course = C;
})(window.App = window.App || {});
