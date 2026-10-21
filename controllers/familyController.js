import jwt from 'jsonwebtoken';//ספריה שאחראית על יצור חתימה ואימות  אסימוני אבטחה
import Family from '../models/Family.js';
import AppError from '../middleware/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

//מגדיר את המפתח הסודי שמשמש לחתימת האסימונים  
// וכן מנסה לשלוף את המפתח ואם לא מצליח משתמש במחרוזת ברירת מחדל
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// פונקציית עזר לבדיקת הרשאות
const isAuthorized = (req, familyId) => {
  //בודק האם יש משתמש מחובר ומאומת במערכת
  //אם הוא מנהל מעניק לו הרשאה מלאה 
  //בודק האם מזהה המשפחה של המשתמש המחובר תואם למזהה המשפחה שאליו מנסים לגשת
  //מחזיר כן אם אחד מהם מתקיים
  return req.user && (req.user.role === 'admin' || req.user.familyId === familyId.toString());
};

// הרשמת הורה - אימות שהמייל קיים בבסיס הנתונים ועדכון סיסמה
export const registerParent = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {//אם אחד מהם חסר 
      throw new AppError(400, 'יש למלא אימייל וסיסמה');
    }

    //מנקה רווחים  מהקצוות וממיר את האותיות לקטנות,להבטיח חיפוש מדויק במסד הנתונים
    const cleanEmail = email.trim().toLowerCase();

    // בדיקה האם המייל קיים מראש בטבלת המשפחות
    const family = await Family.findOne({ email: cleanEmail });

    if (!family) {//אם לא נמצאה המשפחה אם כתובת המייל מביא שגיאה
      throw new AppError(404, 'שגיאה: מייל לא רשום במערכת, אינך מורשה להירשם');
    }

    // עדכון הסיסמה
    family.password = password.trim();
    await family.save();

    return res.status(200).json({ success: true, message: 'ההרשמה בוצעה בהצלחה' });
});

// התחברות הורה לפי מייל וסיסמה
export const loginParent = asyncHandler(async (req, res) => {
    const { email, password } = req.body;//שולף את כתובת המייל והסיסמה מתוך גוף הבקשה

    if (!email || !password) {//אם אחד מהם חסר 
      throw new AppError(400, 'יש להזין אימייל וסיסמה');
    }

    //מנקה רווחים  מהקצוות וממיר את האותיות לקטנות,להבטיח חיפוש מדויק במסד הנתונים
    const cleanEmail = email.trim().toLowerCase();
    const family = await Family.findOne({ email: cleanEmail });

    if (!family) {//אם לא נמצאה המשפחה אם כתובת המייל מביא שגיאה
      throw new AppError(401, 'שגיאה: מייל לא רשום במערכת');
    }

    //קורא לפונ המשוואה בין הסיסמא שהוקלדה  לבין הסיסמא המוצפנת ששמורה 
    const isMatch = await family.comparePassword(password.trim());
    if (!isMatch) {//אם הסיסמאות אינן תואמות
      throw new AppError(401, 'פרטי התחברות שגויים');
    }


    //יוצר אסימון אימות המכיל את מזהה המשפחה תפקיד המשתמש חותם אותו בעזרת המפתח הסודי
    //ומגדיר לו תוקף של 7 ימים
    const token = jwt.sign(
      { familyId: family._id, role: 'client' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    //מחזיר ללקוח תשובה מוצלחת הכוללת את אסימון האבטחה,מזהה המשפחה וכתובת המייל
    return res.json({ token, familyId: family._id, email: family.email });
});

// שליפת נתוני האזור האישי לפי אימייל (Query Parameter)
export const getPortalData = asyncHandler(async (req, res) => {
    const { email } = req.query;

    if (!email) {//אם אין מייל
      throw new AppError(400, 'חסר פרמטר אימייל');
    }

    //מסיר רווחים והוך לאותיות קטנות
    const family = await Family.findOne({ email: email.trim().toLowerCase() });

    if (!family) {//אם אין משפחה עם המייל
      throw new AppError(404, 'שגיאה: מייל לא רשום במערכת');
    }

    //מחזיר הצלחה + נתוני המשפחה
    return res.status(200).json({ success: true, family });
});

// שליפת פרטי המשפחה והילדים של ההורה המחובר (לפי Token)
export const getMyFamily = asyncHandler(async (req, res) => {
    const family = await Family.findById(req.user.familyId);
    if (!family) {//לא מצאה משפחה
      throw new AppError(404, 'משפחה לא נמצאה');
    }
    return res.json(family);//אם מצא מחזיר נתוני משפחה
});

// עדכון פרטי משפחה
export const updateFamily = asyncHandler(async (req, res) => {
    const familyIdToUpdate = req.params.id;//שולף את מזהה המשפחה מתוך פרמטרי ה-URL

    //קורא לפונקציה שבודקת א אתה מנהל או משתמש
    if (!isAuthorized(req, familyIdToUpdate)) {//אם אינו מנהל
      throw new AppError(403, 'אין לך הרשאה לערוך נתונים של משפחה אחרת');
    }

    //מעדכנת את נתוני המשפחה
    const updatedFamily = await Family.findByIdAndUpdate(familyIdToUpdate, req.body, { new: true });
    if (!updatedFamily) {//אם לא נמצאה 
      throw new AppError(404, 'משפחה לא נמצאה');
    }

    return res.json(updatedFamily);//אם נמצאה  מחזיר את אוביקט המשפחה
});

// מחיקת משפחה
export const deleteFamily = asyncHandler(async (req, res) => {
    const familyIdToDelete = req.params.id;//שולף את מזהה המשפחה מתוך פרמטרי ה-URL

    if (!isAuthorized(req, familyIdToDelete)) {//אם לא מנהל לפי תשובה מפונ בדיקה
      throw new AppError(403, 'אין לך הרשאה למחוק משפחה אחרת');
    }

    const deletedFamily = await Family.findByIdAndDelete(familyIdToDelete);
    if (!deletedFamily) {
      throw new AppError(404, 'משפחה לא נמצאה');
    }

    return res.json({ message: 'המשפחה נמחקה בהצלחה' });
});