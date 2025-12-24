const onlineUsers = new Map(); // uid -> email
const roomMessages = new Map(); // roomId -> [messages]

export const handleConnection = (io, socket) => {
  const { uid, email } = socket.user;

  console.log('[CONNECT]', uid, email);
  onlineUsers.set(uid, email);
  io.emit('onlineUsers', [...new Set(onlineUsers.values())]);

  socket.on('joinRoom', (roomId) => {
    console.log('[JOIN ROOM]', email, 'joined', roomId);
    socket.join(roomId);

    // REPLAY HISTORY TO NEW JOINER
    const history = roomMessages.get(roomId) || [];
    socket.emit('messageHistory', history);
  });

  socket.on('message', ({ roomId, text }) => {
    const msg = {
      sender: uid,
      roomId,
      text,
      timestamp: Date.now(),
    };

    console.log('[MESSAGE]', { from: email, roomId, text });

    // Save to history
    if (!roomMessages.has(roomId)) roomMessages.set(roomId, []);
    roomMessages.get(roomId).push(msg);

    // Limit history to last 50 messages (optional)
    if (roomMessages.get(roomId).length > 50) {
      roomMessages.get(roomId).shift();
    }

    io.to(roomId).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('[DISCONNECT]', email);
    onlineUsers.delete(uid);
    io.emit('onlineUsers', [...new Set(onlineUsers.values())]);
  });
};