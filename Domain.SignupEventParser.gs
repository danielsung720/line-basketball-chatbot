// 把一列 ReceiveLog 的原始內容,解析成一個 SignupAction(或 null 表示與報名無關)。
// 目前統計「只認點擊報名」:parseAction 僅解析 postback 事件 → SignupAction.set(count)。
// 文字 / 貼圖的解析方法(actionFromText / parseDelta / stickerToDeltaSymbol)刻意保留備用,
// 但未接進 actionFromEvent,因此不會被計入統計。
const SignupEventParser = {
  // 按鈕報名可設定的最大人數(含自己帶的朋友)。
  MAX_SIGNUP_COUNT: 3,

  // 按鈕 postback 攜帶的 action 名稱,用來與其他 postback 區隔。
  POSTBACK_ACTION: 'signup',

  parseAction: (logRaw) => {
    if (!logRaw) {
      return null;
    }

    let payload;

    try {
      payload = JSON.parse(logRaw);
    } catch (error) {
      // 非事件 JSON(例如早期純文字列)一律不計入,只認點擊報名。
      return null;
    }

    if (!payload.events || !Array.isArray(payload.events)) {
      return null;
    }

    for (const event of payload.events) {
      const action = SignupEventParser.actionFromEvent(event);

      if (action) {
        return action;
      }
    }

    return null;
  },

  // 只認點擊報名(postback)。文字 / 貼圖事件一律不計入統計。
  actionFromEvent: (event) => {
    if (!event) {
      return null;
    }

    if (event.type === 'postback' && event.postback) {
      return SignupEventParser.actionFromPostback(event.postback.data);
    }

    return null;
  },

  // 按鈕點擊:postback.data 形如 "action=signup&count=2",count 為 0~MAX 的絕對人數。
  actionFromPostback: (dataString) => {
    const params = SignupEventParser.parseQueryString(dataString);

    if (params.action !== SignupEventParser.POSTBACK_ACTION) {
      return null;
    }

    const count = Number(params.count);

    if (
      !Number.isInteger(count) ||
      count < 0 ||
      count > SignupEventParser.MAX_SIGNUP_COUNT
    ) {
      return null;
    }

    return SignupAction.set(count);
  },

  // ── 以下為文字 / 貼圖報名的解析方法,目前保留備用、未接進 actionFromEvent ──
  // 若日後要重新開放文字報名,在 actionFromEvent 加回對應分派即可。

  // 文字 / 貼圖語意:解析成相對增減。
  actionFromText: (text) => {
    const delta = SignupEventParser.parseDelta(text);

    if (delta === null) {
      return null;
    }

    return SignupAction.delta(delta);
  },

  parseDelta: (text) => {
    if (text === null || text === undefined) {
      return null;
    }

    let normalizedText = String(text).trim();

    normalizedText = normalizedText.replace(/^["'「『“‘]+|["'」』”’]+$/g, '');
    normalizedText = normalizedText
      .replace(/[＋]/g, '+')
      .replace(/[－]/g, '-');
    normalizedText = normalizedText.replace(/\s+/g, '');

    if (normalizedText === '+') {
      return 1;
    }

    if (normalizedText === '-') {
      return -1;
    }

    const matched = normalizedText.match(/^([+-])(\d+)$/);

    if (!matched) {
      return null;
    }

    const sign = matched[1];
    const number = Number(matched[2]);

    if (!Number.isInteger(number) || number <= 0) {
      return null;
    }

    return sign === '+' ? number : -number;
  },

  // 把 (+1 類 / -1 類)貼圖關鍵字歸類成 '+' 或 '-' 符號,再交給 parseDelta。
  stickerToDeltaSymbol: (keywords) => {
    if (!Array.isArray(keywords)) {
      return null;
    }

    const normalizedKeywords = keywords.map(keyword => {
      return String(keyword).trim().toLowerCase();
    });

    const positiveKeywords = [
      'yes',
      'agree',
      '+1',
      '+',
      'add',
      'ok',
      'okay',
      'join',
      'go',
      'me',
    ];

    const negativeKeywords = [
      'no',
      'cancel',
      'remove',
      'withdraw',
      'quit',
      'minus',
      '-1',
      '-',
    ];

    const hasPositiveKeyword = normalizedKeywords.some(keyword => {
      return positiveKeywords.includes(keyword);
    });

    if (hasPositiveKeyword) {
      return '+';
    }

    const hasNegativeKeyword = normalizedKeywords.some(keyword => {
      return negativeKeywords.includes(keyword);
    });

    if (hasNegativeKeyword) {
      return '-';
    }

    return null;
  },

  // 解析 "a=1&b=2" 形式的字串為物件;無值或格式不符時回傳空物件。
  parseQueryString: (dataString) => {
    const params = {};

    if (!dataString) {
      return params;
    }

    String(dataString).split('&').forEach(pair => {
      if (!pair) {
        return;
      }

      const index = pair.indexOf('=');
      const key = index >= 0 ? pair.slice(0, index) : pair;
      const value = index >= 0 ? pair.slice(index + 1) : '';

      params[decodeURIComponent(key)] = decodeURIComponent(value);
    });

    return params;
  },
};
