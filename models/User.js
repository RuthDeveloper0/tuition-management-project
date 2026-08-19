import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'שם משתמש הוא שדה חובה'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'סיסמה היא שדה חובה'],
    minlength: [6, 'סיסמה חייבת להכיל לפחות 6 תווים']
  },
  role: {
    type: String,
    enum: ['admin', 'client'],
    default: 'client'
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null
  }
}, {
  timestamps: true
});

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


userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);