let allFamiliesData = [];

function getDefaultPrice(gradeStr) {
  if (!gradeStr) return 250;
  if (gradeStr.includes('מעון')) return 1200;
  if (gradeStr.includes('גן')) return 230;
  if (gradeStr.includes("ו'") || gradeStr.includes("ז'") || gradeStr.includes("ח'")) return 300;
  return 250;
}

function handleGradeChange() {
  const selectedGrade = document.getElementById('childGradeSelect').value;
  const defaultPrice = getDefaultPrice(selectedGrade);
  document.getElementById('childPriceInput').value = defaultPrice;
}

async function loadFamilies() {
  try {
    const res = await fetch('/api/families');
    allFamiliesData = await res.json();
    allFamiliesData.sort((a, b) => (a.familyName || '').localeCompare(b.familyName || '', 'he'));
    renderFamilies();
  } catch (err) {
    console.error('שגיאה בטעינת משפחות:', err);
  }
}

function renderFamilies() {
  const tbody = document.getElementById('familiesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const searchVal = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
  const showOnlyAttention = document.getElementById('filterAttentionCheckbox')?.checked || false;

  const familiesToDisplay = allFamiliesData.filter(family => {
    const matchesSearch = !searchVal || (family.familyName && family.familyName.toLowerCase().includes(searchVal));
    const hasGraduates = Array.isArray(family.children) && family.children.some(c => c.grade === 'בוגר / לטיפול');
    const paymentUnpaid = !family.paymentStatus;
    const needsAttention = hasGraduates || paymentUnpaid;
    
    if (showOnlyAttention) {
      return matchesSearch && needsAttention;
    }
    return matchesSearch;
  });

  familiesToDisplay.forEach(family => {
    const hasGraduates = Array.isArray(family.children) && family.children.some(c => c.grade === 'בוגר / לטיפול');
    const paymentUnpaid = !family.paymentStatus;
    const needsAttention = hasGraduates || paymentUnpaid;
    
    const hasChildren = Array.isArray(family.children) && family.children.length > 0;
    const hasFiles = Array.isArray(family.files) && family.files.length > 0;

    const totalMonthly = hasChildren
      ? family.children.reduce((sum, child) => sum + (child.price || 0), 0)
      : 0;

    const tr = document.createElement('tr');
    if (needsAttention) {
      tr.className = 'family-needs-attention';
    }

    const arrowHtml = (hasChildren || hasFiles)
      ? `<span class="toggle-arrow" onclick="toggleChildren('${family._id}', this)">◄</span>` 
      : '';

    let attentionBadge = '';
    if (hasGraduates && paymentUnpaid) {
      attentionBadge = '<span style="color:var(--danger-color); font-size:12px; margin-right:4px;">(לטיפול: בוגר + לא שולם)</span>';
    } else if (hasGraduates) {
      attentionBadge = '<span style="color:var(--danger-color); font-size:12px; margin-right:4px;">(לטיפול: בוגר)</span>';
    } else if (paymentUnpaid) {
      attentionBadge = '<span style="color:var(--warning-color); font-size:12px; margin-right:4px;">(לטיפול: לא ירד תשלום)</span>';
    }

    const filesCount = (family.files && family.files.length) ? family.files.length : 0;
    const filesLabel = filesCount > 0 ? `<span class="files-badge">📎 ${filesCount} קבצים מצורפים</span>` : '';

    const isChecked = family.paymentStatus ? 'checked' : '';
    const paymentLabel = family.paymentStatus 
      ? '<span style="color:#16a34a; font-weight:600;">כן</span>' 
      : '<span style="color:var(--danger-color); font-weight:600;">לא</span>';

    tr.innerHTML = `
      <td>${arrowHtml}<strong>${family.familyName}</strong> ${attentionBadge} ${filesLabel}</td>
      <td>${family.fatherName || ''} ${family.motherName ? 'ו' + family.motherName : ''}</td>
      <td>${family.fatherPhone || '-'}</td>
      <td>${family.motherPhone || '-'}</td>
      <td><strong>₪ ${totalMonthly}</strong></td>
      <td>
        <label class="payment-toggle">
          <input type="checkbox" ${isChecked} onchange="togglePaymentStatus('${family._id}', this.checked)">
          ${paymentLabel}
        </label>
      </td>
      <td style="color: var(--text-muted);">${family.notes || ''}</td>
      <td>
        <button class="btn-sm btn-add-child" onclick="openAddChildModal('${family._id}')">+ ילד</button>
        <button class="btn-sm btn-file" onclick="openUploadFileModal('${family._id}')">קובץ +</button>
        <button class="btn-sm btn-edit" onclick="openEditFamilyModal('${family._id}')">ערוך</button>
        <button class="btn-sm btn-delete" onclick="deleteFamily('${family._id}')">מחק</button>
      </td>
    `;

    tbody.appendChild(tr);

    if (hasChildren || hasFiles) {
      const childTr = document.createElement('tr');
      childTr.className = 'children-row';
      childTr.id = `children-row-${family._id}`;
      
      let expandedHtml = `<td colspan="8"><div class="children-wrapper">`;
      
      if (hasChildren) {
        expandedHtml += `<div class="children-title">ילדי המשפחה:</div><ul class="children-list">`;
        family.children.forEach(child => {
          const isGraduated = child.grade === 'בוגר / לטיפול';
          const statusStyle = isGraduated ? 'color: var(--danger-color); font-weight: 600;' : '';
          const safeName = (child.name || '').replace(/'/g, "\\'");
          const safeGrade = (child.grade || '').replace(/'/g, "\\'");

          expandedHtml += `
            <li>
              <div class="child-info">
                <strong>${child.name}</strong> — <span style="${statusStyle}">כיתה: ${child.grade}</span> (${child.price} ₪)
              </div>
              <div>
                <button class="btn-sm btn-edit" onclick="openEditChildModal('${family._id}', '${child._id}', '${safeName}', '${safeGrade}', ${child.price})">ערוך ילד</button>
                <button class="btn-sm btn-delete" onclick="deleteChild('${family._id}', '${child._id}')">מחק ילד</button>
              </div>
            </li>
          `;
        });
        expandedHtml += `</ul>`;
      }

      if (hasFiles) {
        expandedHtml += `<div class="children-title" style="margin-top: 14px;">קבצים מצורפים:</div><div style="display: flex; gap: 10px; flex-wrap: wrap;">`;
        family.files.forEach((file, index) => {
          const filePath = typeof file === 'string' ? file : (file.path || file.url || '');
          const cleanPath = filePath.startsWith('uploads/') ? `/${filePath}` : (filePath.startsWith('/') ? filePath : `/uploads/${filePath}`);
          const fileName = typeof file === 'object' && file.name ? file.name : `פתח קובץ ${index + 1}`;
          
          expandedHtml += `
            <div style="display: inline-flex; align-items: center; background: #e2e8f0; padding: 4px 10px; border-radius: 4px; font-size: 0.9em;">
              <a href="${cleanPath}" target="_blank" style="color: #1e293b; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">📎 ${fileName}</a>
              <button type="button" class="btn-sm btn-delete" onclick="deleteFile('${family._id}', '${filePath}')" style="padding: 1px 6px; font-size: 11px; margin: 0 8px 0 0; line-height: 1;">×</button>
            </div>
          `;
        });
        expandedHtml += `</div>`;
      }

      expandedHtml += `</div></td>`;
      childTr.innerHTML = expandedHtml;
      tbody.appendChild(childTr);
    }
  });
}

async function togglePaymentStatus(familyId, isChecked) {
  try {
    const res = await fetch(`/api/families/${familyId}/payment-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: isChecked })
    });

    if (res.ok) {
      const updatedFamily = await res.json();
      const target = allFamiliesData.find(f => f._id === familyId);
      if (target) {
        target.paymentStatus = updatedFamily.paymentStatus;
      }
      renderFamilies();
    } else {
      alert('שגיאה בעדכון סטטוס התשלום');
      loadFamilies();
    }
  } catch (e) {
    alert('שגיאת תקשורת');
    loadFamilies();
  }
}

function toggleChildren(familyId, arrowElem) {
  const row = document.getElementById(`children-row-${familyId}`);
  if (row) {
    row.classList.toggle('active');
    arrowElem.classList.toggle('open');
  }
}

function openAddFamilyModal() {
  document.getElementById('editFamilyId').value = '';
  document.getElementById('familyNameInput').value = '';
  document.getElementById('fatherNameInput').value = '';
  document.getElementById('motherNameInput').value = '';
  document.getElementById('fatherPhoneInput').value = '';
  document.getElementById('motherPhoneInput').value = '';
  document.getElementById('notesInput').value = '';
  document.getElementById('familyModalTitle').innerText = 'הוספת משפחה';
  document.getElementById('familyModal').classList.remove('hidden');
}

function openEditFamilyModal(familyId) {
  const family = allFamiliesData.find(f => f._id === familyId);
  if (!family) return;

  document.getElementById('editFamilyId').value = familyId;
  document.getElementById('familyNameInput').value = family.familyName || '';
  document.getElementById('fatherNameInput').value = family.fatherName || '';
  document.getElementById('motherNameInput').value = family.motherName || '';
  document.getElementById('fatherPhoneInput').value = family.fatherPhone || '';
  document.getElementById('motherPhoneInput').value = family.motherPhone || '';
  document.getElementById('notesInput').value = family.notes || '';
  document.getElementById('familyModalTitle').innerText = 'עריכת נתוני משפחה';
  document.getElementById('familyModal').classList.remove('hidden');
}

async function submitFamily() {
  const familyId = document.getElementById('editFamilyId').value;
  const bodyData = {
    familyName: document.getElementById('familyNameInput').value,
    fatherName: document.getElementById('fatherNameInput').value,
    motherName: document.getElementById('motherNameInput').value,
    fatherPhone: document.getElementById('fatherPhoneInput').value,
    motherPhone: document.getElementById('motherPhoneInput').value,
    notes: document.getElementById('notesInput').value,
  };

  const url = familyId ? `/api/families/${familyId}` : '/api/families';
  const method = familyId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (res.ok) {
      closeModal('familyModal');
      loadFamilies();
    } else {
      const err = await res.json();
      alert('שגיאה: ' + err.message);
    }
  } catch (e) {
    alert('שגיאת תקשורת');
  }
}

function openUploadFileModal(familyId) {
  document.getElementById('uploadFamilyId').value = familyId;
  document.getElementById('familyFilesInput').value = '';
  document.getElementById('uploadFileModal').classList.remove('hidden');
}

async function submitFiles() {
  const familyId = document.getElementById('uploadFamilyId').value;
  const fileInput = document.getElementById('familyFilesInput');

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('אנא בחר קובץ להעלאה');
    return;
  }

  const formData = new FormData();
  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append('files', fileInput.files[i]);
  }

  try {
    const res = await fetch(`/api/families/${familyId}/files`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      closeModal('uploadFileModal');
      loadFamilies();
    } else {
      const err = await res.json();
      alert('שגיאה בהעלאת הקבצים: ' + err.message);
    }
  } catch (e) {
    alert('שגיאת תקשורת בהעלאת הקבצים');
  }
}

async function deleteFile(familyId, filePath) {
  if (!confirm('האם למחוק את הקובץ?')) return;
  try {
    const res = await fetch(`/api/families/${familyId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });
    if (res.ok) {
      loadFamilies();
    } else {
      alert('שגיאה במחיקת הקובץ');
    }
  } catch (e) {
    alert('שגיאת תקשורת במחיקת הקובץ');
  }
}

function openAddChildModal(familyId) {
  document.getElementById('childFamilyId').value = familyId;
  document.getElementById('editChildId').value = '';
  document.getElementById('childNameInput').value = '';
  const defaultGrade = document.getElementById('childGradeSelect').value;
  document.getElementById('childPriceInput').value = getDefaultPrice(defaultGrade);
  document.getElementById('childModalTitle').innerText = 'הוספת ילד';
  document.getElementById('childModal').classList.remove('hidden');
}

function openEditChildModal(familyId, childId, name, grade, price) {
  document.getElementById('childFamilyId').value = familyId;
  document.getElementById('editChildId').value = childId;
  document.getElementById('childNameInput').value = name;
  document.getElementById('childGradeSelect').value = grade;
  document.getElementById('childPriceInput').value = price;
  document.getElementById('childModalTitle').innerText = 'עריכת ילד';
  document.getElementById('childModal').classList.remove('hidden');
}

async function submitChild() {
  const familyId = document.getElementById('childFamilyId').value;
  const childId = document.getElementById('editChildId').value;
  const name = document.getElementById('childNameInput').value;
  const grade = document.getElementById('childGradeSelect').value;
  const customPrice = document.getElementById('childPriceInput').value;

  const url = childId 
    ? `/api/families/${familyId}/children/${childId}` 
    : `/api/families/${familyId}/children`;
  const method = childId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, grade, customPrice, price: customPrice })
    });

    if (res.ok) {
      closeModal('childModal');
      loadFamilies();
    } else {
      const err = await res.json();
      alert('שגיאה בעדכון ילד: ' + err.message);
    }
  } catch (e) {
    alert('שגיאת תקשורת בעדכון ילד');
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

async function updateYear() {
  if (!confirm('האם אתה בטוח שברצונך לקדם את כל הילדים בשנתון?')) return;

  try {
    const res = await fetch('/api/families/update-year', { method: 'POST' });
    const data = await res.json();
    alert(data.message);
    loadFamilies();
  } catch (e) {
    alert('שגיאה בעדכון שנת הלימודים');
  }
}

async function deleteChild(familyId, childId) {
  if (!confirm('האם למחוק את הילד?')) return;
  try {
    const res = await fetch(`/api/families/${familyId}/children/${childId}`, { method: 'DELETE' });
    if (res.ok) loadFamilies();
  } catch (e) {
    alert('שגיאה במחיקת הילד');
  }
}

async function deleteFamily(familyId) {
  if (!confirm('האם למחוק את המשפחה?')) return;
  try {
    const res = await fetch(`/api/families/${familyId}`, { method: 'DELETE' });
    if (res.ok) loadFamilies();
  } catch (e) {
    alert('שגיאה במחיקת המשפחה');
  }
}

document.addEventListener('DOMContentLoaded', loadFamilies);