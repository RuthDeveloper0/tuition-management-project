import Child from '../models/Child.js';


//פונקציה ליצירת ילד חדש
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
export const updateChild = async (req, res) => {
  try{
    //{ new: true }-כדי לקבל את הנתונים המעודכנים בחזרה
    const child = await Child.findByIdAndUpdate(req.params.id , req.body , { new: true });
    res.json(child);
  }
  catch (error){
    res.status(400).json({message:'שגיאה בעדכון פרטי ילד', error: error.message });
  }
};


//פונקציה למחיקת רכב
export const deleteChild = async (req, res) => {
  try{
    await Child.findByIdAndDelete(req.params.id);
    req.json({message:'הילד נמחק בהצלחה'})
  }
  catch(error){
        res.status(500).json({ message: 'שגיאה במחיקת ילד', error: error.message });
  }
};