import Child from '../models/Child.js';

const nextAgeGroupMap = {
  'מעון פעוטות': 'מעון ביניים',
  'מעון ביניים': 'מעון בוגרים',
  'מעון בוגרים': 'גן גיל 3',
  'גן גיל 3': 'גן גיל 4',
  'גן גיל 4': 'גן גיל 5',
  'גן גיל 5': 'כיתה א\'',
  'כיתה א\'': 'כיתה ב\'',
  'כיתה ב\'': 'כיתה ג\'',
  'כיתה ג\'': 'כיתה ד\'',
  'כיתה ד\'': 'כיתה ה\'',
  'כיתה ה\'': 'כיתה ו\'',
  'כיתה ו\'': 'כיתה ז\'',
  'כיתה ז\'': 'כיתה ח\'',
  'כיתה ח\'': 'חריגה / למחיקה',
  'חריגה / למחיקה': 'חריגה / למחיקה'
};

export const advanceYear = async (req, res) => {
  try {
    const children = await Child.find();

    for (let child of children) {
      const nextGroup = nextAgeGroupMap[child.ageGroup] || child.ageGroup;
      child.ageGroup = nextGroup;
      if (nextGroup === 'חריגה / למחיקה') {
        child.markedForAction = true;
      }
      await child.save();
    }

    res.json({ message: 'עדכון השנה בוצע בהצלחה לכל הילדים' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בביצוע עדכון שנה', error: error.message });
  }
};