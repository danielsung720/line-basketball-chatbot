# ADDCN Basketball Chatbot

Google Apps Script LINE bot for basketball signup reminders and statistics.

## Environment Variables

Sensitive config lives in local `.env` and Google Apps Script **Script Properties**.

Do not commit `.env`. Commit `.env.example` only.

Required keys:

```dotenv
GOOGLE_SHEET_ID=
GOOGLE_GEMINI_API_KEY=
GOOGLE_GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
GOOGLE_SHEET_NAME_RECEIVE_LOG=ReceiveLog
GOOGLE_SHEET_NAME_SEND_LOG=SendLog
GOOGLE_SHEET_NAME_USERS=Users

LINE_CHANNEL_ACCESS_TOKEN=
LINE_PUSH_API_URL=https://api.line.me/v2/bot/message/push
LINE_GROUP_MEMBER_PROFILE_API_URL=https://api.line.me/v2/bot/group/{groupId}/member/{userId}
LINE_GROUP_ID=
```

## Google Apps Script Setup

Apps Script cannot read the local `.env` file at runtime. After updating `.env`, also set the same keys in Apps Script:

1. Open the Apps Script project.
2. Go to **Project Settings**.
3. Under **Script Properties**, add every key from `.env`.
4. Deploy or run the script normally.

`Config.gs` reads values from `PropertiesService.getScriptProperties()`.

## Sheets

`ReceiveLog` stores incoming LINE webhook events:

| A | B | C | D | E |
| --- | --- | --- | --- | --- |
| date | group_id | user_id | log | desc |

`SendLog` stores outgoing messages and API results:

| A | B | C | D |
| --- | --- | --- | --- |
| date | group_id | target | log |

`SendLog.log` is stored as a JSON string for structured API request, response, and error details.

`Users` is used as the LINE display name cache. If it does not exist, the script creates it automatically with this header:

| A | B | C | D | E |
| --- | --- | --- | --- | --- |
| group_id | user_id | name | updated_at | deleted_at |

Rows with `deleted_at` are ignored and treated as cache misses.
