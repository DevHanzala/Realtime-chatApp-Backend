import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import admin from './services/firebase.js';
import { handleConnection } from './controllers/chatController.js';
import userRoutes from './routes/userRoute.js';  // FIXED: full path + .js

const app = express();
const server = createServer(app);

// CORS origin from .env
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Mount routes
app.use('/api', userRoutes);

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token'));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = decodedToken;
    // console.log(`Authenticated user: ${decodedToken.uid} (${decodedToken.email})`);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  handleConnection(io, socket);
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Allowed frontend: ${FRONTEND_URL}`);
  console.log(`API routes available: /api/health | /api/me`);
});