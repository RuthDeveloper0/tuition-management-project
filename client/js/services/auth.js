function toggleParentForm(view) {
  const loginView = document.getElementById('parentLoginView');
  const registerView = document.getElementById('parentRegisterView');

  if (view === 'register') {
    loginView.classList.add('hidden');
    registerView.classList.remove('hidden');
  } else {
    registerView.classList.add('hidden');
    loginView.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const adminLoginForm = document.getElementById('adminLoginForm');
  const parentLoginForm = document.getElementById('parentLoginForm');
  const parentRegisterForm = document.getElementById('parentRegisterForm');

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value.trim();

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.role === 'admin') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', 'admin');
          window.location.href = '/dashboard.html';
        } else {
          alert(data.message || 'פרטי התחברות מנהל שגויים');
        }
      } catch (err) {
        alert('שגיאת תקשורת מול השרת');
      }
    });
  }

  if (parentRegisterForm) {
    parentRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('parentRegUsername').value.trim();
      const uniqueCode = document.getElementById('parentRegCode').value.trim();

      try {
        const response = await fetch('/api/families/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, uniqueCode })
        });

        const data = await response.json();

        if (response.ok) {
          alert('ההרשמה בוצעה בהצלחה! כעת תוכל להתחבר.');
          toggleParentForm('login');
        } else {
          alert('שגיאה: ' + data.message);
        }
      } catch (err) {
        alert('שגיאת תקשורת מול השרת');
      }
    });
  }

  if (parentLoginForm) {
    parentLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('parentLoginUsername').value.trim();
      const password = document.getElementById('parentLoginPassword').value.trim();

      try {
        const response = await fetch('/api/families/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('parentToken', data.token);
          localStorage.setItem('role', 'client');
          window.location.href = '/parent-portal.html';
        } else {
          alert('שגיאה: ' + data.message);
        }
      } catch (err) {
        alert('שגיאת תקשורת מול השרת');
      }
    });
  }
});