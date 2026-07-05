const LineWebhookService = {
  handlePost: (e) => {
    let groupId = '-';
    let userId = '-';

    try {
      const contents = JSON.parse(e.postData.contents);
      const events = contents.events;

      if (!events || events.length === 0) {
        return ContentService.createTextOutput('No events');
      }

      const event = events[0];

      if (event.source && event.source.type === 'group') {
        groupId = event.source.groupId || '-';
        userId = event.source.userId || '-';
        SheetLogRepository.writeReceiveLog(groupId, userId, JSON.stringify(contents));

        if (LineWebhookService.isTextMessageEvent(event)) {
          LineCommandService.handleTextMessage(event.message.text, groupId);
        }
      }
    } catch (err) {
      SheetLogRepository.writeReceiveLog(groupId, userId, 'error:' + err.message);
    }

    return ContentService.createTextOutput('OK');
  },

  isTextMessageEvent: (event) => {
    return event.type === 'message' &&
      event.message &&
      event.message.type === 'text';
  },
};
