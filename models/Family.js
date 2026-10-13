import mongoose from 'mongoose';

const familySchema = new mongoose.Schema({
  familyName: {//שם משפחה
    type: String,
    required: true //שדה חובה 
    },

  fatherName: {//שם אב 
    type: String,
    default: '' 
  },

  motherName: {//שם האם
    type: String,
    default: '' 
  },

  fatherPhone: {//טל אב
    type: String,
    default: ''
   },

  motherPhone: {//טל אם 
    type: String,
    default: ''//ברירת מחדל ריק
  },

  email: {//מייל
    type: String,
    default: '',
    lowercase: true,
    trim: true //מוחק רווח מיותר
  }, 

  // familyCode: {//קוד משפחה
  //   type: String,
  //   default: ''
  //  },

  paymentStatus: {//האם צריך פעולה
    type: Boolean, 
    default: true 
  },

  notes: { //הערות
    type: String,
    default: ''
   },

  files: [String],//מערך לשמירת נתיבים  או כתובות URI
  children: [{//מערך של תת מסמכים הנכנסים תחת הורים-זה הילדים 
    name: String,
    grade: String,
    price: Number
  }]
}, 

//מוסיף אוטומטית שני שדות למסמך: מתי הרשומה נוצרה  ומתי היא עודכנה לאחרונה 
{ timestamps: true });

// FAMILY  יוצר את המודל בפועל מתוך הסכמה שהוגדרה תחת השם 
export default mongoose.model('Family', familySchema);