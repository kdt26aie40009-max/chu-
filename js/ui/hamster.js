/* ナビゲーターのハムスター（SVG で描画。画像ファイル不要） */
(function (App) {
  'use strict';

  const EYES = {
    normal: `
      <ellipse cx="43" cy="58" rx="5.5" ry="6.5" fill="#2A1E16"/><circle cx="45" cy="55.5" r="2" fill="#fff"/>
      <ellipse cx="77" cy="58" rx="5.5" ry="6.5" fill="#2A1E16"/><circle cx="79" cy="55.5" r="2" fill="#fff"/>`,
    happy: `
      <path d="M37 60 q6 -8 12 0" stroke="#2A1E16" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M71 60 q6 -8 12 0" stroke="#2A1E16" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    wow: `
      <circle cx="43" cy="57" r="7" fill="#2A1E16"/><circle cx="45.5" cy="54" r="2.6" fill="#fff"/><circle cx="41" cy="60" r="1.2" fill="#fff"/>
      <circle cx="77" cy="57" r="7" fill="#2A1E16"/><circle cx="79.5" cy="54" r="2.6" fill="#fff"/><circle cx="75" cy="60" r="1.2" fill="#fff"/>`,
    think: `
      <ellipse cx="43" cy="59" rx="5.5" ry="5" fill="#2A1E16"/><circle cx="45" cy="57" r="1.8" fill="#fff"/>
      <ellipse cx="77" cy="59" rx="5.5" ry="5" fill="#2A1E16"/><circle cx="79" cy="57" r="1.8" fill="#fff"/>
      <path d="M36 49 l12 3" stroke="#B9773F" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M84 49 l-12 3" stroke="#B9773F" stroke-width="2.4" stroke-linecap="round"/>`,
  };

  const MOUTH = {
    normal: '<path d="M55 69.5 q2.5 3 5 0 q2.5 3 5 0" stroke="#8A5532" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
    happy: '<path d="M54.5 69 q5.5 8 11 0 z" fill="#E36B6B" stroke="#8A5532" stroke-width="1.4" stroke-linejoin="round"/>',
    wow: '<ellipse cx="60" cy="72" rx="3.4" ry="4" fill="#E36B6B" stroke="#8A5532" stroke-width="1.3"/>',
    think: '<path d="M56 71 q4 -2 8 0" stroke="#8A5532" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
  };

  function svg(mood = 'normal') {
    const m = EYES[mood] ? mood : 'normal';
    return `
<svg class="hamster-svg" viewBox="0 0 120 112" aria-hidden="true">
  <ellipse cx="60" cy="106" rx="34" ry="5" fill="rgba(90,60,30,.12)"/>
  <circle cx="30" cy="30" r="12" fill="#E9A060"/><circle cx="30" cy="30" r="6.5" fill="#F6B3A9"/>
  <circle cx="90" cy="30" r="12" fill="#E9A060"/><circle cx="90" cy="30" r="6.5" fill="#F6B3A9"/>
  <ellipse cx="60" cy="62" rx="46" ry="42" fill="#F4B26A"/>
  <ellipse cx="60" cy="78" rx="31" ry="26" fill="#FFF5E6"/>
  <path d="M52 22 q8 -6 16 0" stroke="#E9A060" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${EYES[m]}
  <ellipse cx="30" cy="70" rx="7.5" ry="4.5" fill="#FF8F8F" opacity=".55"/>
  <ellipse cx="90" cy="70" rx="7.5" ry="4.5" fill="#FF8F8F" opacity=".55"/>
  <ellipse cx="60" cy="65.5" rx="2.8" ry="2.1" fill="#D9706A"/>
  ${MOUTH[m]}
  <ellipse cx="46" cy="93" rx="6.5" ry="4.5" fill="#F9CDB0"/>
  <ellipse cx="74" cy="93" rx="6.5" ry="4.5" fill="#F9CDB0"/>
  <g transform="rotate(-10 66 20)">
    <ellipse cx="66" cy="22" rx="20" ry="4.8" fill="#EFC45E"/>
    <path d="M54 22 q1 -12 12 -12 q11 0 12 12 z" fill="#F7D985"/>
    <rect x="54.4" y="16.6" width="23.2" height="3.6" rx="1.8" fill="#2BB5A0"/>
  </g>
</svg>`;
  }

  const DEFAULT_NAME = 'ハムコシ'; // ← はじめの名前。設定画面からいつでも変えられる（settings.hamsterName）
  App.Hamster = {
    DEFAULT_NAME,
    get name() {
      const s = App.Store && App.Store.state && App.Store.state.settings;
      const n = s && typeof s.hamsterName === 'string' ? s.hamsterName.trim() : '';
      return n || DEFAULT_NAME;
    },
    svg,
    figure({ mood = 'normal', size = 'md', bounce = false } = {}) {
      return `<div class="hamster hamster-${size}${bounce ? ' is-bounce' : ''}">${svg(mood)}</div>`;
    },
  };
})(window.App = window.App || {});
