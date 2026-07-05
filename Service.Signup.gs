const SignupService = {
  countSignup: (options = {}) => {
    const range = SignupWindowPolicy.resolveRange(options);
    const receiveLogs = ReceiveLogRepository.findByDateRange(range.startTime, range.endTime);
    const result = SignupCounter.count(receiveLogs, {
      startTime: range.startTime,
      endTime: range.endTime,
    });

    return SignupService.attachMemberProfiles(result);
  },

  attachMemberProfiles: (result) => {
    let total = 0;
    const attendees = [];

    Object.keys(result.users).forEach(userId => {
      const count = result.users[userId];
      total += count;

      if (count > 0) {
        const groupId = result.userGroups[userId] || LINE_GROUP_ID;
        let displayName = UNKNOWN_MEMBER_DISPLAY_NAME;

        try {
          const profile = MemberService.getMemberProfile(userId, groupId);

          // 抓取失敗時 displayName 會退化成 userId(sentinel),此時維持佔位字串。
          if (profile.displayName && profile.displayName !== userId) {
            displayName = profile.displayName;
          }
        } catch (err) {
          // 單一成員解析失敗不應中斷整份統計,維持佔位字串顯示。
          Logger.log(`取得成員資料失敗,改用佔位名稱顯示(${userId}):${err.message}`);
        }

        attendees.push({
          userId,
          displayName,
          count,
        });
      }
    });

    return {
      startTime: result.startTime,
      endTime: result.endTime,
      total,
      attendees,
      users: result.users,
      logs: result.logs,
      ignoredLogs: result.ignoredLogs,
    };
  },

  formatSignupSummary: (result) => {
    return SignupSummaryFormatter.format(result);
  },
};
