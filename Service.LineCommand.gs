const LineCommandService = {
  handleTextMessage: (text, groupId) => {
    // const lineBotName = '籃球小幫手';
    // if (text.startsWith(lineBotName)) {
    //   const sendGeminiMsg = text.slice(lineBotName.length).trimStart();
    //   const geminiReplyText = GeminiClient.sendTextMsg(sendGeminiMsg, groupId);
    //   LineClient.sendTextMsg(geminiReplyText, groupId);
    // }

    // 監聽 /統計
    if (text == '/統計') {
      const result = SignupService.countSignup({endTime: new Date()});
      const message = SignupService.formatSignupSummary(result);
      LineClient.sendTextMsg(message, groupId);
    }
  },
};
