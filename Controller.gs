function doGet(e) {
  return ContentService.createTextOutput("healthy");
}

function doPost(e) {
  return LineWebhookService.handlePost(e);
}

function pushBasketballNotification() {
  BasketballNotificationService.pushReminder();
}

function pushBasketballSignupResult() {
  BasketballNotificationService.pushSignupResult();
}
