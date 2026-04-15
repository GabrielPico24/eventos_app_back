const admin = require('firebase-admin');
const serviceAccount = require('../config/eventos-app-2026g-firebase-adminsdk-fbsvc-234683fcac.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;