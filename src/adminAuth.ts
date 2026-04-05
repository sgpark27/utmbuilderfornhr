const SESSION_KEY = "utmbuilder_admin_session";

export function isAdminSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function setAdminSession(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
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
