import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import AppError from '../middleware/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// 1. הרשמת משתמש חדש (הורה) - שם משתמש וסיסמה בלבד
export const register = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new AppError(400, 'שם המשתמש כבר קיים במערכת');
    }

    // המודל מטפל בהצפנת הסיסמה ב-pre('save')
    const user = new User({
      username,
      password,
      role: 'client'
    });

    await user.save();

    res.status(201).json({ message: 'הרשמה בוצעה בהצלחה' });
});

// 2. התחברות משתמש (מנהל או הורה)
export const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(400, 'שם משתמש או סיסמה שגויים');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError(400, 'שם משתמש או סיסמה שגויים');
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
});

// 3. אימות טוקן לקבלת פרטי המשתמש המחובר (Auto-Login)
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      throw new AppError(404, 'משתמש לא נמצא');
    }
    res.json(user);
});