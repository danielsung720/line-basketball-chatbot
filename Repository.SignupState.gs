// SignupState 分頁:每一場球、每位使用者的目前報名人數(即時聚合狀態)。
// 欄位:game_key | user_id | count | display_name | updated_at
// 由 postback 寫入時直接覆蓋(最後一次點擊為準),讀取時免掃描 ReceiveLog。
const SignupStateRepository = {
  stateCache: null,

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

      cache[SignupStateRepository.getCacheKey(gameKey, userId)] = {
        gameKey,
        userId,
        count: Number(row[2]) || 0,
        displayName: row[3],
        rowNumber: index + 2,
      };
    });

    SignupStateRepository.stateCache = cache;

    return cache;
  },

  // 取得鎖等待毫秒數。webhook 併發時序列化「讀→改→寫」,避免連點造成重複列/覆寫遺失。
  LOCK_WAIT_MS: 15000,

  // 覆蓋寫入某使用者在某場的報名人數(count 可為 0 表示取消)。
  // 以 LockService 序列化:同一時間只有一個執行緒能進行讀改寫,解決併發 race condition。
  upsert: (gameKey, userId, count, displayName) => {
    const lock = LockService.getScriptLock();
    lock.waitLock(SignupStateRepository.LOCK_WAIT_MS);

    try {
      // 進鎖後強制重讀,才能看到剛被其他執行緒寫入的列,避免重複 append。
      SignupStateRepository.stateCache = null;

      const sheet = SignupStateRepository.getSheet();
      const cache = SignupStateRepository.getCache();
      const cacheKey = SignupStateRepository.getCacheKey(gameKey, userId);
      const now = new Date();
      const existing = cache[cacheKey];

      let record;

      if (existing) {
        sheet.getRange(existing.rowNumber, 3, 1, 3).setValues([[count, displayName, now]]);

        existing.count = count;
        existing.displayName = displayName;
        record = existing;
      } else {
        sheet.appendRow([gameKey, userId, count, displayName, now]);

        record = {
          gameKey,
          userId,
          count,
          displayName,
          rowNumber: sheet.getLastRow(),
        };

        cache[cacheKey] = record;
      }

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
