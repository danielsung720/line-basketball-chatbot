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
        const profile = MemberService.getMemberProfile(userId, groupId);

        attendees.push({
          userId,
          displayName: profile.displayName,
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
