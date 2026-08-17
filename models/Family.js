import mongoose from 'mongoose';
import childSchema from './Child.js';

const familySchema = new mongoose.Schema({
  familyName: {
    type: String,
    required: [true, 'נא להזין שם משפחה'],
    trim: true
  },
  parentName: {
    type: String,
    required: [true, 'נא להזין שם ההורה'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'נא להזין מספר טלפון'],
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  children: [childSchema], // מערך אובייקטים של ילדים
  monthlyTotal: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// חישוב מחדש של המחיר המשוקלל לפני כל שמירה
familySchema.pre('save', function(next) {
  if (this.children && this.children.length > 0) {
    this.monthlyTotal = this.children.reduce((sum, child) => sum + (child.price || 0), 0);
  } else {
    this.monthlyTotal = 0;
  }
  next();
});

const Family = mongoose.model('Family', familySchema);
export default Family;