const SignupEventParser = {
  parseText: (logRaw) => {
    if (!logRaw) {
      return null;
    }

    try {
      const payload = JSON.parse(logRaw);

      if (!payload.events || !Array.isArray(payload.events)) {
        return null;
      }

      for (const event of payload.events) {
        if (
          event.type !== 'message' ||
          !event.message
        ) {
          continue;
        }

        if (event.message.type === 'text') {
          return event.message.text;
        }

        if (event.message.type === 'sticker') {
          return SignupEventParser.parseStickerKeywords(event.message.keywords);
        }
      }

      return null;
    } catch (error) {
      return String(logRaw).trim();
    }
  },

  parseDelta: (text) => {
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

  parseStickerKeywords: (keywords) => {
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
};
