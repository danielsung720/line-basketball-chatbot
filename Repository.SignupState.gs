// SignupState 分頁:每一場球、每位使用者的目前報名人數(即時聚合狀態)。
// 欄位:game_key | user_id | count | display_name | updated_at
//   updated_at 存「該筆勝出點擊的 LINE 事件時間」,用來做「最後點擊為準」的比較。
// 以 (game_key, user_id) 為唯一鍵:寫入用 LockService 序列化 + 事件時間戳守衛,
// 讀取對任何殘留重複列取最新者,確保結果正確。
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

      // 若同一鍵有殘留重複列(過去併發造成),保留 updated_at 最新的那筆。
      const existing = cache[key];
      if (!existing || SignupStateRepository.toMs(record.updatedAt) >= SignupStateRepository.toMs(existing.updatedAt)) {
        cache[key] = record;
      }
    });

    SignupStateRepository.stateCache = cache;

    return cache;
  },

  // 覆蓋寫入某使用者在某場的報名人數(count 可為 0 表示取消)。
  //   以 LockService 序列化,避免併發重複 append;
  //   以事件時間戳守衛,只有較新的點擊才覆蓋,確保「最後一次點擊為準」與處理順序無關。
  upsert: (gameKey, userId, count, displayName, eventTime) => {
    const lock = LockService.getScriptLock();
    lock.waitLock(SignupStateRepository.LOCK_WAIT_MS);

    try {
      // 進鎖後強制重讀,才能看到剛被其他執行緒寫入的列,避免重複 append。
      SignupStateRepository.stateCache = null;

      const sheet = SignupStateRepository.getSheet();
      const cache = SignupStateRepository.getCache();
      const cacheKey = SignupStateRepository.getCacheKey(gameKey, userId);
      const eventMs = SignupStateRepository.toMs(eventTime);
      const existing = cache[cacheKey];

      if (existing) {
        // 這筆事件比已記錄的還舊(晚到的較早點擊)→ 略過,不覆蓋較新的結果。
        if (SignupStateRepository.toMs(existing.updatedAt) > eventMs) {
          return existing;
        }

        sheet.getRange(existing.rowNumber, 3, 1, 3).setValues([[count, displayName, eventTime]]);

        existing.count = count;
        existing.displayName = displayName;
        existing.updatedAt = eventTime;

        SpreadsheetApp.flush();

        return existing;
      }

      sheet.appendRow([gameKey, userId, count, displayName, eventTime]);

      const record = {
        gameKey,
        userId,
        count,
        displayName,
        updatedAt: eventTime,
        rowNumber: sheet.getLastRow(),
      };

      cache[cacheKey] = record;

      // 確保寫入在放鎖前落地,下一個持鎖者重讀才看得到。
      SpreadsheetApp.flush();

      return record;
    } finally {
      lock.releaseLock();
    }
  },

  // 取得某場所有 count>0 的報名(由多到少排序)。
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
