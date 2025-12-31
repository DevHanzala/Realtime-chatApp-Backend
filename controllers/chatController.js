import { saveMessage, getRoomMessages } from '../services/firestoreChat.js';

const onlineUsers = new Map(); // uid -> email

export const handleConnection = (io, socket) => {
  const { uid, email } = socket.user;

  console.log('[CONNECT]', uid, email);

  // Track online users
  onlineUsers.set(uid, email);
  io.emit('onlineUsers', [...new Set(onlineUsers.values())]);

  // JOIN ROOM
  socket.on('joinRoom', async (roomId) => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.leave(room);
      }
    }

    socket.join(roomId);

    const history = await getRoomMessages(roomId);

    socket.emit('messageHistory', {
      roomId,
      history,
    });
  });

  // SEND MESSAGE — Now supports text + file
socket.on('message', async (payload) => {
  const { roomId, text = '', file } = payload;

  console.log('[BACKEND RECEIVED MESSAGE]', {
    from: email,
    roomId,
    hasText: !!text,
    hasFile: !!file,
    fileName: file?.name,
    fileSize: file?.size,
  });

  const msg = {
    sender: uid,
    roomId,
    text,
    file, // pass file through
    participants: roomId.split('_'),
    timestamp: Date.now(),
  };

  await saveMessage(roomId, msg);
  io.to(roomId).emit('message', msg);
});
  // Typing indicator
  socket.on('typing', ({ roomId, username, isTyping }) => {
    socket.to(roomId).emit('typing', {
      username,
      isTyping,
    });
  });

  socket.on('disconnect', () => {
    console.log('[DISCONNECT]', email);

    onlineUsers.delete(uid);
    io.emit('onlineUsers', [...new Set(onlineUsers.values())]);
  });
};