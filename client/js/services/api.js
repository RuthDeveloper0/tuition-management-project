const API_BASE_URL = '/api';

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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'אירעה שגיאה בשרת');
  }

  return response.json();
};