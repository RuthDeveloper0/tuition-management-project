import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Family from '../models/Family.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// הרשמת משתמש הורה חדש
export const register = async (req, res) => {
  try {
    const { username, password, familyCode } = req.body;

    if (!username || !password || !familyCode) {
      return res.status(400).json({ message: 'יש להזין שם משתמש, סיסמה וקוד משפחה' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'שם משתמש זה כבר קיים במערכת' });
    }

    const cleanCode = familyCode.trim().replace('#', '').toLowerCase();

    // חיפוש המשפחה במסד הנתונים לפי ID מלא, שדה code, או סופית ה-ID
    const allFamilies = await Family.find({});
    const family = allFamilies.find(f => {
      const idStr = f._id.toString().toLowerCase();
      const codeStr = (f.code || f.familyCode || '').toLowerCase();
      return (
        idStr === cleanCode ||
        codeStr === cleanCode ||
        idStr.endsWith(cleanCode)
      );
    });

    if (!family) {
      return res.status(400).json({ message: 'קוד המשפחה שהוזן אינו תקין או שאינו קיים במערכת' });
    }

    const newUser = new User({
      username: username.trim(),
      password: password,
      role: 'client',
      familyId: family._id
    });

    await newUser.save();
    res.status(201).json({ message: 'משתמש נרשם בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// התחברות למערכת (מנהל או הורה)
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'יש להזין שם משתמש וסיסמה' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, familyId: user.familyId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role, familyId: user.familyId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};