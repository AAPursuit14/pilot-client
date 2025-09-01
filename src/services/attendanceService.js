const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export async function fetchTodayAttendance(token, cohort = null) {
  let url = `${API_BASE_URL}/attendance/today`;
  if (cohort) {
    url += `?cohort=${encodeURIComponent(cohort)}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || 'Failed to fetch today attendance');
  }
  return response.json();
}

export async function triggerPhotoCleanup(token, { keepFirst = true, maxAgeHours = 24 } = {}) {
  const url = `${API_BASE_URL}/photos/cleanup`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify({ keepFirst, maxAgeHours })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || 'Failed to trigger photo cleanup');
  }
  return response.json().catch(() => ({}));
}

export function shouldRunDailyCleanup(storageKey = 'lastPhotoCleanupAt', intervalHours = 24) {
  try {
    const last = localStorage.getItem(storageKey);
    if (!last) return true;
    const lastTs = Number(last);
    if (Number.isNaN(lastTs)) return true;
    const elapsedHours = (Date.now() - lastTs) / (1000 * 60 * 60);
    return elapsedHours >= intervalHours;
  } catch {
    return true;
  }
}

export function markDailyCleanupRun(storageKey = 'lastPhotoCleanupAt') {
  try {
    localStorage.setItem(storageKey, String(Date.now()));
  } catch {
    // ignore
  }
}

