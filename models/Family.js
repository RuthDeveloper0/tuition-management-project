import mongoose from 'mongoose';

const familySchema = new mongoose.Schema({
  familyName: { type: String, required: true },
  fatherName: { type: String, default: '' },
  motherName: { type: String, default: '' },
  fatherPhone: { type: String, default: '' },
  motherPhone: { type: String, default: '' },
  email: { type: String, default: '', lowercase: true, trim: true }, // שדה מייל חדש
  familyCode: { type: String, default: '' },
  paymentStatus: { type: Boolean, default: true },
  notes: { type: String, default: '' },
  files: [String],
  children: [{
    name: String,
    grade: String,
    price: Number
  }]
}, { timestamps: true });

export default mongoose.model('Family', familySchema);