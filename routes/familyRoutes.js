import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Family from '../models/Family.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';


//פונקציה לבדוק האם הבקשה מגיעה עם אסימון (טוקן) תקין ומורשה
export function authenticateToken(req, res, next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if(!token){
    return res.status(401).json({ message: 'חסר אסימון אימות' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
  if (err) return res.status(403).json({ message: 'אסימון לא תקין' });
  req.user = user;
  next();
});
}

function getDefaultPriceByGrade(gradeStr){
    if (!gradeStr) return 250;
      const g = gradeStr.toString();

    if (g.includes('מעון')) return 1200;
    if (g.includes('גן')) return 230;
    if (g.includes('א\'') || g.includes('ב\'') || g.includes('ג\'') || g.includes('ד\'') || g.includes('ה\'')) return 250;
    if (g.includes('ו\'') || g.includes('ז\'') || g.includes('ח\'')) return 300;
  
  return 250;  
}


// 1. הרשמת הורה: קביעת שם משתמש חופשי ואימות חובה מול קוד ייחודי מהטבלה
router.post('/register' , async (req , res) => {
  try{
     const { username, uniqueCode } = req.body;

    if (!username || !uniqueCode) {
      return res.status(400).json({ message: 'יש להזין שם משתמש וקוד ייחודי' });
    }

    
    // חיפוש המשפחה בטבלה לפי קוד ייחודי בשדה
    const family = await Family.findOne ({
       $or: [
        { familyCode: uniqueCode.trim() },
        { _id: uniqueCode.trim().match(/^[0-9a-fA-F]{24}$/) ? uniqueCode.trim() : null }
      ]
    });

     // במידה והקוד הייחודי לא קיים בטבלה – ההרשמה נדחית לחלוטין
    if (!family) {
      return res.status(400).json({ message: 'הקוד הייחודי אינו תקין או שאינו קיים במערכת' });
    }

    family.username = username.trim();
    family.password = uniqueCode.trim();
    await family.save();

    res.status(201).json({ message: 'ההרשמה הושלמה בהצלחה' });
  }
  catch(error){
    res.status(500).json({ message: err.message });
  }
});


// 2. התחברות הורה: הזנת שם המשתמש שבחר והקוד הייחודי כסיסמה
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'יש להזין שם משתמש וסיסמה' });
    }

     const family = await Family.findOne ({username: username.trim()});
     
     if (!family) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

    const isMatch = await bcrypt.compare(password.trim(), family.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }

     const token = jwt.sign({ familyId: family._id, role: 'parent' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: 'parent', familyId: family._id });
  }
  catch(error){
     res.status(500).json({ message: err.message });
  }
});


// 3. שליפת נתוני המשפחה המחוברת בלבד (לגישת הורים בלבד)
router.get('/my-family', authenticateToken, async (req, res) => {
  try{
    const family = await Family.findById(req.user.familyId);

    if(!family){
       return res.status(404).json({ message: 'המשפחה לא נמצאה' });
    }

    res.json(family);
  }
  catch(error){
    res.status(500).json({ message: err.message });
  }
});


// 4. שליפת כל המשפחות (לגישת מנהל)
router.get('/', async (req, res) => {
  try{
    const families = await Family.find({}).sort({ familyName: 1 });

    res.json(families);
  }
  catch(error){
    res.status(500).json({ message: err.message });
  }
});


// 5. הוספת משפחה חדשה
router.post('/', upload.array('files'), async (req, res) => {
  try{
    const { familyName, fatherName, motherName, fatherPhone, motherPhone, paymentStatus, notes, familyCode } = req.body;

    if (!familyName || !familyName.trim()) {
      return res.status(400).json({ message: 'שם משפחה הוא שדה חובה' });
    }

     // תיקון נתיבי הקבצים למניעת בעיות סלאשים במערכות הפעלה שונות
    const filesPaths = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];

    let parsedPaymentStatus = true;
    
    if (paymentStatus !== undefined) {
      parsedPaymentStatus = paymentStatus === 'true' || paymentStatus === true;
    }

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
  }

  catch (error) {
    return res.status(400).json({ message: err.message });
  }
});


// 6. העלאת קבצים למשפחה קיימת
router.post('/:id/files', upload.array('files'), async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    
    if (!family) {
      return res.status(404).json({ message: 'המשפחה לא נמצאה' });
    }

     if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => file.path.replace(/\\/g, '/'));
      family.files = family.files ? family.files.concat(newFiles) : newFiles;
      await family.save();
    }

    res.json(family);
  }
  catch (error) {
    res.status(500).json({ message: err.message });
  }
});

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 6.5. מחיקת קובץ מצורף למשפחה
router.delete('/:id/files', async (req, res) => {
  try{
    const { familyId } = req.params;
    const realFamilyId = req.params.id;
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ message: 'לא צוין נתיב קובץ למחיקה' });
    }

     const family = await Family.findById(realFamilyId);
    if (!family) {
      return res.status(404).json({ message: 'המשפחה לא נמצאה' });
    }

    // ניקוי הנתיב והרכבת הנתיב המלא פיזית בדיסק 
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const absolutePath = path.join(__dirname, '..', cleanPath);

    // מחיקת הקובץ פיזית מהדיסק אם הוא קיים
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      console.log('הקובץ לא נמצא פיזית בדיסק, ממשיכים בעדכון מסד הנתונים:', err.message);
    }

    // הסרת הנתיב ממערך הקבצים במסד הנתונים
    family.files = family.files.filter(f => {
      const fPath = typeof f === 'string' ? f : (f.path || f.url || '');
      return fPath !== filePath;
    });

    await family.save();
    return res.json(family);
  }
  
  catch (error) {
    console.error('שגיאה במחיקת קובץ:', err);
    return res.status(500).json({ message: 'שגיאה במחיקת הקובץ: ' + err.message });
  }
});

