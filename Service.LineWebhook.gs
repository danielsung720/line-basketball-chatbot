const LineWebhookService = {
  handlePost: (e) => {
    // GAS 的 doPost 無法讀取 HTTP header,無法驗證 X-Line-Signature。
    // 改以不可猜的 query token 當作驗證閘門,不符即丟棄(fail closed)。
    if (!LineWebhookService.isAuthorized(e)) {
      return ContentService.createTextOutput('Unauthorized');
    }

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
        } else if (event.type === 'postback') {
          // 點擊報名:即時更新聚合狀態(SignupState),供統計與網頁直接讀取。
          SignupStateService.recordPostback(event, groupId, userId);
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

  /**
   * 驗證請求是否帶有正確的 webhook token。
   * token 未設定時一律拒絕(fail closed),避免設定遺漏造成端點裸奔。
   */
  isAuthorized: (e) => {
    const expected = LINE_WEBHOOK_TOKEN;

    if (!expected) {
      return false;
    }

    const provided = (e && e.parameter && e.parameter.token) || '';

    return LineWebhookService.safeEqual(String(provided), String(expected));
  },

  // 常數時間字串比較,避免以回應時間差推測 token。
  safeEqual: (a, b) => {
    if (a.length !== b.length) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return diff === 0;
  },
};
