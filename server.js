import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import systemRoutes from './routes/systemRoutes.js';
import authRoutes from './routes/authRoutes.js';
import familyRoutes from './routes/familyRoutes.js';
import childRoutes from './routes/childRoutes.js';
import customLogger from './middleware/customLogger.js';

dotenv.config();

const app = express();

// הגדרת __dirname בעבודה עם ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// חיבור למסד הנתונים MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tuitionDB';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Middleware לקבלת נתוני JSON בגוף הבקשה (Body)
app.use(express.json());

// Logger מותאם אישית למעקב אחר בקשות
app.use(customLogger);

// הגדרת תיקיית uploads ותיקיית public כתיקיות סטטיות
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// חיבור נתיבי ה-API
app.use('/api/system', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/children', childRoutes);

// הרצת השרת
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));