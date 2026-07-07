function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'stats') {
    return StatsApiService.handleGet(e);
  }

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
