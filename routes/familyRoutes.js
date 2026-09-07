import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Family from '../models/Family.js';
import User from '../models/User.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware לאימות טוקן
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'חסר אסימון אימות' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'אסימון לא תקין' });
    req.user = user;
    next();
  });
}

// חישוב מחיר ברירת מחדל לפי כיתה
function getDefaultPriceByGrade(gradeStr) {
  if (!gradeStr) return 250;
  const g = gradeStr.toString();
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
    const families = await Family.find({});

    const gradeOrder = [
      'מעון פעוטות (1200 ₪)',
      'מעון ביניים (1200 ₪)',
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
      if (Array.isArray(family.children) && family.children.length > 0) {
        for (let child of family.children) {
          if (!child) continue;
          let current = child.grade || '';

          if ((current.includes('בוגר') && !current.includes('מעון')) || current.includes('לטיפול')) {
            continue;
          }

          let currentIndex = gradeOrder.findIndex(item => {
            if (current.includes('פעוטות') && item.includes('פעוטות')) return true;
            if (current.includes('ביניים') && item.includes('ביניים')) return true;
            if (current.includes('מעון בוגרים') && item.includes('מעון בוגרים')) return true;
            if (current.includes('גיל 3') && item.includes('גיל 3')) return true;
            if (current.includes('גיל 4') && item.includes('גיל 4')) return true;
            if (current.includes('גיל 5') && item.includes('גיל 5')) return true;

            const classMatch = current.match(/כיתה [א-ח]'/);
            if (classMatch) {
              return item.startsWith(classMatch[0]);
            }
            return false;
          });

          if (currentIndex !== -1) {
            if (currentIndex + 1 < gradeOrder.length) {
              const nextGrade = gradeOrder[currentIndex + 1];
              child.grade = nextGrade;
              child.price = getDefaultPriceByGrade(nextGrade);
            } else {
              child.grade = 'בוגר / לטיפול';
            }
          } else {
            child.grade = 'בוגר / לטיפול';
          }
        }

        family.markModified('children');
        await family.save();
      }
    }

    return res.status(200).json({ message: 'שנת הלימודים עודכנה בהצלחה לכל המשפחות' });
  } catch (error) {
    console.error('Error updating school year:', error);
    return res.status(500).json({ message: 'שגיאה בעדכון שנת הלימודים: ' + error.message });
  }
};

router.post('/update-year', handleUpdateYear);
router.post('/advance-year', handleUpdateYear);

