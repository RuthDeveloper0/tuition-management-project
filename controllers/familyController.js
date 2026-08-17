import Family from "../models/Family.js";

export const getFamilies = async (req, res) => {
  try {
    // אם המשתמש הוא מנהל - החזר את כל המשפחות
    if (req.user.role === 'admin') {
      const families = await Family.find().populate('user', 'name email');
      return res.status(200).json(families);
    }

    // אם המשתמש הוא הורה - החזר רק את המשפחה שלו
    const family = await Family.findOne({ user: req.user.id });
    if (!family) {
      return res.status(404).json({ message: 'לא נמצאו נתוני משפחה עבור משתמש זה' });
    }

    res.status(200).json([family]);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בטעינת הנתונים', error: error.message });
  }
};

export const createFamily = async (req, res) => {
  try {
    const { familyName, parentName, phone, userId, children } = req.body;

    const family = new Family({
      familyName,
      parentName,
      phone,
      user: userId || req.user.id,
      children: children || []
    });

    const savedFamily = await family.save();
    res.status(201).json(savedFamily);
  } catch (error) {
    res.status(400).json({ message: 'שגיאה ביצירת משפחה', error: error.message });
  }
};

export const addChild= async (req , res) => {
    try{
        const { firstName , grade , price} = req.body;

        const family = await Family.findById(req.params.id);
         
        if(!family){
            return res.status(404).json({ message: 'משפחה לא נמצאה' });
        }
            family.children.push({firstName , grade , price});
            await family.save();

            res.status(200).json(family);
    }
    catch (error){
        res.status(400).json({ message: 'שגיאה בהוספת ילד', error: error.message });
    }
};



export const updateFamily = async (req, res) => {
  try {
     const updatedFamily = await Family.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
     );
      
     if (!updatedFamily){
        return res.status(404).json({ message: 'משפחה לא נמצאה' }); 
     }
      res.status(200).json(updateFamily);
  }
  catch(error){
     res.status(400).json({ message: 'שגיאה בעדכון המשפחה', error: error.message });
  }
};


export const deleteFamily = async (req, res) => {
    try{
        const family = await Family.findByIdAndDelete( req.params.id);
        if(!family){
            return res.status(404).json({ message: 'משפחה לא נמצאה'})
        }
        res.status(200).json({ message: 'המשפחה נמחקה בהצלחה' });
    }
    catch (error){
        res.status(500).json({ message: 'שגיאה במחיקת המשפחה', error: error.message });
    }
};