const key = "cartora.session";
let session = null;
try {
  const stored = JSON.parse(sessionStorage.getItem(key));
  if (stored?.access && stored?.refresh && stored?.user) session = stored;
} catch {
  /* Storage may be unavailable or corrupted. */
}
export function getSession() {
  return session;
}
export function setSession(value) {
  session = value;
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
  } catch {
    /* Keep the in-memory session when storage is unavailable. */
  }
  window.dispatchEvent(new Event("cartora:session"));
}
