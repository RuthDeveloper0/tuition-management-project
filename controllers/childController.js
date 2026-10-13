//מייבא את מודל הנתונים של מונגוס  המגדיר את הסכמה  של נתוני הילדים במסד הנתונים 
import Child from '../models/Child.js';


//פונקציה ליצירת ילד חדש
//פונ אסינכרונית שנמתין לביצוע דברים
export const createChild = async (req , res) =>{
  try{
    const child = new Child(req.body);//יצירת ילד חדש מהנתונים שהגיעו
    await child.save();// שמירת הילד שנוצר
    res.status(201).json(child);// החזרת סטטוס תקין
  }
  catch (error){
    res.status(400).json({message:'שגיאה בהוספת ילד', error: error.message });
  }
};


// פונקציה לעדכון פרטי ילד
//פונ אסינכרונית שנמתין לביצוע דברים
export const updateChild = async (req, res) => {
  try{
    //{ new: true }-כדי לקבל את הנתונים המעודכנים בחזרה
    //req.params.id מזהה יחודי של הילד שנשלח
    //req.body נתונים חדשים שצריך לעדכן ברשימה
    const child = await Child.findByIdAndUpdate(req.params.id , req.body , { new: true });
    res.json(child);//שולח ללקוח את הילד המעודכן כגסון
  }
  catch (error){
    res.status(400).json({message:'שגיאה בעדכון פרטי ילד', error: error.message });
  }
};


//פונקציה למחיקת ילד
export const deleteChild = async (req, res) => {
  try{
    // כדי לדעת איזו רשומה למחוק URL   מזהה הילד שנשלח בכתובת ה 
    await Child.findByIdAndDelete(req.params.id);
    res.json({message:'הילד נמחק בהצלחה'})
  }
  catch(error){
        res.status(500).json({ message: 'שגיאה במחיקת ילד', error: error.message });
  }
};