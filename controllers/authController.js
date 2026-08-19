import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// 1. הרשמת משתמש חדש (הורה) - שם משתמש וסיסמה בלבד
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'יש להזין שם משתמש וסיסמה' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'שם המשתמש כבר קיים במערכת' });
    }

    // המודל מטפל בהצפנת הסיסמה ב-pre('save')
    const user = new User({
      username,
      password,
      role: 'client'
    });

    await user.save();

    res.status(201).json({ message: 'הרשמה בוצעה בהצלחה' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בהרשמה', error: error.message });
  }
};

// 2. התחברות משתמש (מנהל או הורה)
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'יש להזין שם משתמש וסיסמה' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    // יצירת טוקן
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      role: user.role,
      username: user.username,
      familyId: user.familyId
    });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בהתחברות', error: error.message });
  }
};

// 3. אימות טוקן לקבלת פרטי המשתמש המחובר (Auto-Login)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};