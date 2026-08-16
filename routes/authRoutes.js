import express from 'express';
import { register, login, getMe } from '../controllers/systemController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// הרשמת משתמש חדש
router.post('/register', register);

// התחברות משתמש קיים
router.post('/login', login);

// קבלת פרטי המשתמש המחובר (נתיב מוגן)
router.get('/me', protect, getMe);

export default router;