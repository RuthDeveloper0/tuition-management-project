// ייבוא ספריית Express לבניית השרת וניהול נתיבי ה-API
import express from 'express';
// ייבוא ספריית Mongoose לחיבור וניהול מסד הנתונים MongoDB
import mongoose from 'mongoose';
// ייבוא מתווך (Middleware) המאפשר תקשורת שרת-לקוח בין כתובות שונות (CORS)
import cors from 'cors';
// ייבוא ספריית dotenv לטעינת משתני סביבה מקובץ .env
import dotenv from 'dotenv';
// ייבוא ספריית path לניהול נתיבי קבצים ותיקיות במערכת ההפעלה
import path from 'path';
// ייבוא פונקציה להמרת כתובת URL של קובץ לנתיב מערכת קבצים בסביבת מודולים
import { fileURLToPath } from 'url';

// ייבוא נתיבי ה-API הקשורים לאימות וניהול משתמשים
import authRoutes from './routes/authRoutes.js';
// ייבוא נתיבי ה-API הקשורים לניהול המשפחות במערכת
import familyRoutes from './routes/familyRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// טעינת משתני הסביבה מתוך קובץ ה-.env אל תוך process.env
dotenv.config();

// יצירת מופע של אפליקציית השרת באמצעות Express
const app = express();
// הגדרת מספר הפורט שעליו ירוץ השרת (מתוך משתני הסביבה או ברירת מחדל 5000)
const PORT = process.env.PORT || 5000;

// מחרוזת חיבור ישירה למסד הנתונים (MongoDB Atlas)
const MONGO_URI = process.env.MONGO_URI;

// חילוץ נתיב הקובץ הנוכחי בסביבת ES Modules
const __filename = fileURLToPath(import.meta.url);
// חילוץ תיקיית האב של הקובץ הנוכחי
const __dirname = path.dirname(__filename);

// הפעלת מתווך ה-CORS לאפשר גישה לשרת ממקורות שונים
app.use(cors());
// הפעלת מתווך המאפשר לשרת לקרוא ולנתח נתונים בפורמט JSON מגוף הבקשה
app.use(express.json());
// הפעלת מתווך המאפשר פענוח נתונים מטפסים (URL-encoded)
app.use(express.urlencoded({ extended: true }));

// הגדרת הנתיב לתיקיית צד הלקוח לצורך הנגשת קבצים סטטיים
const clientPath = path.join(__dirname, 'client');
// הגדרת תיקיית הלקוח כתיקייה הנגשת לציבור בשרת
app.use(express.static(clientPath));
// הגדרת תיקיית ההעלאות כתיקייה ציבורית להצגת קבצים שהועלו
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// הגדרת ניתוב עבור כל בקשות ה-API
//  של אימות תחת הקידומת /api/auth
app.use('/api/auth', authRoutes);
// הגדרת ניתוב עבור כל בקשות ה-API 
// הקשורות למשפחות תחת הקידומת /api/families
app.use('/api/families', familyRoutes);

// הגדרת נתיב בדיקה (Health Check) לווידוא שהשרת פועל תקין
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running smoothly' });
});

// הגדרת תמיכה באפליקציית Single Page Application (SPA) - הפניית כל בקשה אחרת ל-index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// מתווך מרכזי לטיפול בשגיאות מכל נתיבי השרת
app.use(errorHandler);

// התחברות למסד הנתונים MongoDB Atlas עם הגדרת פסק זמן ותמיכה בעקיפת בעיות אימות SSL
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,//ירוץ לאחר 5 שניות
  tlsAllowInvalidCertificates: true
})
  .then(() => {
    // הדפסת הודעת הצלחה ברגע שהחיבור למסד הנתונים הושלם
    console.log('Connected to MongoDB Atlas successfully.');
    // הפעלת השרת להאזין לבקשות בפורט שהוגדר
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    // טיפול והצגת שגיאה במקרה שהחיבור למסד הנתונים נכשל
    console.error('Failed to connect to MongoDB Atlas:', err.message);
  });