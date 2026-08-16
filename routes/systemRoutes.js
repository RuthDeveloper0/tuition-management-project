import express from 'express';
import { registerUser, loginUser } from '../controllers/systemController.js';

const router = express.Router();

// נתיב להרשמה
router.post('/register', registerUser);

// נתיב להתחברות
router.post('/login', loginUser);

export default router;