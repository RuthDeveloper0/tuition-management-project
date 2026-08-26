// הצגת טבלת המשפחות והילדים
function renderFamilies(families) {
     const tbody = document.getElementById('familiesTableBody');
     tbody.innerHTML = '';
}

families.forEach(family => {
    // חישוב סך תשלום חודשי למשפחה
    const totalMonthly = Array.isArray(family.children)
      ? family.children.reduce((sum, child) => sum + (child.price || 0), 0)
      : 0;

    // קוד משפחה מקוצר מתוך _id
    const familyCode = family._id ? family._id.substring(family._id.length - 6).toUpperCase() : '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${familyCode}</strong></td>
      <td>${family.familyName}</td>
      <td>${family.fatherName || ''} ${family.motherName ? 'ו' + family.motherName : ''}</td>
      <td>${family.fatherPhone || '-'}</td>
      <td>${family.motherPhone || '-'}</td>
      <td>₪ ${totalMonthly}</td>
      <td>${family.paymentStatus ? 'כן' : 'לא'}</td>
      <td>${family.notes || ''}</td>
      <td>
        <button class="btn-sm btn-add-child" onclick="openAddChildModal('${family._id}')">+ ילד</button>
        <button class="btn-sm btn-delete" onclick="deleteFamily('${family._id}')">מחק</button>
      </td>
    `;

    tbody.appendChild(tr);

    // שורת פירוט הילדים
    if (Array.isArray(family.children) && family.children.length > 0) {
      const childTr = document.createElement('tr');
      childTr.className = 'children-row';
      
      let childrenHtml = `<td colspan="9"><div class="children-wrapper"><strong>ילדי המשפחה:</strong><ul class="children-list">`;
      
      family.children.forEach(child => {
        const isGraduated = child.grade === 'בוגר / לטיפול';
        const statusStyle = isGraduated ? 'color: red; font-weight: bold;' : '';
        
        childrenHtml += `
          <li style="${statusStyle}">
            <strong>${child.name}</strong> — כיתה: ${child.grade} (${child.price} ₪)
            <button class="btn-sm" onclick="openEditChildModal('${family._id}', '${child._id}', '${child.name}', '${child.grade}', ${child.price})">ערוך</button>
            <button class="btn-sm btn-delete" onclick="deleteChild('${family._id}', '${child._id}')">מחק ילד</button>
          </li>
        `;
      });

      childrenHtml += `</ul></div></td>`;
      childTr.innerHTML = childrenHtml;
      tbody.appendChild(childTr);
    }
  });

  // עדכון פרטי ילד מול השרת
async function updateChild(familyId, childId, newName, newGrade, newPrice) {
  try {
    const res = await fetch(`/api/families/${familyId}/children/${childId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, grade: newGrade, price: newPrice })
    });

    if (res.ok) {
      loadFamilies(); // רענון נתונים
    } else {
      const err = await res.json();
      alert('שגיאה בעדכון: ' + err.message);
    }
  } catch (e) {
    alert('שגיאת תקשורת בעדכון הילד');
  }
}

// עדכון שנה לכל הילדים
async function updateYear() {
  if (!confirm('האם אתה בטוח שברצונך לקדם את כל הילדים בשנתון?')) return;

  try {
    const res = await fetch('/api/families/update-year', { method: 'POST' });
    const data = await res.json();
    alert(data.message);
    loadFamilies(); // רענון מחדש של הטבלה
  } catch (e) {
    alert('שגיאה בעדכון שנת הלימודים');
  }
}
