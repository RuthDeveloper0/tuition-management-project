async function loadMyFamilyData() {
  const token = localStorage.getItem('parentToken');
  if (!token) {
    window.location.href = '/index.html';
    return;
  }

  try {
    const res = await fetch('/api/families/my-family', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const family = await res.json();

      document.getElementById('familyDetails').innerHTML = `
        <p><strong>משפחת:</strong> ${family.familyName}</p>
        <p><strong>אבא:</strong> ${family.fatherName || '-'} (${family.fatherPhone || '-'})</p>
        <p><strong>אמא:</strong> ${family.motherName || '-'} (${family.motherPhone || '-'})</p>
        <p><strong>סטטוס תשלום:</strong> ${family.paymentStatus ? 'שולם' : 'טרם ירד תשלום'}</p>
      `;

      let childrenHtml = '<ul style="padding-right: 20px;">';
      if (family.children && family.children.length > 0) {
        family.children.forEach(child => {
          childrenHtml += `<li><strong>${child.name}</strong> - כיתה: ${child.grade || '-'} | מחיר: ₪${child.price || 0}</li>`;
        });
      } else {
        childrenHtml += '<li>לא נרשמו ילדים במערכת</li>';
      }
      childrenHtml += '</ul>';
      document.getElementById('childrenDetails').innerHTML = childrenHtml;
    } else {
      logout();
    }
  } catch (err) {
    alert('שגיאה בטעינת הנתונים');
  }
}

function logout() {
  localStorage.removeItem('parentToken');
  localStorage.removeItem('role');
  window.location.href = '/index.html';
}

loadMyFamilyData();