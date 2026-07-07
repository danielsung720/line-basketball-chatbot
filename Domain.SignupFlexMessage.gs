// 建構「點擊報名」的 Flex 訊息。按鈕以 postback 觸發,data 形如 action=signup&count=N,
// 由 SignupEventParser.actionFromPostback 解析成 SignupAction.set(N)。
// 依需求:點擊不回覆訊息(不設 displayText),且以最後一次點擊為準(SET 覆蓋語意)。
const SignupFlexMessage = {
  ALT_TEXT: '🏀 週三打球日報名',

  build: () => {
    return {
      type: 'flex',
      altText: SignupFlexMessage.ALT_TEXT,
      contents: SignupFlexMessage.buildBubble(),
    };
  },

  buildBubble: () => {
    return {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: '🏀 週三打球日報名',
            weight: 'bold',
            size: 'lg',
          },
          {
            type: 'text',
            text: '點下方按鈕選擇出席人數(可含自己帶的朋友),以最後一次點擊為準。',
            size: 'sm',
            color: '#8C8C8C',
            wrap: true,
          },
          SignupFlexMessage.signupButton('報名 1 人', 1, 'primary'),
          SignupFlexMessage.signupButton('報名 2 人', 2, 'primary'),
          SignupFlexMessage.signupButton('報名 3 人', 3, 'primary'),
          SignupFlexMessage.signupButton('取消報名', 0, 'secondary'),
        ],
      },
    };
  },

  signupButton: (label, count, style) => {
    return {
      type: 'button',
      style,
      height: 'sm',
      action: {
        type: 'postback',
        label,
        // 不帶 displayText:點擊只默默記錄,不在群組洗版。
        data: `action=${SignupEventParser.POSTBACK_ACTION}&count=${count}`,
      },
    };
  },
};
