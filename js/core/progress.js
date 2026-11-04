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

  P.isCleared = (spotId) => !!S().cleared[spotId];
  P.playableSpots = (city) => city.spots.filter((s) => !s.comingSoon);

  // 旅行先のスポットは、2D コースの requires ユニットをクリアすると行ける（一度クリアした所はいつでも）
  P.isUnlocked = (city, spot) => {
    if (spot.comingSoon || !App.Course.travelUnlocked()) return false;
    return P.isCleared(spot.id) || !spot.requires || App.Course.unitDone(spot.requires);
  };

  // おすすめの次のスポット（行けて、まだクリアしていない所）
  P.nextSpot = (city) => P.playableSpots(city).find((s) => !P.isCleared(s.id) && P.isUnlocked(city, s)) || null;

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

  // 間隔反復：覚え度が高いほど次の復習まで間をあける（日数）。
  // 毎日遊ばなくても「たまっている分を少しずつ」出すだけで、ペナルティは無い
  const INTERVAL = [0, 1, 2, 4, 7, 14];
  const addDays = (key, n) => {
    const d = new Date(key + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return U.todayKey(d);
  };

  P.learn = (ids) => {
    const now = U.todayKey();
    ids.forEach((id) => {
      if (!S().learned[id]) {
        S().learned[id] = { strength: 1, correct: 0, wrong: 0, learnedAt: now, lastReviewed: now, due: addDays(now, INTERVAL[1]) };
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
    e.due = addDays(e.lastReviewed, INTERVAL[e.strength]);
    App.Store.save();
  };

  const isDue = (e) => !e.due || e.due <= U.todayKey();
  P.dueCount = () => Object.entries(S().learned).filter(([id, e]) => App.PHRASES[id] && isDue(e)).length;

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

  P.log = pushLog;

  // 復習の時期が来た言葉 → 覚えが弱い言葉 → しばらく見ていない言葉 の順
  P.reviewCandidates = (n) =>
    Object.entries(S().learned)
      .filter(([id]) => App.PHRASES[id])
      .sort((a, b) => (isDue(b[1]) - isDue(a[1]))
        || a[1].strength - b[1].strength
        || String(a[1].lastReviewed || '').localeCompare(String(b[1].lastReviewed || '')))
      .slice(0, n)
      .map(([id]) => id);

  P.needsReview = () => Object.keys(S().learned).length >= 3 && P.dueCount() > 0;

  // 起動時のハムスターのひとこと（休んでも責めない）
  P.welcomeMessage = () => {
    const name = App.Hamster.name;
    const last = S().lastPlayed;
    const city = App.currentCity().name;
    if (!last) return `你好！ぼくは<b>${name}</b>。<br>中国語を覚えて、いっしょに${city}を旅しよう！`;
    const gap = U.daysBetween(last, U.todayKey());
    if (gap <= 0) return 'おかえり！<br>もうちょっとだけ、やってみる？';
    if (gap === 1) return '你好！<br>昨日の続き、行ってみよう！';
    return '久しぶり！また会えてうれしいよ〜<br>マイペースで旅しよう🐹';
  };

  App.Progress = P;
})(window.App = window.App || {});
