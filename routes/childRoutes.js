import express from 'express';
import {
  getChildren,
  getChildById,
  updateChild,
  deleteChild
} from '../controllers/childController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// נתיב לקבלת כל הילדים
router.route('/')
  .get(protect, getChildren);

// נתיבים לפי מזהה ילד ספציפי - צפייה, עדכון ומחיקה
router.route('/:id')
  .get(protect, getChildById)
  .put(protect, adminOnly, updateChild)
  .delete(protect, adminOnly, deleteChild);

export default router;