import mongoose from 'mongoose';

const childSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'נא להזין שם פרטי של הילד'],
    trim: true
  },
  grade: {
    type: Number,
    required: [true, 'נא להזין כיתה/שנתון'],
    min: 1,
    max: 12
  },
  price: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

export default childSchema; // מיוצא כ-Subdocument שמשולב בתוך Family