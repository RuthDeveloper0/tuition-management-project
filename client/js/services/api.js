//  בשרת api מכיל את כתובת הבסיס לנתיבי 
//כל בקשה שתשלח תצורף לכתובת זו.
const API_BASE_URL = '/api';

/**
 * בצורה אחידה מול השרת  http פונקציית עזר גלובלית לביצוע בקשות 
 * @param {string} endpoint - הנתיב הספציפי שאליו תשלח הבקשה
 * @param {string} method - מתודת הבקשה (GET, POST, PUT, DELETE וכו')
 * @param {Object|FormData} body - הנתונים לשליחה בגוף הבקשה (אופציונלי)
 */
window.apiFetch = async function(endpoint, method = 'GET', body = null) {
  // שליפת טוקן ההזדהות השמור בדפדפן
  const token = localStorage.getItem('token');
  //יוצר אובייקט ריק לכותרות הבקשה
  const headers = {};

  // הגדרת כותרת JSON במידה ויש גוף לבקשה והוא אינו טופס
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // הוספת טוקן ההזדהות לכותרות הבקשה אם הוא קיים
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // בניית אובייקט ההגדרות עבור פקודת ה-fetch
  const config = { method, headers };

  // במידת הצורך json הוספת גוף הבקשה תוך המרה ל  
  if (body) {
    config.body = (body instanceof FormData) ? body : JSON.stringify(body);
  }

  // שליחת הבקשה האסינכרונית לשרת
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // בדיקה האם התקבלה תשובת שגיאה מהשרת
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'אירעה שגיאה בשרת');
  }

  // המרת התגובה לפורמט JSON והחזרתה לקוד הקורא
  return response.json();
};