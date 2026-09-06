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

function getDefaultPriceByGrade(gradeStr) {
  if (!gradeStr) return 250;
  const g = gradeStr.toString();
  if (g.includes('1200')) return 1200;
  if (g.includes('230')) return 230;
  if (g.includes('300')) return 300;
  if (g.includes('250')) return 250;
  
  if (g.includes('מעון')) return 1200;
  if (g.includes('גן')) return 230;
  if (g.includes('ו\'') || g.includes('ז\'') || g.includes('ח\'')) return 300;
  return 250;
}

// 1. עדכון שנת לימודים
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

          // אם הילד הוא כבר בוגר/לטיפול (ולא מעון בוגרים) - לא נוגעים
          if ((current.includes('בוגר') && !current.includes('מעון')) || current.includes('לטיפול')) {
            continue;
          }

          // איתור המיקום המדויק במערך
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
            // מעבר לדרגה הבאה (מעון בוגרים יעבור לגן גיל 3)
            if (currentIndex + 1 < gradeOrder.length) {
              const nextGrade = gradeOrder[currentIndex + 1];
              child.grade = nextGrade;
              child.price = getDefaultPriceByGrade(nextGrade);
            } else {
              // כיתה ח' עוברת לבוגר / לטיפול
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

// 2. הרשמת משתמש
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'יש להזין שם משתמש וסיסמה' });
    }

    const cleanUsername = username.trim();

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(400).json({ message: 'שם המשתמש כבר תפוס, נא לבחור שם אחר' });
    }

    const newUser = new User({
      username: cleanUsername,
      password: password.trim(),
      role: 'client'
    });

    await newUser.save();

    return res.status(201).json({ message: 'ההרשמה הושלמה בהצלחה' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 3. התחברות משתמש
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'יש להזין שם משתמש וסיסמה' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    const isMatch = await user.comparePassword(password.trim());
    if (!isMatch) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, role: user.role, userId: user._id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 4. שליפת כל המשפחות
router.get('/', async (req, res) => {
  try {
    const families = await Family.find({}).sort({ familyName: 1 });
    return res.json(families);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 5. הוספת משפחה חדשה
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const { familyName, fatherName, motherName, fatherPhone, motherPhone, paymentStatus, notes, familyCode } = req.body;

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

// 6. העלאת קבצים למשפחה
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

// 7. מחיקת קובץ מצורף
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

// 8. עדכון סטטוס תשלום
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

// 9. עדכון פרטי משפחה
router.put('/:id', upload.array('files'), async (req, res) => {
  try {
    const { familyName, fatherName, motherName, fatherPhone, motherPhone, paymentStatus, notes, familyCode } = req.body;
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    if (familyName) family.familyName = familyName.trim();
    if (fatherName !== undefined) family.fatherName = fatherName.trim();
    if (motherName !== undefined) family.motherName = motherName.trim();
    if (fatherPhone !== undefined) family.fatherPhone = fatherPhone.trim();
    if (motherPhone !== undefined) family.motherPhone = motherPhone.trim();
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

// 10. מחיקת משפחה
router.delete('/:id', async (req, res) => {
  try {
    await Family.findByIdAndDelete(req.params.id);
    return res.json({ message: 'המשפחה נמחקה בהצלחה' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 11. הוספת ילד
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

// 12. עדכון ילד
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

// 13. מחיקת ילד
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