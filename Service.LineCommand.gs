const LineCommandService = {
  handleTextMessage: (text, groupId) => {
    // const lineBotName = '籃球小幫手';
    // if (text.startsWith(lineBotName)) {
    //   const sendGeminiMsg = text.slice(lineBotName.length).trimStart();
    //   const geminiReplyText = GeminiClient.sendTextMsg(sendGeminiMsg, groupId);
    //   LineClient.sendTextMsg(geminiReplyText, groupId);
    // }

    // 目前沒有需要即時回應的文字指令(/統計 已移除,改由排程推送統計結果)。
  },
};
