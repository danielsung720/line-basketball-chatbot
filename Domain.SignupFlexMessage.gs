// 建構「點擊報名」的 Flex 訊息。按鈕以 postback 觸發,data 形如 action=signup&count=N,
// 由 SignupEventParser.actionFromPostback 解析成 SignupAction.set(N)。
// 點擊帶 displayText 回顯選擇,且以最後一次點擊為準(SET 覆蓋語意)。
// footer 放一顆連到報名名單網頁的連結按鈕。
const SignupFlexMessage = {
  ALT_TEXT: '🏀 週三打球日報名',

  // 報名名單靜態網頁(GitHub Pages)
  STATS_WEB_URL: 'https://danielsung720.github.io/basketball-signup-web/',

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
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📋 查看報名名單',
              uri: SignupFlexMessage.STATS_WEB_URL,
            },
          },
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
        data: `action=${SignupEventParser.POSTBACK_ACTION}&count=${count}`,
        // displayText 讓點擊者在群組回顯自己的選擇,作為即時 feedback;
        // 因採「最後一次點擊為準」,連點也不會重複計數。
        displayText: count === 0 ? '我要取消報名' : `我報名 ${count} 人`,
      },
    };
  },
};
