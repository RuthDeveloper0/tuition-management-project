import express from 'express';
import { advanceYear } from '../controllers/systemController.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/advance-year', verifyAdmin, advanceYear);

export default router;