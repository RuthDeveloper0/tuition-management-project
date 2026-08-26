const API_BASE_URL = '/api';

// פונקציה אחידה להוצאת בקשות מורשות
window.apiFetch = async function(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const headers = {};

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };

  if (body) {
    config.body = (body instanceof FormData) ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    if (!window.location.pathname.endsWith('login.html') && window.location.pathname !== '/') {
      window.location.href = '/login.html';
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'אירעה שגיאה בשרת');
  }

  return response.json();
};

// מעבר בין טפסי הרשמה/התחברות
function toggleParentForm(view) {
  const loginView = document.getElementById('parentLoginView');
  const registerView = document.getElementById('parentRegisterView');

  if (loginView && registerView) {
    if (view === 'register') {
      loginView.classList.add('hidden');
      registerView.classList.remove('hidden');
    } else {
      registerView.classList.add('hidden');
      loginView.classList.remove('hidden');
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // --- מנגנון התחברות אוטומטית (Auto-Login) ---
  const token = localStorage.getItem('token');
  const currentPath = window.location.pathname;

  if (token && (currentPath.endsWith('login.html') || currentPath === '/')) {
    try {
      const user = await apiFetch('/auth/me');
      if (user.role === 'admin') {
        window.location.href = '/dashboard.html';
      } else {
        window.location.href = '/parent-portal.html';
      }
      return;
    } catch (e) {
      // אם הטוקן פג תוקף, יתרחש ניקוי אוטומטי
    }
  }

  // 1. התחברות מנהל
  const adminLoginForm = document.getElementById('adminLoginForm');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value.trim();

      try {
        const data = await apiFetch('/auth/login', 'POST', { username, password });
        if (data.role === 'admin') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', 'admin');
          window.location.href = '/dashboard.html';
        } else {
          alert('אינך מורשה להתחבר כמנהל');
        }
      } catch (err) {
        alert(err.message || 'שגיאת התחברות');
      }
    });
  }

  // 2. הרשמת הורה (שם וסיסמה בלבד)
  const parentRegisterForm = document.getElementById('parentRegisterForm');
  if (parentRegisterForm) {
    parentRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('parentRegUsername').value.trim();
      const password = document.getElementById('parentRegPassword').value.trim();

      try {
        await apiFetch('/auth/register', 'POST', { username, password });
        alert('ההרשמה בוצעה בהצלחה! כעת תוכל להתחבר.');
        toggleParentForm('login');
      } catch (err) {
        alert('שגיאה: ' + err.message);
      }
    });
  }

  // 3. התחברות הורה
  const parentLoginForm = document.getElementById('parentLoginForm');
  if (parentLoginForm) {
    parentLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('parentLoginUsername').value.trim();
      const password = document.getElementById('parentLoginPassword').value.trim();

      try {
        const data = await apiFetch('/auth/login', 'POST', { username, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role || 'client');
        window.location.href = '/parent-portal.html';
      } catch (err) {
        alert('שגיאה: ' + err.message);
      }
    });
  }
});