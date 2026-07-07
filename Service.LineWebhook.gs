const LineWebhookService = {
  handlePost: (e) => {
    // GAS 的 doPost 無法讀取 HTTP header,無法驗證 X-Line-Signature。
    // 改以不可猜的 query token 當作驗證閘門,不符即丟棄(fail closed)。
    if (!LineWebhookService.isAuthorized(e)) {
      return ContentService.createTextOutput('Unauthorized');
    }

    let logGroupId = '-';
    let logUserId = '-';

    try {
      const contents = JSON.parse(e.postData.contents);
      const events = contents.events;

      if (!events || events.length === 0) {
        return ContentService.createTextOutput('No events');
      }

      // LINE 一個 request 可能夾帶多筆事件(連點時尤其如此),必須逐一處理,
      // 不能只看 events[0],否則同批的其餘點擊會被丟掉。
      // ReceiveLog 以第一筆群組事件的 ids 標記,整包 contents 存一次(稽核用途)。
      const firstGroupEvent = events.find(ev => ev.source && ev.source.type === 'group');

      if (firstGroupEvent) {
        logGroupId = firstGroupEvent.source.groupId || '-';
        logUserId = firstGroupEvent.source.userId || '-';
        SheetLogRepository.writeReceiveLog(logGroupId, logUserId, JSON.stringify(contents));
      }

      events.forEach(event => {
        try {
          LineWebhookService.handleEvent(event);
        } catch (err) {
          // 單筆事件失敗不影響同批其餘事件。
          Logger.log('處理事件失敗: ' + err.message);
        }
      });
    } catch (err) {
      SheetLogRepository.writeReceiveLog(logGroupId, logUserId, 'error:' + err.message);
    }

    return ContentService.createTextOutput('OK');
  },

  // 處理單一事件(僅限群組)。
  handleEvent: (event) => {
    if (!event.source || event.source.type !== 'group') {
      return;
    }

    const groupId = event.source.groupId || '-';
    const userId = event.source.userId || '-';

    if (LineWebhookService.isTextMessageEvent(event)) {
      LineCommandService.handleTextMessage(event.message.text, groupId);
    } else if (event.type === 'postback') {
      // 點擊報名:即時更新聚合狀態(SignupState),供統計與網頁直接讀取。
      SignupStateService.recordPostback(event, groupId, userId);
    }
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
