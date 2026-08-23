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



