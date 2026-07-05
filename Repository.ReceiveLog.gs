const ReceiveLogRepository = {
  findByDateRange: (startTime, endTime) => {
    const sheet = SpreadsheetApp
      .openById(GOOGLE_SHEET_ID)
      .getSheetByName(GOOGLE_SHEET_NAME_RECEIVE_LOG);

    if (!sheet) {
      return [];
    }

    const values = sheet.getDataRange().getValues();

    return values.slice(1).reduce((logs, row) => {
      const date = DateTimeHelper.parse(row[0]);

      if (!date || date < startTime || date > endTime) {
        return logs;
      }

      logs.push({
        date,
        groupId: row[1],
        userId: row[2],
        log: row[3],
        desc: row[4],
      });

      return logs;
    }, []);
  },
};
