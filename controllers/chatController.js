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
    console.log('[JOIN ROOM]', email, roomId);
    socket.join(roomId);

    const history = await getRoomMessages(roomId);

    socket.emit('messageHistory', {
      roomId,
      history,
    });
  });

  // SEND MESSAGE (MUST BE OUTSIDE joinRoom)
  socket.on('message', async ({ roomId, text }) => {
    const msg = {
      sender: uid,
      roomId,
      text,
      participants: roomId.split('_'),
      timestamp: Date.now(),
    };

    console.log('[MESSAGE]', email, roomId, text);

    await saveMessage(roomId, msg);

    io.to(roomId).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('[DISCONNECT]', email);

    onlineUsers.delete(uid);
    io.emit('onlineUsers', [...new Set(onlineUsers.values())]);
  });
};
