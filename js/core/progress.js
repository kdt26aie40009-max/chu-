/* 進行・経験値・レベル・復習などのゲームロジック */
(function (App) {
  'use strict';

  const U = App.U;
  const S = () => App.Store.state;
  const EXP_PER_LEVEL = 100;
  const REPLAY_BONUS_RATE = 0.5;
  const NO_MISS_BONUS = 10;

  const P = {};

  P.level = (exp = S().exp) => ({
    level: Math.floor(exp / EXP_PER_LEVEL) + 1,
    cur: exp % EXP_PER_LEVEL,
    need: EXP_PER_LEVEL,
  });

  P.markPlayed = () => {
    const t = U.todayKey();
    if (!S().days.includes(t)) S().days.push(t);
    S().lastPlayed = t;
  };

  // 連続日数（表示用。途切れてもペナルティは無い）
  P.streak = () => {
    const days = S().days.slice().sort();
    if (!days.length) return 0;
    let streak = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (U.daysBetween(days[i - 1], days[i]) === 1) streak++;
      else break;
    }
    return U.daysBetween(days[days.length - 1], U.todayKey()) <= 1 ? streak : 0;
  };

  P.isCleared = (spotId) => !!S().cleared[spotId];
  P.playableSpots = (city) => city.spots.filter((s) => !s.comingSoon);

  P.isUnlocked = (city, spot) => {
    if (spot.comingSoon) return false;
    const list = P.playableSpots(city);
    const i = list.indexOf(spot);
    return i <= 0 || P.isCleared(list[i - 1].id);
  };

  P.nextSpot = (city) => P.playableSpots(city).find((s) => !P.isCleared(s.id)) || null;

  P.cityProgress = (city) => {
    const list = P.playableSpots(city);
    if (!list.length) return 0;
    return Math.round((list.filter((s) => P.isCleared(s.id)).length / list.length) * 100);
  };

  P.addExp = (n) => {
    const before = P.level();
    S().exp += n;
    const after = P.level();
    return { before, after, levelUp: after.level > before.level };
  };

  P.learnedCount = () => Object.keys(S().learned).filter((id) => App.PHRASES[id]).length;
  P.isLearned = (id) => !!S().learned[id];

  P.learn = (ids) => {
    const now = U.todayKey();
    ids.forEach((id) => {
      if (!S().learned[id]) {
        S().learned[id] = { strength: 1, correct: 0, wrong: 0, learnedAt: now, lastReviewed: now };
      }
    });
    App.Store.save();
  };

  P.recordAnswer = (id, ok) => {
    let e = S().learned[id];
    if (!e) e = S().learned[id] = { strength: 0, correct: 0, wrong: 0, learnedAt: U.todayKey(), lastReviewed: null };
    if (ok) { e.correct++; e.strength = Math.min(5, e.strength + 1); }
    else { e.wrong++; e.strength = Math.max(0, e.strength - 1); }
    e.lastReviewed = U.todayKey();
    App.Store.save();
  };

  const pushLog = (entry) => {
    S().log.unshift(Object.assign({ date: U.todayKey() }, entry));
    S().log = S().log.slice(0, 50);
  };

  P.completeSpot = (city, spot, { mistakes }) => {
    const first = !P.isCleared(spot.id);
    const base = first ? spot.exp : Math.round(spot.exp * REPLAY_BONUS_RATE);
    const bonus = mistakes === 0 ? NO_MISS_BONUS : 0;
    const gained = base + bonus;

    P.markPlayed();
    const lv = P.addExp(gained);

    const today = U.todayKey();
    const c = S().cleared[spot.id] || { count: 0, firstClearedAt: today, bestMistakes: null };
    c.count++;
    c.lastClearedAt = today;
    c.bestMistakes = c.bestMistakes == null ? mistakes : Math.min(c.bestMistakes, mistakes);
    S().cleared[spot.id] = c;

    pushLog({ kind: 'spot', spotId: spot.id, exp: gained });
    App.Store.save();

    return Object.assign({ first, base, bonus, gained, mistakes, pct: P.cityProgress(city), next: P.nextSpot(city) }, lv);
  };

  P.completeReview = (correct) => {
    const gained = 5 + correct * 3;
    P.markPlayed();
    const lv = P.addExp(gained);
    pushLog({ kind: 'review', exp: gained });
    App.Store.save();
    return Object.assign({ gained }, lv);
  };

  // 覚えが弱い＆しばらく見ていない言葉を優先
  P.reviewCandidates = (n) =>
    Object.entries(S().learned)
      .filter(([id]) => App.PHRASES[id])
      .sort((a, b) => a[1].strength - b[1].strength || String(a[1].lastReviewed || '').localeCompare(String(b[1].lastReviewed || '')))
      .slice(0, n)
      .map(([id]) => id);

  P.needsReview = () => {
    const today = U.todayKey();
    const entries = Object.values(S().learned);
    return entries.length >= 3 && entries.some((e) => e.lastReviewed !== today);
  };

  // 起動時のハムスターのひとこと（休んでも責めない）
  P.welcomeMessage = () => {
    const name = App.Hamster.name;
    const last = S().lastPlayed;
    if (!last) return `你好！ぼくは<b>${name}</b>。<br>いっしょに上海を旅しよう！`;
    const gap = U.daysBetween(last, U.todayKey());
    if (gap <= 0) return 'おかえり！<br>もうちょっと上海を歩いてみる？';
    if (gap === 1) return '你好！<br>昨日の続き、行ってみよう！';
    return '久しぶり！また会えてうれしいよ〜<br>マイペースで旅しよう🐹';
  };

  App.Progress = P;
})(window.App = window.App || {});
