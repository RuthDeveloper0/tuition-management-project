import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import familyRoutes from './routes/familyRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// מחרוזת חיבור ישירה ללא SRV שעוקפת חסימות DNS
const DEFAULT_MONGO_URI = 'mongodb://ruth_hadas:Ruth123456@cluster0-shard-00-00.hvfuobe.mongodb.net:27017,cluster0-shard-00-01.hvfuobe.mongodb.net:27017,cluster0-shard-00-02.hvfuobe.mongodb.net:27017/tuition_db?ssl=true&replicaSet=atlas-hvfuobe-shard-0&authSource=admin&retryWrites=true&w=majority';
const MONGO_URI = process.env.MONGO_URI || DEFAULT_MONGO_URI;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// הנגשת תיקיות סטטיות
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running smoothly' });
});

// תמיכה ב-SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'שגיאת שרת פנימית', error: err.message });
});

// התחברות ל-Atlas עם פרמטר בודד לעקיפת תעודות SSL
mongoose.connect(MONGO_URI, {
  dbName: 'tuition_db',
  serverSelectionTimeoutMS: 5000,
  tlsAllowInvalidCertificates: true
})
  .then(() => {
    console.log('Connected to MongoDB Atlas successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB Atlas:', err.message);
  });