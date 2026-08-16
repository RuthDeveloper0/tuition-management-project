import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/systemController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// הרשמת משתמש חדש
router.post('/register', registerUser);

// התחברות משתמש קיים
router.post('/login', loginUser);

// קבלת פרטי המשתמש המחובר (נתיב מוגן)
router.get('/me', protect, getMe);

export default router;