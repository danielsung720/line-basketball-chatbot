const SignupCounter = {
  MAX_SIGNUP_DELTA: 3,

  count: (receiveLogs, range) => {
    const timezone = 'Asia/Taipei';
    const displayDatetimeFormat = 'yyyy-MM-dd HH:mm';
    const userSignupMap = new Map();
    const userGroupMap = new Map();
    const matchedLogs = [];
    const ignoredLogs = [];

    receiveLogs.forEach(receiveLog => {
      const logTime = receiveLog.date;
      const groupId = receiveLog.groupId;
      const userId = receiveLog.userId;
      const text = SignupEventParser.parseText(receiveLog.log);

      if (!text) {
        return;
      }

      const delta = SignupEventParser.parseDelta(text);

      if (delta === null) {
        return;
      }

      if (Math.abs(delta) > SignupCounter.MAX_SIGNUP_DELTA) {
        ignoredLogs.push({
          time: Utilities.formatDate(logTime, timezone, displayDatetimeFormat),
          groupId,
          userId,
          text,
          delta,
          reason: `單次報名異動不可超過 ${SignupCounter.MAX_SIGNUP_DELTA}`,
        });

        return;
      }

      const current = userSignupMap.get(userId) || 0;
      const next = Math.max(0, current + delta);

      userSignupMap.set(userId, next);
      userGroupMap.set(userId, groupId);

      matchedLogs.push({
        time: Utilities.formatDate(logTime, timezone, displayDatetimeFormat),
        groupId,
        userId,
        text,
        delta,
        before: current,
        after: next,
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
};
