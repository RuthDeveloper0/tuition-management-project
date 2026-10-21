import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { requestSchemas, validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.post('/register', validateRequest(requestSchemas.authRegister), register);
router.post('/login', validateRequest(requestSchemas.authLogin), login);
router.get('/me', verifyToken, getMe);

export default router;