
//מציגה למשפחה שהיא נכנסת רק את פרטי המשפחה שלה
async function loadMyFamilyData() {
  //מאתרת את האלמנט בדף שבו יוצגו פרטי המשפחה הכלליים ושומרת אותו במשתנה
  const familyContainer = document.getElementById('familyDetails');
  //כנל פה לילדים
  const childrenContainer = document.getElementById('childrenDetails');

  // 1. חילוץ המייל מפרמטרי ה-URL 
  const urlParams = new URLSearchParams(window.location.search);
  let email = urlParams.get('email');

  if (!email) {
      //ואם לא מצליח מנסה מזכרון הדפדפן
    email = localStorage.getItem('parentEmail');
  } else {// localStorage אחרת זא מצא שומר  ב 
    localStorage.setItem('parentEmail', email);
  }

  // 2. אם אין אימייל בכלל – הפנייה להתחברות
  if (!email) {
    logout();//יוצא מיד החוצה
    return;
  }

  try {
    // 3. קריאה לנתיב השרת
    const res = await fetch(`/api/families/portaldata?email=${encodeURIComponent(email)}`);

    if (res.ok) {//  אם הצליח שומר נתוני משפחה וממיר לגסון כמובן 
      const data = await res.json();
      const family = data.family || data;

      // הצגת נתוני המשפחה
      //מוודא שנתוני משפחה קיימים פה
      if (familyContainer) {
        //ממלא את אזור פרטי המשפחה בקוד HTML
        familyContainer.innerHTML = `
          <p><strong>משפחת:</strong> ${family.familyName || '-'}</p>
          <p><strong>אימייל:</strong> ${family.email || email}</p>
          <p><strong>אבא:</strong> ${family.fatherName || '-'} (${family.fatherPhone || '-'})</p>
          <p><strong>אמא:</strong> ${family.motherName || '-'} (${family.motherPhone || '-'})</p>
          <p><strong>סטטוס תשלום:</strong> ${
            family.paymentStatus
              ? '<span style="color: green; font-weight: 600;">שולם</span>'
              : '<span style="color: red; font-weight: 600;">טרם ירד תשלום</span>'
          }</p>
        `;
      }

      //  הצגת נתוני הילדים אם קימים
      if (childrenContainer) {
        //בונה רשימה לא מסודרת לילדים
        let childrenHtml = '<ul style="padding-right: 20px; margin: 0;">';
        if (family.children && family.children.length > 0) {//בודק אם יש ילדים למשפחה
          family.children.forEach(child => {//עובר על כל ילד ומוסיפו לרשימה
            childrenHtml += `<li style="padding: 4px 0;"><strong>${child.name}</strong> — כיתה: ${child.grade || '-'} | מחיר: ₪${child.price || 0}</li>`;
          });
        } else {//אם אין ילדים מציג הודעה
          childrenHtml += '<li>לא נרשמו ילדים במערכת</li>';
        }
        childrenHtml += '</ul>';
        childrenContainer.innerHTML = childrenHtml;
      }
    } else {
      // אם האימייל לא נכלל במאגר (סטטוס 404)
      const errData = await res.json().catch(() => ({}));
      alert(errData.message || 'שגיאה: מייל לא רשום במערכת');
      logout();
    }
  } catch (err) {
    alert('שגיאת תקשורת בטעינת הנתונים');
    if (familyContainer) {
      familyContainer.innerHTML = '<p style="color:red;">שגיאה בטעינת הנתונים</p>';
    }
  }
}


//אחראית על ניקוי נתוני ההתחברות והרשאות המשתמש מזיכרון הדפדפן
//ומאזין אירועים מפעיל את טעינת הנתונים מיד עם פתיחת העמוד
function logout() {
  localStorage.removeItem('parentToken');//מוחק טוקן הזדהות הורה
  localStorage.removeItem('parentEmail');//מוחק כתובת מייל
  localStorage.removeItem('role');//מוחק תפקיד הרשאות
  window.location.href = '/index.html';//מבצע הפניה חדשה לדפדפן חזרה לעמוד ראשי 
}


// HTML  זה מאזין אחרי שנטען כל דף ה 
//מפעיל את הפונ הראשית שתביא את הנתונים  מהשרת ותציג בטבלה 
document.addEventListener('DOMContentLoaded', loadMyFamilyData);