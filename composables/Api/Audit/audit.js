const baseURL = fetchConfig.baseURL;

function getAuditAuthHeaders() {
  let tokenValue = '';
  try {
    tokenValue = useCookie('token').value || '';
  } catch {}
  if (process.client) {
    tokenValue = localStorage.getItem('token') || localStorage.getItem('Token') || tokenValue;
  }
  const headers = { appid: fetchConfig.headers.appid };
  if (tokenValue) {
    headers.Authorization = `Bearer ${tokenValue}`;
    headers.token = tokenValue;
  }
  return headers;
}

export async function apiGetPendingAuditResources(body) {
  return $fetch('/audit/pending', {
    method: 'POST',
    baseURL,
    headers: getAuditAuthHeaders(),
    body,
  });
}

export async function apiAuditResource(body) {
  return $fetch('/audit/auditResource', {
    method: 'POST',
    baseURL,
    headers: getAuditAuthHeaders(),
    body,
  });
}
