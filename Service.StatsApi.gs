// 統計唯讀 GET API,供外部網頁讀取目前報名結果(公開、無驗證)。
// 由 Controller.doGet 在 ?action=stats 時委派進來。
//
// 端點:GET /exec?action=stats[&startTime=...&endTime=...&now=...][&callback=fn]
//   startTime / endTime / now — 覆寫統計時間視窗(預設由 SignupWindowPolicy 決定)
//   callback  — 提供時以 JSONP(application/javascript)回傳,繞過瀏覽器 CORS 限制
//
// 注意:GAS ContentService 一律回應 HTTP 200 且無法自訂 header,
// 因此成功/失敗以回應內容的 ok 欄位表達,而非 HTTP 狀態碼。
const StatsApiService = {
  handleGet: (e) => {
    try {
      const options = StatsApiService.parseOptions(e);
      const result = SignupService.countSignup(options);

      return StatsApiService.respond(e, {
        ok: true,
        data: StatsApiService.toResponseBody(result),
      });
    } catch (err) {
      return StatsApiService.respond(e, { ok: false, error: err.message });
    }
  },

  // 只挑出可覆寫統計視窗的參數,原封不動交給 SignupService/SignupWindowPolicy 解析。
  parseOptions: (e) => {
    const params = (e && e.parameter) || {};
    const options = {};

    ['startTime', 'endTime', 'now'].forEach(key => {
      if (params[key]) {
        options[key] = params[key];
      }
    });

    return options;
  },

  // 只輸出外部網頁需要的欄位,不外洩 userId、logs、ignoredLogs 等內部資料。
  toResponseBody: (result) => {
    return {
      startTime: result.startTime,
      endTime: result.endTime,
      total: result.total,
      attendees: result.attendees.map(attendee => ({
        displayName: attendee.displayName,
        count: attendee.count,
      })),
    };
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
