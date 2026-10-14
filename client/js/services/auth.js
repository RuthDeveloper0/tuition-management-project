// פונקציה להחלפת תצוגה בין טופס התחברות לטופס הרשמת הורים
function toggleParentForm(view) {
  // שליפת אלמנט תצוגת ההתחברות מה-DOM
  const loginView = document.getElementById('parentLoginView');
  // שליפת אלמנט תצוגת ההרשמה מה-DOM
  const registerView = document.getElementById('parentRegisterView');

  // בדיקה איזו תצוגה המשתמש ביקש להציג
  if (view === 'register') {
    // אם זו הרשמה - מסתירים את התחברות ומציגים את ההרשמה
    loginView.classList.add('hidden');
    registerView.classList.remove('hidden');
  } else {
    // אחרת (התחברות) - מסתירים את ההרשמה ומציגים את ההתחברות
    registerView.classList.add('hidden');
    loginView.classList.remove('hidden');
  }
}

// האזנה לטעינת הציוד והדפדפן במלואה לפני הרצת קוד ה-JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // שליפת טופס התחברות מנהל מה-DOM
  const adminLoginForm = document.getElementById('adminLoginForm');
  // שליפת טופס התחברות הורה מה-DOM
  const parentLoginForm = document.getElementById('parentLoginForm');
  // שליפת טופס הרשמת הורה מה-DOM
  const parentRegisterForm = document.getElementById('parentRegisterForm');

  // בדיקה האם טופס התחברות מנהל קיים בעמוד הנוכחי
  if (adminLoginForm) {
    // הוספת מאזין לאירוע שליחת הטופס (Submit) בצורה אסינכרונית
    adminLoginForm.addEventListener('submit', async (e) => {
      // מניעת הרענון הבסיסי של הדפדפן בעת שליחת טופס
      e.preventDefault();
      // שליפת שדה שם המשתמש של המנהל
      const usernameInput = document.getElementById('adminUsername');
      // שליפת שדה הסיסמה של המנהל
      const passwordInput = document.getElementById('adminPassword');

      // בדיקה שאכן השדות קיימים בעמוד, אחרת עצור את הריצה
      if (!usernameInput || !passwordInput) return;

      // קבלת הערך שהוקלד והסרת רווחים מיותרים בהתחלה ובסוף
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      try {
        // שליחת בקשת HTTP מסוג POST לשרת להתחברות מנהל
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }) // המרת האובייקט למחרוזת JSON לשליחה
        });

        // המרת התשובה שהתקבלה מהשרת לאובייקט JavaScript
        const data = await response.json();

        // בדיקה שהתשובה הצליחה (response.ok) ושהתפקיד שהוחזר הוא מנהל (admin)
        if (response.ok && data.role === 'admin') {
          // שמירת טוקן האימות בזיכרון המקומי של הדפדפן
          localStorage.setItem('token', data.token);
          // שמירת תפקיד המשתמש כמנהל
          localStorage.setItem('role', 'admin');
          // מעבר אוטומטי לעמוד לוח הבקרה של המנהל
          window.location.href = '/dashboard.html';
        } else {
          // הצגת הודעת שגיאה במקרה שהנתונים שגויים
          alert(data.message || 'פרטי התחברות מנהל שגויים');
        }
      } catch (err) {
        // תפיסת שגיאות תקשורת או שגיאות לא צפויות מול השרת
        alert('שגיאת תקשורת מול השרת');
      }
    });
  }

  // בדיקה האם טופס הרשמת הורה קיים בעמוד הנוכחי
  if (parentRegisterForm) {
    // הוספת מאזין לאירוע שליחת טופס ההרשמה
    parentRegisterForm.addEventListener('submit', async (e) => {
      // מניעת התנהגות ברירת המחדל של טופס (רענון העמוד)
      e.preventDefault();
      // שליפת שדה האימייל להרשמה
      const emailInput = document.getElementById('parentRegEmail');
      // שליפת שדה הסיסמה להרשמה
      const passwordInput = document.getElementById('parentRegPassword');

      // עצירה אם אחד השדות אינו קיים
      if (!emailInput || !passwordInput) return;

      // ניקוי רווחים מהטקסט שהוקלד
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      try {
        // שליחת בקשת POST לשרת לרישום משפחה חדשה
        const response = await fetch('/api/families/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        // פענוח נתוני התשובה מ-JSON
        const data = await response.json();

        // בדיקה האם ההרשמה בוצעה בהצלחה
        if (response.ok) {
          alert('ההרשמה בוצעה בהצלחה!');
          // מעבר לפורטל הורים בצירוף האימייל בפרמטרים של ה-URL (מקודד בבטחה)
          window.location.href = `/parent-portal.html?email=${encodeURIComponent(email)}`;
        } else {
          // הצגת הודעת שגיאה שהתקבלה מהשרת
          alert('שגיאה: ' + (data.message || 'מייל לא רשום במערכת'));
        }
      } catch (err) {
        // טיפול בשגיאת תקשורת
        alert('שגיאת תקשורת מול השרת');
      }
    });
  }

  // בדיקה האם טופס התחברות הורה קיים בעמוד
  if (parentLoginForm) {
    // הוספת מאזין לאירוע שליחת טופס ההתחברות של ההורה
    parentLoginForm.addEventListener('submit', async (e) => {
      // מניעת רענון הדפדפן
      e.preventDefault();
      // שליפת שדה אימייל התחברות
      const emailInput = document.getElementById('parentLoginEmail');
      // שליפת שדה סיסמה התחברות
      const passwordInput = document.getElementById('parentLoginPassword');

      // בדיקת תקינות קיום השדות
      if (!emailInput || !passwordInput) return;

      // ניקוי רווחים
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      try {
        // שליחת בקשת POST לשרת להתחברות הורים
        const response = await fetch('/api/families/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        // קבלת נתוני התשובה מהשרת
        const data = await response.json();

        // בדיקה האם ההתחברות הצליחה
        if (response.ok) {
          // אם השרת החזיר טוקן אימות, שומרים אותו ב-LocalStorage
          if (data.token) {
            localStorage.setItem('parentToken', data.token);
          }
          // שמירת התפקיד (כברירת מחדל client אם לא צוין אחרת)
          localStorage.setItem('role', data.role || 'client');
          // מעבר לעמוד פורטל הורים עם האימייל
          window.location.href = `/parent-portal.html?email=${encodeURIComponent(email)}`;
        } else {
          // הצגת הודעת שגיאה אם ההתחברות נכשלה
          alert('שגיאה: ' + (data.message || 'מייל לא רשום במערכת'));
        }
      } catch (err) {
        // טיפול בשגיאת תקשורת מול השרת
        alert('שגיאת תקשורת מול השרת');
      }
    });
  }
});