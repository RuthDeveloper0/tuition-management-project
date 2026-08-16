import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'שם משתמש הוא שדה חובה'],
      unique: true,
      trim: true,
      minlength: [3, 'שם משתמש חייב להכיל לפחות 3 תווים']
    },
    email: {
      type: String,
      required: [true, 'כתובת אימייל היא שדה חובה'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'נא להזין כתובת אימייל תקינה']
    },
    password: {
      type: String,
      required: [true, 'סיסמה היא שדה חובה'],
      minlength: [6, 'סיסמה חייבת להכיל לפחות 6 תווים']
    },
    role: {
      type: String,
      enum: ['admin', 'parent'],
      default: 'parent'
    }
  },
  {
    timestamps: true
  }
);

// Mongoose Pre-Hook להצפנת סיסמה לפני שמירה ב-DB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// מתודה לאימות סיסמה בעת התחברות (Login)
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);