const UserRepository = {
  userCache: null,

  findActive: (groupId, userId) => {
    const cache = UserRepository.getCache();
    const cacheKey = UserRepository.getCacheKey(groupId, userId);

    return cache[cacheKey] || null;
  },

  upsert: (groupId, userId, name) => {
    const sheet = UserRepository.getSheet();
    const cache = UserRepository.getCache();
    const cacheKey = UserRepository.getCacheKey(groupId, userId);
    const now = new Date();
    const cachedUser = cache[cacheKey];

    if (cachedUser) {
      sheet.getRange(cachedUser.rowNumber, 3, 1, 3).setValues([[name, now, '']]);

      cachedUser.name = name;
      cachedUser.updatedAt = now;
      cachedUser.deletedAt = '';

      return cachedUser;
    }

    sheet.appendRow([groupId, userId, name, now, '']);

    const user = {
      groupId,
      userId,
      name,
      updatedAt: now,
      deletedAt: '',
      rowNumber: sheet.getLastRow(),
    };

    cache[cacheKey] = user;

    return user;
  },

  getCache: () => {
    if (UserRepository.userCache !== null) {
      return UserRepository.userCache;
    }

    const sheet = UserRepository.getSheet();
    const values = sheet.getDataRange().getValues();
    const cache = {};

    values.slice(1).forEach((row, index) => {
      const groupId = row[0];
      const userId = row[1];
      const name = row[2];
      const updatedAt = row[3];
      const deletedAt = row[4];

      if (!groupId || !userId || !name || deletedAt) {
        return;
      }

      cache[UserRepository.getCacheKey(groupId, userId)] = {
        groupId,
        userId,
        name,
        updatedAt,
        deletedAt,
        rowNumber: index + 2,
      };
    });

    UserRepository.userCache = cache;

    return cache;
  },

  getSheet: () => {
    const spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
    let sheet = spreadsheet.getSheetByName(GOOGLE_SHEET_NAME_USERS);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(GOOGLE_SHEET_NAME_USERS);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['group_id', 'user_id', 'name', 'updated_at', 'deleted_at']);
    }

    return sheet;
  },

  getCacheKey: (groupId, userId) => {
    return `${groupId}:${userId}`;
  },
};
