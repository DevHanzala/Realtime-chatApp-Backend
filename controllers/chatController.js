import admin from "../services/firebase.js"

const onlineUsers = new Map();

export const handleConnection = (io, socket) => {
  // console.log(`User connected: ${socket.user.uid}`);

  onlineUsers.set(socket.user.uid, socket.user.email || socket.user.uid);
  io.emit('onlineUsers', Array.from(onlineUsers.values()));

  socket.on('message', (data) => {
    const msg = {
      sender: socket.user.uid,
      text: data.text,
      timestamp: Date.now(),
    };
    io.emit('message', msg);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });

  socket.on('disconnect', async () => {
    // console.log(`User disconnected: ${socket.user.uid}`);
    onlineUsers.delete(socket.user.uid);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));

    // Update Firestore offline status (optional — skip if document not exists)
    try {
      const userDoc = await admin.firestore().collection('users').doc(socket.user.uid).get();
      if (userDoc.exists) {
        await userDoc.ref.update({ online: false });
      }
    } catch (err) {
      console.error('Offline status update failed:', err);
    }
  });
};