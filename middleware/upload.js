import multer from 'multer';
import path from 'path';

// הגדרת מקום השמירה ושמות הקבצים
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // השמירה תתבצע בתיקיית uploads בשרת
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    // יצירת שם ייחודי לקובץ (שם השדה + תאריך + סיומת מקורית)
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// בדיקת סוג הקובץ (אימות סיומות)
function checkFileTypes(file, cb) {
  const filetypes = /jpg|jpeg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('ניתן להעלות קבצי תמונות (JPG, PNG) או PDF בלבד!'));
  }
}

// הגדרת ה-Middleware
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // הגבלה לגודל מקסימלי של 5MB
  fileFilter: function (req, file, cb) {
    checkFileTypes(file, cb);
  },
});

export default upload;