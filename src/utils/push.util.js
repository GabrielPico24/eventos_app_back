const admin = require('../config/firebase-admin');

async function sendPushToUserTokens({ user, title, body, data = {} }) {
  try {
    if (!user?.fcmTokens || user.fcmTokens.length === 0) {
      console.log('⚠️ Usuario sin tokens FCM:', user?.email);
      return {
        ok: false,
        sent: 0,
        failed: 0,
        invalidTokens: [],
      };
    }

    const activeTokens = user.fcmTokens
      .filter((item) => item.isActive && item.token)
      .map((item) => item.token);

    if (activeTokens.length === 0) {
      console.log('⚠️ Usuario sin tokens FCM activos:', user?.email);
      return {
        ok: false,
        sent: 0,
        failed: 0,
        invalidTokens: [],
      };
    }

    const response = await admin.messaging().sendEachForMulticast({
  tokens: activeTokens,
  notification: {
    title,
    body,
  },
  data: Object.entries({
    ...data,
    title,
    body,
  }).reduce((acc, [key, value]) => {
    acc[key] = value?.toString() ?? '';
    return acc;
  }, {}),
  android: {
    priority: 'high',
    ttl: 1000 * 60 * 5,
    notification: {
      channelId: 'event_push_channel',
      sound: 'default',
      priority: 'high',
      defaultSound: true,
      defaultVibrateTimings: true,
    },
  },
  apns: {
    headers: {
      'apns-priority': '10',
    },
    payload: {
      aps: {
        sound: 'default',
        badge: 1,
      },
    },
  },
});

    const invalidTokens = [];

    response.responses.forEach((result, index) => {
      if (!result.success) {
        const code = result.error?.code;
        console.log('❌ Error push:', {
          email: user.email,
          token: activeTokens[index],
          code,
          message: result.error?.message,
        });

        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(activeTokens[index]);
        }
      }
    });

    console.log('✅ Push enviada:', {
      user: user.email,
      sent: response.successCount,
      failed: response.failureCount,
      invalidTokens: invalidTokens.length,
    });

    return {
      ok: true,
      sent: response.successCount,
      failed: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    console.error('❌ sendPushToUserTokens error:', error);
    return {
      ok: false,
      sent: 0,
      failed: 0,
      invalidTokens: [],
      error,
    };
  }
}

module.exports = {
  sendPushToUserTokens,
};