import jwt from 'jsonwebtoken';//ספריה שאחראית על יצור חתימה ואימות  אסימוני אבטחה
import Family from '../models/Family.js';

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
export const registerParent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {//אם אחד מהם חסר 
      return res.status(400).json({ message: 'יש למלא אימייל וסיסמה' });
    }

    //מנקה רווחים  מהקצוות וממיר את האותיות לקטנות,להבטיח חיפוש מדויק במסד הנתונים
    const cleanEmail = email.trim().toLowerCase();

    // בדיקה האם המייל קיים מראש בטבלת המשפחות
    const family = await Family.findOne({ email: cleanEmail });

    if (!family) {//אם לא נמצאה המשפחה אם כתובת המייל מביא שגיאה
      return res.status(404).json({ message: 'שגיאה: מייל לא רשום במערכת, אינך מורשה להירשם' });
    }

    // עדכון הסיסמה
    family.password = password.trim();
    await family.save();

    return res.status(200).json({ success: true, message: 'ההרשמה בוצעה בהצלחה' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// התחברות הורה לפי מייל וסיסמה
export const loginParent = async (req, res) => {
  try {
    const { email, password } = req.body;//שולף את כתובת המייל והסיסמה מתוך גוף הבקשה

    if (!email || !password) {//אם אחד מהם חסר 
      return res.status(400).json({ message: 'יש להזין אימייל וסיסמה' });
    }

    //מנקה רווחים  מהקצוות וממיר את האותיות לקטנות,להבטיח חיפוש מדויק במסד הנתונים
    const cleanEmail = email.trim().toLowerCase();
    const family = await Family.findOne({ email: cleanEmail });

    if (!family) {//אם לא נמצאה המשפחה אם כתובת המייל מביא שגיאה
      return res.status(401).json({ message: 'שגיאה: מייל לא רשום במערכת' });
    }

    //קורא לפונ המשוואה בין הסיסמא שהוקלדה  לבין הסיסמא המוצפנת ששמורה 
    const isMatch = await family.comparePassword(password.trim());
    if (!isMatch) {//אם הסיסמאות אינן תואמות
      return res.status(401).json({ message: 'פרטי התחברות שגויים' });
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
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// שליפת נתוני האזור האישי לפי אימייל (Query Parameter)
export const getPortalData = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {//אם אין מייל
      return res.status(400).json({ message: 'חסר פרמטר אימייל' });
    }

    //מסיר רווחים והוך לאותיות קטנות
    const family = await Family.findOne({ email: email.trim().toLowerCase() });

    if (!family) {//אם אין משפחה עם המייל
      return res.status(404).json({ message: 'שגיאה: מייל לא רשום במערכת' });
    }

    //מחזיר הצלחה + נתוני המשפחה
    return res.status(200).json({ success: true, family });
  } catch (error) {
    //מחזיר שגיאה
    return res.status(500).json({ message: error.message });
  }
};

// שליפת פרטי המשפחה והילדים של ההורה המחובר (לפי Token)
export const getMyFamily = async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId);
    if (!family) {//לא מצאה משפחה
      return res.status(404).json({ message: 'משפחה לא נמצאה' });
    }
    return res.json(family);//אם מצא מחזיר נתוני משפחה
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// עדכון פרטי משפחה
export const updateFamily = async (req, res) => {
  try {
    const familyIdToUpdate = req.params.id;//שולף את מזהה המשפחה מתוך פרמטרי ה-URL

    //קורא לפונקציה שבודקת א אתה מנהל או משתמש
    if (!isAuthorized(req, familyIdToUpdate)) {//אם אינו מנהל
      return res.status(403).json({ message: 'אין לך הרשאה לערוך נתונים של משפחה אחרת' });
    }

    //מעדכנת את נתוני המשפחה
    const updatedFamily = await Family.findByIdAndUpdate(familyIdToUpdate, req.body, { new: true });
    if (!updatedFamily) {//אם לא נמצאה 
      return res.status(404).json({ message: 'משפחה לא נמצאה' });
    }

    return res.json(updatedFamily);//אם נמצאה  מחזיר את אוביקט המשפחה
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// מחיקת משפחה
export const deleteFamily = async (req, res) => {
  try {
    const familyIdToDelete = req.params.id;//שולף את מזהה המשפחה מתוך פרמטרי ה-URL

    if (!isAuthorized(req, familyIdToDelete)) {//אם לא מנהל לפי תשובה מפונ בדיקה
      return res.status(403).json({ message: 'אין לך הרשאה למחוק משפחה אחרת' });
    }

    const deletedFamily = await Family.findByIdAndDelete(familyIdToDelete);
    if (!deletedFamily) {
      return res.status(404).json({ message: 'משפחה לא נמצאה' });
    }

    return res.json({ message: 'המשפחה נמחקה בהצלחה' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};