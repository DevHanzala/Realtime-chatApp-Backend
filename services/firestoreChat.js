import admin from './firebase.js';

const db = admin.firestore();

export const saveMessage = async (roomId, message) => {
  const roomRef = db.collection('chats').doc(roomId);

  await roomRef.set(
    {
      participants: message.participants,
      lastMessage: message.text || (message.file ? message.file.name : ''),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await roomRef.collection('messages').add({
    sender: message.sender,
    text: message.text || '',
    file: message.file || null,   // ✅ THIS LINE FIXES EVERYTHING
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
};


export const getRoomMessages = async (roomId, limit = 50) => {
  const snap = await db
    .collection('chats')
    .doc(roomId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    timestamp: d.data().timestamp?.toMillis() || Date.now(),
  }));
};
