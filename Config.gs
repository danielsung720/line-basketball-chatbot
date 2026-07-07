const Config = {
  get: (key, defaultValue) => {
    const value = PropertiesService.getScriptProperties().getProperty(key);

    if (value !== null && value !== '') {
      return value;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(`Missing required script property: ${key}`);
  },
};

// GOOGLE
var GOOGLE_SHEET_ID = Config.get('GOOGLE_SHEET_ID');
var GOOGLE_GEMINI_API_KEY = Config.get('GOOGLE_GEMINI_API_KEY');
var GOOGLE_GEMINI_API_URL = Config.get(
  'GOOGLE_GEMINI_API_URL',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
);

var GOOGLE_SHEET_NAME_RECEIVE_LOG = Config.get('GOOGLE_SHEET_NAME_RECEIVE_LOG', 'ReceiveLog');
var GOOGLE_SHEET_NAME_SEND_LOG = Config.get('GOOGLE_SHEET_NAME_SEND_LOG', 'SendLog');
var GOOGLE_SHEET_NAME_USERS = Config.get('GOOGLE_SHEET_NAME_USERS', 'Users');
var GOOGLE_SHEET_NAME_SIGNUP_STATE = Config.get('GOOGLE_SHEET_NAME_SIGNUP_STATE', 'SignupState');

// LINE
var LINE_CHANNEL_ACCESS_TOKEN = Config.get('LINE_CHANNEL_ACCESS_TOKEN');
var LINE_PUSH_API_URL = Config.get('LINE_PUSH_API_URL', 'https://api.line.me/v2/bot/message/push');
var LINE_GROUP_MEMBER_PROFILE_API_URL = Config.get(
  'LINE_GROUP_MEMBER_PROFILE_API_URL',
  'https://api.line.me/v2/bot/group/{groupId}/member/{userId}'
);
var LINE_GROUP_ID = Config.get('LINE_GROUP_ID');
// Webhook 驗證用的不可猜 token(掛在 /exec?token=... );未設定則一律拒絕請求
var LINE_WEBHOOK_TOKEN = Config.get('LINE_WEBHOOK_TOKEN', '');

var MESSAGE_TYPE_GEMINI = 'Gemini';
var MESSAGE_TYPE_LINE = 'Line';

// 無法取得 LINE 顯示名稱時,統計清單改用的佔位字串
var UNKNOWN_MEMBER_DISPLAY_NAME = '未知成員';
