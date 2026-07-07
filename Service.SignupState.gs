// 即時報名聚合的應用服務。
//   寫入:webhook 收到 postback 時 recordPostback,直接更新 SignupState 並清該場快取。
//   讀取:getSummary 供 stats API 與統計推播共用,兩邊數字永遠一致。
const SignupStateService = {
  // 處理一則 postback 報名事件:算出所屬球局、覆蓋人數、解析顯示名稱。
  // 任何例外都只記錄不外拋,避免影響 webhook 回應(資料仍已寫入 ReceiveLog)。
  recordPostback: (event, groupId, userId) => {
    try {
      const action = SignupEventParser.actionFromEvent(event);

      // 只處理按鈕報名(SET);其他事件忽略。
      if (!action || action.kind !== SIGNUP_ACTION_SET) {
        return;
      }

      const eventTime = event.timestamp ? new Date(event.timestamp) : new Date();
      const gameKey = GamePolicy.gameKeyForDate(eventTime);
      const displayName = SignupStateService.resolveDisplayName(userId, groupId);

      SignupStateRepository.upsert(gameKey, userId, action.value, displayName);

      // 報名有異動,清掉該場的統計快取,讓下次讀取立即反映。
      StatsApiService.invalidate(gameKey);
    } catch (err) {
      Logger.log(`更新 SignupState 失敗(${userId}):${err.message}`);
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
