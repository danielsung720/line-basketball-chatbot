// 球局政策:把「某個時間點」對應到它所屬的那一場球(game_key),
// 以及由 game_key 還原顯示用的報名視窗。
// game_key = 該週「週三」的日期(yyyy-MM-dd),用來區分不同週的球局。
const GamePolicy = {
  TIMEZONE: 'Asia/Taipei',

  // 傳入日期 → 所屬球局的 game_key(當週週三日期)。
  gameKeyForDate: (date) => {
    const wed = GamePolicy.wednesdayOfWeek(date);
    return Utilities.formatDate(wed, GamePolicy.TIMEZONE, 'yyyy-MM-dd');
  },

  // 取得該日期所在週(週一~週日)的週三。
  wednesdayOfWeek: (date) => {
    const d = new Date(date);
    const mondayIndex = (d.getDay() + 6) % 7; // 週一=0, 週二=1, 週三=2 ... 週日=6
    const offsetToWed = 2 - mondayIndex;
    const wed = new Date(d);
    wed.setDate(d.getDate() + offsetToWed);

    return wed;
  },

  // 由 game_key 還原顯示用視窗:週二 10:00 ~ 週三 18:00,格式為 "yyyy-MM-dd HH:mm"。
  windowForGameKey: (gameKey) => {
    const parts = String(gameKey).split('-');
    const wed = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    const wedEnd = new Date(wed);
    wedEnd.setHours(18, 0, 0, 0);

    const tueStart = new Date(wed);
    tueStart.setDate(wed.getDate() - 1);
    tueStart.setHours(10, 0, 0, 0);

    return {
      startTime: Utilities.formatDate(tueStart, GamePolicy.TIMEZONE, 'yyyy-MM-dd HH:mm'),
      endTime: Utilities.formatDate(wedEnd, GamePolicy.TIMEZONE, 'yyyy-MM-dd HH:mm'),
    };
  },
};
