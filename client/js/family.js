// יטען במלואו  HTML  מחכה שדף ה 
document.addEventListener('DOMContentLoaded', () => {
  let allFamilies = [];//שומר את כל נתוני המשפחות 


  const familyTableBody = document.getElementById('familyTableBody');
  const addFamilyBtn = document.getElementById('addFamilyBtn');//כפתור הוסף משפ
  const addFamilyModal = document.getElementById('addFamilyModal');//טופס ההוספת משפ
  const closeFamilyModal = document.getElementById('closeFamilyModal');//סגירת הטופס
  const addFamilyForm = document.getElementById('addFamilyForm');//טופס דרכו נכנס הנתונים

  const updateYearBtn = document.getElementById('updateYearBtn');//כפתור לעדכון שנה
  const searchInput = document.getElementById('searchInput');//תיבת הטקסט שדרכה המשתמש מחפש משפחות בטבלה

  const addChildModal = document.getElementById('addChildModal');
  const closeChildModal = document.getElementById('closeChildModal');
  const addChildForm = document.getElementById('addChildForm');

  // שמירת מזהי המשפחות שהשורות שלהן פתוחות כרגע
  const openRows = new Set();

  // טעינה ורינדור ראשוניים
  async function fetchAndRender() {
    try {
      //עוצר את ביצוע השורות הבאות בפונקציה עד שהשרת יענה ויחזיר את הנתונים במלואם
      //שומר את רשימת המשפחות שהתקבלה מהשרת בתוך המשתנה
      allFamilies = await window.apiFetch('/families', 'GET');
      renderTable();//קריאה לפונ העוברת על המשפחות ומכניסה אותם ל HTML
    } catch (err) {
      console.error('שגיאה בטעינת נתונים:', err);
    }
  }

  // רינדור טבלת המשפחות והילדים
  function renderTable() {
    //אם גוף הטבלה לא נמצא הוא יוצא
    if (!familyTableBody) return;

    //יוצר מערך חדש עם הנתונים לאחר סינון
    let filtered = [...allFamilies];
    //ממין רשימת משפחות בעיברית
    filtered.sort((a, b) => (a.familyName || '').localeCompare(b.familyName || '', 'he'));

    //בודק אם קים תיבת חיפוש לוקח את השם שהוקלט מסיר רווחים וומיר לאות קטנה 
    //וכברירת מחדל מוגדר מחרוזת ריקה
    const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchVal) {//אם יש חיפוש משפ
      //מסנן שיראו רק את המשפחות שהוזנו 
      filtered = filtered.filter(f => f.familyName && f.familyName.toLowerCase().includes(searchVal));
    }

    familyTableBody.innerHTML = '';//ניקוי הטבלה

    //אם לאחר הסינון והמיון אין משפחות להצגה
    //מכניס שורה שכתוב במרכז לא נמצאו משפחות  
    if (filtered.length === 0) {
      familyTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">לא נמצאו משפחות</td></tr>';
      return;
    }

    //עובר על מערך המשפחות המסונן
    filtered.forEach((family, index) => {
      //לוקח את רשימת ילדי המשפ בין אם ריקה ובין אם לא קיימת ויוצר מערך
      //עובר על כל ילד וילד וסוכם את תשלומו(אם לא רשום מחיר הוא 0)
      const totalPayment = (family.children || []).reduce((sum, c) => sum + (c.price || 0), 0);

      const isPaid = family.paymentStatus === true;//אם שולם למשפ
      const isOpen = openRows.has(family._id);//בודק אם מזהה משפ קיים במשפחות הפתוחות זא האם הציגה ילדים


      //יצירת שורת משפחה  לHTML
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
      //מוסיף את השורה לסוף הטבלה
      familyTableBody.appendChild(mainTr);

      // שורת הילדים והקבצים המצורפים
      const childrenTr = document.createElement('tr');
      childrenTr.classList.add('children-row');//מוסיף מחלקה לעיצוב השורה
      if (!isOpen) {//אם משפ לא פתןחה לא רואים ילדים מוסיף עיצוב שמחביא שלא יראו 
        childrenTr.classList.add('hidden');
      }
      childrenTr.id = `children-${family._id}`;//מזהה יחודי לשורה

      // להכנסת ילדים HTML  יצירת מבנה   
      let childrenHTML = '<td colspan="10"><div style="padding: 12px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">';

      //אם יש ילדים מוסיף כותרת ילדי המשפחה
      if (family.children && family.children.length > 0) {
        childrenHTML += '<strong style="display:block; margin-bottom:8px;">ילדי המשפחה:</strong><ul style="margin: 0 0 12px 0; padding-right: 20px; list-style-type: square;">';
        family.children.forEach(child => {//עובר על כל ילד ומוסיף אותו לרשימה
          childrenHTML += `
            <li style="margin-bottom: 6px;">
              <span><strong>${child.name}</strong> — כיתה: ${child.grade} (${child.price} ₪)</span>
              <button class="btn-delete-child" data-family="${family._id}" data-child="${child._id}" style="margin-right: 12px; color: #dc2626; background: none; border: none; cursor: pointer; text-decoration: underline;">מחק ילד</button>
            </li>
          `;
        });
        childrenHTML += '</ul>';
      } else {//אם אין ילדים
        childrenHTML += '<span style="color: #64748b; display:block; margin-bottom:12px;">אין ילדים רשומים למשפחה זו.</span>';
      }

      //בודק אם יש קבצים
      if (family.files && family.files.length > 0) {
        childrenHTML += '<strong style="display:block; margin-top:10px; margin-bottom:6px;">קבצים מצורפים:</strong><div style="display: flex; gap: 10px; flex-wrap: wrap;">';
        family.files.forEach((file, idx) => {//עובר על כל קובץ 
          //שולף את הכתובת 
          const filePath = typeof file === 'string' ? file : (file.path || file.url || '');
          //מוודא שהנתיב כתוב ומתחיל נכון
          const cleanPath = filePath.startsWith('uploads/') ? `/${filePath}` : (filePath.startsWith('/') ? filePath : `/uploads/${filePath}`);
          //אם יש שם נותנים לו ואם לו יש ברירת מחדל קובץ 1 2 
          const fileName = typeof file === 'object' && file.name ? file.name : `פתח קובץ ${idx + 1}`;

          childrenHTML += `
            <div style="display: inline-flex; align-items: center; background: #e2e8f0; padding: 4px 10px; border-radius: 4px; font-size: 0.9em;">
              <a href="${cleanPath}" target="_blank" style="color: #1e293b; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">📎 ${fileName}</a>
              <button type="button" class="btn-delete-file" data-family="${family._id}" data-filepath="${filePath}" style="background: none; border: none; color: #dc2626; cursor: pointer; font-weight: bold; margin-right: 8px; padding: 0; font-size: 14px;" title="מחק קובץ">×</button>
            </div>
          `;
        });
        childrenHTML += '</div>';
      } else {//אם אין קבצים
        childrenHTML += '<span style="color: #94a3b8; font-size: 0.9em; display:block; margin-top:8px;">אין קבצים מצורפים למשפחה זו.</span>';
      }

      childrenHTML += '</div></td>';

      childrenTr.innerHTML = childrenHTML;//מכניס את הקבציםם לשורת הילדים
      familyTableBody.appendChild(childrenTr);//מוסיף פיזית את שורת הפירוט לטבלה
    });
    //קריאה לפונ עזר שמאזינה לכל הארועים כפתורי פתיחה וסגירה מחיקה וכו לדברים שנוספו
    attachTableEvents();
  }


  //פונקציה שאחראית לחבר מאזיני אירועים לכל האלמנטים הדינמים בטבלה
  function attachTableEvents() {
    document.querySelectorAll('.payment-toggle-checkbox').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const familyId = e.target.dataset.id;
        const newStatus = e.target.checked;
        const labelText = e.target.closest('label').querySelector('.status-text');
        const warningSpan = e.target.closest('tr').querySelector('.status-warning');


        //בסטטוס אם שולם זה כן ירוק אחרת לא אדום
        if (labelText) {
          labelText.textContent = newStatus ? 'כן' : 'לא';
          labelText.style.color = newStatus ? '#16a34a' : '#dc2626';
        }
        if (warningSpan) {//אם שולם ההודעה שלא שולם וצריך טיפול מוסתר למשתמש
          warningSpan.style.display = newStatus ? 'none' : 'inline';
        }

        try {
          //שולח בקשה לשרת עם הנתון החדש
          await window.apiFetch(`/families/${familyId}/payment-status`, 'PATCH', { paymentStatus: newStatus });
          //מוצא את המשפחה מהמרך 
          const family = allFamilies.find(f => f._id === familyId);
          //ומעדכן לה סטטוס חדש
          if (family) family.paymentStatus = newStatus;
        } catch (err) {
          alert('שגיאה בעדכון סטטוס התשלום: ' + err.message);
          e.target.checked = !newStatus;
          if (labelText) {//סטטוס תשלום
            labelText.textContent = !newStatus ? 'כן' : 'לא';
            labelText.style.color = !newStatus ? '#16a34a' : '#dc2626';
          }
          if (warningSpan) {
            warningSpan.style.display = !newStatus ? 'none' : 'inline';
          }
        }
      });
    });


    //מוצא את כל כפתורי הפתיחה/סגירה בטבלה
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {//עובר על כל כפתור שמצא
        const id = e.target.dataset.id;
        const row = document.getElementById(`children-${id}`);
        if (row) {//בדיקת הגנה המוודאת שהשורה אכן קיימת ב-DOM
          const isHidden = row.classList.toggle('hidden');//עיצוב אם השורה מוסתרת או גלויה
          e.target.innerText = isHidden ? '►' : '▼';//  משנה את החץ
          if (isHidden) {//אם השורה נסגרה 
            openRows.delete(id);//מסיר את המשפחה מרשימת המשפחות שפתוחות 
          } else {
            openRows.add(id);//אחרת אם נפתחה הוא מוסיף את המשפחה לרשימה
          }
        }
      });
    });


    //בחירת כל כפתורי הוספת הילד והוספת מאזין אירועים
    document.querySelectorAll('.btn-add-child').forEach(btn => {//מוצא את כל כפתורים בטבלה שקשורים להוספת ילדים
      btn.addEventListener('click', (e) => {//מוסין מאיזן שמחכה ללחיצה 
        document.getElementById('childFamilyId').value = e.target.dataset.id;//שולף מזהה משפחה
        // גורם לחלון הקופץ להופיע ולהיות גלוי לעיני המשתמש
        addChildModal.classList.remove('hidden');
      });
    });


    //מחיקת משפחה ממסד הנתונים ומהטבלה
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (confirm('האם אתה בטוח שברצונך למחוק משפחה זו?')) {
          try {
            //שליחת בקשת המחיקה לשרת
            await window.apiFetch(`/families/${e.target.dataset.id}`, 'DELETE');
            await fetchAndRender();//רענון הטבלה לאחר המחיקה
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });


    //מחיקת ילד
    document.querySelectorAll('.btn-delete-child').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        //שליפת מזהי המשפחה והילד
        const familyId = e.target.dataset.family;
        const childId = e.target.dataset.child;
        if (confirm('האם למחוק ילד זה?')) {
          try {
            //שליחת בקשת המחיקה לשרת 
            await window.apiFetch(`/families/${familyId}/children/${childId}`, 'DELETE');
            await fetchAndRender();//רענון טבלה לאחר מחיקה 
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });


    //מחיקת קובץ
    document.querySelectorAll('.btn-delete-file').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        //שליפת מזהי המשפחה והקובץ
        const familyId = e.target.dataset.family;
        const filePath = e.target.dataset.filepath;
        if (confirm('האם למחוק את הקובץ?')) {
          try {
            //שליחת בקשת המחיקה לשרת 
            await window.apiFetch(`/families/${familyId}/files`, 'DELETE', { filePath });
            await fetchAndRender();//רענון טבלה לאחר מחיקה
          } catch (err) {
            alert('שגיאה במחיקת הקובץ: ' + err.message);
          }
        }
      });
    });
  }

  //עדכון שנה
  if (updateYearBtn) {
    updateYearBtn.addEventListener('click', async () => {
      if (confirm('האם לקדם את כל הילדים לשנת הלימודים הבאה?')) {
        try {
          //שליחת בקשה לקידום שנה לכל הילדים
          await window.apiFetch('/families/update-year', 'POST');
          alert('שנת הלימודים עודכנה בהצלחה לכל הילדים!');
          await fetchAndRender();//רענון הטבלה לאחר קידום הילדים
        } catch (err) {
          alert('שגיאה בעדכון השנה: ' + err.message);
        }
      }
    });
  }

  //האזנה לשינויים בתיבת החיפוש וקריאה לפונ שמוצאת המשפחה
  if (searchInput) searchInput.addEventListener('input', renderTable);
  //פתיחת חלון הוספת משפחה
  if (addFamilyBtn) addFamilyBtn.addEventListener('click', () => addFamilyModal.classList.remove('hidden'));
  //סגירת חלון הוספת משפחה
  if (closeFamilyModal) closeFamilyModal.addEventListener('click', () => addFamilyModal.classList.add('hidden'));
  //סגירת חלון הוספת ילד
  if (closeChildModal) closeChildModal.addEventListener('click', () => addChildModal.classList.add('hidden'));



  if (addFamilyForm) {//בודק שטופס הוספת משפחה קיים
    //מוסיף מאזין לאירוע שליחת הטופס
    addFamilyForm.addEventListener('submit', async (e) => {
      e.preventDefault();//מונע התנהגות ברירת מחדל
      const formData = new FormData();//יוצר אוביקט ריק ושולף את הערכים שהמשתמש הקליד בשדות
      formData.append('familyName', document.getElementById('familyName').value.trim());//שם משפחה
      formData.append('fatherName', document.getElementById('fatherName').value.trim());//שם אב
      formData.append('motherName', document.getElementById('motherName').value.trim());//שם אם
      formData.append('fatherPhone', document.getElementById('fatherPhone').value.trim());//טל אב
      formData.append('motherPhone', document.getElementById('motherPhone').value.trim());//טל אם
      //סטטוס תשלום
      const paymentVal = document.getElementById('paymentStatus') ? document.getElementById('paymentStatus').value : 'true';
      formData.append('paymentStatus', paymentVal);
      formData.append('notes', document.getElementById('notes').value.trim());//הערות
      const fileInput = document.getElementById('familyFiles');//איסוף והוספת קבצים מצורפים
      if (fileInput && fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append('files', fileInput.files[i]);//מכניס את הקובץ
        }
      }
      //שליחת הנתונים לשרת ועדכון הממשק
      //שליחת בקשה לשרת עם הנתונים  מוסיף את העיצוב של הסתרת חלון הוסף משפחה כי נסגר
      try {
        await window.apiFetch('/families', 'POST', formData);
        addFamilyModal.classList.add('hidden');
        addFamilyForm.reset();//ניקוי כל השדות
        await fetchAndRender();//רענון טבלה
      } catch (err) {
        alert('שגיאה בשמירת משפחה: ' + err.message);
      }
    });
  }

  if (addChildForm) {//מוודא שטופס הוסף ילד קיים
    addChildForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      //איסוף מזהה המשפחה ונתוני הילד
      const familyId = document.getElementById('childFamilyId').value;//מזהה משפחה
      const childData = {
        name: document.getElementById('childName').value.trim(),//שם ילד
        grade: document.getElementById('childGrade').value,//כיתה
        //בודק אם הוכנס מחיר ספציפי
        customPrice: document.getElementById('customPrice').value ? Number(document.getElementById('customPrice').value) : null
      };
      try {
        //שליחת הנתונים לשרת 
        await window.apiFetch(`/families/${familyId}/children`, 'POST', childData);
        addChildModal.classList.add('hidden');//מסתיר את החלון הנל
        addChildForm.reset();//מנקה  שדות
        await fetchAndRender();//רענון טבלה
      } catch (err) {
        alert('שגיאה בהוספת ילד: ' + err.message);
      }
    });
  }

  //הפעלה ראשונית של טעינת הנתונים וסגירת קובץ ה-Script
  fetchAndRender();
});