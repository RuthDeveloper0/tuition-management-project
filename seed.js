import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    // התחברות ל-MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    // ניקוי משתמשים קיימים
    await User.deleteMany({});

    // יצירת משתמש מנהל ראשוני
    await User.create({
      username: 'adminUser',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });

    // יצירת משתמש הורה ראשוני
    await User.create({
      username: 'parentUser',
      email: 'parent@example.com',
      password: 'Password123!',
      role: 'parent'
    });

    console.log('Seed completed successfully! Admin and Parent created.');
    process.exit(0);
  } catch (error) {
    console.error('Error with Seeding:', error.message);
    process.exit(1);
  }
};

seedUsers();