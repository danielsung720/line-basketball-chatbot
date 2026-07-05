const DateTimeHelper = {
  parse: (value) => {
    if (value instanceof Date) {
      return value;
    }

    if (!value) {
      return null;
    }

    const text = String(value).trim();

    const matched = text.match(
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s*(上午|下午)\s*(\d{1,2}):(\d{1,2}):(\d{1,2})$/
    );

    if (!matched) {
      const parsed = new Date(text);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    const ampm = matched[4];
    let hour = Number(matched[5]);
    const minute = Number(matched[6]);
    const second = Number(matched[7]);

    if (ampm === '下午' && hour < 12) {
      hour += 12;
    }

    if (ampm === '上午' && hour === 12) {
      hour = 0;
    }

    return new Date(year, month - 1, day, hour, minute, second);
  },
};
