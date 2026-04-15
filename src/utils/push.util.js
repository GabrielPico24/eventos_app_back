const admin = require('../config/firebase-admin');

async function sendPushToUserTokens({ user, title, body, data = {} }) {
  if (!user?.fcmTokens || user.fcmTokens.length === 0) return;

  const activeTokens = user.fcmTokens
    .filter((item) => item.isActive && item.token)
    .map((item) => item.token);

  if (activeTokens.length === 0) return;

  await admin.messaging().sendEachForMulticast({
    tokens: activeTokens,
    notification: {
      title,
      body,
    },
    data: Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = value?.toString() ?? '';
      return acc;
    }, {}),
  });
}

module.exports = {
  sendPushToUserTokens,
};