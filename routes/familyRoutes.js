import express from 'express';
import {
  getFamilies,
  createFamily,
  addChild,
  updateFamily,
  deleteFamily
} from '../controllers/familyController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// נתיב בסיסי - קבלת משפחות ויצירת משפחה חדשה
router.route('/')
  .get(protect, getFamilies)
  .post(protect, adminOnly, createFamily);

// נתיב להוספת ילד למשפחה ספציפית
router.post('/:id/children', protect, adminOnly, addChild);

// נתיבים לפי מזהה משפחה - עדכון ומחיקה
router.route('/:id')
  .put(protect, adminOnly, updateFamily)
  .delete(protect, adminOnly, deleteFamily);

export default router;