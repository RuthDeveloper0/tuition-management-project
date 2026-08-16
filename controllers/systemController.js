import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// הרשמת משתמש
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. בדיקה שכל השדות הנדרשים התקבלו
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'נא למלא את כל השדות: שם משתמש, אימייל וסיסמה' });
    }

    // 2. בדיקה אם המשתמש או האימייל כבר קיימים
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'שם משתמש או אימייל כבר קיימים במערכת' });
    }

    // 3. הצפנת הסיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. יצירת המשתמש החדש
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // 5. יצירת טוקן JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'שגיאת שרת בהרשמה', error: error.message });
  }
};

// התחברות משתמש
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'נא להזין אימייל וסיסמה' });
    }

    // חיפוש המשתמש לפי אימייל
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'פרטי התחברות שגויים' });
    }

    // אימות הסיסמה
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'פרטי התחברות שגויים' });
    }

    // יצירת טוקן
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'שגיאת שרת בהתחברות', error: error.message });
  }
};