// 2. הרשמת משתמש (תומך במייל)
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const userEmail = email || username;

    if (!userEmail || !password) {
      return res.status(400).json({ message: 'יש להזין אימייל וסיסמה' });
    }

    const cleanEmail = userEmail.trim().toLowerCase();

    const existingUser = await User.findOne({ username: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'כתובת האימייל כבר רשומה במערכת' });
    }

    const newUser = new User({
      username: cleanEmail,
      password: password.trim(),
      role: 'client'
    });

    await newUser.save();

    return res.status(201).json({ message: 'ההרשמה הושלמה בהצלחה' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 3. התחברות משתמש ושליפת נתוני המשפחה
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const userEmail = email || username;

    if (!userEmail || !password) {
      return res.status(400).json({ message: 'יש להזין אימייל וסיסמה' });
    }

    const cleanEmail = userEmail.trim().toLowerCase();

    const user = await User.findOne({ username: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    const isMatch = await user.comparePassword(password.trim());
    if (!isMatch) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    const familyData = await Family.findOne({ email: cleanEmail });

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ 
      token, 
      role: user.role, 
      userId: user._id, 
      family: familyData || null 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 4. שליפת נתוני המשפחה עבור האזור האישי (לפי Query string או Token)
router.get('/portaldata', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'חסר פרמטר אימייל' });
    }

    const family = await Family.findOne({ email: email.trim().toLowerCase() });
    if (!family) {
      return res.status(404).json({ message: 'לא נמצאו נתוני משפחה עבור אימייל זה' });
    }

    return res.json({ success: true, family });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// שליפת פרטי משפחה של הורה מחובר לפי Token
router.get('/my-family', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.username.toLowerCase();
    const family = await Family.findOne({ email: userEmail });

    if (!family) {
      return res.status(404).json({ message: 'לא נמצאו נתוני משפחה עבור אימייל זה' });
    }

    return res.json(family);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 5. שליפת כל המשפחות
router.get('/', async (req, res) => {
  try {
    const families = await Family.find({}).sort({ familyName: 1 });
    return res.json(families);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 6. הוספת משפחה חדשה
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const { familyName, fatherName, motherName, fatherPhone, motherPhone, email, paymentStatus, notes, familyCode } = req.body;

    if (!familyName || !familyName.trim()) {
      return res.status(400).json({ message: 'שם משפחה הוא שדה חובה' });
    }

    const filesPaths = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];
    let parsedPaymentStatus = paymentStatus !== undefined ? (paymentStatus === 'true' || paymentStatus === true) : true;

    const newFamily = new Family({
      familyName: familyName.trim(),
      fatherName: fatherName ? fatherName.trim() : '',
      motherName: motherName ? motherName.trim() : '',
      fatherPhone: fatherPhone ? fatherPhone.trim() : '',
      motherPhone: motherPhone ? motherPhone.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      familyCode: familyCode ? familyCode.trim() : '',
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
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => file.path.replace(/\\/g, '/'));
      family.files = family.files ? family.files.concat(newFiles) : newFiles;
      await family.save();
    }
    return res.json(family);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 8. מחיקת קובץ מצורף
router.delete('/:id/files', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ message: 'לא צוין נתיב קובץ למחיקה' });

    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const absolutePath = path.join(__dirname, '..', cleanPath);

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      console.log('הקובץ לא נמצא פיזית בדיסק:', error.message);
    }

    family.files = family.files.filter(f => {
      const fPath = typeof f === 'string' ? f : (f.path || f.url || '');
      return fPath !== filePath;
    });

    await family.save();
    return res.json(family);
  } catch (error) {
    return res.status(500).json({ message: 'שגיאה במחיקת הקובץ: ' + error.message });
  }
});

// 9. עדכון סטטוס תשלום
router.patch('/:id/payment-status', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const isPaid = paymentStatus === true || paymentStatus === 'true';
    const family = await Family.findByIdAndUpdate(
      req.params.id,
      { $set: { paymentStatus: isPaid } },
      { new: true }
    );

    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });
    return res.json(family);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 10. עדכון פרטי משפחה
router.put('/:id', upload.array('files'), async (req, res) => {
  try {
    const { familyName, fatherName, motherName, fatherPhone, motherPhone, email, paymentStatus, notes, familyCode } = req.body;
    const family = await Family.findById(req.params.id);
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

    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => file.path.replace(/\\/g, '/'));
      family.files = family.files ? family.files.concat(newFiles) : newFiles;
    }

    await family.save();
    return res.json(family);
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
    if (!name || !name.trim()) return res.status(400).json({ message: 'שם הילד הוא שדה חובה' });

    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    if (!Array.isArray(family.children)) family.children = [];

    const finalPriceInput = (customPrice !== undefined && customPrice !== '') ? customPrice : price;
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

    if (name !== undefined) child.name = name.trim();
    if (grade !== undefined) child.grade = grade;

    const finalPriceInput = (customPrice !== undefined && customPrice !== '') ? customPrice : price;
    if (finalPriceInput !== undefined && finalPriceInput !== null && finalPriceInput !== '') {
      child.price = Number(finalPriceInput);
    } else if (grade !== undefined) {
      child.price = getDefaultPriceByGrade(grade);
    }

    family.markModified('children');
    await family.save();
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

    family.children.pull({ _id: req.params.childId });
    await family.save();
    return res.json(family);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;