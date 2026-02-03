const admin = require("firebase-admin");
const serviceAccount = require("../db/serviceAccount.json");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Push Notification Handler
const sendPushNotification = async (notification) => {
  const uniqueTokens = notification?.tokens;

  for (const deviceToken of uniqueTokens) {
    const message = {
      token: deviceToken,
      notification: notification?.notification,
      data: notification?.data || {},
    };

    try {
      const response = await admin.messaging().send(message);
      console.log(`Notification sent to ${deviceToken}:`, response);
    } catch (error) {
      console.error(`Error sending to ${deviceToken}:`, error.message);
    }
  }
};

module.exports = sendPushNotification;