// 7. עדכון מהיר של סטטוס תשלום
router.patch('/:id/payment-status', async (req, res) => {
  try{
    const {paymentStatus} = req.body;
    const isPaid = paymentStatus === true || paymentStatus ==='true';
    const family = await Family.findByIdAndUpdate(req.params.id,
       { $set: { paymentStatus: isPaid } },
       {new: true}
    );

    if(!family){
      return res.status(404).json({ message: 'המשפחה לא נמצאה' });
    }

    res.json(family);
  }
  catch(error){
    res.status(500).json({ message: err.message });
  }
});

// 8. עדכון נתוני משפחה קיימת
router.put('/:id', upload.array('files'), async (req, res) => {
  try{
    const { familyName, fatherName, motherName, fatherPhone, motherPhone, paymentStatus, notes, familyCode } = req.body;
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(404).json({ message: 'המשפחה לא נמצאה' });
    }

    if(familyName)
      family.familyName = familyName.trim();
    if(fatherName !== undefined)
      family.fatherName = fatherName.trim();
    if(motherName !== undefined)
      family.motherName = motherName.trim();
    if (fatherPhone !== undefined)
      family.fatherPhone = fatherPhone.trim();
    if (motherPhone !== undefined) 
      family.motherPhone = motherPhone.trim();
    if (familyCode !== undefined) 
      family.familyCode = familyCode.trim();
    if (paymentStatus !== undefined) {
      family.paymentStatus = paymentStatus === 'true' || paymentStatus === true;
    }
    if (notes !== undefined)
       family.notes = notes.trim();

    if (req.files && req.files.length > 0) {//בדיקה האם יש קבצים חדשים
      const newFiles = req.files.map(file => file.path.replace(/\\/g, '/'));
      family.files = family.files ? family.files.concat(newFiles) : newFiles;
    }

    await family.save();
    res.json(family);
  }
  catch(error){
    res.status(500).json({ message: err.message });
  }
});


// 9. מחיקת משפחה
router.delete('/:id', async (req, res) => {
  try{
    await Family.findByIdAndDelete(req.params.id);
    res.json({ message: 'המשפחה נמחקה בהצלחה' });
  }
  catch (error) {
    res.status(500).json({ message: err.message });
  }
});


// 10. הוספת ילד למשפחה
router.post('/:id/children', async (req, res) => {
  try {
    const { name, grade, customPrice, price } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'שם הילד הוא שדה חובה' });
    }

    const family = await Family.findById(req.params.id);

    if(!family){
       return res.status(404).json({ message: 'המשפחה לא נמצאה' });
    }

     if (!Array.isArray(family.children)) {
      family.children = [];
    }

     const finalPriceInput = (customPrice !== undefined && customPrice !== '') ? customPrice : price;
    let computedPrice;
    if (finalPriceInput !== undefined && finalPriceInput !== null && finalPriceInput !== '') {
      computedPrice = Number(finalPriceInput);
    } else {
      computedPrice = getDefaultPriceByGrade(grade);//  אם שדה המחיר ריק או לא תקין, הקוד מפעיל את פונקציית העזר שלנו לקבל מחיר לילד לפי ברירת מחדל של הכיתה 
  }

  family.children.push({ name: name.trim(), grade, price: computedPrice });
    await family.save();

    return res.status(201).json(family);
    }
  catch(error){
    return res.status(500).json({ message: 'שגיאה בהוספת ילד: ' + err.message });
  }
});


// 11. עדכון נתוני ילד קיים
router.put('/:id/children/:childId', async (req, res) => {
  try{
    const { name, grade, customPrice, price } = req.body;
    const family = await Family.findById(req.params.id);

    if (!family) 
      return res.status(404).json({ message: 'המשפחה לא נמצאה' });

     const child = family.children.id(req.params.childId);
    if (!child)
       return res.status(404).json({ message: 'הילד לא נמצא' });

    if(name !== undefined)
      child.name = name.trim();
    if(grade !== undefined)
      child.grade = grade;

    const finalPriceInput = (customPrice !== undefined && customPrice !== '') ? customPrice : price;
    if (finalPriceInput !== undefined && finalPriceInput !== null && finalPriceInput !== '') {
      child.price = Number(finalPriceInput);
    } 
    else if (grade !== undefined) {
      child.price = getDefaultPriceByGrade(grade);
    }

    family.markModified('children');
    await family.save();

    res.json(family);
  }
   catch (error) {
    res.status(500).json({ message: err.message });
  }
});

// 12. מחיקת ילד
router.delete('/:id/children/:childId', async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'המשפחה לא נמצאה' });

    family.children.pull({ _id: req.params.childId });
    await family.save();

    res.json(family);
  }
  catch (error) {
    res.status(500).json({ message: err.message });
  }
});


// 13. עדכון שנת לימודים
router.post('/update-year', async (req, res) => {
  try{
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
          let current = child.grade || '';
          
          if (current === 'בוגר / לטיפול') continue;

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

    res.json({ message: 'שנת הלימודים עודכנה בהצלחה' });
  }
  catch (error) {
    res.status(500).json({ message: err.message });
  }
});

export default router;