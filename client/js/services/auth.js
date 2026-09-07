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

  // התחברות מנהל
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('adminUsername');
      const passwordInput = document.getElementById('adminPassword');

      if (!usernameInput || !passwordInput) return;

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

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

  // הרשמת הורה
  if (parentRegisterForm) {
    parentRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('parentRegEmail');
      const passwordInput = document.getElementById('parentRegPassword');

      if (!emailInput || !passwordInput) return;

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      try {
        const response = await fetch('/api/families/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          alert('ההרשמה בוצעה בהצלחה!');
          window.location.href = `/parent-portal.html?email=${encodeURIComponent(email)}`;
        } else {
          alert('שגיאה: ' + (data.message || 'מייל לא רשום במערכת'));
        }
      } catch (err) {
        alert('שגיאת תקשורת מול השרת');
      }
    });
  }

  // התחברות הורה
  if (parentLoginForm) {
    parentLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('parentLoginEmail');
      const passwordInput = document.getElementById('parentLoginPassword');

      if (!emailInput || !passwordInput) return;

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      try {
        const response = await fetch('/api/families/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.token) {
            localStorage.setItem('parentToken', data.token);
          }
          localStorage.setItem('role', data.role || 'client');
          window.location.href = `/parent-portal.html?email=${encodeURIComponent(email)}`;
        } else {
          alert('שגיאה: ' + (data.message || 'מייל לא רשום במערכת'));
        }
      } catch (err) {
        alert('שגיאת תקשורת מול השרת');
      }
    });
  }
});