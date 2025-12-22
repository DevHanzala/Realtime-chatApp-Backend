import express from 'express';
import { getHealth, getCurrentUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/health', getHealth);
router.get('/me', getCurrentUser);

export default router;