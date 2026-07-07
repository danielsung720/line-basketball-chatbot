// 即時報名聚合的應用服務。
//   寫入:webhook 收到事件時 recordEvents 批次更新 SignupState 並清該場快取。
//   讀取:getSummary 供 stats API 與統計推播共用,兩邊數字永遠一致。
const SignupStateService = {
  // 處理一個 webhook request 內的所有事件(LINE 會把多筆點擊打包在同一 request)。
  // 每筆按鈕報名各解析成一個 action,顯示名稱在鎖外先解析好,再純 append 寫入
  // (每個事件一列,不合併、不覆蓋);聚合由讀取端處理。
  // 任何例外都只記錄不外拋,避免影響 webhook 回應(資料仍已寫入 ReceiveLog)。
  recordEvents: (events) => {
    try {
      const actions = [];

      (events || []).forEach(event => {
        if (!event || !event.source || event.source.type !== 'group') {
          return;
        }

        if (event.type !== 'postback') {
          return;
        }

        const action = SignupEventParser.actionFromEvent(event);

        // 只處理按鈕報名(SET);其他 postback 忽略。
        if (!action || action.kind !== SIGNUP_ACTION_SET) {
          return;
        }

        const userId = event.source.userId || '-';
        const groupId = event.source.groupId || '-';
        const eventTime = event.timestamp ? new Date(Number(event.timestamp)) : new Date();

        actions.push({
          gameKey: GamePolicy.gameKeyForDate(eventTime),
          userId,
          count: action.value,
          // 顯示名稱在鎖外先解析好(可能讀 Users/LINE API),不佔用寫入鎖。
          displayName: SignupStateService.resolveDisplayName(userId, groupId),
          eventTime,
        });
      });

      if (actions.length === 0) {
        return;
      }

      SignupStateRepository.appendActions(actions);
    } catch (err) {
      Logger.log('更新 SignupState 失敗: ' + err.message);
    }
  },

  // 取得某場的統計摘要,形狀與 SignupSummaryFormatter 及 stats API 期望一致。
  getSummary: (gameKey) => {
    const window = GamePolicy.windowForGameKey(gameKey);
    const rows = SignupStateRepository.findByGameKey(gameKey);

    let total = 0;
    const attendees = rows.map(row => {
      total += row.count;

      return {
        displayName: row.displayName || UNKNOWN_MEMBER_DISPLAY_NAME,
        count: row.count,
      };
    });

    return {
      startTime: window.startTime,
      endTime: window.endTime,
      total,
      attendees,
    };
  },

  // 解析顯示名稱,失敗時退回佔位字串(不中斷寫入)。
  resolveDisplayName: (userId, groupId) => {
    try {
      const profile = MemberService.getMemberProfile(userId, groupId);

      if (profile.displayName && profile.displayName !== userId) {
        return profile.displayName;
      }
    } catch (err) {
      Logger.log(`取得成員資料失敗,改用佔位名稱(${userId}):${err.message}`);
    }

    return UNKNOWN_MEMBER_DISPLAY_NAME;
  },
};
