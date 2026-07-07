const SignupCounter = {
  // 文字 / 貼圖單次相對增減的上限,超過視為誤植而略過。
  MAX_SIGNUP_DELTA: 3,

  count: (receiveLogs, range) => {
    const timezone = 'Asia/Taipei';
    const displayDatetimeFormat = 'yyyy-MM-dd HH:mm';
    const userSignupMap = new Map();
    const userGroupMap = new Map();
    const matchedLogs = [];
    const ignoredLogs = [];

    // ReceiveLog 由舊到新逐列套用;因 SET 會覆蓋,自然達成「以最後一次點擊為準」。
    receiveLogs.forEach(receiveLog => {
      const logTime = receiveLog.date;
      const groupId = receiveLog.groupId;
      const userId = receiveLog.userId;
      const action = SignupEventParser.parseAction(receiveLog.log);

      if (!action) {
        return;
      }

      const current = userSignupMap.get(userId) || 0;
      const outcome = SignupCounter.applyAction(current, action);

      if (outcome.ignored) {
        ignoredLogs.push({
          time: Utilities.formatDate(logTime, timezone, displayDatetimeFormat),
          groupId,
          userId,
          kind: action.kind,
          value: action.value,
          reason: outcome.reason,
        });

        return;
      }

      userSignupMap.set(userId, outcome.next);
      userGroupMap.set(userId, groupId);

      matchedLogs.push({
        time: Utilities.formatDate(logTime, timezone, displayDatetimeFormat),
        groupId,
        userId,
        kind: action.kind,
        value: action.value,
        before: current,
        after: outcome.next,
      });
    });

    return {
      startTime: Utilities.formatDate(range.startTime, timezone, displayDatetimeFormat),
      endTime: Utilities.formatDate(range.endTime, timezone, displayDatetimeFormat),
      users: Object.fromEntries(userSignupMap),
      userGroups: Object.fromEntries(userGroupMap),
      logs: matchedLogs,
      ignoredLogs,
    };
  },

  // 依動作型別計算套用後的人數。回傳 { next } 或 { ignored: true, reason }。
  applyAction: (current, action) => {
    if (action.kind === SIGNUP_ACTION_SET) {
      // 按鈕點擊:直接覆蓋為絕對人數(已在解析層限制 0~MAX)。
      return { next: Math.max(0, action.value), ignored: false };
    }

    // 相對增減(文字 / 貼圖)。
    if (Math.abs(action.value) > SignupCounter.MAX_SIGNUP_DELTA) {
      return {
        ignored: true,
        reason: `單次報名異動不可超過 ${SignupCounter.MAX_SIGNUP_DELTA}`,
      };
    }

    return { next: Math.max(0, current + action.value), ignored: false };
  },
};
