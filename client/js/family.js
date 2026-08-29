document.addEventListener('DOMContentLoaded', () => {
  let allFamilies = [];

  const familyTableBody = document.getElementById('familyTableBody');
  const addFamilyBtn = document.getElementById('addFamilyBtn');
  const addFamilyModal = document.getElementById('addFamilyModal');
  const closeFamilyModal = document.getElementById('closeFamilyModal');
  const addFamilyForm = document.getElementById('addFamilyForm');
  
  const updateYearBtn = document.getElementById('updateYearBtn');
  const searchInput = document.getElementById('searchInput');

  const addChildModal = document.getElementById('addChildModal');
  const closeChildModal = document.getElementById('closeChildModal');
  const addChildForm = document.getElementById('addChildForm');

  // שמירת מזהי המשפחות שהשורות שלהן פתוחות כרגע
  const openRows = new Set();

  // טעינה ורינדור ראשוניים
  async function fetchAndRender() {
    try {
      allFamilies = await window.apiFetch('/families', 'GET');
      renderTable();
    } catch (err) {
      console.error('שגיאה בטעינת נתונים:', err);
    }
  }

  // רינדור טבלת המשפחות והילדים
  function renderTable() {
    if (!familyTableBody) return;

    let filtered = [...allFamilies];
    filtered.sort((a, b) => (a.familyName || '').localeCompare(b.familyName || '', 'he'));

    const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchVal) {
      filtered = filtered.filter(f => f.familyName && f.familyName.toLowerCase().includes(searchVal));
    }

    familyTableBody.innerHTML = '';

    if (filtered.length === 0) {
      familyTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">לא נמצאו משפחות</td></tr>';
      return;
    }

    filtered.forEach((family, index) => {
      const totalPayment = (family.children || []).reduce((sum, c) => sum + (c.price || 0), 0);
      
      const isPaid = family.paymentStatus === true;
      const isOpen = openRows.has(family._id);

      // שורת המשפחה הראשית - כפתור פתיחה בעמודה 1, ומספר רץ (index + 1) בעמודה 2
      const mainTr = document.createElement('tr');
      mainTr.innerHTML = `
        <td><button class="toggle-btn" data-id="${family._id}" style="cursor:pointer; background:none; border:none; font-size:14px;">${isOpen ? '▼' : '►'}</button></td>
        <td style="text-align: center; font-weight: bold; color: #64748b;">${index + 1}</td>
        <td>
          <strong>${family.familyName}</strong>
          <span class="status-warning" style="color: #dc2626; font-size: 0.85em; margin-right: 6px; font-weight: bold; display: ${!isPaid ? 'inline' : 'none'};">(לטפול: לא ירד תשלום)</span>
        </td>
        <td>${family.fatherName || ''} ${family.motherName ? 'ו' + family.motherName : ''}</td>
        <td>${family.fatherPhone || ''}</td>
        <td>${family.motherPhone || ''}</td>
        <td><strong>${totalPayment} ₪</strong></td>
        <td>
          <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            <input 
              type="checkbox" 
              class="payment-toggle-checkbox"
              data-id="${family._id}"
              ${isPaid ? 'checked' : ''} 
            />
            <span class="status-text" style="color: ${isPaid ? '#16a34a' : '#dc2626'}; font-weight: bold;">
              ${isPaid ? 'כן' : 'לא'}
            </span>
          </label>
        </td>
        <td>${family.notes || ''}</td>
        <td>
          <button class="btn-sm btn-add-child" data-id="${family._id}">+ ילד</button>
          <button class="btn-sm btn-delete" data-id="${family._id}">מחק</button>
        </td>
      `;
      familyTableBody.appendChild(mainTr);

      // שורת הילדים והקבצים המצורפים
      const childrenTr = document.createElement('tr');
      childrenTr.classList.add('children-row');
      if (!isOpen) {
        childrenTr.classList.add('hidden');
      }
      childrenTr.id = `children-${family._id}`;

      let childrenHTML = '<td colspan="10"><div style="padding: 12px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">';
      
      if (family.children && family.children.length > 0) {
        childrenHTML += '<strong style="display:block; margin-bottom:8px;">ילדי המשפחה:</strong><ul style="margin: 0 0 12px 0; padding-right: 20px; list-style-type: square;">';
        family.children.forEach(child => {
          childrenHTML += `
            <li style="margin-bottom: 6px;">
              <span><strong>${child.name}</strong> — כיתה: ${child.grade} (${child.price} ₪)</span>
              <button class="btn-delete-child" data-family="${family._id}" data-child="${child._id}" style="margin-right: 12px; color: #dc2626; background: none; border: none; cursor: pointer; text-decoration: underline;">מחק ילד</button>
            </li>
          `;
        });
        childrenHTML += '</ul>';
      } else {
        childrenHTML += '<span style="color: #64748b; display:block; margin-bottom:12px;">אין ילדים רשומים למשפחה זו.</span>';
      }

      if (family.files && family.files.length > 0) {
        childrenHTML += '<strong style="display:block; margin-top:10px; margin-bottom:6px;">קבצים מצורפים:</strong><div style="display: flex; gap: 10px; flex-wrap: wrap;">';
        family.files.forEach((file, idx) => {
          const filePath = typeof file === 'string' ? file : (file.path || file.url || '');
          const cleanPath = filePath.startsWith('uploads/') ? `/${filePath}` : (filePath.startsWith('/') ? filePath : `/uploads/${filePath}`);
          const fileName = typeof file === 'object' && file.name ? file.name : `פתח קובץ ${idx + 1}`;
          
          childrenHTML += `
            <div style="display: inline-flex; align-items: center; background: #e2e8f0; padding: 4px 10px; border-radius: 4px; font-size: 0.9em;">
              <a href="${cleanPath}" target="_blank" style="color: #1e293b; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">📎 ${fileName}</a>
              <button type="button" class="btn-delete-file" data-family="${family._id}" data-filepath="${filePath}" style="background: none; border: none; color: #dc2626; cursor: pointer; font-weight: bold; margin-right: 8px; padding: 0; font-size: 14px;" title="מחק קובץ">×</button>
            </div>
          `;
        });
        childrenHTML += '</div>';
      } else {
        childrenHTML += '<span style="color: #94a3b8; font-size: 0.9em; display:block; margin-top:8px;">אין קבצים מצורפים למשפחה זו.</span>';
      }

      childrenHTML += '</div></td>';

      childrenTr.innerHTML = childrenHTML;
      familyTableBody.appendChild(childrenTr);
    });

    attachTableEvents();
  }

  function attachTableEvents() {
    document.querySelectorAll('.payment-toggle-checkbox').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const familyId = e.target.dataset.id;
        const newStatus = e.target.checked;
        const labelText = e.target.closest('label').querySelector('.status-text');
        const warningSpan = e.target.closest('tr').querySelector('.status-warning');

        if (labelText) {
          labelText.textContent = newStatus ? 'כן' : 'לא';
          labelText.style.color = newStatus ? '#16a34a' : '#dc2626';
        }
        if (warningSpan) {
          warningSpan.style.display = newStatus ? 'none' : 'inline';
        }

        try {
          await window.apiFetch(`/families/${familyId}/payment-status`, 'PATCH', { paymentStatus: newStatus });
          const family = allFamilies.find(f => f._id === familyId);
          if (family) family.paymentStatus = newStatus;
        } catch (err) {
          alert('שגיאה בעדכון סטטוס התשלום: ' + err.message);
          e.target.checked = !newStatus;
          if (labelText) {
            labelText.textContent = !newStatus ? 'כן' : 'לא';
            labelText.style.color = !newStatus ? '#16a34a' : '#dc2626';
          }
          if (warningSpan) {
            warningSpan.style.display = !newStatus ? 'none' : 'inline';
          }
        }
      });
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const row = document.getElementById(`children-${id}`);
        if (row) {
          const isHidden = row.classList.toggle('hidden');
          e.target.innerText = isHidden ? '►' : '▼';
          if (isHidden) {
            openRows.delete(id);
          } else {
            openRows.add(id);
          }
        }
      });
    });

    document.querySelectorAll('.btn-add-child').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.getElementById('childFamilyId').value = e.target.dataset.id;
        addChildModal.classList.remove('hidden');
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (confirm('האם אתה בטוח שברצונך למחוק משפחה זו?')) {
          try {
            await window.apiFetch(`/families/${e.target.dataset.id}`, 'DELETE');
            await fetchAndRender();
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });

    document.querySelectorAll('.btn-delete-child').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const familyId = e.target.dataset.family;
        const childId = e.target.dataset.child;
        if (confirm('האם למחוק ילד זה?')) {
          try {
            await window.apiFetch(`/families/${familyId}/children/${childId}`, 'DELETE');
            await fetchAndRender();
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });

    document.querySelectorAll('.btn-delete-file').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const familyId = e.target.dataset.family;
        const filePath = e.target.dataset.filepath;
        if (confirm('האם למחוק את הקובץ?')) {
          try {
            await window.apiFetch(`/families/${familyId}/files`, 'DELETE', { filePath });
            await fetchAndRender();
          } catch (err) {
            alert('שגיאה במחיקת הקובץ: ' + err.message);
          }
        }
      });
    });
  }

   if (updateYearBtn) {
    updateYearBtn.addEventListener('click', async () => {
      if (confirm('האם לקדם את כל הילדים לשנת הלימודים הבאה?')) {
        try {
          await window.apiFetch('/families/update-year', 'POST');
          alert('שנת הלימודים עודכנה בהצלחה לכל הילדים!');
          await fetchAndRender();
        } catch (err) {
          alert('שגיאה בעדכון השנה: ' + err.message);
        }
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', renderTable);
  if (addFamilyBtn) addFamilyBtn.addEventListener('click', () => addFamilyModal.classList.remove('hidden'));
  if (closeFamilyModal) closeFamilyModal.addEventListener('click', () => addFamilyModal.classList.add('hidden'));
  if (closeChildModal) closeChildModal.addEventListener('click', () => addChildModal.classList.add('hidden'));

  if (addFamilyForm) {
    addFamilyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('familyName', document.getElementById('familyName').value.trim());
      formData.append('fatherName', document.getElementById('fatherName').value.trim());
      formData.append('motherName', document.getElementById('motherName').value.trim());
      formData.append('fatherPhone', document.getElementById('fatherPhone').value.trim());
      formData.append('motherPhone', document.getElementById('motherPhone').value.trim());
      const paymentVal = document.getElementById('paymentStatus') ? document.getElementById('paymentStatus').value : 'true';
      formData.append('paymentStatus', paymentVal);
      formData.append('notes', document.getElementById('notes').value.trim());
      const fileInput = document.getElementById('familyFiles');
      if (fileInput && fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append('files', fileInput.files[i]);
        }
      }
      try {
        await window.apiFetch('/families', 'POST', formData);
        addFamilyModal.classList.add('hidden');
        addFamilyForm.reset();
        await fetchAndRender();
      } catch (err) {
        alert('שגיאה בשמירת משפחה: ' + err.message);
      }
    });
  }

  if (addChildForm) {
    addChildForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const familyId = document.getElementById('childFamilyId').value;
      const childData = {
        name: document.getElementById('childName').value.trim(),
        grade: document.getElementById('childGrade').value,
        customPrice: document.getElementById('customPrice').value ? Number(document.getElementById('customPrice').value) : null
      };
      try {
        await window.apiFetch(`/families/${familyId}/children`, 'POST', childData);
        addChildModal.classList.add('hidden');
        addChildForm.reset();
        await fetchAndRender();
      } catch (err) {
        alert('שגיאה בהוספת ילד: ' + err.message);
      }
    });
  }

  fetchAndRender();
});