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
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tuition_management';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// הנגשת תיקיית ה-client הסטטית
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));

<<<<<<< HEAD
// הגדרת תיקיית uploads ותיקיית client כתיקיות סטטיות
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'client')));
=======
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
>>>>>>> 0e2bbd0ea7a60aee75af405a6ad5341e8036e175

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running smoothly' });
});

// החזרת index.html לכל ראוט רגיל
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'שגיאת שרת פנימית', error: err.message });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
  });