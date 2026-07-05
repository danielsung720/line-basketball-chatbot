const LineClient = {
  sendTextMsg: (message, groupId = LINE_GROUP_ID) => {
    const payload = {
      to: groupId,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    };

    try {
      const response = UrlFetchApp.fetch(LINE_PUSH_API_URL, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN,
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const code = response.getResponseCode();
      const text = response.getContentText();
      Logger.log('LINE 回應狀態碼: ' + code);
      Logger.log('LINE 回應內容: ' + text);

      SheetLogRepository.writeSendLog(groupId, MESSAGE_TYPE_LINE, {
        action: 'sendTextMsg',
        request: payload,
        responseCode: code,
        responseBody: text,
      });
    } catch (e) {
      Logger.log('發送 LINE 訊息時發生錯誤: ' + e.message);

      SheetLogRepository.writeSendLog(groupId, MESSAGE_TYPE_LINE, {
        action: 'sendTextMsg',
        request: payload,
        error: e.message,
      });
    }
  },

  getGroupMemberProfile: (groupId, userId) => {
    const url = LINE_GROUP_MEMBER_PROFILE_API_URL
      .replace('{groupId}', encodeURIComponent(groupId))
      .replace('{userId}', encodeURIComponent(userId));

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      muteHttpExceptions: true,
    });

    const statusCode = response.getResponseCode();
    const body = response.getContentText();

    if (statusCode !== 200) {
      Logger.log(`取得 LINE profile 失敗：${statusCode} ${body}`);

      return {
        userId,
        displayName: userId,
      };
    }

    const profile = JSON.parse(body);

    return {
      userId,
      displayName: profile.displayName || userId,
      pictureUrl: profile.pictureUrl || null,
    };
  },
};
