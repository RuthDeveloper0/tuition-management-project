async function loadMyFamilyData() {
  const familyContainer = document.getElementById('familyDetails');
  const childrenContainer = document.getElementById('childrenDetails');

  // 1. חילוץ המייל מפרמטרי ה-URL או ה-localStorage
  const urlParams = new URLSearchParams(window.location.search);
  let email = urlParams.get('email');

  if (!email) {
    email = localStorage.getItem('parentEmail');
  } else {
    localStorage.setItem('parentEmail', email);
  }

  // 2. אם אין אימייל בכלל – הפנייה להתחברות
  if (!email) {
    logout();
    return;
  }

  try {
    // 3. קריאה לנתיב השרת
    const res = await fetch(`/api/families/portaldata?email=${encodeURIComponent(email)}`);

    if (res.ok) {
      const data = await res.json();
      const family = data.family || data;

      // הצגת נתוני המשפחה
      if (familyContainer) {
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

      // הצגת נתוני הילדים
      if (childrenContainer) {
        let childrenHtml = '<ul style="padding-right: 20px; margin: 0;">';
        if (family.children && family.children.length > 0) {
          family.children.forEach(child => {
            childrenHtml += `<li style="padding: 4px 0;"><strong>${child.name}</strong> — כיתה: ${child.grade || '-'} | מחיר: ₪${child.price || 0}</li>`;
          });
        } else {
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

function logout() {
  localStorage.removeItem('parentToken');
  localStorage.removeItem('parentEmail');
  localStorage.removeItem('role');
  window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', loadMyFamilyData);