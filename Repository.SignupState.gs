// SignupState 分頁:報名點擊的「事件列」(append-only)。
// 欄位:game_key | user_id | count | display_name | updated_at(該事件的 LINE 事件時間)
//
// 設計:寫入只做 append(每個點擊記一列),保證併發下資料不遺失、也不需讀-改-寫,
//       徹底避開 GAS 跨執行緒 read-after-write 造成的重複/漏寫 race condition。
//       「同一人同一場的目前人數」由讀取端聚合:取該人事件時間最新的那一列(最後點擊為準)。
const SignupStateRepository = {
  stateCache: null,

  // 取得鎖等待毫秒數。webhook 併發時序列化「讀→改→寫」,避免連點造成重複列/覆寫遺失。
  LOCK_WAIT_MS: 15000,

  getSheet: () => {
    const spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
    let sheet = spreadsheet.getSheetByName(GOOGLE_SHEET_NAME_SIGNUP_STATE);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(GOOGLE_SHEET_NAME_SIGNUP_STATE);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['game_key', 'user_id', 'count', 'display_name', 'updated_at']);
    }

    return sheet;
  },

  getCacheKey: (gameKey, userId) => {
    return `${gameKey}::${userId}`;
  },

  // 把 Date 或字串轉成毫秒;無法解析時回傳 0。
  toMs: (value) => {
    if (value instanceof Date) {
      return value.getTime();
    }

    const date = new Date(value);

    return isNaN(date.getTime()) ? 0 : date.getTime();
  },

  getCache: () => {
    if (SignupStateRepository.stateCache !== null) {
      return SignupStateRepository.stateCache;
    }

    const sheet = SignupStateRepository.getSheet();
    const values = sheet.getDataRange().getValues();
    const cache = {};

    values.slice(1).forEach((row, index) => {
      const gameKey = row[0];
      const userId = row[1];

      if (!gameKey || !userId) {
        return;
      }

      const key = SignupStateRepository.getCacheKey(gameKey, userId);
      const record = {
        gameKey,
        userId,
        count: Number(row[2]) || 0,
        displayName: row[3],
        updatedAt: row[4],
        rowNumber: index + 2,
      };

      // 聚合:同一人同一場有多列事件時,保留 updated_at(事件時間)最新的那筆 = 最後點擊。
      const existing = cache[key];
      if (!existing || SignupStateRepository.toMs(record.updatedAt) >= SignupStateRepository.toMs(existing.updatedAt)) {
        cache[key] = record;
      }
    });

    SignupStateRepository.stateCache = cache;

    return cache;
  },

  // 純 append:每個報名動作各寫一列,不做讀-改-寫、不合併、不覆蓋。
  //   → 併發下不會遺失、也不會因 read-after-write 讀不到而重複判斷;每一列都是合法事件紀錄。
  //   聚合(同一人取最新點擊)交給讀取端 getCache/findByGameKey 處理。
  // 用一把鎖包住整批寫入,僅為確保多執行緒同時 append 時不互相覆蓋(不做任何讀取)。
  // actions: [{ gameKey, userId, count, displayName, eventTime }]
  // 回傳:受影響的 gameKey 陣列(供清快取)。
  appendActions: (actions) => {
    if (!actions || actions.length === 0) {
      return [];
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(SignupStateRepository.LOCK_WAIT_MS);

    try {
      const sheet = SignupStateRepository.getSheet();
      const rows = actions.map(action => [
        action.gameKey,
        action.userId,
        action.count,
        action.displayName,
        action.eventTime,
      ]);

      // 一次寫入整批列到表尾(持鎖期間 getLastRow 不會被其他執行緒插隊)。
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
      SpreadsheetApp.flush();

      // 記憶體快取失效,避免同執行緒後續讀取拿到舊的。
      SignupStateRepository.stateCache = null;

      const affectedGameKeys = {};
      actions.forEach(action => { affectedGameKeys[action.gameKey] = true; });

      return Object.keys(affectedGameKeys);
    } finally {
      lock.releaseLock();
    }
  },

  // 取得某場所有 count>0 的報名。count 來自「每人事件時間最新的那一列」(見 getCache 聚合),
  // 由多到少排序。
  findByGameKey: (gameKey) => {
    const cache = SignupStateRepository.getCache();

    return Object.keys(cache)
      .map(key => cache[key])
      .filter(record => record.gameKey === gameKey && record.count > 0)
      .map(record => ({
        userId: record.userId,
        count: record.count,
        displayName: record.displayName,
      }))
      .sort((a, b) => b.count - a.count);
  },
};
