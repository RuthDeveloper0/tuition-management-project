document.addEventListener('DOMContentLoaded', () => {
  const advanceYearBtn = document.getElementById('advanceYearBtn');

  if (advanceYearBtn) {
    advanceYearBtn.addEventListener('click', async () => {
      if (confirm('האם אתה בטוח שברצונך לקדם את כל הילדים לשנה הבאה?')) {
        try {
          await apiFetch('/system/advance-year', 'POST');
          alert('עדכון השנה בוצע בהצלחה!');
          location.reload();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }
});