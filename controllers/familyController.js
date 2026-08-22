import jwt from 'jsonwebtoken';
import Family from '../models/Family.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';//יצירת טוקני אימות



// פונקציית עזר לבדיקת הרשאות (לוודא שהורה עורך אך ורק את המשפחה שלו, אלא אם הוא מנהל)
const isAuthorized = (req, familyId) => {
  return req.user && (req.user.role === 'admin' || req.user.familyId === familyId.toString());
};


// הרשמת הורה לפי קוד ייחודי (כולל שם משתמש, מייל וסיסמה)
export const registerParent = async (req, res) => {
  try{
    const { username, email, password, uniqueCode } = req.body;
    if (!username || !email || !password || !uniqueCode) {
      return res.status(400).json({ message: 'יש למלא את כל השדות: שם משתמש, מייל, סיסמה וקוד ייחודי' });
  }
  const cleanCode = uniqueCode.trim().replase().replace('#', '').toLowerCase();
  
  // איתור המשפחה לפי ID מלא, קוד מקוצר או familyCode
  const allFamilies = await Family.find({});//שולף את כל רשימת המשפחות הקיימות במסד הנתונים ושומר אותם  במשתנה
   const family = allFamilies.find(f => {
    const idStr = f._id.toString().toLowerCase();
    const codeStr = (f.code || f.familyCode || '').toLowerCase();
     return (
        idStr === cleanCode ||
        codeStr === cleanCode ||
        idStr.endsWith(cleanCode));
   });
   if(!family){
     return res.status(404).json({ message: 'הקוד הייחודי אינו תקין או שאינו קיים במערכת' });
   }
   

    // עדכון פרטי הגישה של ההורה (שם משתמש, מייל וסיסמה)
    family.username = username.trim();
    family.email = email.trim();
    family.password = password.trim(); // המודל שלך יטפל בהצפנה במידת הצורך
    
    await family.save();
   
    res.status(201).json({ message: 'ההרשמה בוצעה בהצלחה' });

}
  catch(error){
      res.status(500).json({ message: err.message });
  }
};


// התחברות הורה
export const loginParent = async (req, res) => {
  try{
    const {username , password} = req.body;//קבלת שם משתמש וסיסמה לאיתור משפחה
     if (!username || !password) {
      return res.status(400).json({ message: 'יש להזין שם משתמש וסיסמה' });
    }

    const family = await Family.findOne({username: username.trim()})
    if (!family) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }
   
    const isMatch = await family.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
    }
    
    const token = jwt.sign ({familyId: family._id , role: 'client'},//שומרים בתוך הטוקן את מזהה המשפחה ואת תפקיד המשתמש
      JWT_SECRET,//חתימה סודית שרק השרת מכיר
      { expiresIn: '7d' }//קובע שהטוקן תקף למשך 7 ימים בלבד. לאחר שבוע, ההורה יצטרך להתחבר מחדש למערכת כדי לקבל טוקן חדש מטעמי אבטחה.
    );

     res.json({ token, familyId: family._id });
  }
  catch(error){
      res.status(500).json({ message: err.message });
  }
};


// שליפת פרטי המשפחה והילדים של ההורה המחובר בלבד
export const getMyFamily = async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId);
    if (!family) {
      return res.status(404).json({ message: 'משפחה לא נמצאה' });
    }
    res.json(family);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// עדכון פרטי משפחה (מוגן - רק המשפחה של ההורה או אדמין)
export const updateFamily = async (req , res) =>{
  try{
     const familyIdToUpdate = req.params.id;//מזהה המשפחה שמגיע מתוך כתובת ה-URL
    
    //בודקים בעזרת פונקציית העזר האם למשתמש יש אישור לעדכן את המשפחה הזו (כלומר, האם הוא מנהל או שזו המשפחה שלו)
     if (!isAuthorized(req, familyIdToUpdate)) {
      return res.status(403).json({ message: 'אין לך הרשאה לערוך נתונים של משפחה אחרת' });
    }

    const updatedFamily = await Family.findByIdAndUpdate (familyIdToUpdate , req.body , {new: true});
    if (!updatedFamily) {
      return res.status(404).json({ message: 'משפחה לא נמצאה' });
    }
  
    req.json(updateFamily);
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// מחיקת משפחה 
export const deleteFamily = async (req, res) => {
  try{
    const familyIdToDelet = req.params.id;
     if (!isAuthorized(req, familyIdToDelet)) {
      return res.status(403).json({ message: 'אין לך הרשאה למחוק משפחה אחרת' });
    }

    const deletedFamily = await
      Family.findByIdAndDelete(familyIdToDelet);
      if(!deleteFamily){
        return res.status(404).json({ message: 'משפחה לא נמצאה' });
      }
      res.json({ message: 'המשפחה נמחקה בהצלחה' });
  }
  catch(error){
     res.status(500).json({ message: err.message });
  }
};
