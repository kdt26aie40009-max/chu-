/* 旅のマップの名所イラスト（オリジナルの SVG。クリーム色の丸い広場の上に建物がのっている）
 * App.Landmarks.svg(stageId) → SVG 文字列（viewBox 0 0 100 90）
 */
(function (App) {
  'use strict';

  const O = '#4A3426'; // ふちの線
  // 足もとの広場（クリーム色の丸い台。緑の地図の上でよく目立つ）
  const base = `
    <ellipse cx="50" cy="76" rx="41" ry="11.5" fill="#D9A95A" stroke="${O}" stroke-width="2.4"/>
    <ellipse cx="50" cy="72" rx="41" ry="11" fill="#FFE7AE" stroke="${O}" stroke-width="2.4"/>
    <ellipse cx="38" cy="69" rx="12" ry="3" fill="#fff" opacity=".6"/>`;

  const ART = {
    // 管制塔と飛行機
    airport: `
      <rect x="30" y="34" width="10" height="36" fill="#E8EEF2" stroke="${O}" stroke-width="2"/>
      <path d="M24 26 h22 l-3 10 h-16 z" fill="#5BA4D6" stroke="${O}" stroke-width="2"/>
      <rect x="26" y="22" width="18" height="5" rx="2" fill="#F4F7FA" stroke="${O}" stroke-width="2"/>
      <path d="M48 56 l34 -14 q6 -2 6 3 q0 3 -6 5 l-34 12 z" fill="#FFFFFF" stroke="${O}" stroke-width="2"/>
      <path d="M62 50 l6 -12 h5 l-3 15 z M58 60 l-2 8 h5 l5 -10 z" fill="#2BB5A0" stroke="${O}" stroke-width="2"/>
      <path d="M50 58 l-6 -6 h4 l8 4 z" fill="#2BB5A0" stroke="${O}" stroke-width="2"/>`,
    // ホテル（赤い屋根のビル）
    hotel: `
      <rect x="30" y="26" width="40" height="46" fill="#F3E2C8" stroke="${O}" stroke-width="2"/>
      <path d="M26 28 L50 14 L74 28 Z" fill="#C0392B" stroke="${O}" stroke-width="2"/>
      ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${35 + c * 11}" y="${33 + r * 10}" width="7" height="6" fill="${(r + c) % 2 ? '#FFD68C' : '#7FB6DE'}" stroke="${O}" stroke-width="1.2"/>`).join('')).join('')}
      <rect x="45" y="62" width="10" height="10" fill="#8E5A2E" stroke="${O}" stroke-width="1.5"/>
      <path d="M50 14 v-8" stroke="${O}" stroke-width="1.5"/><path d="M50 6 h9 l-2 3 l2 3 h-9 z" fill="#F5B92E" stroke="${O}" stroke-width="1.2"/>`,
    // 商店街（牌楼と提灯）
    market: `
      <rect x="22" y="36" width="7" height="36" fill="#C0392B" stroke="${O}" stroke-width="2"/>
      <rect x="71" y="36" width="7" height="36" fill="#C0392B" stroke="${O}" stroke-width="2"/>
      <rect x="20" y="30" width="60" height="9" fill="#C0392B" stroke="${O}" stroke-width="2"/>
      <path d="M14 30 Q50 14 86 30 L80 24 Q50 10 20 24 Z" fill="#3E4A52" stroke="${O}" stroke-width="2"/>
      <rect x="38" y="31" width="24" height="7" fill="#F5D46B" stroke="${O}" stroke-width="1.2"/>
      ${[34, 50, 66].map((x) => `<line x1="${x}" y1="39" x2="${x}" y2="45" stroke="${O}" stroke-width="1"/><ellipse cx="${x}" cy="50" rx="5" ry="6" fill="#F0503C" stroke="${O}" stroke-width="1.5"/>`).join('')}
      <rect x="34" y="58" width="32" height="12" fill="#E8B4A0" stroke="${O}" stroke-width="1.5"/>
      <path d="M32 58 h36 l-4 -5 h-28 z" fill="#2BB5A0" stroke="${O}" stroke-width="1.5"/>`,
    // 胡同（灰色の塀・赤い門・木）
    hutong: `
      <rect x="20" y="40" width="60" height="30" fill="#9EA3A8" stroke="${O}" stroke-width="2"/>
      <path d="M16 42 L84 42 L78 34 L22 34 Z" fill="#4C4C50" stroke="${O}" stroke-width="2"/>
      <rect x="42" y="48" width="16" height="22" fill="#B8332A" stroke="${O}" stroke-width="2"/>
      <circle cx="47" cy="59" r="1.4" fill="#F5D46B"/><circle cx="53" cy="59" r="1.4" fill="#F5D46B"/>
      <circle cx="40" cy="68" r="3" fill="#C9C4BA" stroke="${O}" stroke-width="1.2"/><circle cx="60" cy="68" r="3" fill="#C9C4BA" stroke="${O}" stroke-width="1.2"/>
      <rect x="70" y="30" width="4" height="40" fill="#7A5236" stroke="${O}" stroke-width="1.5"/>
      <circle cx="72" cy="24" r="13" fill="#6DA35A" stroke="${O}" stroke-width="2"/>
      <ellipse cx="30" cy="38" rx="4" ry="5" fill="#F0503C" stroke="${O}" stroke-width="1.2"/>`,
    // 天安門（赤い城壁と黄色い二重屋根）
    tiananmen: `
      <rect x="16" y="46" width="68" height="24" fill="#B8332A" stroke="${O}" stroke-width="2"/>
      <path d="M45 70 v-12 a5 5 0 0 1 10 0 v12 z" fill="#5A1A14" stroke="${O}" stroke-width="1.5"/>
      <path d="M28 70 v-9 a4 4 0 0 1 8 0 v9 z M64 70 v-9 a4 4 0 0 1 8 0 v9 z" fill="#5A1A14"/>
      <rect x="26" y="34" width="48" height="12" fill="#C0392B" stroke="${O}" stroke-width="2"/>
      <path d="M18 36 L82 36 L72 27 L28 27 Z" fill="#F2B530" stroke="${O}" stroke-width="2"/>
      <path d="M26 27 L74 27 L64 18 L36 18 Z" fill="#F2B530" stroke="${O}" stroke-width="2"/>
      <rect x="44" y="37" width="12" height="6" fill="#2A3A6B" stroke="${O}" stroke-width="1"/>`,
    // 故宮（白い基壇の上の大きな宮殿）
    gugong: `
      <rect x="14" y="60" width="72" height="10" fill="#F1EEE6" stroke="${O}" stroke-width="2"/>
      <rect x="20" y="54" width="60" height="7" fill="#F1EEE6" stroke="${O}" stroke-width="2"/>
      <rect x="24" y="38" width="52" height="16" fill="#B8332A" stroke="${O}" stroke-width="2"/>
      ${[0, 1, 2, 3, 4, 5].map((k) => `<rect x="${28 + k * 8.4}" y="40" width="2.4" height="14" fill="#7E2620"/>`).join('')}
      <path d="M12 40 L88 40 L76 30 L24 30 Z" fill="#F2B530" stroke="${O}" stroke-width="2"/>
      <path d="M22 30 L78 30 L66 18 L34 18 Z" fill="#F2B530" stroke="${O}" stroke-width="2"/>
      <path d="M12 40 q-4 -2 -3 -6 M88 40 q4 -2 3 -6" stroke="${O}" stroke-width="2" fill="none"/>`,
    // 万里の長城（山の上の城壁と見張り台）
    greatwall: `
      <path d="M12 70 Q30 36 50 52 Q66 30 88 70 Z" fill="#7FA866" stroke="${O}" stroke-width="2"/>
      <path d="M14 62 L30 48 L42 54 L56 40 L72 46 L86 60" stroke="#B9A98A" stroke-width="8" fill="none" stroke-linejoin="round"/>
      <path d="M14 62 L30 48 L42 54 L56 40 L72 46 L86 60" stroke="${O}" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>
      <rect x="49" y="24" width="14" height="16" fill="#C9BB9E" stroke="${O}" stroke-width="2"/>
      <path d="M49 24 v-4 h3 v3 h2 v-3 h3 v3 h2 v-3 h3 v4" fill="#C9BB9E" stroke="${O}" stroke-width="1.5"/>
      <rect x="54" y="32" width="4" height="8" fill="#5A4A3A"/>`,
    // 少林寺（山と寺と塔）
    shaolin: `
      <path d="M10 66 L30 26 L44 46 L60 18 L90 66 Z" fill="#8FA97A" stroke="${O}" stroke-width="2"/>
      <path d="M54 30 L60 18 L66 30 Z" fill="#F4F4F0"/>
      <rect x="26" y="48" width="40" height="20" fill="#A4532E" stroke="${O}" stroke-width="2"/>
      <path d="M20 50 L72 50 L62 40 L30 40 Z" fill="#5B6B5A" stroke="${O}" stroke-width="2"/>
      <rect x="40" y="56" width="12" height="12" fill="#5A2A1A" stroke="${O}" stroke-width="1.5"/>
      <rect x="40" y="43" width="12" height="5" fill="#2A2420" stroke="${O}" stroke-width="1"/>
      <path d="M76 68 v-8 h6 v8 z M75 60 h8 l-1 -4 h-6 z M76 56 h6 v-6 h-6 z M75 50 h8 l-4 -6 z" fill="#B7B2A8" stroke="${O}" stroke-width="1.5"/>`,
  };

  App.Landmarks = {
    svg: (id) => `<svg class="lm-art" viewBox="0 0 100 90" aria-hidden="true">${base}${ART[id] || ''}</svg>`,
  };
})(window.App = window.App || {});
