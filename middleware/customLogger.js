/**
 * Middleware לתיעוד (Logging) בקשות HTTP הנכנסות לשרת
 */
const customLogger = (req, res, next) => {
  // 1. חילוץ תאריך ושעה נוכחיים בפורמט קריא
  const timestamp = new Date().toISOString();

  // 2. חילוץ שיטת הבקשה (GET, POST, PUT, DELETE וכו')
  const method = req.method;

  // 3. חילוץ הכתובת (URL) שאליה נשלחה הבקשה
  const url = req.originalUrl || req.url;

  // 4. הדפסת הפרטים בטרמינל
  console.log(`[${timestamp}] ${method} ${url}`);

  // 5. העברת הטיפול ל-Middleware או לבקר הבא בשרשרת
  next();
};

export default customLogger;