const admin = require('firebase-admin');
const fs = require('fs');

if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    throw new Error(
      'Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT_PATH'
    );
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;