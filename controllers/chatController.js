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

  const msg = {
    sender: uid,
    roomId,
    text,
    file: file
      ? {
          url: file.url,
          name: file.name,
          type: file.type,
          size: file.size,
        }
      : null,
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

socket.on('call-offer', ({ roomId, offer, withVideo = true }) => {
  console.log('[CALL OFFER]', email, 'to room', roomId, 'video:', withVideo);
  socket.to(roomId).emit('call-offer', { offer, from: email, withVideo });
});

  socket.on('call-answer', ({ roomId, answer }) => {
    console.log('[CALL ANSWER]', email, 'in room', roomId);
    socket.to(roomId).emit('call-answer', { answer });
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  socket.on('call-ended', ({ roomId }) => {
    console.log('[CALL ENDED]', email, 'in room', roomId);
    socket.to(roomId).emit('call-ended');
  });

  socket.on('disconnect', () => {
    console.log('[DISCONNECT]', email);

    onlineUsers.delete(uid);
    io.emit('onlineUsers', [...new Set(onlineUsers.values())]);
  });
};