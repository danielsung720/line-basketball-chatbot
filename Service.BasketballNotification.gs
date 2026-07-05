const BasketballNotificationService = {
  pushReminder: (now = new Date()) => {
    if (BasketballNotificationService.shouldPushReminder(now)) {
      const message = '明天又是週三打球日囉🏀\n請要出席的人幫我喊+1❤️\n(人數統計請用文字訊息 +, +1, ++, +數字, -, --, -數字,  貼圖(+1類型)，其餘資訊不統計)';
      LineClient.sendTextMsg(message);

      return;
    }

    const timeString = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
    SheetLogRepository.writeSendLog(LINE_GROUP_ID, MESSAGE_TYPE_LINE, {
      action: 'pushBasketballNotification',
      status: 'skipped',
      reason: 'schedule_not_matched',
      currentTime: timeString,
    });
  },

  pushSignupResult: () => {
    const result = SignupService.countSignup({endTime: new Date()});
    const message = SignupService.formatSignupSummary(result);

    LineClient.sendTextMsg(message);
  },

  shouldPushReminder: (now) => {
    const day = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, ...
    const hour = now.getHours();
    const minute = now.getMinutes();

    const isTuesday = day === 2;
    const isBetween10And11 = (hour === 10) || (hour === 11 && minute === 0);

    return isTuesday && isBetween10And11;
  },
};
