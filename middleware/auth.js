import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware לאימות הטוקן (JWT) ובדיקה שהמשתמש מחובר
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. בדיקה אם נשלח טוקן ב-Headers של הבקשה תחת Authorization בפורמט Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // חילוץ המחרוזת של הטוקן מתוך 'Bearer <token>'
      token = req.headers.authorization.split(' ')[1];

      // 2. פענוח ואימות תוקף הטוקן באמצעות המפתח הסודי מתוך משתני הסביבה
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. שליפת המשתמש ממסד הנתונים לפי ה-ID שפוענח (ללא שדה הסיסמה)
      req.user = await User.findById(decoded.id).select('-password');

      // 4. מעבר לבקר/ל-Middleware הבא בשרשרת
      next();
    } catch (error) {
      // אם הטוקן לא תקין או פג תוקפו
      return res.status(401).json({ message: 'אימות נכשל, טוקן לא תקין' });
    }
  }

  // אם לא נשלח טוקן כלל
  if (!token) {
    return res.status(401).json({ message: 'אין הרשאת גישה, לא נשלח טוקן' });
  }
};

/**
 * Middleware לבדיקה אם המשתמש המחובר הוא בעל הרשאת מנהל (admin)
 */
export const adminOnly = (req, res, next) => {
  // בדיקה שקיים משתמש מחובר ושתפקידו מוגדר כ-admin
  if (req.user && req.user.role === 'admin') {
    next(); // המשתמש הוא מנהל - ממשיכים
  } else {
    // אם המשתמש אינו מנהל
    res.status(403).json({ message: 'גישה חסומה: הרשאת מנהל בלבד' });
  }
};