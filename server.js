import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// ייבוא ה-Middlewares שיצרת
import customLogger from './middleware/customLogger.js';
import { protect, adminOnly } from './middleware/auth.js';

// טעינת משתני הסביבה מקובץ .env
dotenv.config();

const app = express();

// Middlewares גלובליים
app.use(cors());
app.use(express.json());
app.use(customLogger); // הפעלת ה-Logger לכל בקשה נכנסת

// התחברות למסד הנתונים MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --------------------------------------------------
// נתיבי בדיקה (Test Routes)
// --------------------------------------------------

// 1. נתיב פתוח לכולם - לבדיקה שהשרת וה-Logger עובדים
app.get('/api/test/public', (req, res) => {
  res.json({ message: 'Public route works!' });
});

// 2. נתיב מוגן - לבדיקת מנגנון ה-protect (דורש טוקן)
app.get('/api/test/protected', protect, (req, res) => {
  res.json({ message: 'Protected route works!', user: req.user });
});

// 3. נתיב מנהלים - לבדיקת מנגנון ה-adminOnly (דורש טוקן + תפקיד admin)
app.get('/api/test/admin', protect, adminOnly, (req, res) => {
  res.json({ message: 'Admin route works!', user: req.user });
});

// --------------------------------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});