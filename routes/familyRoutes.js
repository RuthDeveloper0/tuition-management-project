import express from 'express';//בניית השרת וניהול נתיבי ה-API
import multer from 'multer';//טיפול בהעלאת קבצים
import jwt from 'jsonwebtoken';//ליצירה ואימות של אסימוני אבטחה
import fs from 'fs/promises';//מאפשר לבצע פעולות אסינכרוניות על קבצים
import path from 'path';//ייבוא ספריית נתיבים לניהול נתיבים של קבצים ותיקיות
import { fileURLToPath } from 'url';//פונקציית עזר המאפשרת לחלץ את נתיב הקובץ הנוכחי
import Family from '../models/Family.js';
import User from '../models/User.js';

const router = express.Router();//יוצר אובייקט נתב חדש
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';//מגדיר את מפתח הסודיות

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// השומר על הסיומת המקורית של הקובץ MULTER הגדרת אחסון מותאם ל
const storage = multer.diskStorage({//מגדיר באיזו תיקייה ישמרו קבצים המועלים לשרת בדיסק הקשיח
  destination: function (req, file, cb) {//פונקציית היעד המגדירה היכן לשמור את הקבצים שהועלו
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // שמיעת הסיומת (.pdf, .jpg וכו')
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Middleware לאימות טוקן
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];//שולף את הכותרת
  //מוודא שהכותרת קיימת, ולאחר מכן מפצל את המחרוזת לפי רווח
  //המחרוזת והאסימון 
  const token = authHeader && authHeader.split(' ')[1];

  //בדיקת הגנה – אם לא נמצא אסימון עוצר מיד
  if (!token) return res.status(401).json({ message: 'חסר אסימון אימות' });

  //מאמת את תקיפות האסימון באמצעות המפתח הסודי
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'אסימון לא תקין' });
    //אם האימות הצליח
    //מחזירה את הנתונים שהוצפנו בתוך האסימון
    req.user = user;
    next();//ממשיך לפונקציה הבאה
  });
}

// חישוב מחיר ברירת מחדל לפי כיתה
function getDefaultPriceByGrade(gradeStr) {
  if (!gradeStr) return 250;//אם לא הועבר ערך כלל כבררת מחדל שווה 250
  const g = gradeStr.toString();//ממירה את הקלט למחרוזת
  if (g.includes('1200')) return 1200;
  if (g.includes('230')) return 230;
  if (g.includes('300')) return 300;
  if (g.includes('250')) return 250;

  if (g.includes('מעון')) return 1200;
  if (g.includes('גן')) return 230;
  if (g.includes("ו'") || g.includes("ז'") || g.includes("ח'")) return 300;
  return 250;
}

