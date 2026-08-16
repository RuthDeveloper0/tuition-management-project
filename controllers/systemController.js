import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// פונקציית עזר ליצירת JWT Token כולל id ו-role
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '30d' }
  );
};

// 1. הרשמת משתמש חדש
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'נא למלא את כל השדות: שם משתמש, אימייל וסיסמה' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'שם משתמש או אימייל כבר קיימים במערכת' });
    }

    // יצירת המשתמש — ה-Pre-Hook ב-User.js יצפין את הסיסמה אוטומטית!
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'parent'
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'שגיאת שרת בהרשמה', error: error.message });
  }
};

// 2. התחברות משתמש
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'נא להזין אימייל וסיסמה' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'פרטי התחברות שגויים' });
    }

    // שימוש במתודה comparePassword מהמודל User.js
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'פרטי התחברות שגויים' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'שגיאת שרת בהתחברות', error: error.message });
  }
};

// 3. קבלת פרטי המשתמש המחובר (getMe)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ message: 'שגיאת שרת בקבלת נתוני משתמש', error: error.message });
  }
};