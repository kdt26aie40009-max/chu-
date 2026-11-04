/* AI 会話の差し込み口（今は未使用・AI なしで全機能が動く）
 *
 * 将来「AI と中国語で自由に会話」「自由入力への返答」「添削」「習熟度に合わせた会話」を
 * 足すときは、ここに provider を登録するだけで画面側から使えるようにする。
 *
 *   App.AI.use({
 *     name: 'local' | 'server',
 *     async reply({ scene, history, input, level, learned }) {
 *       // scene:   { place: 'stall', role: '屋台のおばちゃん' } など会話の場面
 *       // history: [{ who: 'npc'|'me', zh }]
 *       // input:   プレイヤーが入力した中国語
 *       // level:   App.Progress.level().level
 *       // learned: 覚えた言葉の id 一覧（AI にはこの範囲の言葉で話してもらう）
 *       return { zh, py, ja, correction: { ok, better, note } };
 *     },
 *   });
 *
 * ⚠️ API キーをこのフロントエンド（ブラウザで動く JS）に書かないこと。
 *    外部 API を使うときは、自分のサーバー（プロキシ）を用意してキーはサーバー側に置き、
 *    ここからはそのサーバーにだけリクエストする。詳しくは README の「AI について」。
 */
(function (App) {
  'use strict';

  let provider = null;

  App.AI = {
    available: () => !!provider,
    use(p) { provider = p; },
    async reply(req) {
      if (!provider) throw new Error('AI provider is not configured');
      return provider.reply(Object.assign({
        level: App.Progress.level().level,
        learned: Object.keys(App.Store.state.learned),
      }, req));
    },
  };
})(window.App = window.App || {});
