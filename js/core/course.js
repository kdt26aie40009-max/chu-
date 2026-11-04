/* 2D 学習コースの進行と、レッスンの問題づくり
 * 進み具合は state.course.lessons[lessonId] = { count, best, firstAt, lastAt }（3D の旅とは別に保存）。
 * カテゴリ（基礎・単語・文法と文章・会話）はどれからでも始められ、カテゴリの中は順番に解放される。
 * 問題は「覚え度（learned[id].strength 0〜5）」に合わせて毎回つくり直す：
 *   はじめて → 覚えるカード＋やさしい問題、覚えてきた → 日→中・並べ替え・穴埋め・ピンイン入力・聞き取り
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

  C.cats = () => App.COURSE.cats;
  C.cat = (id) => App.COURSE.cats.find((c) => c.id === id) || null;
  C.units = () => App.COURSE.units;
  C.lessons = () => App.COURSE.units.flatMap((u) => u.lessons);
  C.catLessons = (cat) => cat.units.flatMap((u) => u.lessons);
  C.find = (id) => C.lessons().find((l) => l.id === id) || null;
  C.unit = (id) => App.COURSE.units.find((u) => u.id === id) || null;

  const rec = () => S().course.lessons;
  C.isDone = (lessonId) => !!rec()[lessonId];
  // カテゴリの中で 1 つ前のレッスンをクリアすると開く（開発者モードでは全部開く）
  C.isUnlocked = (lesson) => {
    if (App.Dev && App.Dev.on && App.Dev.flags.allLessons) return true;
    const list = C.catLessons(lesson.unit.cat);
    const i = list.indexOf(lesson);
    return i <= 0 || C.isDone(list[i - 1].id);
  };
  C.current = (cat) => {
    if (cat) return C.catLessons(cat).find((l) => !C.isDone(l.id)) || null;
    const last = S().course.lastCat && C.cat(S().course.lastCat);
    return (last && C.current(last)) || C.cats().map((c) => C.current(c)).find(Boolean) || null;
  };
  C.unitDone = (unitId) => {
    const u = C.unit(unitId);
    return !!u && u.lessons.every((l) => C.isDone(l.id));
  };
  C.unitProgress = (u) => ({ done: u.lessons.filter((l) => C.isDone(l.id)).length, total: u.lessons.length });
  C.catProgress = (cat) => {
    const list = C.catLessons(cat);
    return { done: list.filter((l) => C.isDone(l.id)).length, total: list.length };
  };
  C.percent = () => {
    const list = C.lessons();
    return Math.round((list.filter((l) => C.isDone(l.id)).length / list.length) * 100);
  };

  C.complete = (lesson, { correct, total, mistakes }) => {
    const first = !C.isDone(lesson.id);
    const base = first ? LESSON_EXP : REPLAY_EXP;
    const bonus = mistakes === 0 ? NO_MISS_BONUS : 0;
    const gained = base + bonus;
    const unitWasDone = C.unitDone(lesson.unit.id);

    App.Progress.markPlayed();
    App.Progress.learn(lesson.ids);
    const lv = App.Progress.addExp(gained);
    const today = App.U.todayKey();
    const r = rec()[lesson.id] || { count: 0, best: 0, firstAt: today };
    r.count++;
    r.lastAt = today;
    r.best = Math.max(r.best, total ? Math.round((correct / total) * 100) : 100);
    rec()[lesson.id] = r;
    S().course.lastCat = lesson.unit.cat.id;
    App.Progress.log({ kind: 'lesson', lessonId: lesson.id, exp: gained });
    App.Store.save();

    const unitCleared = !unitWasDone && C.unitDone(lesson.unit.id);
    return Object.assign({ first, base, bonus, gained, correct, total, mistakes, unitCleared, next: C.current(lesson.unit.cat) }, lv);
  };

  /* ---------- 問題づくり ---------- */
  const isSentence = (id) => !!App.PHRASES[id].w || App.PHRASES[id].zh.length >= 4;
  const strength = (id) => (S().learned[id] ? S().learned[id].strength : -1);
  // ピンイン入力に向く短い言葉（記号なし・3 文字まで）
  const typable = (id) => { const p = App.PHRASES[id]; return !p.w && p.zh.length <= 3 && !/[？！。，?!.,]/.test(p.zh); };

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
    // 意味（ja）や表記（zh）が同じ言葉は、正解が 2 つになるので選択肢に入れない
    const seen = new Set([answer[field]]);
    const out = [];
    for (const k of all.sort((a, b) => rank(a) - rank(b))) {
      const t = App.PHRASES[k][field];
      if (seen.has(t) || App.PHRASES[k].ja === answer.ja || App.PHRASES[k].zh === answer.zh) continue;
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

  // 穴埋め：文の単語を 1 つ隠して、4 つから選ぶ
  C.cloze = (id) => {
    const words = App.phraseWords(id);
    if (!words || words.length < 2) return null;
    const k = Math.floor(Math.random() * words.length);
    const ans = words[k];
    const pool = shuffle(Object.keys(App.PHRASES).filter((x) => App.PHRASES[x].w && x !== id).flatMap((x) => App.phraseWords(x)));
    const seen = new Set(words.map((w) => w.zh));
    const wrong = [];
    for (const w of pool) {
      if (seen.has(w.zh)) continue;
      seen.add(w.zh);
      wrong.push(w);
      if (wrong.length >= 3) break;
    }
    return { type: 'cloze', id, k, options: shuffle([ans, ...wrong]) };
  };

  // 覚え度に合わせて 1 問えらぶ
  function questionFor(id, k) {
    const s = strength(id);
    const hasOrder = !!App.PHRASES[id].w;
    if (s <= 1) return choice(id, k % 2 && listenOk() ? 'listen' : 'zh2ja');
    if (s <= 3) {
      if (hasOrder && k % 3 === 0) return { type: 'order', id };
      if (hasOrder && k % 3 === 1) return C.cloze(id);
      if (!hasOrder && typable(id) && k % 3 === 2) return { type: 'pinyin', id };
      return choice(id, k % 2 && listenOk() ? 'listen' : 'ja2zh');
    }
    if (hasOrder) return k % 2 ? C.cloze(id) : { type: 'order', id };
    if (typable(id) && k % 2 === 0) return { type: 'pinyin', id };
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
    // 会話ロールプレイ：言葉をおさらいしてから、チャット形式の会話へ
    if (lesson.dialogue) {
      shuffle(ids).slice(0, 3).forEach((id, k) => graded.push(questionFor(id, k)));
      return items.concat(graded.filter(Boolean), [{ type: 'dialogue', dialogue: lesson.dialogue }]);
    }
    // ② 読解
    (lesson.reads || []).forEach((r) => graded.push({ type: 'read', read: r }));
    // ③ 組み合わせ（言葉と意味）
    if (ids.length >= 3) graded.push({ type: 'match', ids: shuffle(ids).slice(0, 4) });
    // ④ 並べ替え・穴埋め（文）
    ids.filter((id) => App.PHRASES[id].w).forEach((id, k) => graded.push(k % 2 && strength(id) >= 1 ? C.cloze(id) : { type: 'order', id }));
    // ⑤ 日→中・聞き取り・ピンイン入力（覚え度しだい）
    ids.forEach((id, k) => graded.push(strength(id) < 0 ? choice(id, 'ja2zh') : questionFor(id, k + 1)));
    const typ = ids.filter(typable);
    if (typ.length) graded.push({ type: 'pinyin', id: shuffle(typ)[0] });
    if (listenOk()) shuffle(ids).slice(0, 2).forEach((id) => graded.push(choice(id, 'listen')));
    // ⑥ 前に覚えた弱い言葉をすこし
    weakOthers(ids, 2).forEach((id, k) => graded.push(questionFor(id, k)));
    // ⑦ 声に出す練習（マイクが使えるときだけ・採点なし）
    if (App.Speech.canRecognize && ids.length) graded.splice(1, 0, { type: 'speak', id: ids[ids.length - 1] });

    const rest = MAX_GRADED - items.filter((x) => x.type === 'choice').length;
    return items.concat(graded.filter(Boolean).slice(0, Math.max(4, rest)));
  };

  // 復習・まとめ：弱い言葉から
  C.buildReview = (ids, n) => {
    const pick = ids.slice().sort((a, b) => strength(a) - strength(b) || Math.random() - 0.5).slice(0, n);
    const items = [];
    const words = pick.filter((id) => !isSentence(id));
    if (words.length >= 3) items.push({ type: 'match', ids: words.slice(0, 4) });
    pick.forEach((id, k) => items.push(questionFor(id, k)));
    return shuffle(items.filter(Boolean)).slice(0, n);
  };

  // 3D の旅の「単語チェック」用：短い 4 択だけ（2〜5 問）
  C.buildCheck = (ids) => ids.filter((id) => App.PHRASES[id]).slice(0, 5)
    .map((id, k) => choice(id, k % 2 && listenOk() ? 'listen' : (k % 3 === 2 ? 'ja2zh' : 'zh2ja')));

  App.Course = C;
})(window.App = window.App || {});
