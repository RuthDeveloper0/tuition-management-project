import mongoose from 'mongoose';

const childSchema = new mongoose.Schema({
  firstName:{
    type: String,
    required: [true , 'שם פרטי הינו שדה חובה'],
    trim: true// מנקה רווחים
  },

  familyId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',//מקשר את הילד למשפחה שאליה הוא שייך.
    required: true// שדה חובה
  },

  ageGroup:{
    type: String,
    enum: [
  'מעון בוגרים', 'מעון ביניים', 'מעון פעוטות',
  'גן גיל 5', 'גן גיל 4', 'גן גיל 3',
  'כיתה א', 'כיתה ב', 'כיתה ג', 'כיתה ד', 'כיתה ה', 'כיתה ו',
  'חריגה / למחיקה', 'כיתה ז', 'כיתה ח'
],// רשימה סגורה לבחירה
    required: true
  },

  birthYear:{
    type: Number,
    required: true
  },

  customPrice:{
    type: Number,
    default: null// אם אין מחיר ברירת מחדל ריק
  },

  markedForAction:{
    type: Boolean,
    default: false
  }
},{
  timestamps: true//מוסיף אוטומטית שני שדות למסמך: מתי הרשומה נוצרה  ומתי היא עודכנה לאחרונה 
});

export default mongoose.model('Child' , childSchema);