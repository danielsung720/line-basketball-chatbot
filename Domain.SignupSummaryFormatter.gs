const SignupSummaryFormatter = {
  format: (result) => {
    const attendeeText = result.attendees.length > 0
      ? result.attendees
          .map((attendee, index) => {
            return `${index + 1}. ${attendee.displayName}：${attendee.count} 人`;
          })
          .join('\n')
      : '目前沒有人報名';

    return [
      '🏀 報名統計',
      `開始時間：${result.startTime}`,
      `結束時間：${result.endTime}`,
      `目前報名人數：${result.total} 人`,
      '出席名單：',
      attendeeText,
    ].join('\n');
  },
};
