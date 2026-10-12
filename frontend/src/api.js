// All HTTP calls to the PHP backend go through this one function.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost/careerbridge/backend/index.php';
export const FILE_HOST = import.meta.env.VITE_FILE_HOST || 'http://localhost';

export const getToken = () => localStorage.getItem('cb_token');

export async function api(path, { method = 'GET', body, form, raw } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['X-Auth-Token'] = token;
  const opts = { method, headers };
  if (form) opts.body = form;                       // FormData (file upload)
  else if (body) { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }

  const res = await fetch(BASE + '/' + path, opts);
  if (raw) return res;                              // used for CSV download
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) { localStorage.removeItem('cb_token'); localStorage.removeItem('cb_user'); }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}
