import Family from "../models/Family";

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
