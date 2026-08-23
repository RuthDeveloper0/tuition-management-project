import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


const familySchema = new mongoose.Schema({
  familyName: {
    type: String,
    required: true
   },

  username: { 
    type: String,
     default: ''
   },

  familyCode: { 
    type: String, 
    default: '' 
  },

  code: { 
    type: String, 
    default: '' 
  }, // קוד מקוצר ייחודי המוצג בטבלה

  password: { 
    type: String, 
    default: '' 
  },

  fatherName: { 
    type: String, 
    default: '' 
  },

  motherName: { 
    type: String, 
    default: '' 
  },

  fatherPhone: { 
    type: String, 
    default: '' 
  },

  motherPhone: { 
    type: String, 
    default: '' 
  },

  paymentStatus: { 
    type: Boolean, 
    default: true 
  },

  notes: { 
    type: String, 
    default: '' 
  },

  files: [{ type: String }],

  children: [{
    name: { 
      type: String, 
      required: true },

    grade: { 
      type: String },

    price: { 
      type: Number }
  }]
  
}, { timestamps: true });

// Pre-save hook ליצירת קוד מקוצר והצפנת סיסמה
familySchema.pre('save', async function (next) {
  // 1. יצירת קוד מקוצר בן 6 תווים במידה ולא קיים
  if (!this.code && this._id) {
    this.code = this._id.toString().substring(18).toUpperCase();
  }

  // 2. הצפנת סיסמה במידה והיא שונתה
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// מתודה לאימות סיסמה בעת התחברות
familySchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Family', familySchema);






