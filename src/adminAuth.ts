const SESSION_KEY = "utmbuilder_admin_session";
const API_CREDS_KEY = "utmbuilder_admin_api_creds";

export function isAdminSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function setAdminSession(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(API_CREDS_KEY);
}

/** 중앙 저장(PythonAnywhere API)용 — 로그인 시에만 설정, 로그아웃 시 제거. */
export function setAdminCredsForApi(id: string, password: string): void {
  try {
    const payload = JSON.stringify({ id, password });
    sessionStorage.setItem(
      API_CREDS_KEY,
      btoa(unescape(encodeURIComponent(payload)))
    );
  } catch {
    // ignore
  }
}

export function getAdminCredsForApi(): { id: string; password: string } | null {
  const raw = sessionStorage.getItem(API_CREDS_KEY);
  if (!raw) return null;
  try {
    const payload = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(payload) as { id?: string; password?: string };
    if (typeof parsed.id === "string" && typeof parsed.password === "string") {
      return { id: parsed.id, password: parsed.password };
    }
  } catch {
    // ignore
  }
  return null;
}

/** Vite 환경 변수 VITE_ADMIN_ID / VITE_ADMIN_PASSWORD 와 비교 */
export function verifyAdminCredentials(id: string, password: string): boolean {
  const expectedId = import.meta.env.VITE_ADMIN_ID ?? "";
  const expectedPw = import.meta.env.VITE_ADMIN_PASSWORD ?? "";
  if (!expectedId || !expectedPw) return false;
  return id === expectedId && password === expectedPw;
}

export function isAdminConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_ADMIN_ID && import.meta.env.VITE_ADMIN_PASSWORD
  );
}
