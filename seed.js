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
    await User.deleteMany({});
    await Family.deleteMany({});
    await Child.deleteMany({});

    const admin = new User({
      username: 'admin',
      password: 'adminpassword',
      role: 'admin'
    });
    await admin.save();

    const parent = new User({
      username: 'parent1',
      password: 'parentpassword',
      role: 'client'
    });
    await parent.save();

    console.log('נתונים ראשוניים נוצרו בהצלחה!');
    process.exit();
  } catch (error) {
    console.error('שגיאה ביצירת נתונים:', error);
    process.exit(1);
  }
};

seedData();