// 1. קידום שנת לימודים
const handleUpdateYear = async (req, res) => {
  try {
    //שולף את כל מסמכי המשפחות הקיימות במסד הנתונים
    const families = await Family.find({});

    const gradeOrder = [
      'מעון פעוטות (1200 ₪)',
      'מעון תינוקות (1200 ₪)',
      'מעון בוגרים (1200 ₪)',
      'גן גיל 3 (230 ₪)',
      'גן גיל 4 (230 ₪)',
      'גן גיל 5 (230 ₪)',
      "כיתה א' (250 ₪)",
      "כיתה ב' (250 ₪)",
      "כיתה ג' (250 ₪)",
      "כיתה ד' (250 ₪)",
      "כיתה ה' (250 ₪)",
      "כיתה ו' (300 ₪)",
      "כיתה ז' (300 ₪)",
      "כיתה ח' (300 ₪)"
    ];

    for (let family of families) {
      //בדיקת הגנה המוודאת שלמשפחה יש מערך ילדים תקין ולא ריק 
      if (Array.isArray(family.children) && family.children.length > 0) {
        for (let child of family.children) {//עובר על כ הילדים
          if (!child) continue;//אם אין ילדים  היא עוברת לילד הבאה 
          let current = child.grade || '';//שולף את שם הכיתה הנוכחית של הילד

          //בדיקה האם מחרוזת הכיתה מכילה את המילה "בוגר",ולא מכילה את המילה מעון
          //וכן אם הכיתה מסומנת לטיפול
          //אם אחד מהם מתקיים מדלג על הילד
          if ((current.includes('בוגר') && !current.includes('מעון')) || current.includes('לטיפול')) {
            continue;
          }


          let currentIndex = gradeOrder.findIndex(item => {
            if (current.includes('פעוטות') && item.includes('פעוטות')) return true;
            if (current.includes('תינוקות') && item.includes('תינוקות')) return true;
            if (current.includes('מעון בוגרים') && item.includes('מעון בוגרים')) return true;
            if (current.includes('גיל 3') && item.includes('גיל 3')) return true;
            if (current.includes('גיל 4') && item.includes('גיל 4')) return true;
            if (current.includes('גיל 5') && item.includes('גיל 5')) return true;

            //מחפש בתוך מחרוזת הכיתה דפוס התואם לביטוי "כיתה" ואחריו אות מא ועד ח
            const classMatch = current.match(/כיתה [א-ח]'/);
            if (classMatch) {
              return item.startsWith(classMatch[0]);
            }
            return false;//אם לא נמצא שום התאמה
          });

          //בודק האם הכיתה הנוכחית אכן נמצאה בתוך מערך
          if (currentIndex !== -1) {
            if (currentIndex + 1 < gradeOrder.length) {//בודק אם הילד עדין לא הגיע לכיתה ח זא יש אחריו
              const nextGrade = gradeOrder[currentIndex + 1];//שולף את הכיתה של שנה הבאה
              child.grade = nextGrade;
              //מעדכן את מחיר שכר הלימוד של הילד בהתאם למחיר ברירת המחדל של הכיתה החדשה
              child.price = getDefaultPriceByGrade(nextGrade);
            } else {//אם הילד כבר נמצא בכיתה האחרונה במערך
              child.grade = 'בוגר / לטיפול';
            }
          } else {
            child.grade = 'בוגר / לטיפול';
          }
        }

        family.markModified('children');//מסמן שחל שינוי במערך ילדים
        await family.save();//שומר שינויים שבוצעו במשפחה
      }
    }

    return res.status(200).json({ message: 'שנת הלימודים עודכנה בהצלחה לכל המשפחות' });
  } catch (error) {
    console.error('Error updating school year:', error);
    return res.status(500).json({ message: 'שגיאה בעדכון שנת הלימודים: ' + error.message });
  }
};

//2 השורות מבצעות אותו הדבר וזה לביטחון 
//כשלוחצים על עדכון שנה  פה הוא שולח לפונקציה שמבצעת זאת
router.post('/update-year', handleUpdateYear);
router.post('/advance-year', handleUpdateYear);

// נתיב להורדת קבצים מסודרת
router.get('/download', async (req, res) => {//מיועד לטיפול בבקשות להורדת קבצים מהשרת
  try {
    const { filePath } = req.query;//שולף נתיב קובץ
    if (!filePath) {//אם אין נתיב קובץ
      return res.status(400).json({ message: 'לא צוין נתיב קובץ' });
    }

    //בודק אם הנתיב מתחיל בקו נטוי  אם כן מסיר אותו להבטחה
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
   //ממיר את הנתיב היחסי לנתיב מוחלט
    const absolutePath = path.resolve(cleanPath);

    return res.download(absolutePath, (err) => {//פונ מובנית המבצעת את ההורדה
      if (err && !res.headersSent) {//בודק אם יש שגיאה  והכותרות לא נשלחו ללקוח
        return res.status(404).json({ message: 'הקובץ לא נמצא בשרת' });
      }
    });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ message: error.message });
    }
  }
});

