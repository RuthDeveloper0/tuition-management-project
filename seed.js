import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Family from './models/Family.js';
import Child from './models/Child.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tuition_management';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    // מחיקת נתונים קיימים
    await User.deleteMany({});
    await Family.deleteMany({});
    await Child.deleteMany({});

    // ניקוי אינדקסים ישנים למניעת התנגשויות
    try {
      await User.collection.dropIndexes();
    } catch (indexError) {
      // מתעלם אם האוסף היה ריק ולא היו אינדקסים למחוק
    }

    // יצירת משתמש מנהל
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'adminpassword',
      role: 'admin'
    });
    await admin.save();

    // יצירת משתמש הורה
    const parent = new User({
      username: 'parent1',
      email: 'parent1@example.com',
      password: 'parentpassword',
      role: 'client'
    });
    await parent.save();

    console.log('נתונים ראשוניים נוצרו בהצלחה!');
    process.exit(0);
  } catch (error) {
    console.error('שגיאה ביצירת נתונים:', error);
    process.exit(1);
  }
};

seedData();