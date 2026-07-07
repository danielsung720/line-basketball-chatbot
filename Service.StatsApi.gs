// 統計唯讀 GET API,供外部網頁讀取目前報名結果(公開、無驗證)。
// 由 Controller.doGet 在 ?action=stats 時委派進來。
// 讀取來源為即時聚合狀態 SignupState(依 game_key),不再掃描 ReceiveLog。
//
// 端點:GET /exec?action=stats[&startTime=...|&now=...][&callback=fn]
//   startTime / now — 用來決定「看哪一場」的時間錨點(取該時間當週的週三為 game_key);
//                     皆未帶則以現在為準。endTime 不再使用。
//   callback        — 提供時以 JSONP(application/javascript)回傳,繞過瀏覽器 CORS 限制
//
// 注意:GAS ContentService 一律回應 HTTP 200 且無法自訂 header,
// 因此成功/失敗以回應內容的 ok 欄位表達,而非 HTTP 狀態碼。
const StatsApiService = {
  // 讀取仍有 GAS 平台開銷(冷啟動 + 轉址 + 開表),故仍快取;報名異動會即時清快取
  // (見 SignupStateService.recordEvents),所以名單既快又不會過期。TTL 只是保底。
  CACHE_TTL_SECONDS: 30,
  CACHE_PREFIX: 'stats:',

  handleGet: (e) => {
    try {
      const options = StatsApiService.parseOptions(e);
      const gameKey = GamePolicy.gameKeyForDate(StatsApiService.resolveAnchor(options));
      const cache = CacheService.getScriptCache();
      const cacheKey = StatsApiService.cacheKeyForGame(gameKey);

      const cached = cache.get(cacheKey);
      if (cached) {
        return StatsApiService.respond(e, { ok: true, data: JSON.parse(cached) });
      }

      // 直接讀即時聚合狀態(SignupState),不再掃描 ReceiveLog。
      const body = SignupStateService.getSummary(gameKey);

      cache.put(cacheKey, JSON.stringify(body), StatsApiService.CACHE_TTL_SECONDS);

      return StatsApiService.respond(e, { ok: true, data: body });
    } catch (err) {
      return StatsApiService.respond(e, { ok: false, error: err.message });
    }
  },

  cacheKeyForGame: (gameKey) => {
    return StatsApiService.CACHE_PREFIX + gameKey;
  },

  // 報名異動時清掉該場快取,讓下次讀取立即反映。
  invalidate: (gameKey) => {
    CacheService.getScriptCache().remove(StatsApiService.cacheKeyForGame(gameKey));
  },

  // 決定要看「哪一場」的時間錨點:優先 startTime,其次 now,否則現在。
  resolveAnchor: (options) => {
    const raw = options.startTime || options.now;
    const parsed = raw ? DateTimeHelper.parse(raw) : null;

    return parsed || new Date();
  },

  // 只挑出可決定球局的時間參數。
  parseOptions: (e) => {
    const params = (e && e.parameter) || {};
    const options = {};

    ['startTime', 'now'].forEach(key => {
      if (params[key]) {
        options[key] = params[key];
      }
    });

    return options;
  },

  // 有帶 callback 參數時回 JSONP,否則回 JSON。
  respond: (e, payload) => {
    const json = JSON.stringify(payload);
    const callback = e && e.parameter && e.parameter.callback;

    if (callback && StatsApiService.isValidCallbackName(callback)) {
      return ContentService
        .createTextOutput(`${callback}(${json});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  },

  // 僅允許合法的 JS 識別字元,避免 callback 名稱夾帶注入內容。
  isValidCallbackName: (name) => {
    return /^[A-Za-z_$][\w$]*$/.test(String(name));
  },
};
