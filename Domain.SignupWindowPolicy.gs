const SignupWindowPolicy = {
  resolveRange: (options = {}) => {
    const now = options.now
      ? DateTimeHelper.parse(options.now)
      : new Date();

    const defaultStartTime = new Date(now);
    defaultStartTime.setDate(defaultStartTime.getDate() - 1);
    defaultStartTime.setHours(10, 0, 0, 0);

    const defaultEndTime = new Date(now);
    defaultEndTime.setHours(17, 0, 0, 0);

    const startTime = options.startTime
      ? DateTimeHelper.parse(options.startTime)
      : defaultStartTime;

    const endTime = options.endTime
      ? DateTimeHelper.parse(options.endTime)
      : defaultEndTime;

    if (!startTime || !endTime) {
      throw new Error('startTime 或 endTime 格式錯誤，無法解析時間');
    }

    return {
      startTime,
      endTime,
    };
  },
};
