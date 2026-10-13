//משתנה גלובלי לשמור במערך את רשימת המשפחות שתגיע מהשרת,
// שנוכל לבצע חיפושים וסינונים מבלי לפנות לשרת מחדש בכל פעם
let allFamiliesData = [];


//פונקציית עזר המקבלת מחרוזת של כיתה ומחזירה את מחיר ברירת המחדל המתאים
function getDefaultPrice(gradeStr) {
  if (!gradeStr) return 250;
  if (gradeStr.includes('מעון')) return 1200;
  if (gradeStr.includes('גן')) return 230;
  if (gradeStr.includes("ו'") || gradeStr.includes("ז'") || gradeStr.includes("ח'")) return 300;
  return 250;//שאר הדברים
}

//פונקציה שמופעלת כאשר משתמש בוחר כיתה בתפריט נפתח
function handleGradeChange() {
  const selectedGrade = document.getElementById('childGradeSelect').value;//שולפת כיתה נבחרת
  const defaultPrice = getDefaultPrice(selectedGrade);//מפעילה פונ לחישוב מחיר
  document.getElementById('childPriceInput').value = defaultPrice;//מעדכנת אוטומטית את המחיר שחזר 
}

async function loadFamilies() {
  try {
    // לשרת כדי לקבל את רשימת המשפחות GET שולח בקשת 
    const res = await fetch('/api/families');
    allFamiliesData = await res.json();//שומר את המשפחה במשתנה 

    //HE ממין משפחות לפי שם משפחה בעיברית לפי שרשום  
    allFamiliesData.sort((a, b) => (a.familyName || '').localeCompare(b.familyName || '', 'he'));
    
    //קורא לפונקציה שמציגה את הנתונים בטבלה שעל המסך
    renderFamilies();

    //אם יש שגיאה שולח הודעה
  } catch (err) {
    console.error('שגיאה בטעינת משפחות:', err);
  }
}


