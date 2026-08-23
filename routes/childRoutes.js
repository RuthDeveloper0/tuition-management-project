import express from 'express';//ספריית הבסיס ליצירת נתבי השרת
import { createChild, updateChild, deleteChild } from '../controllers/childController.js';
import { verifyAdmin } from '../middleware/auth.js';//רכיב  שמוודא שרק מנהלים מורשים יכולים לבצע את הפעולות האלו

const router = express.Router();//יצירת ראוטר

router.post('/', verifyAdmin, createChild);//נתיב ליצירת ילד חדש
router.put('/:id', verifyAdmin, updateChild);//נתיב לעדכון פרטי ילד קיים
router.delete('/:id', verifyAdmin, deleteChild);//נתיב למחיקת ילד

export default router;//יצוא הראוטר שיתחבר לשרת