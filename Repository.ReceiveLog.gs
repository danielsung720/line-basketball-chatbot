const ReceiveLogRepository = {
  // 單次往上讀取的列數。ReceiveLog 為附加寫入、時間近似遞增,符合視窗的
  // 資料集中在表尾,因此從尾端分批往上讀,讀到早於 startTime 即停止,
  // 避免隨歷史總量成長的全表掃描。
  READ_CHUNK_SIZE: 1000,

  findByDateRange: (startTime, endTime) => {
    const sheet = SpreadsheetApp
      .openById(GOOGLE_SHEET_ID)
      .getSheetByName(GOOGLE_SHEET_NAME_RECEIVE_LOG);

    if (!sheet) {
      return [];
    }

    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    // 只有標題列或空表
    if (lastRow < 2) {
      return [];
    }

    const logs = [];
    let cursor = lastRow; // 目前批次要讀到的最底列
    let reachedStart = false;

    while (cursor >= 2 && !reachedStart) {
      const topRow = Math.max(2, cursor - ReceiveLogRepository.READ_CHUNK_SIZE + 1);
      const numRows = cursor - topRow + 1;
      const values = sheet.getRange(topRow, 1, numRows, lastColumn).getValues();

      // 由新到舊處理(陣列尾端為較新的列)
      for (let i = values.length - 1; i >= 0; i--) {
        const row = values[i];
        const date = DateTimeHelper.parse(row[0]);

        // 無法解析時間的列略過,但不因此判定已到視窗起點
        if (!date) {
          continue;
        }

        if (date < startTime) {
          reachedStart = true; // 更早的列都在視窗外,不需再往上讀
          break;
        }

        if (date > endTime) {
          continue;
        }

        logs.push({
          date,
          groupId: row[1],
          userId: row[2],
          log: row[3],
          desc: row[4],
        });
      }

      cursor = topRow - 1;
    }

    // 讀取為由新到舊,反轉回由舊到新,維持與原本一致的時間順序
    return logs.reverse();
  },
};
