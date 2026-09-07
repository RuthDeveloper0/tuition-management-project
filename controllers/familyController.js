import jwt from 'jsonwebtoken';
import Family from '../models/Family.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// פונקציית עזר לבדיקת הרשאות
const isAuthorized = (req, familyId) => {
  return req.user && (req.user.role === 'admin' || req.user.familyId === familyId.toString());
};

// הרשמת הורה - אימות שהמייל קיים בבסיס הנתונים ועדכון סיסמה
export const registerParent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'יש למלא אימייל וסיסמה' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // בדיקה האם המייל קיים מראש בטבלת המשפחות
    const family = await Family.findOne({ email: cleanEmail });

    if (!family) {
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'יש להזין אימייל וסיסמה' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const family = await Family.findOne({ email: cleanEmail });

    if (!family) {
      return res.status(401).json({ message: 'שגיאה: מייל לא רשום במערכת' });
    }

    const isMatch = await family.comparePassword(password.trim());
    if (!isMatch) {
      return res.status(401).json({ message: 'פרטי התחברות שגויים' });
    }

    const token = jwt.sign(
      { familyId: family._id, role: 'client' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, familyId: family._id, email: family.email });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// שליפת נתוני האזור האישי לפי אימייל (Query Parameter)
export const getPortalData = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'חסר פרמטר אימייל' });
    }

    const family = await Family.findOne({ email: email.trim().toLowerCase() });

    if (!family) {
      return res.status(404).json({ message: 'שגיאה: מייל לא רשום במערכת' });
    }

    return res.status(200).json({ success: true, family });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// שליפת פרטי המשפחה והילדים של ההורה המחובר (לפי Token)
export const getMyFamily = async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId);
    if (!family) {
      return res.status(404).json({ message: 'משפחה לא נמצאה' });
    }
    return res.json(family);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// עדכון פרטי משפחה
export const updateFamily = async (req, res) => {
  try {
    const familyIdToUpdate = req.params.id;

    if (!isAuthorized(req, familyIdToUpdate)) {
      return res.status(403).json({ message: 'אין לך הרשאה לערוך נתונים של משפחה אחרת' });
    }

    const updatedFamily = await Family.findByIdAndUpdate(familyIdToUpdate, req.body, { new: true });
    if (!updatedFamily) {
      return res.status(404).json({ message: 'משפחה לא נמצאה' });
    }

    return res.json(updatedFamily);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// מחיקת משפחה
export const deleteFamily = async (req, res) => {
  try {
    const familyIdToDelete = req.params.id;

    if (!isAuthorized(req, familyIdToDelete)) {
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