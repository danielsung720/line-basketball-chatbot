// 報名動作的兩種語意,決定 SignupCounter 如何套用到目前人數:
//   DELTA — 相對增減(文字 +1 / -2、貼圖),累加在目前人數上。
//   SET   — 設定絕對值(點擊報名按鈕),直接覆蓋,達成「以最後一次點擊為準」。
const SIGNUP_ACTION_DELTA = 'delta';
const SIGNUP_ACTION_SET = 'set';

// SignupAction 值物件:把「使用者做了什麼報名操作」與「怎麼算」解耦。
// 解析層(SignupEventParser)只負責產生這個物件,計數層(SignupCounter)只負責套用。
const SignupAction = {
  // 相對增減,value 可正可負(例如文字 +1 → 1、-2 → -2)。
  delta: (value) => ({
    kind: SIGNUP_ACTION_DELTA,
    value,
  }),

  // 設定絕對報名人數,value 為 >= 0 的整數(例如按鈕「報名 2 人」→ 2、「取消報名」→ 0)。
  set: (value) => ({
    kind: SIGNUP_ACTION_SET,
    value,
  }),
};
