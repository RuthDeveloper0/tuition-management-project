import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// פונקציית עזר לייצור Token
const generateToken = (id) => {
  // ללא expiresIn - הטוקן לא יפוג לעולם
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// הרשמת משתמש חדש
export const registerUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'שם משתמש זה כבר קיים במערכת' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: role || 'user',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'נתוני משתמש לא תקינים' });
    }
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'שגיאת שרת בהרשמה' });
  }
};

// התחברות משתמש
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'שגיאת שרת בהתחברות' });
  }
};