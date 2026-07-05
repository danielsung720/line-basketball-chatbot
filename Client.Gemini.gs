const GeminiClient = {

  /**
   * 送出訊息
   * @param string message 文字訊息
   * @return string|null
   */
  sendTextMsg: (message, groupId = '-') => {
    message = message.replace(/[\s\u3000]/g, '');
    if (message == '') {
      return null;
    }

    try {
      const apiKey = GOOGLE_GEMINI_API_KEY;
      const url = GOOGLE_GEMINI_API_URL + `?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: message
              }
            ]
          }
        ]
      };

      const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseBody = response.getContentText();
      const result = JSON.parse(responseBody);
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      SheetLogRepository.writeSendLog(groupId, MESSAGE_TYPE_GEMINI, {
        action: 'sendTextMsg',
        prompt: message,
        responseCode,
        responseBody,
        responseText: text || null,
      });

      return text;
    } catch (e) {
      SheetLogRepository.writeSendLog(groupId, MESSAGE_TYPE_GEMINI, {
        action: 'sendTextMsg',
        prompt: message,
        error: e.message,
      });
      return null;
    }
  },

}