//פונקציה שאחראית לצייר את טבלת המשפחות במסך
function renderFamilies() {

  // אם לא מוצא יוצא HTML   מחפש את גוף הטבלה מה 
  const tbody = document.getElementById('familiesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';//מאפס את תוכן הטבלה 

  //שולף את ערך החיפוש
  const searchVal = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
  //מתחיל לסנן לפי משפחה ותנאים נוספים 
  const showOnlyAttention = document.getElementById('filterAttentionCheckbox')?.checked || false;

  const familiesToDisplay = allFamiliesData.filter(family => {
    // בודק אם שם משפחה זהה לטיפוס  
    const matchesSearch = !searchVal || (family.familyName && family.familyName.toLowerCase().includes(searchVal));
    //יש ילדים גדולים לטיפול
    const hasGraduates = Array.isArray(family.children) && family.children.some(c => c.grade === 'בוגר / לטיפול');
    //אם תשלום לא בוצע
    const paymentUnpaid = !family.paymentStatus;

    const needsAttention = hasGraduates || paymentUnpaid;
    
   //אם סומנה תיבת הסימון להצגת דורשי טיפול בלבד הפונקציה תחזיר משפחות העונות לתנאים
    if (showOnlyAttention) {
      return matchesSearch && needsAttention;
    }
    return matchesSearch;
  });


  //חישוב סכום חודשי ויצירת שורת הטבלה הראשית
  familiesToDisplay.forEach(family => {

    //עובר על כל ילד וסוכם תשלום כולם
    const hasGraduates = Array.isArray(family.children) && family.children.some(c => c.grade === 'בוגר / לטיפול');
    const paymentUnpaid = !family.paymentStatus;
    const needsAttention = hasGraduates || paymentUnpaid;
    
    const hasChildren = Array.isArray(family.children) && family.children.length > 0;
    const hasFiles = Array.isArray(family.files) && family.files.length > 0;

    const totalMonthly = hasChildren
      ? family.children.reduce((sum, child) => sum + (child.price || 0), 0)
      : 0;

      //יוצר אלמנט של שורה חדשה בטבלה
   const tr = document.createElement('tr');
    if (needsAttention) {//אם משפחה לא שלמה משנה רקע שורה
      tr.style.backgroundColor = '#f6f6f0'; 
    }

    //בודק האם למשפחה יש ילדים (hasChildren) או קבצים (hasFiles).

// יוצר אלמנט חץ  אירוע לחיצה  שקורא לפונקציה  כדי לפתוח או לסגור את פירוט הילדים והקבצים. 
// אם אין ילדים או קבצים, משאיר את המחרוזת ריקה
    const arrowHtml = (hasChildren || hasFiles)
      ? `<span class="toggle-arrow" onclick="toggleChildren('${family._id}', this)">◄</span>` 
      : '';

    let attentionBadge = '';
    //בלוק תנאים שבודק אילו התראות שייכות למשפחה
    //אם יש ילד בוגר וגם לא שולם
    if (hasGraduates && paymentUnpaid) {
      attentionBadge = '<span style="color: var(--danger-color); font-size: 12px; margin-right: 6px; font-weight: 600;">(לטיפול: בוגר + לא שולם)</span>';
    } 
    //אם יש ילד בוגר 
    else if (hasGraduates) {
      attentionBadge = '<span style="color: var(--danger-color); font-size: 12px; margin-right: 6px; font-weight: 600;">(לטיפול: בוגר)</span>';
    } 
    //אם לא שולם
    else if (paymentUnpaid) {
      attentionBadge = '<span style="color: #b45309; font-size: 12px; margin-right: 6px; font-weight: 600;">(לטיפול: לא ירד תשלום)</span>';
    }

    //סופר כמה קבצים קיימים במערך הקבצים של המשפחה. אם אין קבצים, הערך יהיה 0
    const filesCount = (family.files && family.files.length) ? family.files.length : 0;
    //אם יש יותר מ1 יהיה כמו סימן מהדק של כל הקבצים
    const filesLabel = filesCount > 0 ? `<span class="files-badge">📎 ${filesCount} קבצים מצורפים</span>` : '';

    //בודק אם סימן תשלום צריך להיות מסומ לפי אם המש שילמה או לא
    const isChecked = family.paymentStatus ? 'checked' : '';
    const paymentLabel = family.paymentStatus 
      ? '<span style="color:#16a34a; font-weight:600;">כן</span>' 
      : '<span style="color:var(--danger-color); font-weight:600;">לא</span>';


      // לשורת הטבלה HTML  מכניס את מבנה ה 
    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 4px;">
          ${arrowHtml}${family.familyName} ${filesLabel}
        </div>
        ${attentionBadge ? `<div style="margin-top: 4px;">${attentionBadge}</div>` : ''}
      </td>
      <td>${family.fatherName || ''} ${family.motherName ? 'ו' + family.motherName : ''}</td>
      <td>${family.email || '-'}</td>
      <td>${family.fatherPhone || '-'}</td>
      <td>${family.motherPhone || '-'}</td>
      <td>₪ ${totalMonthly}</td>
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
//מכניס את השורה המוכנה לטבלה
    tbody.appendChild(tr);


    //בודק אם יש קובץ או ילד הוא ימשיך ליצור את השורה שמתחת שיהיה להם
    if (hasChildren || hasFiles) {
      const childTr = document.createElement('tr');
      childTr.className = 'children-row';
      childTr.id = `children-row-${family._id}`;//מזהה יחודי לטבלה + של המש
      

      // שתוכנס לתוך השורה HTML  יוצר מחרוזת 
      let expandedHtml = `<td colspan="9"><div class="children-wrapper">`;
      

      //אם יש ילדים מוסיף כותרת ילדי המש ורשימה לא מסודרת
      if (hasChildren) {
        expandedHtml += `<div class="children-title">ילדי המשפחה:</div><ul class="children-list">`;
        
        //לולאה שעוברת על כל הילדים ובודקת אם הוא בוגר/לטיפול יעשה לו עיצוב בולט
        //ומכניס את פרטי הילד
        family.children.forEach(child => {
          const isGraduated = child.grade === 'בוגר / לטיפול';
          const statusStyle = isGraduated ? 'color: var(--danger-color); font-weight: 600;' : '';
          const safeName = (child.name || '').replace(/'/g, "\\'");
          const safeGrade = (child.grade || '').replace(/'/g, "\\'");

          expandedHtml += `
            <li>
              <div class="child-info">
                <strong>${child.name}</strong> — <span style="${statusStyle}">כיתה: ${child.grade}</span> (${child.price})
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


      //בודק אם יש קבצים
      if (hasFiles) {

        expandedHtml += `<div class="children-title" style="margin-top: 14px;">קבצים מצורפים:</div><div style="display: flex; gap: 10px; flex-wrap: wrap;">`;
        family.files.forEach((file, index) => {
          //מחלץ את נתיב הקובץ
          const filePath = typeof file === 'string' ? file : (file.path || file.url || '');
          //מחלץ ומסדר את נתיב הקובץ ומנקה אחכ
          const cleanPath = filePath.startsWith('uploads/') ? `/${filePath}` : (filePath.startsWith('/') ? filePath : `/uploads/${filePath}`);
          const fileName = typeof file === 'object' && file.name ? file.name : `פתח קובץ ${index + 1}`;
          

          //מוסיף כפתור מחיקת קובץ הסיכה אם יש יותר מ1
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
      //מוסיף את השורה ישר מתחת למשפחה
      tbody.appendChild(childTr);
    }
  });
}


//מקבל מזהה משפחה ומצב התיבה החדש
async function togglePaymentStatus(familyId, isChecked) {
  try {
   // שולח בקשת רשת למשתמש הנל
    const res = await fetch(`/api/families/${familyId}/payment-status`, {
      method: 'PATCH',//מוגדר בתור עדכון חלקי שיוכל לעשות
      headers: { 'Content-Type': 'application/json' },// JSON מגדיר ששולח כ  
      body: JSON.stringify({ paymentStatus: isChecked })//ממיר לגסון ושולח כבקשה
    });

    if (res.ok) {//אם הצליח הבקשה
      const updatedFamily = await res.json();//ממיר את התשובה ל JS
      const target = allFamiliesData.find(f => f._id === familyId);//מחפש משפחה ספציפי
      if (target) {//אם משפ נמצאה מעדכן את התשלום לחדש
        target.paymentStatus = updatedFamily.paymentStatus;
      }
      renderFamilies();//מפעיל שוב את יצירת הטבלה שגם היא תעודכן בתשלום
    } else {
      alert('שגיאה בעדכון סטטוס התשלום');
      loadFamilies();//טוען מחדש את המשפחות
    }
  } catch (e) {
    alert('שגיאת תקשורת');
    loadFamilies();
  }
}


//מקבל  מזהה משפחה ואלמנט עליו לחצו
function toggleChildren(familyId, arrowElem) {
  const row = document.getElementById(`children-row-${familyId}`);//מזהה את המשפחה
  if (row) {
    row.classList.toggle('active');
    arrowElem.classList.toggle('open');
  }
}


//פועלת כשלוחצים על הוספת משפחה היא מנקה לפני את השדות
// editFamilyId  זה מראה על הנקיון שזה אומר משפחה חדשה 
function openAddFamilyModal() {
  document.getElementById('editFamilyId').value = '';
  document.getElementById('familyNameInput').value = '';
  document.getElementById('emailInput').value = '';
  document.getElementById('fatherNameInput').value = '';
  document.getElementById('motherNameInput').value = '';
  document.getElementById('fatherPhoneInput').value = '';
  document.getElementById('motherPhoneInput').value = '';
  document.getElementById('notesInput').value = '';
    //מעדכנת כותרת חלונית להוסף משפחה
  document.getElementById('familyModalTitle').innerText = 'הוספת משפחה';
 //  HIDDEN   מסיר את העיצור שנקרא 
  document.getElementById('familyModal').classList.remove('hidden');
}


//מקבלת מזהה משפחה מאתרת נתונים ממאגר הדפדפן וממלא לבד
function openEditFamilyModal(familyId) {
  const family = allFamiliesData.find(f => f._id === familyId);
  if (!family) return;//אם לא מצא משפחה יוצא


  //ממלא נתונים ממאגר ואם אין משאירה כמחרוזת ריקה 
  document.getElementById('editFamilyId').value = familyId;
  document.getElementById('familyNameInput').value = family.familyName || '';
  document.getElementById('emailInput').value = family.email || '';
  document.getElementById('fatherNameInput').value = family.fatherName || '';
  document.getElementById('motherNameInput').value = family.motherName || '';
  document.getElementById('fatherPhoneInput').value = family.fatherPhone || '';
  document.getElementById('motherPhoneInput').value = family.motherPhone || '';
  document.getElementById('notesInput').value = family.notes || '';
  //מעדכנת כותרת כעריכה...
  document.getElementById('familyModalTitle').innerText = 'עריכת נתוני משפחה';
   //  HIDDEN   מסיר את העיצור שנקרא 
  document.getElementById('familyModal').classList.remove('hidden');
}


//תפקידה לשמור או לעדכן את נתוני המשפחה במערכת
async function submitFamily() {
  //שולפת את השדה אם הוא ריק זו יצירת  משפחה אחרת זה עדכון
  const familyId = document.getElementById('editFamilyId').value;
  const bodyData = {
    //שולפת את הנתונים שהוקלד בשדה הרלוונטי ושומרת אותו במפתח
    familyName: document.getElementById('familyNameInput').value,
    email: document.getElementById('emailInput').value,//מייל
    fatherName: document.getElementById('fatherNameInput').value,//שם אבא
    motherName: document.getElementById('motherNameInput').value,//שם אמא
    fatherPhone: document.getElementById('fatherPhoneInput').value,//טל אבא
    motherPhone: document.getElementById('motherPhoneInput').value,//טל אמא
    notes: document.getElementById('notesInput').value,//הערות
  };


  // .. תנאי מקוצר אם זה יצירת משפ הכתובת היא .. ואם עדכון הכתובת 
  const url = familyId ? `/api/families/${familyId}` : '/api/families';
  //POST יצירת משפחה 
  //PUT עדכון משפחה
  const method = familyId ? 'PUT' : 'POST';

  try {
    //שולח את הבקשה לכתובת שנקבע עם סוג הבקשה  וומיר לגסון
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    //אם חזר בהצלחה
    if (res.ok) {
      closeModal('familyModal');//סוגר את חלונית הטופס
      loadFamilies();//רענון
    } else {//אחרת שולח שגיאה
      const err = await res.json();
      alert('שגיאה: ' + err.message);
    }
  } catch (e) {
    alert('שגיאת תקשורת');
  }
}


//מופעלת שלוחצים  על כפתור להוסיף קובץ 
function openUploadFileModal(familyId) {
  //מאתרת שדה נסתר בטופס העלאת הקבצים  ומכניסה לתוכו את מזהה המשפחה 
  // פעולה זו מבטיחה שכאשר הקובץ יישלח לשרת, המערכת תדע בדיוק לאיזו משפחה לשייך אותו
  document.getElementById('uploadFamilyId').value = familyId;
  //מאפס שדה בחירת הקבצים שתיבת בחירת הקבצים תופיע ריקה לחלוטין וללא קבצים שנבחרו קודם
  document.getElementById('familyFilesInput').value = '';
  //מסיר עיצוב  שיוכלו לראות את החלונית ולא תתחבא
  document.getElementById('uploadFileModal').classList.remove('hidden');
}


//פונקציה זו מופעלת כאשר המשתמש בוחר קבצים בטופס העלאה ולוחץ על כפתור השמירה/העלאה
async function submitFiles() {
  //שולפת את מזהה המשפחה מהשדה הנסתר, כדי שהשרת ידע בדיוק לאיזו משפחה לשייך הקבצים המועלים
  const familyId = document.getElementById('uploadFamilyId').value;
  const fileInput = document.getElementById('familyFilesInput');

  //תנאי בדיקה אם נבחר קובץ להעלות
  if (!fileInput.files || fileInput.files.length === 0) {
    //אם לא נבחר מציג הודעה שיבחר
    alert('אנא בחר קובץ להעלאה');
    return;
  }


  const formData = new FormData();
  //לולאה העוברת על כל הקבצים שהמשתמש בחר להעלות
  for (let i = 0; i < fileInput.files.length; i++) {
    //FILE  תחת המפתח   FORMDATA   מוסיפה כל קובץ בנפרד לתוך אובייקט      
    formData.append('files', fileInput.files[i]);
  }

  try {
    //שולח בקשת רשת אסינכרונית לכתובת הייעודית בשרת להעלאת קבצים עבור אותה משפחה
    const res = await fetch(`/api/families/${familyId}/files`, {
      method: 'POST',//ייצור/עדכון נתונים
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

//מקבל מזהה משפחה וכתובת הקובץ למחיקה
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

//הוספת ילד חדש למשפה
function openAddChildModal(familyId) {
  //מעדכן את שדה הנסתר של המשפחה בתוך טופס הילד
  //  כדי שהמערכת תדע בדיוק לאיזו משפחה לשייך את הילד
  document.getElementById('childFamilyId').value = familyId;
  document.getElementById('editChildId').value = '';
  document.getElementById('childNameInput').value = '';//מאפס שדה שם הילד
  //שולף את הכיתה הראשונית שנמצאת כברירת מחדל בתפריט הבחירה של הכיתות
  const defaultGrade = document.getElementById('childGradeSelect').value;
  document.getElementById('childPriceInput').value = getDefaultPrice(defaultGrade);//חישוב מחיר
  //מעדכן כותרת החלונית
  document.getElementById('childModalTitle').innerText = 'הוספת ילד';
  //משנה עיצוב שלא יסתיר את החלון שקופץ
  document.getElementById('childModal').classList.remove('hidden');
}


//עריכת ילד
function openEditChildModal(familyId, childId, name, grade, price) {
  document.getElementById('childFamilyId').value = familyId;
  document.getElementById('editChildId').value = childId;
  document.getElementById('childNameInput').value = name;
  document.getElementById('childGradeSelect').value = grade;
  document.getElementById('childPriceInput').value = price;
  document.getElementById('childModalTitle').innerText = 'עריכת ילד';
  document.getElementById('childModal').classList.remove('hidden');
}


/**
 * פונקציה לשמירת נתוני ילד (הוספת ילד חדש או עדכון ילד קיים).
 * שולפת את הנתונים מהטופס, בוחרת את נתיב השרת והמתודה המתאימה (PUT/POST),
 * ושולחת את המידע לשרת בפורמט JSON.
 */
async function submitChild() {
  // שליפת מזהי המשפחה והילד מהשדות הנסתרים בטופס
  const familyId = document.getElementById('childFamilyId').value;
  const childId = document.getElementById('editChildId').value;
  
  // שליפת נתוני הילד מהשדות השונים בטופס
  const name = document.getElementById('childNameInput').value;
  const grade = document.getElementById('childGradeSelect').value;
  const customPrice = document.getElementById('childPriceInput').value;

  // קביעת כתובת היעד בשרת ומתודת ה-HTTP (עדכון לעומת יצירה)
  const url = childId 
    ? `/api/families/${familyId}/children/${childId}` 
    : `/api/families/${familyId}/children`;
  const method = childId ? 'PUT' : 'POST';

  try {
    // שליחת הנתונים לשרת באמצעות fetch
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, grade, customPrice, price: customPrice })
    });

    if (res.ok) {
      // במקרה של הצלחה: סגירת החלונית ורענון טבלת הנתונים הראשית
      closeModal('childModal');
      loadFamilies();
    } else {
      // הצגת הודעת שגיאה במקרה שהשרת דחה את הבקשה
      const err = await res.json();
      alert('שגיאה בעדכון ילד: ' + err.message);
    }
  } catch (e) {
    // טיפול בשגיאות תקשורת חמורות
    alert('שגיאת תקשורת בעדכון ילד');
  }
}


//מקבלת מזהה של החלונית אותה רוצים לסגור 
function closeModal(modalId) {
  //מוסיף עיצוב שיעלים את  החלונית 
  document.getElementById(modalId).classList.add('hidden');
}

//מופעלת כאשר נגמר שנה וצריך לקדם הילדים בשנתון
async function updateYear() {
  if (!confirm('האם אתה בטוח שברצונך לקדם את כל הילדים בשנתון?')) return;

  try {
    const res = await fetch('/api/families/update-year', { method: 'POST' });
    const data = await res.json();
    alert(data.message);//מקפיץ הודעת חיווי למשתמש עם הטקסט שהחזיר השרת כמה ילדים עודכנו בהצלחה
    loadFamilies();//רענון שיראו את השינויים
  } catch (e) {
    alert('שגיאה בעדכון שנת הלימודים');
  }
}


//מחיקת ילד
async function deleteChild(familyId, childId) {
  if (!confirm('האם למחוק את הילד?')) return;
  try {
    const res = await fetch(`/api/families/${familyId}/children/${childId}`, { method: 'DELETE' });
    if (res.ok) loadFamilies();//אם לחץ כן מחק ורענן הטבלה
  } catch (e) {
    alert('שגיאה במחיקת הילד');
  }
}


//מחיקת משפחה
async function deleteFamily(familyId) {
  if (!confirm('האם למחוק את המשפחה?')) return;
  try {
    const res = await fetch(`/api/families/${familyId}`, { method: 'DELETE' });
    if (res.ok) loadFamilies();
  } catch (e) {
    alert('שגיאה במחיקת המשפחה');
  }
}


// HTML  זה מאזין אחרי שנטען כל דף ה 
//מפעיל את הפונ הראשית שתביא את הנתונים  מהשרת ותציג בטבלה 
document.addEventListener('DOMContentLoaded', loadFamilies);