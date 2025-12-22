import admin from '../services/firebase.js';

export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    project: 'Real-Time Chat Application - DCN II',
  });
};

export const getCurrentUser = async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userRecord = await admin.auth().getUser(decodedToken.uid);

    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const profile = userDoc.exists ? userDoc.data() : {};

    res.json({
      uid: decodedToken.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || profile.username,
      photoURL: userRecord.photoURL,
      username: profile.username || null,
      online: profile.online || false,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};