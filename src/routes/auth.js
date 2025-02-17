import express from 'express';
import { signup, signin, refreshToken, logout, getInfo } from '../controllers/authController.js';
import { authValidationRules, refreshTokenValidationRules } from '../utils/validation.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Публичные маршруты
router.post('/signup', authValidationRules, signup);
router.post('/signin', authValidationRules, signin);
router.post('/signin/new_token', refreshTokenValidationRules, refreshToken);

// Защищенные маршруты
router.get('/info', authMiddleware, getInfo);
router.get('/logout', authMiddleware, logout);

export default router;
