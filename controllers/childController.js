//מייבא את מודל הנתונים של מונגוס  המגדיר את הסכמה  של נתוני הילדים במסד הנתונים 
import Child from '../models/Child.js';
import AppError from '../middleware/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';


//פונקציה ליצירת ילד חדש
//פונ אסינכרונית שנמתין לביצוע דברים
export const createChild = asyncHandler(async (req, res) => {
    const child = new Child(req.body);//יצירת ילד חדש מהנתונים שהגיעו
    await child.save();// שמירת הילד שנוצר
    res.status(201).json(child);// החזרת סטטוס תקין
});


// פונקציה לעדכון פרטי ילד
//פונ אסינכרונית שנמתין לביצוע דברים
export const updateChild = asyncHandler(async (req, res) => {
    //{ new: true }-כדי לקבל את הנתונים המעודכנים בחזרה
    //req.params.id מזהה יחודי של הילד שנשלח
    //req.body נתונים חדשים שצריך לעדכן ברשימה
    const child = await Child.findByIdAndUpdate(req.params.id , req.body , { new: true });
    if (!child) throw new AppError(404, 'הילד לא נמצא');
    res.json(child);//שולח ללקוח את הילד המעודכן כגסון
});


//פונקציה למחיקת ילד
export const deleteChild = asyncHandler(async (req, res) => {
    // כדי לדעת איזו רשומה למחוק URL   מזהה הילד שנשלח בכתובת ה 
    const child = await Child.findByIdAndDelete(req.params.id);
    if (!child) throw new AppError(404, 'הילד לא נמצא');
    res.json({message:'הילד נמחק בהצלחה'})
});