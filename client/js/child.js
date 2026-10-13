//JS יטען במלואו ורק אז מריץ את ה  HTML  ממתין לכך שכל מבנה ה 
document.addEventListener('DOMContentLoaded', () => {
  // ID מחפש בדף ומאמת את קיומו של הכפתור המיועד לקידום השנה, על פי  
  const advanceYearBtn = document.getElementById('advanceYearBtn');

  //מוודא שהכפתור קיים בעמוד
  if (advanceYearBtn) {

   // מוסיף מאזין לאירוע לחיצה  על הכפתור
   //  מכיוון שהפעולה מול השרת דורשת המתנה, הפונקציה מוגדרת כאסינכרונית
    advanceYearBtn.addEventListener('click', async () => {
      
      // OK בדיקה והוא ימשיך בפעולה רק עם הלקוח ילחץ 
      if (confirm('האם אתה בטוח שברצונך לקדם את כל הילדים לשנה הבאה?')) {

        //לטפל בצורה בטוחה בשגיאות שעלולות להתרחש בזמן התקשורת עם השרת
        try {
          await apiFetch('/system/advance-year', 'POST');
          alert('עדכון השנה בוצע בהצלחה!');

        //מרענן מחדש את הדפדפן כדי שהנתונים החדשים והמעודכנים של השנה הבאה יופיעו על המסך
          location.reload();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }
});