// 2. הרשמת משתמש
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    //מאפשר גמישות בקליטת הנתונים ע"י שימוש באימייל או בשם המשתמש בהתאם למה שנשלח מהלקוח
    const userEmail = email || username;

    if (!userEmail || !password) {
      return res.status(400).json({ message: 'יש להזין אימייל וסיסמה' });
    }

    const cleanEmail = userEmail.trim().toLowerCase();

    //מחפש במסד הנתונים משתמש קיים בעל אותו שם משתמש/אימייל
    const existingUser = await User.findOne({ username: cleanEmail });
    if (existingUser) {//אם נמצא
      return res.status(400).json({ message: 'כתובת האימייל כבר רשומה במערכת' });
    }

    const newUser = new User({
      username: cleanEmail,
      password: password.trim(),
      role: 'client'
    });

    await newUser.save();//מחכה שישמר המשתמש החדש

    return res.status(201).json({ message: 'ההרשמה הושלמה בהצלחה' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 3. התחברות משתמש
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
        //מאפשר גמישות בקליטת הנתונים ע"י שימוש באימייל או בשם המשתמש בהתאם למה שנשלח מהלקוח
    const userEmail = email || username;

    if (!userEmail || !password) {
      return res.status(400).json({ message: 'יש להזין אימייל וסיסמה' });
    }

    const cleanEmail = userEmail.trim().toLowerCase();

    //מחפש במסד הנתונים משתמש ששם המשתמש/אימייל שלו תואם לכתובת הנקייה
    const user = await User.findOne({ username: cleanEmail });
    if (!user) {//אם המשתמש לא נמצא או שהסיסמה שהוקלדה אינה תואמת לסיסמה המוצפנת במסד הנתונים
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    const isMatch = await user.comparePassword(password.trim());
    if (!isMatch) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    //מחפש במסד הנתונים את נתוני המשפחה המשוייכים לכתובת המייל הזו
    const familyData = await Family.findOne({ email: cleanEmail });

    //יוצר אסימון אבטחה
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ 
      token, //אסימון האבטחה שהופק, שבו ישתמש הלקוח בכותרות הבקשות
      role: user.role, //תפקיד המשתמש במערכת שבאמצעותו צד הלקוח מחליט אילו רכיבים ומסכים להציג למשתמש
      userId: user._id, //המזהה הייחודי של המשתמש במסד הנתונים
      family: familyData || null //נתוני המשפחה
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 4. שליפת נתוני המשפחה עבור האזור האישי
router.get('/portaldata', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'חסר פרמטר אימייל' });
    }

    const family = await Family.findOne({ email: email.trim().toLowerCase() });//מחפש משפחה עם המייל
    if (!family) {//לא נמצא
      return res.status(404).json({ message: 'לא נמצאו נתוני משפחה עבור אימייל זה' });
    }

    //אם נמצאו נתוני משפחה שולח שהצליח+ הנתונים של המשפחה
    return res.json({ success: true, family });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// שליפת פרטי משפחה של הורה מחובר לפי Token
router.get('/my-family', authenticateToken, async (req, res) => {
  try {
    //שולף משתמש/מייל וממיר לאותיות קטנות
    const userEmail = req.user.username.toLowerCase();
    const family = await Family.findOne({ email: userEmail });//מחפש משפחה עם המייל

    if (!family) {//לא נמצאה 
      return res.status(404).json({ message: 'לא נמצאו נתוני משפחה עבור אימייל זה' });
    }

    return res.json(family);//אם המשפחה נמצאה הצלחה שולח הצלחה + פרטי משפחה
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 5. שליפת כל המשפחות
router.get('/', async (req, res) => {
  try {
    //מוציא את כל השמות משפחה וממין בסדר עולה 
    const families = await Family.find({}).sort({ familyName: 1 });
    return res.json(families);//שולח חזרה אל דפדפן הלקוח את מערך המשפחות שנמצאו בפורמט גסון 
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 6. הוספת משפחה חדשה
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const { familyName, fatherName, motherName, fatherPhone, motherPhone, email, paymentStatus, notes, familyCode } = req.body;

    if (!familyName || !familyName.trim()) {//אם שם משפ ריק או מכיל רווחים
      return res.status(400).json({ message: 'שם משפחה הוא שדה חובה' });
    }


    //בודק האם צורפו קבצים בבקשה.עובר על כל קובץ וממיר נתיב השמירה לפורמט אחיד עם תווים נטויים תקינים ואם לא – מגדיר מערך ריק
    const filesPaths = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];
    //בדיקת סטטוס תשלום
    let parsedPaymentStatus = paymentStatus !== undefined ? (paymentStatus === 'true' || paymentStatus === true) : true;

    //יוצר משפחה חדשה וגם מנקה רווחים מיותרים
    const newFamily = new Family({
      familyName: familyName.trim(),
      fatherName: fatherName ? fatherName.trim() : '',
      motherName: motherName ? motherName.trim() : '',
      fatherPhone: fatherPhone ? fatherPhone.trim() : '',
      motherPhone: motherPhone ? motherPhone.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      familyCode: familyCode ? familyCode.trim() : '',//לא בשימוש
      paymentStatus: parsedPaymentStatus,
      notes: notes ? notes.trim() : '',
      files: filesPaths,
      children: []
    });

    const savedFamily = await newFamily.save();
    return res.status(201).json(savedFamily);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// 7. העלאת קבצים למשפחה
router.post('/:id/files', upload.array('files'), async (req, res) => {
  try {
    //מחפש משפחה לפי מזהה יחודי שהתקבל
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    if (req.files && req.files.length > 0) {//בודק אם יש קבצים והם לא ריקים
      //עובר על כל קובץ שהועלה וממיר את נתיב השמירה שלו לפורמט אחיד עם תווים נטויים תקינים
      const newFiles = req.files.map(file => file.path.replace(/\\/g, '/'));
      family.files = family.files ? family.files.concat(newFiles) : newFiles;
      await family.save();//שומר שינויים
    }
    return res.json(family);//שולח חזרה אל דפדפן הלקוח את אובייקט המשפחה המעודכן לאחר הוספת הקבצים
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 8. מחיקת קובץ מצורף
router.delete('/:id/files', async (req, res) => {
  try {
    const { filePath } = req.body;//שולף את נתיב הקובץ
    if (!filePath) return res.status(400).json({ message: 'לא צוין נתיב קובץ למחיקה' });

    //מחפש במסד הנתונים את רשומת המשפחה לפי המזהה הייחודי שלה
    const family = await Family.findById(req.params.id);
    //אם לא נמצאה המשפחה מחזיר שגיאה
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    //מסיר קו נטוי מוביל אם קיים, כדי ליצור נתיב נקי
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const absolutePath = path.join(__dirname, '..', cleanPath);

    try {
      await fs.unlink(absolutePath);//מוחק פיזית את הקובץ מהדיסק הקשיח של השרת
    } catch (error) {
      console.log('הקובץ לא נמצא פיזית בדיסק:', error.message);
    }

    //מעדכן את מערך הקבצים של המשפחה ומסנן ממנו החוצה את הקובץ שנמחק
    family.files = family.files.filter(f => {
      const fPath = typeof f === 'string' ? f : (f.path || f.url || '');
      return fPath !== filePath;
    });

    await family.save();
    //מחזיר ללקוח את אובייקט המשפחה המעודכן לאחר הסרת הקובץ
    return res.json(family);
  } catch (error) {
    return res.status(500).json({ message: 'שגיאה במחיקת הקובץ: ' + error.message });
  }
});

// 9. עדכון סטטוס תשלום
router.patch('/:id/payment-status', async (req, res) => {
  try {
    //שולף את משתנה סטטוס התשלום מתוך גוף הבקשה
    const { paymentStatus } = req.body;
    //מוודא שהסטטוס תשלום מומר בצורה מדויקת לסוג בוליאני אם הגיע כמחרוזת ואם הגיע כמשתנה בוליאני 
    const isPaid = paymentStatus === true || paymentStatus === 'true';
    const family = await Family.findByIdAndUpdate(//מאתרת לפי מזהה יחודי
      req.params.id,//מזהה המשפחה שנשלף מתוך כתובת ה-URL
      { $set: { paymentStatus: isPaid } },
      { new: true }
    );

    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });
    return res.json(family);//אם נמצאה משפחה מחזיר סטטוס הצליח + נתוני משפחה
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 10. עדכון פרטי משפחה
router.put('/:id', upload.array('files'), async (req, res) => {
  try {
    const { familyName, fatherName, motherName, fatherPhone, motherPhone, email, paymentStatus, notes, familyCode } = req.body;
    const family = await Family.findById(req.params.id);//מאתר במסד הנתונים את רשומת המשפחה הספציפית לפי המזהה שלה
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    if (familyName) family.familyName = familyName.trim();
    if (fatherName !== undefined) family.fatherName = fatherName.trim();
    if (motherName !== undefined) family.motherName = motherName.trim();
    if (fatherPhone !== undefined) family.fatherPhone = fatherPhone.trim();
    if (motherPhone !== undefined) family.motherPhone = motherPhone.trim();
    if (email !== undefined) family.email = email.trim().toLowerCase();
    if (familyCode !== undefined) family.familyCode = familyCode.trim();
    if (paymentStatus !== undefined) family.paymentStatus = paymentStatus === 'true' || paymentStatus === true;
    if (notes !== undefined) family.notes = notes.trim();

    if (req.files && req.files.length > 0) {//אם יש קובץ ולא ריק
      const newFiles = req.files.map(file => file.path.replace(/\\/g, '/'));//מוציא מסנן ומסדר קו אחד אלכסוני
      family.files = family.files ? family.files.concat(newFiles) : newFiles;
    }

    await family.save();//שמור את המשפחה עם העדכונים
    return res.json(family);//אם הצליח מחזיר סטטוס הצלחה+נתוני משפחה
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 11. מחיקת משפחה
router.delete('/:id', async (req, res) => {
  try {
    await Family.findByIdAndDelete(req.params.id);
    return res.json({ message: 'המשפחה נמחקה בהצלחה' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 12. הוספת ילד
router.post('/:id/children', async (req, res) => {
  try {
    const { name, grade, customPrice, price } = req.body;
    //בדיקה ששם הילד מלא ולא מרווחים
    if (!name || !name.trim()) return res.status(400).json({ message: 'שם הילד הוא שדה חובה' });

    //מחפש במסד הנתונים את רשומת המשפחה לפי המזהה הייחודי שלה
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    //בדיקה האם שדה הילדים במשפחה מוגדר כמערך תקין
    //  אם מסיבה כלשהי אינו מערך, המערכת מאחלת אותו כמערך ריק
    if (!Array.isArray(family.children)) family.children = [];

    //המחיר או מחיר שהזינו אחרת ברירת מחדל לפי הנתונים
    const finalPriceInput = (customPrice !== undefined && customPrice !== '') ? customPrice : price;
    //אם קיים ערך תקין למחיר, הוא מומר למספר
    //אם לא הוזן מחיר המערכת קוראת לפונקציית העזר לקבוע אוטומטי את מחיר ברירת המחדל בהתאם לכיתת הילד
    let computedPrice = (finalPriceInput !== undefined && finalPriceInput !== null && finalPriceInput !== '') 
      ? Number(finalPriceInput) 
      : getDefaultPriceByGrade(grade);

    family.children.push({ name: name.trim(), grade, price: computedPrice });
    await family.save();

    return res.status(201).json(family);
  } catch (error) {
    return res.status(500).json({ message: 'שגיאה בהוספת ילד: ' + error.message });
  }
});

// 13. עדכון ילד
router.put('/:id/children/:childId', async (req, res) => {
  try {
    const { name, grade, customPrice, price } = req.body;
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    const child = family.children.id(req.params.childId);
    if (!child) return res.status(404).json({ message: 'הילד לא נמצא' });

    if (name !== undefined) child.name = name.trim();//בדיקה האם שדה השם אכן נכלל בבקשה שנשלחה לשרת ואם כן מנקה רווח
    if (grade !== undefined) child.grade = grade;//בדיקה האם שדה הכיתה נכלל בבקשה שנשלחה

    //בודק אם הוגדר מחיר אישי אם כן משתמש בו אחרת  בוחר מחיר רגיל
    const finalPriceInput = (customPrice !== undefined && customPrice !== '') ? customPrice : price;
    //בודק שיש ערך במחיר ואניו ריק
    if (finalPriceInput !== undefined && finalPriceInput !== null && finalPriceInput !== '') {
      child.price = Number(finalPriceInput);//ממיר למספר
    } else if (grade !== undefined) {//לא הוזן מחיר ידני אך יש מחיר
      //המערכת קוראת לפונקציית עזר המחזירה את מחיר ברירת המחדל האוטומטי בהתאם לכיתה של הילד
      child.price = getDefaultPriceByGrade(grade);
    }

    family.markModified('children');//לסמן שיש שינוי במערך ילדים במונגוס
    await family.save();//שמירת שינויים
    return res.json(family);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 14. מחיקת ילד
router.delete('/:id/children/:childId', async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    //הפונקציה סורקת את מערך הילדים
    // URL מאתרת את הילד ששדה המזהה הייחודי שלו תואם למזהה שהועבר בכתובת 
    // ומסירה אותו מתוך המערך
    family.children.pull({ _id: req.params.childId });
    await family.save();
    return res.json(family);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

//מסיימת את קובץ הנתבים הנוכחי ומייצאת אותו לשימוש בשרת המרכזי
export default router;