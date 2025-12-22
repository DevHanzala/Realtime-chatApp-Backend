import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,  // Direct use – multi-line works!
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

export default admin;