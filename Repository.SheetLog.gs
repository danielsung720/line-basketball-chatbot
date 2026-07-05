const SheetLogRepository = {

  /**
   * 將訊息寫入日誌
   * @param string groupId
   * @param string userId
   * @param string log
   * @param string desc
   * @return void
   */
  writeReceiveLog: (groupId = '-', userId = '-', log, desc = '') => {
    if (log != '') {
      const time = new Date().toLocaleString('zh-TW');

      const sheet = SheetLogRepository.getSheet(
        GOOGLE_SHEET_NAME_RECEIVE_LOG,
        ['date', 'group_id', 'user_id', 'log', 'desc']
      );
      sheet.appendRow([time, groupId, userId, log, desc]);
    }
  },

  writeSendLog: (groupId = '-', target, log) => {
    if (log != '') {
      const time = new Date().toLocaleString('zh-TW');
      const formattedLog = SheetLogRepository.formatLog(log);

      const sheet = SheetLogRepository.getSheet(
        GOOGLE_SHEET_NAME_SEND_LOG,
        ['date', 'group_id', 'target', 'log']
      );
      sheet.appendRow([time, groupId, target, formattedLog]);
    }
  },

  formatLog: (log) => {
    if (typeof log === 'string') {
      return log;
    }

    return JSON.stringify(log);
  },

  getSheet: (sheetName, headers) => {
    const spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    return sheet;
  },

}
