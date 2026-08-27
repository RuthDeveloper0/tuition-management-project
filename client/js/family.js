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
});